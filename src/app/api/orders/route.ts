import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { INITIAL_ORDERS, INITIAL_MEDICINES, INITIAL_DIAGNOSTICS } from '@/data/mockData';
import { verifyServerSession } from '@/lib/serverAuth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

function buildTrackingHistory(order: any) {
  const isConsult = Boolean(order.doctorConsultRequired);
  const isRx = order.prescriptionStatus === 'PENDING_REVIEW' || order.orderStatus === 'RX_VERIFICATION';
  const hasDiagnostics = Boolean(order.diagnosticPatientName);

  const stepOrder = ['PLACED', 'RX_VERIFICATION', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIndex = stepOrder.indexOf(order.orderStatus);

  return [
    {
      status: 'PLACED',
      title: 'Order Placed Successfully',
      description: `Order of ₹${Number(order.finalTotal).toFixed(2)} confirmed. Payment mode: ${order.paymentMethod || 'Online'}.`,
      timestamp: new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      completed: true,
      current: order.orderStatus === 'PLACED',
    },
    {
      status: 'RX_VERIFICATION',
      title: isConsult
        ? 'Doctor Teleconsultation Scheduled'
        : (isRx ? 'Prescription Under Pharmacist Review' : (hasDiagnostics ? 'Phlebotomist Assigned' : 'Prescription Verified')),
      description: isConsult
        ? `Verified MBBS practitioner will call on ${order.customerPhone} within 10 minutes to verify symptoms and generate digital Rx.`
        : (isRx
          ? 'Registered Pharmacist reviewing your uploaded prescription.'
          : (hasDiagnostics
            ? `Certified phlebotomist scheduled for home sample collection on ${order.diagnosticCollectionDate || 'tomorrow'} (${order.diagnosticCollectionSlot || 'morning'}).`
            : 'All items are Over-The-Counter (OTC). Ready for dispatch.')),
      timestamp: 'Pending',
      completed: currentIndex >= 2 || (!isRx && !isConsult),
      current: order.orderStatus === 'RX_VERIFICATION',
    },
    {
      status: 'PACKED',
      title: 'Quality Checked & Packed',
      description: 'Medicines and sterile diagnostic kits packed in tamper-evident sealed box with FEFO batch traceability.',
      timestamp: 'Pending',
      completed: currentIndex >= 2,
      current: order.orderStatus === 'PACKED',
    },
    {
      status: 'OUT_FOR_DELIVERY',
      title: 'Out for Delivery (5-10km Radius)',
      description: `Delivery OTP: ${order.deliveryOtp}`,
      timestamp: 'Pending',
      completed: currentIndex >= 3,
      current: order.orderStatus === 'OUT_FOR_DELIVERY',
    },
    {
      status: 'DELIVERED',
      title: 'Delivered',
      description: 'Package handed over with OTP verification.',
      timestamp: 'Pending',
      completed: currentIndex >= 4,
      current: order.orderStatus === 'DELIVERED',
    },
  ];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    // Strict Supabase Token Verification (Zero-Trust)
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required to view orders' },
        { status: 401 }
      );
    }

    const { userId, isStaff } = authResult.auth;

    if (process.env.DATABASE_URL) {
      if (orderId) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (!order) {
          return NextResponse.json({ success: false, error: `Order #${orderId} not found` }, { status: 404 });
        }

        // Security: Customers can only read their own orders. Staff can read any order.
        if (order.userId !== userId && !isStaff) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized: You do not have permission to view this order.' },
            { status: 403 }
          );
        }

        const formatted = {
          ...order,
          subtotal: Number(order.subtotal),
          discountTotal: Number(order.discountTotal),
          deliveryFee: Number(order.deliveryFee),
          finalTotal: Number(order.finalTotal),
          distanceKm: Number(order.distanceKm),
          items: (order.items || []).map((it: any) => ({
            ...it,
            mrp: Number(it.mrp),
            unitPrice: Number(it.unitPrice),
          })),
          delivery: {
            riderName: order.riderName || 'Assigned Express Rider',
            riderPhone: order.riderPhone || '+91 98330 11223',
            deliveryOtp: order.deliveryOtp,
            estimatedMinutes: order.estimatedMinutes || 25,
          },
          diagnosticAppointment: order.diagnosticPatientName
            ? {
                patientName: order.diagnosticPatientName,
                patientAge: order.diagnosticPatientAge || 30,
                patientGender: order.diagnosticPatientGender || 'Male',
                patientRelation: order.diagnosticPatientRelation || 'Self',
                collectionDate: order.diagnosticCollectionDate || 'Tomorrow',
                collectionSlot: order.diagnosticCollectionSlot || 'Morning',
              }
            : undefined,
          trackingHistory: buildTrackingHistory(order),
        };

        return NextResponse.json({ success: true, data: formatted });
      }

      // If regular customer: strictly query ONLY their own orders
      const userOrders = await prisma.order.findMany({
        where: isStaff ? {} : { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const formattedList = userOrders.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        discountTotal: Number(order.discountTotal),
        deliveryFee: Number(order.deliveryFee),
        finalTotal: Number(order.finalTotal),
        distanceKm: Number(order.distanceKm),
        items: (order.items || []).map((it: any) => ({
          ...it,
          mrp: Number(it.mrp),
          unitPrice: Number(it.unitPrice),
        })),
        delivery: {
          riderName: order.riderName,
          riderPhone: order.riderPhone,
          deliveryOtp: order.deliveryOtp,
          estimatedMinutes: order.estimatedMinutes,
        },
        diagnosticAppointment: order.diagnosticPatientName
          ? {
              patientName: order.diagnosticPatientName,
              patientAge: order.diagnosticPatientAge,
              patientGender: order.diagnosticPatientGender,
              patientRelation: order.diagnosticPatientRelation,
              collectionDate: order.diagnosticCollectionDate,
              collectionSlot: order.diagnosticCollectionSlot,
            }
          : undefined,
        trackingHistory: buildTrackingHistory(order),
      }));

      return NextResponse.json({ success: true, data: formattedList });
    }

    // Fallback if DB URL not yet populated
    if (orderId) {
      const found = INITIAL_ORDERS.find((o) => o.id.toUpperCase() === orderId.toUpperCase());
      if (!found) {
        return NextResponse.json({ success: false, error: `Order #${orderId} not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: found });
    }
    return NextResponse.json({ success: true, data: INITIAL_ORDERS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting on Order Creation
    const clientIp = getClientIp(request);
    const ipLimit = await checkRateLimit(`ip_order_${clientIp}`, 15, 60);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many order creation requests. Please retry in ${ipLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    // 2. Strict Supabase Token Verification (Zero-Trust)
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized: Supabase access token required to place an order' },
        { status: 401 }
      );
    }

    const { userId } = authResult.auth;

    // Per-user rate limit
    const userLimit = await checkRateLimit(`user_order_${userId}`, 10, 60);
    if (!userLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Please wait ${userLimit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail = authResult.auth.email,
      address,
      pincode,
      distanceKm,
      items,
      paymentMethod,
      prescriptionUrl,
      doctorConsultRequired,
      diagnosticAppointment,
      razorpayPaymentId,
      razorpayOrderId,
    } = body;

    // 3. Validate Customer & Delivery Address
    if (!customerName?.trim() || !customerPhone?.trim() || !address?.trim() || !pincode?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Full name, mobile number, delivery address, and pincode are required.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty. Please add items before placing an order.' },
        { status: 400 }
      );
    }

    // Validate 6-digit Indian Pincode
    const cleanPin = pincode.toString().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 6-digit postal pincode.' },
        { status: 400 }
      );
    }

    const calculatedDist = Math.max(0.8, Number(distanceKm) || 2.5);
    if (calculatedDist > 10.0) {
      return NextResponse.json(
        { success: false, error: `Address is ${calculatedDist} km away. MedNeed local delivery is strictly within 10 km.` },
        { status: 400 }
      );
    }

    // 2. Server-side Recalculation & Drug Schedule / Prescription Verification
    let calculatedSubtotal = 0;
    let calculatedDiscount = 0;
    let orderRequiresPrescription = false;

    interface ProcessedItem {
      medicineId?: string;
      title: string;
      itemType: string;
      batchNumber: string;
      mrp: number;
      unitPrice: number;
      quantity: number;
      allocatedBatchId?: string;
    }

    const processedItems: ProcessedItem[] = [];

    // Process each item with database verification
    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const isMedicine = item.type !== 'DIAGNOSTIC_TEST';

      if (isMedicine) {
        let dbMed: any = null;
        if (process.env.DATABASE_URL) {
          dbMed = await prisma.medicine.findFirst({
            where: {
              OR: [
                { id: item.id || '' },
                { localWellCode: item.localWellCode || '' },
                { name: item.title },
              ],
            },
            include: {
              batches: {
                where: {
                  isQuarantined: false,
                  expiryDate: { gt: new Date() },
                  quantity: { gt: 0 },
                },
                orderBy: { expiryDate: 'asc' }, // FEFO sort
              },
            },
          });
        }

        // Fallback to static catalog if DB item not found
        const fallbackMed = INITIAL_MEDICINES.find((m) => m.id === item.id || m.name === item.title);

        const mrp = Number(dbMed?.baseMrp || fallbackMed?.mrp || item.mrp || 100);
        const discountPct = Number(dbMed?.discountPercentage || fallbackMed?.discountPercentage || 0);
        const unitPrice = Number((mrp * (1 - discountPct / 100)).toFixed(2));

        const medSchedule = dbMed?.schedule || fallbackMed?.schedule;

        // Regulatory Compliance: Block online checkout of Schedule X controlled substances under Rule 65/97
        if (medSchedule === 'SCHEDULE_X') {
          return NextResponse.json(
            {
              success: false,
              error: `Regulatory Compliance Error: "${dbMed?.name || item.title}" is classified as a Schedule X controlled substance. Under Indian Pharmacy Regulations (Drugs and Cosmetics Rules 65 & 97), Schedule X medications cannot be sold or dispensed online. Please remove this item from your cart to proceed.`,
            },
            { status: 400 }
          );
        }

        const requiresRx = dbMed?.requiresPrescription ?? fallbackMed?.requiresPrescription ?? false;
        if (requiresRx || medSchedule === 'SCHEDULE_H' || medSchedule === 'SCHEDULE_H1') {
          orderRequiresPrescription = true;
        }

        // FEFO Batch Allocation
        let allocatedBatchNumber = item.batchNumber || fallbackMed?.batchNumber || 'LW-BATCH-CURR';
        let allocatedBatchId: string | undefined;

        if (dbMed && dbMed.batches && dbMed.batches.length > 0) {
          const suitableBatch = dbMed.batches.find((b: any) => b.quantity >= qty) || dbMed.batches[0];
          if (suitableBatch.quantity < qty) {
            return NextResponse.json(
              { success: false, error: `Insufficient physical stock for ${dbMed.name}. Available: ${suitableBatch.quantity} units.` },
              { status: 400 }
            );
          }
          allocatedBatchNumber = suitableBatch.batchNumber;
          allocatedBatchId = suitableBatch.id;
        }

        calculatedSubtotal += mrp * qty;
        calculatedDiscount += (mrp - unitPrice) * qty;

        processedItems.push({
          medicineId: dbMed?.id,
          title: dbMed?.name || item.title,
          itemType: 'MEDICINE',
          batchNumber: allocatedBatchNumber,
          mrp,
          unitPrice,
          quantity: qty,
          allocatedBatchId,
        });
      } else {
        // Diagnostic Lab Test
        const test = INITIAL_DIAGNOSTICS.find((t) => t.id === item.id || t.name === item.title);
        const mrp = Number(test?.mrp || item.mrp || 500);
        const unitPrice = Number(test?.discountedPrice || item.sellingPrice || mrp * 0.85);

        calculatedSubtotal += mrp * qty;
        calculatedDiscount += (mrp - unitPrice) * qty;

        processedItems.push({
          title: test?.name || item.title,
          itemType: 'DIAGNOSTIC_TEST',
          batchNumber: 'NABL-STERILE-KIT',
          mrp,
          unitPrice,
          quantity: qty,
        });
      }
    }

    // 3. Prescription & Regulatory Compliance Check (Drugs & Cosmetics Act)
    let finalOrderStatus: 'PLACED' | 'RX_VERIFICATION' | 'PACKED' = 'PACKED';
    let finalPrescriptionStatus = 'NOT_REQUIRED';
    let finalDoctorConsultStatus = 'NOT_REQUIRED';

    if (orderRequiresPrescription) {
      if (doctorConsultRequired) {
        finalOrderStatus = 'RX_VERIFICATION';
        finalPrescriptionStatus = 'PENDING_REVIEW';
        finalDoctorConsultStatus = 'PENDING_CALL';
      } else if (prescriptionUrl && prescriptionUrl.trim() !== '') {
        finalOrderStatus = 'RX_VERIFICATION';
        finalPrescriptionStatus = 'PENDING_REVIEW';
      } else {
        return NextResponse.json(
          {
            success: false,
            error:
              'A valid Doctor Prescription or Free Doctor Teleconsultation is mandatory for Schedule H/H1 prescription medicines in your cart under Indian Pharmacy Regulations.',
          },
          { status: 400 }
        );
      }
    }

    // 4. Server Financial Calculation
    calculatedSubtotal = Number(calculatedSubtotal.toFixed(2));
    calculatedDiscount = Number(calculatedDiscount.toFixed(2));
    const itemsTotal = Math.max(0, calculatedSubtotal - calculatedDiscount);
    // Free delivery above ₹200, else ₹35
    const calculatedDeliveryFee = itemsTotal >= 200 ? 0 : 35;
    const calculatedFinalTotal = Number((itemsTotal + calculatedDeliveryFee).toFixed(2));

    // Collision-free Order ID & 4-digit Delivery Handover OTP
    const generatedOrderId = `ORD-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 1000)}`;
    const handoverOtp = crypto.randomInt(1000, 10000).toString();

    // Payment validation: All newly placed orders are created as PENDING.
    // Non-COD orders only advance to PAID upon cryptographic payment verification or webhook.
    const method = paymentMethod || 'RAZORPAY_UPI';
    const isCod = method === 'COD';
    const paymentStatus: 'PENDING' = 'PENDING';

    if (process.env.DATABASE_URL) {
      // Create Order Record in DB (Stock deduction & cart clearing deferred to payment confirmation)
      const createdOrder = await prisma.order.create({
        data: {
          id: generatedOrderId,
          userId, // Set server-side from validated Supabase session token
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
          paymentMethod: method,
          paymentStatus,
          razorpayPaymentId: razorpayPaymentId || null,
          razorpayOrderId: razorpayOrderId || null,
          orderStatus: finalOrderStatus,
          deliveryOtp: handoverOtp,
          prescriptionUrl: prescriptionUrl || null,
          prescriptionStatus: finalPrescriptionStatus,
          doctorConsultRequired: Boolean(doctorConsultRequired),
          doctorConsultStatus: finalDoctorConsultStatus,
          diagnosticPatientName: diagnosticAppointment?.patientName || null,
          diagnosticPatientAge: diagnosticAppointment?.patientAge ? Number(diagnosticAppointment.patientAge) : null,
          diagnosticPatientGender: diagnosticAppointment?.patientGender || null,
          diagnosticPatientRelation: diagnosticAppointment?.patientRelation || null,
          diagnosticCollectionDate: diagnosticAppointment?.collectionDate || null,
          diagnosticCollectionSlot: diagnosticAppointment?.collectionSlot || null,
          riderName: 'Vikrant Roy',
          riderPhone: '+91 98330 11223',
          estimatedMinutes: Math.round(calculatedDist * 10 + 15),
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
        include: { items: true },
      });

      // 3. Write immutable audit log (Non-blocking: order placement succeeds even if audit logging fails)
      try {
        await prisma.auditLog.create({
          data: {
            actorName: customerName.trim(),
            actorRole: 'CUSTOMER',
            actionType: 'ORDER_PLACED',
            details: `Order #${generatedOrderId} placed for ₹${calculatedFinalTotal}. Status: ${finalOrderStatus}. Items: ${processedItems.length}.`,
            newValue: finalOrderStatus,
          },
        });
      } catch (auditError) {
        console.warn('Non-fatal: Failed to record order placement audit log:', auditError);
      }

      return NextResponse.json({
        success: true,
        orderId: generatedOrderId,
        otp: handoverOtp,
        data: createdOrder,
      });
    }

    return NextResponse.json({
      success: true,
      orderId: generatedOrderId,
      otp: handoverOtp,
      data: {
        id: generatedOrderId,
        customerName,
        customerPhone,
        address,
        pincode: cleanPin,
        distanceKm: calculatedDist,
        subtotal: calculatedSubtotal,
        discountTotal: calculatedDiscount,
        deliveryFee: calculatedDeliveryFee,
        finalTotal: calculatedFinalTotal,
        paymentMethod: method,
        paymentStatus,
        orderStatus: finalOrderStatus,
        deliveryOtp: handoverOtp,
        items: processedItems,
      },
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    const rawMsg = error?.message || '';
    const isTechnicalDbError = /prisma|connectorerror|postgreserror|queryerror|syntaxerror|adminrole|22p02|p[0-9]{4}/i.test(rawMsg);
    const userMessage = isTechnicalDbError
      ? 'Unable to complete order placement due to a momentary server delay. Please review your cart and retry, or contact MedNeed Support (+91 98330 11223).'
      : (rawMsg || 'Could not place order. Please check your information and retry.');
    return NextResponse.json({ success: false, error: userMessage }, { status: 500 });
  }
}
