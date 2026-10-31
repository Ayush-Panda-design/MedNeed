import dns from 'node:dns';
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('verbatim');
}
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Testing Supabase PostgreSQL connection...');
  const medicineCount = await prisma.medicine.count();
  console.log('Medicine count in Supabase:', medicineCount);

  const medicines = await prisma.medicine.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      saltComposition: true,
      baseMrp: true,
      sellingPrice: true,
      localWellCode: true,
    },
  });

  console.log('Sample medicines in Supabase:');
  console.log(JSON.stringify(medicines, null, 2));

  const orderCount = await prisma.order.count();
  console.log('Order count in Supabase:', orderCount);

  const batchCount = await prisma.medicineBatch.count();
  console.log('MedicineBatch count in Supabase:', batchCount);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Database connection error:', err);
  process.exit(1);
});
