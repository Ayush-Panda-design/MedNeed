import { getPharmacyInvoiceConfig, PharmacyInvoiceConfig } from './invoiceConfig';
import { prisma } from './prisma';

export interface InvoiceLineItem {
  slNo: number;
  id: string;
  title: string;
  itemType: string;
  batchNumber: string;
  hsnCode: string;
  quantity: number;
  mrp: number;
  unitPrice: number;
  lineTotal: number;
  taxableValue: number;
  gstRate: number; // e.g. 0.12 (12%)
  cgstRate: number; // e.g. 0.06
  cgstAmount: number;
  sgstRate: number; // e.g. 0.06
  sgstAmount: number;
  igstRate: number; // e.g. 0.12 or 0
  igstAmount: number;
}

export interface StatutoryGstInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  orderId: string;
  paymentMethod: string;
  paymentStatus: string;
  razorpayPaymentId?: string | null;
  pharmacy: PharmacyInvoiceConfig;
  dispensingPharmacist: {
    name: string;
    registrationNumber: string;
    council: string;
  };
  customer: {
    name: string;
    phone: string;
    address: string;
    pincode: string;
    state: string;
    stateCode: string;
  };
  placeOfSupply: string;
  isInterState: boolean;
  items: InvoiceLineItem[];
  totals: {
    itemTotalMrp: number;
    discountSavings: number;
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
    deliveryFee: number;
    roundedFinalTotal: number;
  };
}

/**
 * Derives the 2-digit Indian GST state code from a 6-digit postal pincode.
 */
function getStateCodeFromPincode(pincode: string, stateName?: string): { code: string; name: string } {
  const pin = (pincode || '').replace(/\D/g, '');
  const prefix2 = pin.substring(0, 2);

  // Odisha (PIN 75xxxx, 76xxxx) -> State Code 21
  if (prefix2 === '75' || prefix2 === '76' || stateName?.toLowerCase() === 'odisha') {
    return { code: '21', name: 'Odisha' };
  }
  // West Bengal (PIN 70-74) -> State Code 19
  if (parseInt(prefix2) >= 70 && parseInt(prefix2) <= 74) {
    return { code: '19', name: 'West Bengal' };
  }
  // Andhra Pradesh (PIN 51-53) -> State Code 37
  if (parseInt(prefix2) >= 51 && parseInt(prefix2) <= 53) {
    return { code: '37', name: 'Andhra Pradesh' };
  }
  // Delhi (PIN 11) -> State Code 07
  if (prefix2 === '11') {
    return { code: '07', name: 'Delhi' };
  }
  // Maharashtra (PIN 40-44) -> State Code 27
  if (parseInt(prefix2) >= 40 && parseInt(prefix2) <= 44) {
    return { code: '27', name: 'Maharashtra' };
  }

  return { code: '21', name: stateName || 'Odisha' };
}

/**
 * Calculates a complete statutory GST Tax Invoice for an Order.
 */
