import dns from 'node:dns';
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('verbatim');
}
import { prisma } from '../src/lib/prisma';
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
  if (text.includes('amoxycillin') || text.includes('azithromycin') || text.includes('cefixime') || text.includes('ciprofloxacin') || text.includes('antibiotic')) return 'Antibiotics';
  if (text.includes('paracetamol') || text.includes('aceclofenac') || text.includes('ibuprofen') || text.includes('diclofenac') || text.includes('cough') || text.includes('cold') || text.includes('pain')) return 'Pain Relief';
  if (text.includes('pantoprazole') || text.includes('omeprazole') || text.includes('rabeprazole') || text.includes('domperidone') || text.includes('antacid') || text.includes('digest')) return 'Digestion';
  if (text.includes('metformin') || text.includes('glimepiride') || text.includes('vildagliptin') || text.includes('insulin') || text.includes('diabetes')) return 'Diabetes';
  if (text.includes('telmisartan') || text.includes('amlodipine') || text.includes('atorvastatin') || text.includes('rosuvastatin') || text.includes('cardiac') || text.includes('hypertension')) return 'Cardiac';
  if (text.includes('vitamin') || text.includes('calcium') || text.includes('zinc') || text.includes('folic') || text.includes('iron') || text.includes('b-complex')) return 'Vitamins';
  if (text.includes('flupenthixol') || text.includes('melitracen') || text.includes('deanxit') || text.includes('clonazepam') || text.includes('alprazolam') || text.includes('escitalopram')) return 'General';
  return 'General';
}

async function run() {
  console.log('Testing connection to Supabase...');
  const initialCount = await prisma.medicine.count();
  console.log('Initial medicines in DB:', initialCount);

  console.log('Testing master dataset streaming and Deanxit extraction...');
  const stream = fs.createReadStream('scripts/data/indian_medicine_master.csv');
  const rl = readline.createInterface({ input: stream });

  let lineCount = 0;
  const items: any[] = [];
  let deanxitItem: any = null;

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) continue; // header
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

    const isDeanxit = /DEANXIT/i.test(rawName);

    const med = {
      name: rawName,
      brand: mfg,
      category: detectCategory(rawName, salt),
      dosageForm: (/syrup|suspension|liquid/i.test(pack) ? 'SYRUP' : (/capsule|cap/i.test(pack) ? 'CAPSULE' : (/gel|cream|ointment/i.test(pack) ? 'GEL' : (/drop/i.test(pack) ? 'DROPS' : 'TABLET')))) as any,
      packaging: pack,
      schedule: 'SCHEDULE_H' as any,
      requiresPrescription: true,
      description: desc ? desc.substring(0, 500) : `${rawName} manufactured by ${mfg}.`,
      saltComposition: salt,
      baseMrp: Math.round(price * 100) / 100,
      discountPercentage: 10,
      sellingPrice: Math.round(price * 0.9 * 100) / 100,
      localWellCode: `MED-IND-${String(id).padStart(6, '0')}`,
    };

    if (isDeanxit) {
      deanxitItem = med;
      console.log('Found Deanxit:', med);
    }

    if (items.length < 500) {
      items.push(med);
    }

    if (items.length >= 500 && deanxitItem) {
      break;
    }
  }

  // Ensure deanxitItem is in items
  if (deanxitItem && !items.some(m => m.localWellCode === deanxitItem.localWellCode)) {
    items.push(deanxitItem);
  }

  console.log(`Parsed sample batch of ${items.length} medicines. Testing bulk createMany...`);
  const start = Date.now();
  const result = await prisma.medicine.createMany({
    data: items,
    skipDuplicates: true,
  });
  console.log(`Successfully bulk-inserted in ${Date.now() - start}ms! Result:`, result);

  // Check Deanxit in DB
  const deanxitInDb = await prisma.medicine.findFirst({
    where: { name: { contains: 'Deanxit', mode: 'insensitive' } },
  });
  console.log('Deanxit in Supabase:', deanxitInDb);

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
