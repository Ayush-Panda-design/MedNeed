import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifyServerSession } from '@/lib/serverAuth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting on Order Creation
    const clientIp = getClientIp(request);
    const ipLimit = await checkRateLimit(`ip_order_${clientIp}`, 15, 60);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many checkout requests. Please retry in ${ipLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    // 2. Strict Supabase Token Verification (Zero-Trust)
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized: Missing or invalid Supabase access token' },
        { status: 401 }
      );
    }

    const { userId, email: authEmail } = authResult.auth;

    // User-specific rate limit
    const userLimit = await checkRateLimit(`user_order_${userId}`, 10, 60);
    if (!userLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Please wait ${userLimit.retryAfterSeconds}s before creating a new order.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail = authEmail,
      address,
      pincode,
      distanceKm = 2.5,
      items = [],
      existingOrderId, // For safe, idempotent retry without creating duplicate orders
      prescriptionUrl,
      doctorConsultRequired = false,
      diagnosticAppointment,
      paymentMethod = 'RAZORPAY_UPI',
    } = body;

    if (!customerName?.trim() || !customerPhone?.trim() || !address?.trim() || !pincode?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name, mobile number, address, and pincode are required.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot checkout with an empty cart.' },
        { status: 400 }
      );
    }

    const cleanPin = pincode.toString().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit postal pincode.' },
        { status: 400 }
      );
    }

    // Verify existingOrderId if provided (Prevent BOLA / Order hijacking)
    if (existingOrderId && existingOrderId.trim() !== '') {
      if (process.env.DATABASE_URL) {
        const existingOrder = await prisma.order.findUnique({
          where: { id: existingOrderId.trim() },
        });

        if (!existingOrder) {
          return NextResponse.json(
            { success: false, error: `Order #${existingOrderId} not found` },
            { status: 404 }
          );
        }

        if (existingOrder.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: You do not have permission to modify this order.' },
            { status: 403 }
          );
        }

        if (existingOrder.paymentStatus === 'PAID') {
          return NextResponse.json(
            { success: false, error: 'Cannot modify an order that has already been paid.' },
            { status: 400 }
          );
        }
      }
    }

    const calculatedDist = Math.max(0.8, Number(distanceKm) || 2.5);
    if (calculatedDist > 10.0) {
      return NextResponse.json(
        { success: false, error: `Delivery address is ${calculatedDist} km away. Maximum delivery radius is 10 km.` },
        { status: 400 }
      );
    }

    // 3. Server-side Recalculation (Client-sent prices are completely ignored)
    const medicineIds = items.filter((i: any) => i.type !== 'DIAGNOSTIC_TEST').map((i: any) => i.id);
    const diagnosticIds = items.filter((i: any) => i.type === 'DIAGNOSTIC_TEST').map((i: any) => i.id);

    const [medicines, diagnostics, activeDiscounts] = await Promise.all([
      medicineIds.length > 0 && process.env.DATABASE_URL
        ? prisma.medicine.findMany({
            where: { id: { in: medicineIds } },
            include: { batches: { where: { isQuarantined: false, quantity: { gt: 0 } }, orderBy: { expiryDate: 'asc' } } },
          })
        : [],
      diagnosticIds.length > 0 && process.env.DATABASE_URL
        ? prisma.diagnosticTest.findMany({ where: { id: { in: diagnosticIds } } })
        : [],
      process.env.DATABASE_URL
        ? prisma.discountRule.findMany({ where: { isActive: true } })
        : [],
    ]);

    const medMap = new Map(medicines.map((m) => [m.id, m]));
    const diagMap = new Map(diagnostics.map((d) => [d.id, d]));

    let calculatedSubtotal = 0;
    let calculatedDiscount = 0;
    let orderRequiresPrescription = false;

    interface ProcessedOrderItem {
      medicineId?: string;
      title: string;
      itemType: string;
      batchNumber: string;
      mrp: number;
      unitPrice: number;
      quantity: number;
    }

    const processedItems: ProcessedOrderItem[] = [];

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const isDiag = item.type === 'DIAGNOSTIC_TEST';

      if (isDiag) {
        const diag = diagMap.get(item.id);
        const mrp = diag ? Number(diag.mrp) : 500;
        const sellingPrice = diag ? Number(diag.discountedPrice) : 400;

        calculatedSubtotal += mrp * qty;
        calculatedDiscount += (mrp - sellingPrice) * qty;

        processedItems.push({
          title: diag ? diag.name : (item.title || 'Diagnostic Test'),
          itemType: 'DIAGNOSTIC_TEST',
          batchNumber: 'N/A',
          mrp,
          unitPrice: sellingPrice,
          quantity: qty,
        });
      } else {
        const med = medMap.get(item.id);
        const earliestBatch = med?.batches?.[0];
        const mrp = earliestBatch ? Number(earliestBatch.printedMrp) : (med ? Number(med.baseMrp) : 100);

        let bestDiscount = med ? Number(med.discountPercentage) : 15;
        for (const rule of activeDiscounts) {
          if (rule.scope === 'ALL_MEDICINES' && Number(rule.discountPercentage) > bestDiscount) {
            bestDiscount = Number(rule.discountPercentage);
          } else if (rule.scope === 'CATEGORY' && med && rule.targetCategory === med.category && Number(rule.discountPercentage) > bestDiscount) {
            bestDiscount = Number(rule.discountPercentage);
          }
        }

        // Regulatory Compliance: Block online checkout of Schedule X controlled substances
        if (med?.schedule === 'SCHEDULE_X') {
          return NextResponse.json(
            {
              success: false,
              error: `Regulatory Compliance Error: "${med.name}" is classified as a Schedule X controlled substance. Under Indian Pharmacy Regulations (Drugs and Cosmetics Rules 65 & 97), Schedule X medications cannot be sold or dispensed online. Please remove this item from your cart to proceed.`,
            },
            { status: 400 }
          );
        }

        const sellingPrice = Number((mrp * (1 - bestDiscount / 100)).toFixed(2));
        if (med?.requiresPrescription || med?.schedule === 'SCHEDULE_H' || med?.schedule === 'SCHEDULE_H1') {
          orderRequiresPrescription = true;
        }

        calculatedSubtotal += mrp * qty;
        calculatedDiscount += (mrp - sellingPrice) * qty;

        processedItems.push({
          medicineId: med?.id,
          title: med ? `${med.name} (${med.packaging})` : (item.title || 'Medicine'),
          itemType: 'MEDICINE',
          batchNumber: earliestBatch?.batchNumber || 'LW-BATCH-CURR',
          mrp,
          unitPrice: sellingPrice,
          quantity: qty,
        });
      }
    }

    calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));
    calculatedDiscount = Number(calculatedDiscount.toFixed(2));
    const itemsTotal = Math.max(0, calculatedSubtotal - calculatedDiscount);
    const calculatedDeliveryFee = itemsTotal >= 200 ? 0 : 35;
    const calculatedFinalTotal = Number((itemsTotal + calculatedDeliveryFee).toFixed(2));
    const amountInPaise = Math.round(calculatedFinalTotal * 100);

    // 4. Generate or Reuse Order ID (Idempotency)
    const targetOrderId = existingOrderId?.trim() || `ORD-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 1000)}`;
    const handoverOtp = crypto.randomInt(1000, 10000).toString();

    // 5. Razorpay Server Order Creation
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    let serverRazorpayOrderId: string | null = null;

    if (paymentMethod !== 'COD') {
      if (!razorpayKeySecret || !razorpayKeyId || !razorpayKeyId.startsWith('rzp_')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Razorpay test keys are not configured. Please configure NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.',
          },
          { status: 500 }
        );
      }

      try {
        const credentials = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: targetOrderId,
            notes: {
              userId,
              customerEmail,
              orderId: targetOrderId,
            },
          }),
        });

        const rzpData = await rzpResponse.json();
        if (!rzpResponse.ok || !rzpData.id) {
          return NextResponse.json(
            {
              success: false,
              error: rzpData.error?.description || 'Razorpay order creation failed at gateway. Please check your credentials.',
            },
            { status: 502 }
          );
        }

        serverRazorpayOrderId = rzpData.id;
      } catch (rzpErr: any) {
        return NextResponse.json(
          { success: false, error: `Could not connect to Razorpay Gateway: ${rzpErr.message}` },
          { status: 502 }
        );
      }
    }

    // 6. Upsert Pending Order in DB with non-null userId
    if (process.env.DATABASE_URL) {
      const orderData = {
        userId, // Strictly non-null, set from validated server token
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim() || null,
        address: address.trim(),
        pincode: cleanPin,
        distanceKm: calculatedDist,
        subtotal: calculatedSubtotal,
        discountTotal: calculatedDiscount,
        deliveryFee: calculatedDeliveryFee,
        finalTotal: calculatedFinalTotal,
        paymentMethod: paymentMethod as any,
        paymentStatus: 'PENDING' as any,
        razorpayOrderId: serverRazorpayOrderId,
        orderStatus: (orderRequiresPrescription ? 'RX_VERIFICATION' : 'PLACED') as any,
        deliveryOtp: handoverOtp,
        prescriptionUrl: prescriptionUrl || null,
        prescriptionStatus: (orderRequiresPrescription ? 'PENDING_REVIEW' : 'NOT_REQUIRED') as any,
        doctorConsultRequired: Boolean(doctorConsultRequired),
        doctorConsultStatus: (doctorConsultRequired ? 'PENDING_CALL' : 'NOT_REQUIRED') as any,
        diagnosticPatientName: diagnosticAppointment?.patientName || null,
        diagnosticPatientAge: diagnosticAppointment?.patientAge ? Number(diagnosticAppointment.patientAge) : null,
        diagnosticPatientGender: diagnosticAppointment?.patientGender || null,
        diagnosticPatientRelation: diagnosticAppointment?.patientRelation || null,
        diagnosticCollectionDate: diagnosticAppointment?.collectionDate || null,
        diagnosticCollectionSlot: diagnosticAppointment?.collectionSlot || null,
        riderName: 'Vikrant Roy',
        riderPhone: '+91 98330 11223',
        estimatedMinutes: Math.round(calculatedDist * 10 + 15),
      };

      await prisma.order.upsert({
        where: { id: targetOrderId },
        update: {
          ...orderData,
          items: {
            deleteMany: {},
            create: processedItems.map((it) => ({
              medicineId: it.medicineId || null,
              title: it.title,
              itemType: it.itemType,
              batchNumber: it.batchNumber,
              mrp: it.mrp,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
            })),
          },
        },
        create: {
          id: targetOrderId,
          ...orderData,
          items: {
            create: processedItems.map((it) => ({
              medicineId: it.medicineId || null,
              title: it.title,
              itemType: it.itemType,
              batchNumber: it.batchNumber,
              mrp: it.mrp,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
            })),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      orderId: targetOrderId,
      razorpayOrderId: serverRazorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: razorpayKeyId,
      calculatedFinalTotal,
      handoverOtp,
    });
  } catch (error: any) {
    console.error('Razorpay create-order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
