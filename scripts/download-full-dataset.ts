import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const TARGET_DIR = path.join(process.cwd(), 'scripts', 'data');
const TARGET_FILE = path.join(TARGET_DIR, 'indian_medicine_master.csv');
const DOWNLOAD_URL = 'https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/DATA/updated_indian_medicine_data.csv';

async function downloadFile() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  console.log(`Downloading complete Indian Medicine master dataset (~45 MB) from:\n${DOWNLOAD_URL}`);
  const fileStream = fs.createWriteStream(TARGET_FILE);

  return new Promise<void>((resolve, reject) => {
    https.get(DOWNLOAD_URL, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) return reject(new Error('Redirect location header missing'));
        https.get(redirectUrl, (redirectRes) => {
          streamToFile(redirectRes, fileStream, resolve, reject);
        }).on('error', reject);
        return;
      }
      streamToFile(response, fileStream, resolve, reject);
    }).on('error', reject);
  });
}

function streamToFile(response: any, fileStream: fs.WriteStream, resolve: () => void, reject: (err: any) => void) {
  const totalBytes = parseInt(response.headers['content-length'] || '44953149', 10);
  let downloadedBytes = 0;
  let lastReportedPct = 0;

  response.on('data', (chunk: Buffer) => {
    downloadedBytes += chunk.length;
    fileStream.write(chunk);
    const pct = Math.floor((downloadedBytes / totalBytes) * 100);
    if (pct >= lastReportedPct + 10) {
      lastReportedPct = pct;
      console.log(`Download progress: ${pct}% (${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB)`);
    }
  });

  response.on('end', () => {
    fileStream.end();
    console.log(`Download complete! Saved to: ${TARGET_FILE} (${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB)`);
    resolve();
  });

  response.on('error', (err: any) => {
    fileStream.close();
    reject(err);
  });
}

downloadFile().catch((err) => {
  console.error('Download failed:', err);
  process.exit(1);
});
