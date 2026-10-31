/**
 * Statutory Indian Pharmacy & GST Invoice Configuration
 * 
 * Loaded from environment variables with legal defaults for an authorized
 * retail/e-pharmacy operating under Drugs and Cosmetics Rules 1945.
 */
export interface PharmacyInvoiceConfig {
  pharmacyLegalName: string;
  tradeName: string;
  registeredAddress: string;
  city: string;
  state: string;
  pincode: string;
  stateCode: string; // GST State Code e.g. "21" for Odisha
  gstin: string;
  pan: string;
  drugLicense20B: string; // Form 20B Allopathic retail/wholesale
  drugLicense21B: string; // Form 21B Schedule C/C1
  fssaiLicense: string;
  contactPhone: string;
  contactEmail: string;
  defaultHsnCode: string; // 3004 for medicaments
  defaultDiagnosticSac: string; // 9993 for healthcare/clinical diagnostic services
  medicineGstRate: number; // 0.12 (12% standard GST on HSN 3004)
  defaultPharmacistName: string;
  defaultPharmacistRegNo: string;
}

export function getPharmacyInvoiceConfig(): PharmacyInvoiceConfig {
  return {
    pharmacyLegalName: process.env.PHARMACY_LEGAL_NAME || 'MedNeed Healthcare Private Limited',
    tradeName: process.env.PHARMACY_TRADE_NAME || 'MedNeed 24x7 Express Pharmacy',
    registeredAddress: process.env.PHARMACY_ADDRESS || 'Plot No. 104, Rasulgarh Industrial Estate, Cuttack Road',
    city: process.env.PHARMACY_CITY || 'Bhubaneswar',
    state: process.env.PHARMACY_STATE || 'Odisha',
    pincode: process.env.PHARMACY_PINCODE || '751010',
    stateCode: process.env.PHARMACY_STATE_CODE || '21',
    gstin: process.env.PHARMACY_GSTIN || '21AAACM1234F1Z5',
    pan: process.env.PHARMACY_PAN || 'AAACM1234F',
    drugLicense20B: process.env.PHARMACY_DRUG_LICENSE_20B || 'DL-20B-BBSR-2024-0012',
    drugLicense21B: process.env.PHARMACY_DRUG_LICENSE_21B || 'DL-21B-BBSR-2024-0013',
    fssaiLicense: process.env.PHARMACY_FSSAI_LICENSE || '12024999000123',
    contactPhone: process.env.PHARMACY_PHONE || '+91 94375 45411',
    contactEmail: process.env.PHARMACY_EMAIL || 'billing@medneed.com',
    defaultHsnCode: process.env.PHARMACY_DEFAULT_HSN || '3004',
    defaultDiagnosticSac: process.env.PHARMACY_DEFAULT_SAC || '9993',
    medicineGstRate: parseFloat(process.env.PHARMACY_MEDICINE_GST_RATE || '0.12'),
    defaultPharmacistName: process.env.PHARMACY_DISPENSING_PHARMACIST_NAME || 'Rajesh Sharma, B.Pharm',
    defaultPharmacistRegNo: process.env.PHARMACY_DISPENSING_PHARMACIST_REG_NO || 'OSPC/2021/7892',
  };
}
