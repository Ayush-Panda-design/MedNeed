// Comprehensive Catalog Hierarchy and Taxonomy for MedNeed Pharmacy & Healthcare
// Provides structured categories, subcategories, therapeutic classifications, diagnostics, and doctor consultation filters.

export interface SubCategoryItem {
  name: string;
  slug: string;
}

export interface CategoryGroup {
  name: string;
  slug: string;
  icon?: string;
  items: SubCategoryItem[];
}

export interface MainDepartment {
  id: string;
  name: string;
  description: string;
  groups: CategoryGroup[];
}

// 1. GENERAL STORE (Personal Care, Mother & Baby, Nutrition, Household, OTC, Ayurvedic)
export const GENERAL_STORE_SECTIONS: CategoryGroup[] = [
  {
    name: 'Factory-Direct',
    slug: 'factory-direct',
    items: [
      { name: 'Accessories', slug: 'accessories' },
      { name: 'Baby Care', slug: 'baby-care' },
      { name: 'Bathing Needs', slug: 'bathing-needs' },
      { name: 'Health & Nutrition', slug: 'health-n-nutrition' },
      { name: 'Dried Fruits, Nuts & Seeds', slug: 'dried-fruits-nuts-n-seeds' },
      { name: 'Household Needs', slug: 'household-needs' },
      { name: 'Oral Care', slug: 'oral-care' },
      { name: 'Personal Care', slug: 'personal-care' },
      { name: 'Sanitary & Hygiene', slug: 'sanitary-n-hygiene' },
      { name: 'OTC & Health Needs', slug: 'otc-n-health-needs' },
      { name: 'Food Items', slug: 'food-items' },
      { name: "Men's Fashion", slug: 'men-s-fashion' },
      { name: 'Gym Needs', slug: 'gym-needs' },
    ],
  },
  {
    name: 'Baby-Needs',
    slug: 'baby-needs',
    items: [
      { name: 'Baby Care', slug: 'baby-care' },
      { name: 'Baby Food', slug: 'baby-food' },
      { name: 'Baby Toys & Activities', slug: 'baby-toys-n-activities' },
    ],
  },
  {
    name: 'Personal-Care',
    slug: 'personal-care',
    items: [
      { name: 'Skin Care', slug: 'skin-care' },
      { name: 'Sanitary & Hygiene', slug: 'sanitary-n-hygiene' },
      { name: 'Oral Care', slug: 'oral-care' },
      { name: 'Hair Care', slug: 'hair-care' },
      { name: 'Bath & Body Products', slug: 'bath-n-body-products' },
      { name: 'Sexual Wellness', slug: 'sexual-wellness' },
      { name: 'Deodorants & Perfumes', slug: 'deodorants-n-perfumes' },
      { name: 'Eyes, Ears & Lips', slug: 'eyes-ears-n-lips' },
      { name: 'Shaving & Hair Removal', slug: 'shaving-n-hair-removal' },
      { name: 'Hand, Foot & Nails', slug: 'hand-foot-n-nails' },
      { name: 'Makeup Essentials', slug: 'makeup-essentials' },
      { name: 'Massage & Relaxation Products', slug: 'massage-n-relaxation-products' },
    ],
  },
  {
    name: 'Women-Care',
    slug: 'women-care',
    items: [
      { name: 'Mother Care', slug: 'mother-care' },
      { name: 'Nutrition Needs', slug: 'nutrition-needs' },
      { name: 'Makeup Essentials', slug: 'makeup-essentials' },
      { name: 'Sanitary & Hygiene Needs', slug: 'sanitary-n-hygiene-needs' },
    ],
  },
  {
    name: 'Health-n-Nutrition',
    slug: 'health-n-nutrition',
    items: [
      { name: 'Nutritional Foods', slug: 'nutritional-foods' },
      { name: 'Breakfast Cereals', slug: 'breakfast-cereals' },
      { name: 'Weight Management', slug: 'weight-management' },
    ],
  },
  {
    name: 'OTC-n-Health-Needs',
    slug: 'otc-n-health-needs',
    items: [
      { name: 'First Aid', slug: 'first-aid' },
      { name: 'Pain Relief', slug: 'pain-relief' },
      { name: 'Cold Relief', slug: 'cold-relief' },
      { name: 'Joint Care & Support', slug: 'joint-care-n-support' },
      { name: 'Skin & Foot Care', slug: 'skin-n-foot-care' },
      { name: 'Digestives & Laxatives', slug: 'digestives-n-laxatives' },
      { name: 'Healthcare Devices', slug: 'healthcare-devices' },
      { name: 'Anti-Smoking Products', slug: 'anti-smoking-products' },
    ],
  },
  {
    name: 'Vitamins-n-Supplements',
    slug: 'vitamins-n-supplements',
    items: [
      { name: 'Sports Supplements', slug: 'sports-supplements' },
      { name: 'Vitamins & Minerals', slug: 'vitamins-n-minerals' },
      { name: 'Other Supplements', slug: 'other-supplements' },
    ],
  },
  {
    name: 'Diabetic-Needs',
    slug: 'diabetic-needs',
    items: [
      { name: 'Diabetic Testing Needs', slug: 'diabetic-testing-needs' },
      { name: 'Diabetic Nutrition', slug: 'diabetic-nutrition' },
      { name: 'Diabetic Aids', slug: 'diabetic-aids' },
    ],
  },
  {
    name: 'Household-Needs',
    slug: 'household-needs',
    items: [
      { name: 'Cleaning Needs', slug: 'cleaning-needs' },
      { name: 'Detergents', slug: 'detergents' },
      { name: 'Germ Protection', slug: 'germ-protection' },
      { name: 'Home Utilities', slug: 'home-utilities' },
      { name: 'Kitchen Utilities', slug: 'kitchen-utilities' },
      { name: 'Pooja & Decoratives', slug: 'pooja-n-decoratives' },
      { name: 'Stationery', slug: 'stationery' },
      { name: 'Tissues & Disposables', slug: 'tissues-n-disposables' },
      { name: 'Pet Care', slug: 'pet-care' },
      { name: 'Rice & Grains', slug: 'rice-n-grains' },
      { name: 'Dals & Pulses', slug: 'dals-n-pulses' },
      { name: 'Atta, Rava & Flours', slug: 'atta-rava-n-flours' },
      { name: 'Luggage', slug: 'luggage' },
      { name: 'Ghee & Edible Oils', slug: 'ghee-n-edible-oils' },
      { name: 'Salt, Spices & Condiments', slug: 'salt-spices-n-condiments' },
      { name: 'Sugars & Sweeteners', slug: 'sugars-n-sweeteners' },
      { name: 'Dried Fruits, Nuts and Seeds', slug: 'dried-fruits-nuts-and-seeds' },
      { name: 'Bakery & Confectionary', slug: 'bakery-n-confectionary' },
      { name: 'Beverages', slug: 'beverages' },
      { name: 'Noodles, Soups & Pasta', slug: 'noodles-soups-n-pasta' },
      { name: 'Snacks & Ready To Eat', slug: 'snacks-n-ready-to-eat' },
      { name: 'Pickles & Ready To Cook', slug: 'pickles-n-ready-to-cook' },
      { name: 'Jams, Sauces & Spreads', slug: 'jams-sauces-n-spreads' },
      { name: 'Dairy Products', slug: 'dairy-products' },
      { name: 'Branded Organic & Ayurvedic', slug: 'branded-organic-n-ayurvedic' },
    ],
  },
  {
    name: 'Ayurvedic',
    slug: 'ayurvedic',
    items: [
      { name: 'Ayurvedic Foods & Drinks', slug: 'ayurvedic-foods-n-drinks' },
      { name: 'Ayurvedic Personal Care', slug: 'ayurvedic-personal-care' },
      { name: 'Ayurvedic Remedies', slug: 'ayurvedic-remedies' },
      { name: 'Herbal Supplements', slug: 'herbal-supplements' },
      { name: 'Immunity Boosters', slug: 'immunity-boosters' },
    ],
  },
  {
    name: 'Fashion-n-Lifestyle',
    slug: 'fashion-n-lifestyle',
    items: [
      { name: "Men's Fashion", slug: 'men-s-fashion' },
      { name: 'Gym Equipments', slug: 'gym-equipments' },
      { name: 'Wearables & Smart Accessories', slug: 'wearables-n-smart-accessories' },
    ],
  },
  {
    name: 'Monsoon-Essentials',
    slug: 'monsoon-essentials',
    items: [
      { name: 'Super Monsoon Sale', slug: 'super-monsoon-sale' },
      { name: 'Seasonal Immunity', slug: 'seasonal-immunity' },
    ],
  },
];

