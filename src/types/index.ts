export type AdminRole = 'SUPER_ADMIN' | 'STORE_MANAGER' | 'PHARMACIST' | 'AUDIT_OFFICER' | 'CUSTOMER';
export type UserRole = 'CUSTOMER' | 'SUPER_ADMIN' | 'STORE_MANAGER' | 'PHARMACIST' | 'AUDIT_OFFICER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  provider: 'email' | 'google';
  pharmacistLicenseNumber?: string;
  pharmacistRegNo?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  role: AdminRole;
  email: string;
  avatar: string;
  pharmacistRegNo?: string;
  pharmacistLicenseNumber?: string;
  isActive?: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  salt: string; // Composition e.g., "Paracetamol 650mg"
  category: string;
  department?: 'Pharmacy' | 'General Store' | 'OTC';
  subCategory?: string;
  therapeuticCategory?: string;
  therapeuticClass?: string;
  symptoms?: string[];
  conditions?: string[];
  mrp: number; // Maximum Retail Price (Printed on batch)
  discountPercentage: number; // e.g. 5, 10
  sellingPrice: number; // Calculated dynamically
  costPrice: number; // Wholesale / LocalWell cost rate
  requiresPrescription: boolean;
  stockQty: number;
  batchNumber: string;
  expiryDate: string; // YYYY-MM
  packaging: string; // e.g., "Strip of 10 Tablets", "Bottle of 100ml"
  dosageForm: 'Tablet' | 'Syrup' | 'Injection' | 'Gel' | 'Drops' | 'Capsule' | 'Inhaler' | 'Sachet' | 'Cream' | 'Powder' | 'Lotion' | string;
  isColdChain?: boolean;
  schedule?: 'OTC' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X';
  localWellCode: string;
  description: string;
}

export interface DiagnosticTest {
  id: string;
  name: string;
  category: 'Full Body' | 'Diabetes' | 'Thyroid' | 'Heart' | 'Vitamins' | 'CBC / Fever' | 'Liver & Kidney';
  mrp: number;
  discountedPrice: number;
  fastingHours: number;
  sampleType: 'Blood' | 'Blood & Urine' | 'Urine';
  turnaroundHours: number; // e.g. 12, 24
  testCount: number;
  includes: string[];
  popular?: boolean;
}

export type OrderStatus =
  | 'PLACED'
  | 'RX_VERIFICATION'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface TrackingStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

export interface DeliveryDetails {
  riderName?: string;
  riderPhone?: string;
  deliveryOtp?: string;
  estimatedMinutes?: number;
  assignedAt?: string;
}

export interface DiagnosticAppointment {
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientRelation: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';
  collectionDate: string;
  collectionSlot: string;
}

export interface OrderItem {
  id: string;
  title: string;
  type: 'MEDICINE' | 'DIAGNOSTIC_TEST';
  mrp: number;
  unitPrice: number;
  quantity: number;
  requiresPrescription?: boolean;
  batchNumber?: string;
  patientDetails?: DiagnosticAppointment;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  pincode: string;
  distanceKm: number;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  finalTotal: number;
  paymentMethod: 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'COD';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
  razorpayPaymentId?: string;
  orderStatus: OrderStatus;
  prescriptionUrl?: string;
  prescriptionStatus?: 'NOT_REQUIRED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  doctorConsultRequired?: boolean;
  doctorConsultStatus?: 'NOT_REQUIRED' | 'PENDING_CALL' | 'COMPLETED';
  diagnosticAppointment?: DiagnosticAppointment;
  delivery: DeliveryDetails;
  trackingHistory: TrackingStep[];
  createdAt: string;
}

export interface FranchiseInquiry {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  proposedArea: string;
  commercialSpaceSqFt: number;
  ownershipType: 'OWNED' | 'RENTED';
  investmentBudget: '5_TO_10_LAKHS' | '10_TO_20_LAKHS' | '20_LAKHS_PLUS';
  hasPharmaExperience: boolean;
  status: 'NEW' | 'CONTACTED' | 'SITE_VISIT' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
}

export interface DiscountRule {
  id: string;
  title: string;
  scope: 'ALL_MEDICINES' | 'CATEGORY';
  targetCategory?: string;
  discountPercentage: number;
  isActive: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: AdminRole;
  actionType:
    | 'BULK_DISCOUNT_APPLIED'
    | 'ORDER_STATUS_UPDATED'
    | 'PRESCRIPTION_VERIFIED'
    | 'PRESCRIPTION_REJECTED'
    | 'LOCALWELL_STOCK_SYNCED'
    | 'PRICE_INFLATION_ADJUSTED'
    | 'RIDER_ASSIGNED'
    | 'FRANCHISE_STATUS_CHANGED';
  details: string;
  oldValue?: string;
  newValue?: string;
}
