import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MedNeed Supabase database...');

  // 1. Seed Initial Admin Users
  // In production, INITIAL_ADMIN_PASSWORD can be provided in .env to hash a secure initial password.
  // If omitted, passwordHash remains null, requiring Google SSO or an authenticated reset.
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  const initialPasswordHash = initialAdminPassword
    ? await bcrypt.hash(initialAdminPassword, 10)
    : null;

  await prisma.adminUser.upsert({
    where: { email: 'owner@medneed.com' },
    update: {
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      name: 'Rajesh Sharma',
      email: 'owner@medneed.com',
      role: 'SUPER_ADMIN',
      passwordHash: initialPasswordHash,
      isActive: true,
      avatar: '👨‍💼',
    },
  });

  // Seed Owner Google SSO admin if configured or default
  const ownerEmail = process.env.INITIAL_OWNER_EMAIL || 'ayushnetwork25@gmail.com';
  await prisma.adminUser.upsert({
    where: { email: ownerEmail },
    update: {
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      name: 'MedNeed Owner & Super Admin',
      email: ownerEmail,
      role: 'SUPER_ADMIN',
      provider: 'google',
      isActive: true,
      avatar: '👨‍💼',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'manager@medneed.com' },
    update: {
      role: 'STORE_MANAGER',
      isActive: true,
    },
    create: {
      name: 'Pooja Verma',
      email: 'manager@medneed.com',
      role: 'STORE_MANAGER',
      passwordHash: initialPasswordHash,
      isActive: true,
      avatar: '👩‍💼',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'pharmacist@medneed.com' },
    update: {
      role: 'PHARMACIST',
      pharmacistRegNo: 'DL-89421',
      pharmacistLicenseNumber: 'DL-89421',
      isActive: true,
    },
    create: {
      name: 'Vikram Sethi (Reg. #DL-89421)',
      email: 'pharmacist@medneed.com',
      role: 'PHARMACIST',
      pharmacistRegNo: 'DL-89421',
      pharmacistLicenseNumber: 'DL-89421',
      passwordHash: initialPasswordHash,
      isActive: true,
      avatar: '👨‍⚕️',
    },
  });

  // 2. Seed Medicines with LocalWell Batches
  const dolo = await prisma.medicine.upsert({
    where: { localWellCode: 'LW-MED-001' },
    update: {},
    create: {
      localWellCode: 'LW-MED-001',
      name: 'Dolo 650mg Tablet',
      brand: 'Micro Labs Ltd',
      category: 'Pain Relief',
      dosageForm: 'TABLET',
      packaging: 'Strip of 15 Tablets',
      schedule: 'OTC',
      requiresPrescription: false,
      saltComposition: 'Paracetamol (650mg)',
      baseMrp: 34.0,
      discountPercentage: 10.0,
      sellingPrice: 30.6,
      description: 'Effective relief from fever, headache, body aches, and mild-to-moderate pain.',
      batches: {
        create: {
          batchNumber: 'ML-2024-B1',
          printedMrp: 34.0,
          purchaseRate: 22.5,
          quantity: 320,
          expiryDate: new Date('2026-08-31'),
        },
      },
    },
  });

  const panD = await prisma.medicine.upsert({
    where: { localWellCode: 'LW-MED-002' },
    update: {},
    create: {
      localWellCode: 'LW-MED-002',
      name: 'Pan-D Capsule',
      brand: 'Alkem Laboratories',
      category: 'Digestion',
      dosageForm: 'CAPSULE',
      packaging: 'Strip of 15 Capsules',
      schedule: 'SCHEDULE_H',
      requiresPrescription: true,
      saltComposition: 'Pantoprazole (40mg) + Domperidone (30mg)',
      baseMrp: 199.0,
      discountPercentage: 15.0,
      sellingPrice: 169.15,
      description: 'Relief from hyperacidity, GERD, heartburn, and nausea-induced gastritis.',
      batches: {
        create: {
          batchNumber: 'ALK-8921',
          printedMrp: 199.0,
          purchaseRate: 130.0,
          quantity: 185,
          expiryDate: new Date('2026-11-30'),
        },
      },
    },
  });

  const augmentin = await prisma.medicine.upsert({
    where: { localWellCode: 'LW-MED-003' },
    update: {},
    create: {
      localWellCode: 'LW-MED-003',
      name: 'Augmentin 625 Duo Tablet',
      brand: 'GlaxoSmithKline',
      category: 'Antibiotics',
      dosageForm: 'TABLET',
      packaging: 'Strip of 10 Tablets',
      schedule: 'SCHEDULE_H1',
      requiresPrescription: true,
      saltComposition: 'Amoxycillin (500mg) + Clavulanic Acid (125mg)',
      baseMrp: 223.5,
      discountPercentage: 8.0,
      sellingPrice: 205.62,
      description: 'High-efficacy broad-spectrum antibiotic for bacterial respiratory and skin infections.',
      batches: {
        create: {
          batchNumber: 'GSK-A62-90',
          printedMrp: 223.5,
          purchaseRate: 175.0,
          quantity: 95,
          expiryDate: new Date('2025-12-31'),
        },
      },
    },
  });

  // 3. Seed Diagnostic Tests
  await prisma.diagnosticTest.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'diag-1',
        name: 'MedNeed Prime Full Body Checkup with Smart Report (68 Tests)',
        category: 'Full Body',
        mrp: 4623,
        discountedPrice: 1849,
        fastingHours: 10,
        sampleType: 'Blood & Urine',
        turnaroundHours: 18,
        testCount: 68,
        popular: true,
        parameters: [
          'Complete Blood Count (CBC with ESR - 28 params)',
          'Lipid Profile (Total Cholesterol, HDL, LDL, VLDL, Triglycerides)',
          'Liver Function Test (SGOT, SGPT, Bilirubin, Protein, Albumin)',
          'Kidney Function Test with Electrolytes (Creatinine, Urea, Uric Acid, BUN, Na, K)',
          'Thyroid Profile Total (T3, T4, TSH Ultrasensitive)',
          'Fasting Blood Sugar (FBS)',
          'Urine Routine & Microscopic (24 params)',
        ],
      },
      {
        id: 'diag-2',
        name: 'MedNeed Full Body Checkup - Superior (90 Tests)',
        category: 'Full Body',
        mrp: 9871,
        discountedPrice: 3455,
        fastingHours: 12,
        sampleType: 'Blood & Urine',
        turnaroundHours: 24,
        testCount: 90,
        popular: true,
        parameters: [
          'All 68 Parameters of Prime Package',
          'Vitamin D (25-OH Total D2 + D3)',
          'Vitamin B12 (Cyanocobalamin)',
          'HbA1c (Glycosylated Hemoglobin 90-day average)',
          'Iron Deficiency Profile',
          'Cardiac Hs-CRP',
          'Serum Calcium & Phosphorus',
        ],
      },
      {
        id: 'diag-3',
        name: 'MedNeed Full Body Checkup - Basic (52 Tests)',
        category: 'Full Body',
        mrp: 2198,
        discountedPrice: 879,
        fastingHours: 10,
        sampleType: 'Blood & Urine',
        turnaroundHours: 12,
        testCount: 52,
        popular: false,
        parameters: [
          'Complete Hemogram (CBC - 24 params)',
          'Random / Fasting Blood Glucose',
          'Kidney Function (Serum Creatinine, Blood Urea)',
          'Liver Screening (SGPT, SGOT)',
          'Urine Routine & Microscopic (24 params)',
        ],
      },
      {
        id: 'diag-4',
        name: 'Complete Blood Count (CBC) with ESR (Hemogram)',
        category: 'CBC / Fever',
        mrp: 1122,
        discountedPrice: 399,
        fastingHours: 0,
        sampleType: 'Blood',
        turnaroundHours: 6,
        testCount: 28,
        popular: true,
        parameters: ['Hemoglobin', 'Platelet Count', 'Total WBC', 'DLC', 'RBC Indices', 'ESR'],
      },
      {
        id: 'diag-5',
        name: 'MedNeed Fever Panel Complete (59 Tests)',
        category: 'CBC / Fever',
        mrp: 5297,
        discountedPrice: 2119,
        fastingHours: 0,
        sampleType: 'Blood & Urine',
        turnaroundHours: 12,
        testCount: 59,
        popular: true,
        parameters: ['Dengue NS1 Antigen', 'Malaria Parasite', 'Widal Typhoid', 'CBC with ESR', 'Urine Routine', 'SGPT'],
      },
      {
        id: 'diag-7',
        name: 'HbA1c (Glycated Hemoglobin) Test',
        category: 'Diabetes',
        mrp: 1722,
        discountedPrice: 689,
        fastingHours: 0,
        sampleType: 'Blood',
        turnaroundHours: 8,
        testCount: 2,
        popular: true,
        parameters: ['HbA1c Glycated Hemoglobin', 'Estimated Average Glucose (eAG)'],
      },
      {
        id: 'diag-10',
        name: 'Thyroid Profile Total (T3, T4, TSH)',
        category: 'Thyroid',
        mrp: 1548,
        discountedPrice: 619,
        fastingHours: 0,
        sampleType: 'Blood',
        turnaroundHours: 8,
        testCount: 3,
        popular: true,
        parameters: ['Total T3', 'Total T4', 'TSH Ultrasensitive'],
      },
      {
        id: 'diag-13',
        name: 'Lipid Profile Test (8 Tests)',
        category: 'Heart',
        mrp: 2298,
        discountedPrice: 919,
        fastingHours: 10,
        sampleType: 'Blood',
        turnaroundHours: 8,
        testCount: 8,
        popular: true,
        parameters: ['Total Cholesterol', 'HDL', 'LDL', 'VLDL', 'Triglycerides', 'Cholesterol Ratios'],
      },
      {
        id: 'diag-15',
        name: 'Liver Function Test (LFT) with GGT (12 Tests)',
        category: 'Liver & Kidney',
        mrp: 2547,
        discountedPrice: 1019,
        fastingHours: 0,
        sampleType: 'Blood',
        turnaroundHours: 8,
        testCount: 12,
        popular: true,
        parameters: ['Total Bilirubin', 'Direct Bilirubin', 'SGOT', 'SGPT', 'ALP', 'GGT', 'Proteins', 'Albumin'],
      },
      {
        id: 'diag-17',
        name: 'Vitamin D3 & Vitamin B12 Vital Duo',
        category: 'Vitamins',
        mrp: 6898,
        discountedPrice: 2499,
        fastingHours: 0,
        sampleType: 'Blood',
        turnaroundHours: 12,
        testCount: 2,
        popular: true,
        parameters: ['25-Hydroxy Vitamin D', 'Vitamin B12 Cyanocobalamin'],
      },
    ],
  });

  // 4. Seed Discount Rule
  await prisma.discountRule.create({
    data: {
      title: 'Storewide Flat 5% OFF Launch Offer',
      scope: 'ALL_MEDICINES',
      discountPercentage: 5.0,
      isActive: true,
      updatedBy: 'Rajesh Sharma (Owner)',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
