import fs from 'fs';
import path from 'path';

const csvPath = 'C:\\Users\\ayush\\.gemini\\antigravity\\brain\\d4268c19-2a72-4cde-baf6-be2ff5d51960\\.system_generated\\steps\\606\\content.md';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function analyze() {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  
  // Find header line
  let headerIndex = -1;
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    if (lines[i].startsWith('id,name,price(₹)')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error('Header not found!');
    return;
  }

  console.log('Header line found at index:', headerIndex);
  const dataLines = lines.slice(headerIndex + 1).filter((l) => l.trim().length > 0);
  console.log('Total data lines:', dataLines.length);

  let activeCount = 0;
  let discontinuedCount = 0;
  const manufacturers = new Set<string>();
  const topMedicines: any[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const cols = parseCSVLine(dataLines[i]);
    if (cols.length >= 8) {
      const [id, name, priceStr, isDiscontinued, mfg, type, packSize, comp1, comp2] = cols;
      const isDisc = isDiscontinued.toUpperCase() === 'TRUE';
      if (isDisc) {
        discontinuedCount++;
      } else {
        activeCount++;
        manufacturers.add(mfg);
        if (topMedicines.length < 15) {
          topMedicines.push({ id, name, price: priceStr, mfg, packSize, comp: [comp1, comp2].filter(Boolean).join(' + ') });
        }
      }
    }
  }

  console.log('Active Indian Medicines (non-discontinued):', activeCount);
  console.log('Discontinued Medicines:', discontinuedCount);
  console.log('Unique Indian Manufacturers:', manufacturers.size);
  console.log('\nSample 15 Active Indian Medicines:');
  console.log(JSON.stringify(topMedicines, null, 2));
}

analyze().catch(console.error);