// 2. PHARMACY - THERAPEUTIC CATEGORIES & DRUG CLASSIFICATIONS
export interface TherapeuticCategory {
  name: string;
  slug: string;
  description: string;
  classes: string[];
}

export const PHARMACY_THERAPEUTIC_CATEGORIES: TherapeuticCategory[] = [
  {
    name: 'Gastrointestinal & Hepatobiliary System',
    slug: 'gastrointestinal-n-hepatobiliary-system',
    description: 'Medicines for acidity, ulceration, liver function, GERD, nausea, and digestive motility.',
    classes: [
      'Antacids & Antireflux Agents',
      'Antiulcerants (PPIs & H2 Blockers)',
      'Laxatives & Purgatives',
      'Antidiarrhoeals & Probiotics',
      'Antiemetics & Antinauseants',
      'Hepatoprotective Drugs',
    ],
  },
  {
    name: 'Cardiovascular & Hematopoietic system',
    slug: 'cardiovascular-n-hematopoietic-system',
    description: 'Formulations for hypertension, heart failure, angina, cholesterol, and coagulation.',
    classes: [
      'Cardiac Drugs & Inotropes',
      'Antihypertensives (ACEI/ARBs)',
      'Beta-Blockers & Calcium Channel Blockers',
      'Lipid Lowering Drugs (Statins)',
      'Antiplatelets & Anticoagulants',
      'Haemostatics & Blood Volume Expanders',
    ],
  },
  {
    name: 'Respiratory System',
    slug: 'respiratory-system',
    description: 'Treatments for cough, allergic rhinitis, asthma, COPD, and respiratory tract infections.',
    classes: [
      'Respiratory Stimulants',
      'Antiasthmatics & Bronchodilators',
      'Cough Syrups, Expectorants & Mucolytics',
      'Nasal Decongestants & Anti-Allergics',
      'Inhalation Aerosols & Respules',
    ],
  },
  {
    name: 'Central Nervous System',
    slug: 'central-nervous-system',
    description: 'Drugs acting on the brain and nerves for pain, fever, anxiety, depression, and seizures.',
    classes: [
      'Analgesics & Antipyretics',
      'Anxiolytics & Sedatives',
      'Antidepressants & Mood Regulators',
      'Antiepileptics & Anticonvulsants',
      'Antimigraine Formulations',
      'Neuroprotective & Nootropics',
    ],
  },
  {
    name: 'Musculo-Skeletal System',
    slug: 'musculo-skeletal-system',
    description: 'Therapies for arthritis, joint inflammation, muscular spasm, and gout.',
    classes: [
      'Disease-Modifying Anti-Rheumatic Drugs (DMARDs)',
      'NSAIDs & Pain Relief Formulations',
      'Muscle Relaxants',
      'Anti-Gout Preparations',
      'Bone Health & Calcium Regulators',
    ],
  },
  {
    name: 'Hormones',
    slug: 'hormones',
    description: 'Hormone replacement therapies, steroids, thyroid modulators, and endocrine regulators.',
    classes: [
      'Androgens & Synthetic Hormones',
      'Corticosteroids (Oral & Injectable)',
      'Thyroid & Antithyroid Agents',
      'Progestogens & Estrogens',
      'Pituitary & Hypothalamic Hormones',
    ],
  },
  {
    name: 'Contraceptive Agents',
    slug: 'contraceptive-agents',
    description: 'Oral pills, emergency contraception, and reproductive health wellness products.',
    classes: [
      'Oral Contraceptives',
      'Emergency Contraception',
      'Intrauterine & Barrier Formulations',
    ],
  },
  {
    name: 'Infectious Disease Drugs',
    slug: 'infectious-disease-drugs',
    description: 'Broad-spectrum antibiotics, antifungals, antivirals, and antiparasitics.',
    classes: [
      'Aminoglycosides & Glycopeptides',
      'Penicillins & Cephalosporins',
      'Fluoroquinolones & Macrolides',
      'Antifungal Systemic Agents',
      'Antiviral Therapeutics',
      'Antimalarials & Anthelmintics',
    ],
  },
  {
    name: 'Oncology',
    slug: 'oncology',
    description: 'Cytotoxic chemotherapy, targeted therapies, and supportive oncology agents.',
    classes: [
      'Cytotoxic Chemotherapy',
      'Targeted Therapies & Monoclonals',
      'Hormone Antagonists in Oncology',
      'Supportive & Antiemetic Oncology Care',
    ],
  },
  {
    name: 'Genito - Urinary System',
    slug: 'genito-urinary-system',
    description: 'Medicines for urinary tract health, prostate conditions, and gynecological care.',
    classes: [
      'Preparations for Vaginal Conditions',
      'Urinary Antiseptics & Alkalizers',
      'BPH (Prostate) Medications',
      'Drugs for Erectile Dysfunction',
    ],
  },
  {
    name: 'Endocrine & Metabolic System',
    slug: 'endocrine-n-metabolic-system',
    description: 'Comprehensive diabetes management, insulin formulations, and metabolic stabilizers.',
    classes: [
      'Insulin Preparations (Rapid/Long Acting)',
      'Oral Antidiabetic Agents (Biguanides/Sulfonylureas)',
      'DPP-4, SGLT-2 & GLP-1 Analogues',
      'Metabolic Correctors & Weight Agents',
    ],
  },
  {
    name: 'Vitamins & Minerals',
    slug: 'vitamins-n-minerals',
    description: 'Essential micronutrients, therapeutic vitamins, calcium, iron, and antioxidant supplements.',
    classes: [
      'Vitamins (A, B-Complex, C, D3, E, K)',
      'Multivitamins with Minerals',
      'Calcium & Vitamin D3 Formulations',
      'Iron & Folic Acid Formulations',
      'Zinc & Trace Elements',
    ],
  },
  {
    name: 'Nutrition',
    slug: 'nutrition',
    description: 'Medical nutritional feeds, infant nutrition, electrolyte solutions, and clinical supplements.',
    classes: [
      'Infant Nutritional Products',
      'Clinical Enteral Nutrition & Protein',
      'Oral Rehydration Solutions (ORS)',
      'Specialized Adult Nutritional Care',
    ],
  },
  {
    name: 'Eye',
    slug: 'eye',
    description: 'Ophthalmic anti-infectives, lubricants, anti-allergy drops, and glaucoma therapies.',
    classes: [
      'Eye Anti-Infectives & Antiseptics',
      'Lubricating Eye Drops & Artificial Tears',
      'Anti-Glaucoma Drops',
      'Ophthalmic Corticosteroids & NSAIDs',
    ],
  },
  {
    name: 'Ear & Mouth / Throat',
    slug: 'ear-n-mouth-throat',
    description: 'Topical drops for otic conditions, antiseptic gargles, throat sprays, and dental gels.',
    classes: [
      'Ear Anti-Infectives & Wax Softeners',
      'Mouthwashes & Antiseptic Gargles',
      'Throat Lozenges & Anesthetic Sprays',
      'Dental Pain & Ulcer Gels',
    ],
  },
  {
    name: 'Dermatologicals',
    slug: 'dermatologicals',
    description: 'Topical creams, ointments, lotions for eczema, acne, fungal infections, and wounds.',
    classes: [
      'Topical Antibiotics & Antiseptics',
      'Topical Antifungals',
      'Topical Corticosteroids & Calcineurin Inhibitors',
      'Emollients, Moisturizers & Barrier Creams',
      'Anti-Acne Formulations',
    ],
  },
  {
    name: 'Anaesthetics & Intravenous Solutions',
    slug: 'anaesthetics-n-intravenous-solutions',
    description: 'Local anesthetic gels/injections, IV fluid infusions, and electrolytes.',
    classes: [
      'Anaesthetics Local & Surface',
      'Intravenous Solutions (Normal Saline, RL, DNS)',
      'Parenteral Electrolyte Additives',
    ],
  },
  {
    name: 'Allergy & Immune System',
    slug: 'allergy-n-immune-system',
    description: 'Non-sedating antihistamines, allergy therapies, and immunomodulators.',
    classes: [
      'Antihistamines & Antiallergics',
      'Immunosuppressive Agents',
      'Immunostimulants & Allergy Desensitizers',
    ],
  },
  {
    name: 'Antidotes, Detoxifying Agents & Drugs Used in Substance Dependence',
    slug: 'antidotes-detoxifying-agents-n-drugs-used-in-substance-dependence',
    description: 'Antidotes, smoking cessation products, and detoxifying therapies.',
    classes: [
      'Antidotes and Detoxifying Agents',
      'Smoking Cessation (Nicotine Replacement)',
      'Substance Dependence Therapeutics',
    ],
  },
  {
    name: 'Miscellaneous',
    slug: 'miscellaneous',
    description: 'General surgical supplies, diagnostic reagents, and miscellaneous health products.',
    classes: [
      'Surgical Disinfectants & Handrubs',
      'Diagnostic Strips & Reagents',
      'General Medicinal Aids',
    ],
  },
];

