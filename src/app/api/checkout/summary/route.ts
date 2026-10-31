import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerSession } from '@/lib/serverAuth';

export async function POST(request: Request) {
  try {
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required to checkout' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items = [], pincode, distanceKm } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Your cart is empty. Please add items before checking out.' },
        { status: 400 }
      );
    }

    // Validate 6-digit Pincode & 10km Delivery Radius if provided
    let calculatedDist = 2.5;
    if (pincode) {
      const cleanPin = pincode.toString().replace(/\D/g, '');
      if (cleanPin.length !== 6) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid 6-digit postal pincode.' },
          { status: 400 }
        );
      }
      calculatedDist = Math.max(0.8, Number(distanceKm) || 2.5);
      if (calculatedDist > 10.0) {
        return NextResponse.json(
          { success: false, error: `Delivery location is ${calculatedDist} km away. Doorstep delivery strictly covers within 10 km.` },
          { status: 400 }
        );
      }
    }

    const medicineIds = items
      .filter((i: any) => i.type !== 'DIAGNOSTIC_TEST')
      .map((i: any) => i.id);

    const diagnosticIds = items
      .filter((i: any) => i.type === 'DIAGNOSTIC_TEST')
      .map((i: any) => i.id);

    const [medicines, diagnostics, activeDiscounts] = await Promise.all([
      medicineIds.length > 0 && process.env.DATABASE_URL
        ? prisma.medicine.findMany({
            where: { id: { in: medicineIds } },
            include: { batches: { where: { isQuarantined: false, quantity: { gt: 0 } }, orderBy: { expiryDate: 'asc' } } },
          })
        : [],
      diagnosticIds.length > 0 && process.env.DATABASE_URL
        ? prisma.diagnosticTest.findMany({
            where: { id: { in: diagnosticIds } },
          })
        : [],
      process.env.DATABASE_URL
        ? prisma.discountRule.findMany({ where: { isActive: true } })
        : [],
    ]);

    const medMap = new Map(medicines.map((m) => [m.id, m]));
    const diagMap = new Map(diagnostics.map((d) => [d.id, d]));

    let calculatedSubtotal = 0;
    let calculatedDiscount = 0;
    let requiresPrescription = false;
    let hasDiagnostics = false;
    let hasScheduleX = false;
    const scheduleXItems: string[] = [];
    const changeMessages: string[] = [];
    let hasChanged = false;
    let allStockAvailable = true;

    interface TrustedSummaryItem {
      id: string;
      title: string;
      type: 'MEDICINE' | 'DIAGNOSTIC_TEST';
      batchNumber: string;
      mrp: number;
      sellingPrice: number;
      quantity: number;
      lineTotal: number;
      stockQty: number;
      inStock: boolean;
      requiresPrescription: boolean;
      schedule?: string;
    }

    const trustedItems: TrustedSummaryItem[] = [];

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const isDiag = item.type === 'DIAGNOSTIC_TEST';

      if (isDiag) {
        hasDiagnostics = true;
        const diag = diagMap.get(item.id);
        const mrp = diag ? Number(diag.mrp) : 500;
        const sellingPrice = diag ? Number(diag.discountedPrice) : 400;
        const lineTotal = Number((sellingPrice * qty).toFixed(2));

        calculatedSubtotal += mrp * qty;
        calculatedDiscount += (mrp - sellingPrice) * qty;

        trustedItems.push({
          id: item.id,
          title: diag ? diag.name : (item.title || 'Diagnostic Test'),
          type: 'DIAGNOSTIC_TEST',
          batchNumber: 'N/A',
          mrp,
          sellingPrice,
          quantity: qty,
          lineTotal,
          stockQty: 999,
          inStock: true,
          requiresPrescription: false,
        });
      } else {
        const med = medMap.get(item.id);
        if (!med) {
          // If fallback mode without full DB seed
          const fallbackMrp = Number(item.mrp) || 120;
          const fallbackSelling = Number(item.sellingPrice) || 100;
          calculatedSubtotal += fallbackMrp * qty;
          calculatedDiscount += (fallbackMrp - fallbackSelling) * qty;

          trustedItems.push({
            id: item.id,
            title: item.title || 'Medicine Item',
            type: 'MEDICINE',
            batchNumber: 'ML-2024-B1',
            mrp: fallbackMrp,
            sellingPrice: fallbackSelling,
            quantity: qty,
            lineTotal: Number((fallbackSelling * qty).toFixed(2)),
            stockQty: 50,
            inStock: true,
            requiresPrescription: Boolean(item.requiresPrescription),
          });
          continue;
        }

        if (med.requiresPrescription || med.schedule === 'SCHEDULE_H' || med.schedule === 'SCHEDULE_H1') {
          requiresPrescription = true;
        }

        if (med.schedule === 'SCHEDULE_X') {
          hasScheduleX = true;
          scheduleXItems.push(med.name);
          hasChanged = true;
          changeMessages.push(
            `"${med.name}" is classified as a Schedule X controlled substance. Indian regulations (Drugs & Cosmetics Rules 65/97) prohibit online sale of Schedule X drugs. Please remove it to proceed.`
          );
        }

        // FEFO batch selection
        const earliestBatch = med.batches[0];
        const mrp = earliestBatch ? Number(earliestBatch.printedMrp) : Number(med.baseMrp);

        // Highest active discount check
        let bestDiscount = Number(med.discountPercentage) || 0;
        for (const rule of activeDiscounts) {
          if (rule.scope === 'ALL_MEDICINES' && Number(rule.discountPercentage) > bestDiscount) {
            bestDiscount = Number(rule.discountPercentage);
          } else if (rule.scope === 'CATEGORY' && rule.targetCategory === med.category && Number(rule.discountPercentage) > bestDiscount) {
            bestDiscount = Number(rule.discountPercentage);
          }
        }

        const sellingPrice = Number((mrp * (1 - bestDiscount / 100)).toFixed(2));
        const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
        const inStock = totalStock >= qty;

        if (!inStock) {
          allStockAvailable = false;
          hasChanged = true;
          changeMessages.push(`"${med.name}" has only ${totalStock} units available (you requested ${qty}).`);
        }

        // Check if price changed vs client assumption
        if (item.sellingPrice !== undefined && Math.abs(Number(item.sellingPrice) - sellingPrice) > 0.05) {
          hasChanged = true;
          changeMessages.push(`Price for "${med.name}" updated to ₹${sellingPrice} (was ₹${item.sellingPrice}).`);
        }

        calculatedSubtotal += mrp * qty;
        calculatedDiscount += (mrp - sellingPrice) * qty;

        trustedItems.push({
          id: med.id,
          title: `${med.name} (${med.packaging})`,
          type: 'MEDICINE',
          batchNumber: earliestBatch?.batchNumber || 'LW-BATCH-CURR',
          mrp,
          sellingPrice,
          quantity: qty,
          lineTotal: Number((sellingPrice * qty).toFixed(2)),
          stockQty: totalStock,
          inStock,
          requiresPrescription: Boolean(med.requiresPrescription || med.schedule === 'SCHEDULE_H' || med.schedule === 'SCHEDULE_H1'),
          schedule: med.schedule,
        });
      }
    }

    calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));
    calculatedDiscount = Number(calculatedDiscount.toFixed(2));
    const itemsTotal = Math.max(0, calculatedSubtotal - calculatedDiscount);
    // Free delivery above ₹200, else ₹35
    const deliveryFee = itemsTotal >= 200 ? 0 : 35;
    const finalTotal = Number((itemsTotal + deliveryFee).toFixed(2));

    return NextResponse.json({
      success: true,
      summary: {
        items: trustedItems,
        subtotal: calculatedSubtotal,
        discountTotal: calculatedDiscount,
        deliveryFee,
        finalTotal,
        distanceKm: calculatedDist,
        requiresPrescription,
        hasDiagnostics,
        hasScheduleX,
        scheduleXItems,
        hasChanged,
        changeMessages,
        allStockAvailable,
      },
    });
  } catch (error: any) {
    console.error('Checkout summary error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
