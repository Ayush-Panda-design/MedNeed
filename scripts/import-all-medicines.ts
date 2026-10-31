import dns from 'node:dns';
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('verbatim');
}
import fs from 'node:fs';
import readline from 'node:readline';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
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

function detectCategory(name: string, comp: string): string {
  const text = `${name} ${comp}`.toLowerCase();
  if (text.includes('amoxycillin') || text.includes('azithromycin') || text.includes('cefixime') || text.includes('ciprofloxacin') || text.includes('ofloxacin') || text.includes('levofloxacin') || text.includes('antibiotic')) return 'Antibiotics';
  if (text.includes('paracetamol') || text.includes('aceclofenac') || text.includes('ibuprofen') || text.includes('diclofenac') || text.includes('tramadol') || text.includes('cough') || text.includes('cold') || text.includes('pain')) return 'Pain Relief';
  if (text.includes('pantoprazole') || text.includes('omeprazole') || text.includes('rabeprazole') || text.includes('esomeprazole') || text.includes('domperidone') || text.includes('antacid') || text.includes('digest')) return 'Digestion';
  if (text.includes('metformin') || text.includes('glimepiride') || text.includes('vildagliptin') || text.includes('sitagliptin') || text.includes('insulin') || text.includes('diabetes')) return 'Diabetes';
  if (text.includes('telmisartan') || text.includes('amlodipine') || text.includes('atorvastatin') || text.includes('rosuvastatin') || text.includes('atenolol') || text.includes('cardiac') || text.includes('hypertension')) return 'Cardiac';
  if (text.includes('vitamin') || text.includes('calcium') || text.includes('zinc') || text.includes('folic') || text.includes('iron') || text.includes('b-complex') || text.includes('multivitamin')) return 'Vitamins';
  if (text.includes('flupenthixol') || text.includes('melitracen') || text.includes('deanxit') || text.includes('clonazepam') || text.includes('alprazolam') || text.includes('escitalopram')) return 'General';
  return 'General';
}

function detectDosageForm(pack: string): 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'GEL' | 'DROPS' | 'INHALER' | 'SACHET' {
  const p = pack.toLowerCase();
  if (p.includes('capsule') || p.includes('cap')) return 'CAPSULE';
  if (p.includes('syrup') || p.includes('suspension') || p.includes('liquid') || p.includes('oral solution')) return 'SYRUP';
  if (p.includes('injection') || p.includes('inj') || p.includes('vial') || p.includes('ampoule')) return 'INJECTION';
  if (p.includes('gel') || p.includes('cream') || p.includes('ointment')) return 'GEL';
  if (p.includes('drop') || p.includes('eye') || p.includes('ear') || p.includes('nasal')) return 'DROPS';
  if (p.includes('inhaler') || p.includes('respules')) return 'INHALER';
  if (p.includes('sachet') || p.includes('powder')) return 'SACHET';
  return 'TABLET';
}

async function run() {
  const { prisma } = await import('../src/lib/prisma');
  const args = process.argv.slice(2);
  let targetCount = 5000;
  const countArgIdx = args.indexOf('--count');
  if (countArgIdx !== -1 && args[countArgIdx + 1]) {
    targetCount = parseInt(args[countArgIdx + 1], 10);
  } else if (args.includes('--all')) {
    targetCount = 250000;
  }

  console.log(`=== MedNeed High-Speed Bulk Catalogue Ingestion ===`);
  console.log(`Target Count: ${targetCount} medicines`);
  console.log('Testing Supabase connectivity...');
  let currentCount = 0;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      currentCount = await prisma.medicine.count();
      break;
    } catch (err: any) {
      if (attempt === 5) throw err;
      console.log(`Initial handshake retry ${attempt}/5: waiting for network socket...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log(`Current medicines in Supabase: ${currentCount}`);

  const csvPath = 'scripts/data/indian_medicine_master.csv';
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Master dataset not found at ${csvPath}`);
  }

  const stream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({ input: stream });

  let lineCount = 0;
  let batch: any[] = [];
  let totalImported = 0;
  const CHUNK_SIZE = 500;

  async function insertWithRetry(data: any[], maxRetries = 4) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await prisma.medicine.createMany({
          data,
          skipDuplicates: true,
        });
      } catch (err: any) {
        if (attempt === maxRetries) throw err;
        console.warn(`[Supabase Connection Retry ${attempt}/${maxRetries}] Waiting ${attempt * 2}s...`);
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
    return { count: 0 };
  }

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) continue; // skip header
    const cols = parseCsvLine(line);
    if (cols.length < 5) continue;

    const id = cols[0];
    const rawName = cols[1];
    const priceStr = cols[2];
    const mfg = cols[4] || 'Indian Pharma';
    const pack = cols[6] || 'Strip of 10 Tablets';
    const salt = cols[9] || cols[7] || rawName;
    const desc = cols[10] || '';

    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) continue;

    batch.push({
      name: rawName,
      brand: mfg,
      category: detectCategory(rawName, salt),
      dosageForm: detectDosageForm(pack),
      packaging: pack,
      schedule: 'SCHEDULE_H' as any,
      requiresPrescription: true,
      description: desc ? desc.substring(0, 500) : `${rawName} manufactured by ${mfg}.`,
      saltComposition: salt,
      baseMrp: Math.round(price * 100) / 100,
      discountPercentage: 10,
      sellingPrice: Math.round(price * 0.9 * 100) / 100,
      localWellCode: `MED-IND-${String(id).padStart(6, '0')}`,
    });

    if (batch.length >= CHUNK_SIZE) {
      const res = await insertWithRetry(batch);
      totalImported += res.count;
      console.log(`Progress: Imported ${totalImported} medicines (Line ${lineCount})...`);
      batch = [];

      if (totalImported >= targetCount) {
        break;
      }
    }
  }

  // Final remaining chunk
  if (batch.length > 0 && totalImported < targetCount) {
    const res = await insertWithRetry(batch);
    totalImported += res.count;
  }

  const newTotal = await prisma.medicine.count();
  console.log(`\n=== BULK INGESTION COMPLETE ===`);
  console.log(`Total Medicines now in Supabase PostgreSQL: ${newTotal}`);

  // Attach default batches for any medicines missing a batch
  console.log('\nAttaching inventory batches for new medicines in store...');
  const medsWithoutBatch = await prisma.medicine.findMany({
    where: { batches: { none: {} } },
    select: { id: true, baseMrp: true, localWellCode: true },
    take: 5000,
  });

  if (medsWithoutBatch.length > 0) {
    console.log(`Found ${medsWithoutBatch.length} medicines needing stock batches. Creating store batches in bulk...`);
    const batchRecords = medsWithoutBatch.map((m) => ({
      medicineId: m.id,
      batchNumber: `MN-2025-${m.localWellCode.slice(-4)}`,
      printedMrp: Number(m.baseMrp),
      purchaseRate: Math.round(Number(m.baseMrp) * 0.75 * 100) / 100,
      quantity: 100,
      expiryDate: new Date('2027-12-31T00:00:00.000Z'),
    }));

    await prisma.medicineBatch.createMany({
      data: batchRecords,
      skipDuplicates: true,
    });
    console.log(`Created ${batchRecords.length} inventory batches!`);
  }

  const finalBatchCount = await prisma.medicineBatch.count();
  console.log(`Final MedicineBatch count in Supabase: ${finalBatchCount}`);

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Bulk ingestion error:', err);
  process.exit(1);
});