// 3. DIAGNOSTICS & TESTS TAXONOMY
export interface DiagnosticCategoryGroup {
  groupName: string;
  slug: string;
  tests: { name: string; slug: string }[];
}

export const DIAGNOSTICS_TAXONOMY: DiagnosticCategoryGroup[] = [
  {
    groupName: 'Radiology Tests',
    slug: 'radiology-tests',
    tests: [
      { name: '2D Echo', slug: '2d-echo' },
      { name: 'Bone Densitometry', slug: 'bone-densitometry' },
      { name: 'TMT', slug: 'tmt' },
      { name: 'Audiometry', slug: 'audiometry' },
      { name: 'ECG (Electrocardiogram)', slug: 'ecg' },
      { name: 'MRI', slug: 'mri' },
      { name: '3D/4D Ultrasound', slug: 'ultrasound' },
      { name: 'Mammography', slug: 'mammography' },
      { name: 'CT Scan', slug: 'ct-scan' },
      { name: 'Pulmonary Function Test (PFT)', slug: 'pft' },
      { name: 'X-Ray', slug: 'x-ray' },
    ],
  },
  {
    groupName: 'Condition Based',
    slug: 'condition-based',
    tests: [
      { name: 'Kidney', slug: 'kidney' },
      { name: 'Heavy Metals', slug: 'heavy-metals' },
      { name: 'Lungs', slug: 'lungs' },
      { name: 'Fertility', slug: 'fertility' },
      { name: 'Infectious Disease', slug: 'infectious-disease' },
      { name: 'Blood Disorders', slug: 'blood-disorders' },
      { name: 'Inflammatory Markers', slug: 'inflammatory-markers' },
      { name: 'Vitamins', slug: 'vitamins' },
      { name: 'Electrolytes', slug: 'electrolytes' },
      { name: 'Anaemia', slug: 'anaemia' },
      { name: 'Autoimmune Disorders', slug: 'autoimmune-disorders' },
      { name: 'Allergy', slug: 'allergy' },
      { name: 'Stomach', slug: 'stomach' },
      { name: 'Thyroid', slug: 'thyroid' },
      { name: 'Bone', slug: 'bone' },
      { name: 'Immunity', slug: 'immunity' },
      { name: 'Fever', slug: 'fever' },
      { name: 'Diabetes', slug: 'diabetes' },
      { name: 'Cancer', slug: 'cancer' },
      { name: 'Hormones', slug: 'hormones' },
      { name: 'Prostate', slug: 'prostate' },
      { name: 'Tuberculosis', slug: 'tuberculosis' },
    ],
  },
  {
    groupName: 'Other Pathology Tests',
    slug: 'other-pathology-tests',
    tests: [
      { name: 'Pregnancy', slug: 'pregnancy' },
      { name: 'HIV', slug: 'hiv' },
      { name: 'Clotting Disorders', slug: 'clotting-disorders' },
      { name: 'Heart', slug: 'heart' },
      { name: 'Drug Level Monitoring', slug: 'drug-level-monitoring' },
      { name: 'Liver', slug: 'liver' },
      { name: 'Musculo Skeletal Disorders', slug: 'musculo-skeletal' },
      { name: 'Toxicology', slug: 'toxicology' },
    ],
  },
  {
    groupName: 'Department Wise Diagnostic Tests',
    slug: 'department-wise-diagnostic-tests',
    tests: [
      { name: 'Serology', slug: 'serology' },
      { name: 'Microbiology', slug: 'microbiology' },
      { name: 'Biochemistry', slug: 'biochemistry' },
      { name: 'Hematology', slug: 'hematology' },
      { name: 'Molecular Biology', slug: 'molecular-biology' },
      { name: 'Clinical Pathology', slug: 'clinical-pathology' },
      { name: 'Profile Parameters', slug: 'profile-parameters' },
    ],
  },
];