export async function generateGstTaxInvoice(order: any): Promise<StatutoryGstInvoice> {
  const config = getPharmacyInvoiceConfig();

  // 1. Resolve Dispensing Pharmacist dynamically from active AdminUser table
  let pharmacistName = config.defaultPharmacistName;
  let pharmacistRegNo = config.defaultPharmacistRegNo;

  try {
    if (process.env.DATABASE_URL) {
      const activePharmacist = await prisma.adminUser.findFirst({
        where: {
          role: 'PHARMACIST',
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (activePharmacist) {
        pharmacistName = activePharmacist.name;
        if (activePharmacist.pharmacistRegNo) {
          pharmacistRegNo = activePharmacist.pharmacistRegNo;
        }
      }
    }
  } catch {
    // Graceful fallback to configured pharmacist
  }

  // 2. Determine Place of Supply (Intra-state vs Inter-state)
  const customerState = getStateCodeFromPincode(order.pincode, 'Odisha');
  const isInterState = customerState.code !== config.stateCode;

  // 3. Line Items Tax Back-calculation
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let itemTotalMrp = 0;

  const items: InvoiceLineItem[] = (order.items || []).map((it: any, index: number) => {
    const qty = Math.max(1, Number(it.quantity) || 1);
    const mrp = Number(it.mrp || 0);
    const unitPrice = Number(it.unitPrice || 0);
    const lineSellingTotal = Number((unitPrice * qty).toFixed(2));
    itemTotalMrp += mrp * qty;

    const isMedicine = it.itemType !== 'DIAGNOSTIC_TEST';
    const hsnCode = isMedicine ? config.defaultHsnCode : config.defaultDiagnosticSac;
    
    // Medicaments standard GST rate (12%), Diagnostics healthcare services are exempt (0%)
    const gstRate = isMedicine ? config.medicineGstRate : 0.0;

    // Back-calculate taxable value from inclusive retail price
    const taxableValue = gstRate > 0
      ? Number((lineSellingTotal / (1 + gstRate)).toFixed(2))
      : lineSellingTotal;
    
    const lineTaxAmount = Number((lineSellingTotal - taxableValue).toFixed(2));

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (gstRate > 0) {
      if (isInterState) {
        igstRate = gstRate;
        igstAmount = lineTaxAmount;
        totalIgst += igstAmount;
      } else {
        cgstRate = gstRate / 2;
        sgstRate = gstRate / 2;
        cgstAmount = Number((lineTaxAmount / 2).toFixed(2));
        sgstAmount = Number((lineTaxAmount - cgstAmount).toFixed(2));
        totalCgst += cgstAmount;
        totalSgst += sgstAmount;
      }
    }

    totalTaxableValue += taxableValue;

    return {
      slNo: index + 1,
      id: it.id,
      title: it.title,
      itemType: it.itemType,
      batchNumber: it.batchNumber || 'LW-GENUINE-BATCH',
      hsnCode,
      quantity: qty,
      mrp,
      unitPrice,
      lineTotal: lineSellingTotal,
      taxableValue,
      gstRate,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
    };
  });

  totalTaxableValue = Number(totalTaxableValue.toFixed(2));
  totalCgst = Number(totalCgst.toFixed(2));
  totalSgst = Number(totalSgst.toFixed(2));
  totalIgst = Number(totalIgst.toFixed(2));
  const totalTax = Number((totalCgst + totalSgst + totalIgst).toFixed(2));
  const deliveryFee = Number(order.deliveryFee || 0);
  const roundedFinalTotal = Number(order.finalTotal || (totalTaxableValue + totalTax + deliveryFee));
  const discountSavings = Math.max(0, Number((itemTotalMrp - (roundedFinalTotal - deliveryFee)).toFixed(2)));

  const invoiceNumber = `INV-${config.stateCode}-${order.id.replace(/^ORD-/, '')}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return {
    invoiceNumber,
    invoiceDate,
    orderId: order.id,
    paymentMethod: order.paymentMethod || 'RAZORPAY_UPI',
    paymentStatus: order.paymentStatus || 'PAID',
    razorpayPaymentId: order.razorpayPaymentId || null,
    pharmacy: config,
    dispensingPharmacist: {
      name: pharmacistName,
      registrationNumber: pharmacistRegNo,
      council: 'Odisha State Pharmacy Council (OSPC)',
    },
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      address: order.address,
      pincode: order.pincode,
      state: customerState.name,
      stateCode: customerState.code,
    },
    placeOfSupply: `${customerState.name} (${customerState.code})`,
    isInterState,
    items,
    totals: {
      itemTotalMrp: Number(itemTotalMrp.toFixed(2)),
      discountSavings,
      totalTaxableValue,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      deliveryFee,
      roundedFinalTotal: Number(roundedFinalTotal.toFixed(2)),
    },
  };
}