// 4. DOCTOR CONSULTATION & SYMPTOM SEARCH
export interface DoctorConsultCategory {
  title: string;
  slug: string;
  items: { name: string; slug: string }[];
}

export const DOCTOR_CONSULTATION_TAXONOMY: DoctorConsultCategory[] = [
  {
    title: 'By Specialization',
    slug: 'by-specialization',
    items: [
      { name: 'General Medicine', slug: 'general-medicine' },
      { name: 'Paediatrics', slug: 'paediatrics' },
      { name: 'Obstetrics and Gynaecology', slug: 'obstetrics-gynaecology' },
      { name: 'Diabetology', slug: 'diabetology' },
      { name: 'Cardiology', slug: 'cardiology' },
      { name: 'Pulmonary Medicine', slug: 'pulmonary-medicine' },
      { name: 'Orthopaedics', slug: 'orthopaedics' },
      { name: 'Dermatology-Venereology', slug: 'dermatology' },
      { name: 'Infectious Disease', slug: 'infectious-disease' },
      { name: 'Allergy & Immunology', slug: 'allergy-immunology' },
      { name: 'Respiratory Medicine', slug: 'respiratory-medicine' },
      { name: 'TB & Chest Disease', slug: 'tb-chest-disease' },
      { name: 'Senior Consultant Orthopaedic Surgeon', slug: 'orthopaedic-surgeon' },
      { name: 'General Physician', slug: 'general-physician' },
    ],
  },
  {
    title: 'By Symptoms',
    slug: 'by-symptoms',
    items: [
      { name: 'Chest Pain', slug: 'chest-pain' },
      { name: 'Cold and Fever', slug: 'cold-and-fever' },
      { name: 'Depression', slug: 'depression' },
      { name: 'Constipation', slug: 'constipation' },
      { name: 'Low Back Pain', slug: 'low-back-pain' },
      { name: 'Irregular Periods', slug: 'irregular-periods' },
      { name: 'Throat Pain', slug: 'throat-pain' },
      { name: 'Hair Fall', slug: 'hair-fall' },
      { name: 'Breathing Problems', slug: 'breathing-problems' },
      { name: 'Abdominal Pain', slug: 'abdominal-pain' },
      { name: 'Sexual Health', slug: 'sexual-health' },
    ],
  },
];

// 5. ALPHABET LIST FOR MEDICINES DIRECTORY (A-Z)
export const ALPHABET_DIRECTORY = [
  'ALL',
  '0-9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

// Helper to sanitize slug
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[&]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
