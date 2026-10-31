import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { verifyServerSession } from '@/lib/serverAuth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const limit = await checkRateLimit(`verify:${clientIp}`, 10, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many payment verification attempts. Please try again in ${limit.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    // 1. Strict Supabase Token Verification (Zero-Trust)
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized: Supabase access token required' },
        { status: 401 }
      );
    }

    const { userId } = authResult.auth;
    const body = await request.json();
    const {
      orderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      paymentFailed = false,
      failureReason,
    } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    // 2. Fetch order and verify ownership
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, orderId, verified: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: `Order #${orderId} not found` }, { status: 404 });
    }

    // Security: Ensure user owns this order (or is authorized staff)
    if (order.userId !== userId && !authResult.auth.isStaff) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You do not have permission to verify this order' },
        { status: 403 }
      );
    }

    // Idempotency: Do not duplicate fulfillment or stock decrement if order is already PAID
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        verified: true,
        order,
        message: 'Order has already been verified and marked as PAID.',
      });
    }

    // 3. Handle Explicit Payment Failure
    if (paymentFailed) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
        },
      });

      // Cart is NOT cleared so the customer can retry without losing their cart items
      return NextResponse.json({
        success: false,
        error: failureReason || 'Payment failed or was canceled. Your cart is preserved to retry checkout.',
        orderId,
      });
    }

    // 4. Cryptographic HMAC-SHA256 Signature Verification
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    const isCod = order.paymentMethod === 'COD';

    if (!isCod) {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required Razorpay payment verification parameters (razorpayOrderId, razorpayPaymentId, razorpaySignature).',
          },
          { status: 400 }
        );
      }

      if (!razorpaySecret || razorpaySecret.trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Server payment configuration error: RAZORPAY_KEY_SECRET is not configured.',
          },
          { status: 500 }
        );
      }

      // Cross-check razorpayOrderId matches the server-side stored Razorpay order ID
      if (order.razorpayOrderId && order.razorpayOrderId.trim() !== razorpayOrderId.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Razorpay order ID mismatch with server order record.',
          },
          { status: 400 }
        );
      }

      const generatedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      const generatedBuffer = Buffer.from(generatedSignature, 'utf8');
      const providedBuffer = Buffer.from(razorpaySignature, 'utf8');

      if (
        generatedBuffer.length !== providedBuffer.length ||
        !crypto.timingSafeEqual(generatedBuffer, providedBuffer)
      ) {
        // Mark order as failed, preserve cart
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'FAILED' },
        });

        return NextResponse.json(
          { success: false, error: 'Invalid payment signature: Cryptographic HMAC-SHA256 verification failed.' },
          { status: 400 }
        );
      }
    }

    // Optional Gateway Verification: Cross-check order amount/currency against Razorpay API
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (
      !isCod &&
      razorpayKeyId &&
      razorpayKeyId.startsWith('rzp_') &&
      razorpaySecret
    ) {
      try {
        const credentials = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64');
        const rzpOrderRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpayOrderId)}`, {
          headers: { Authorization: `Basic ${credentials}` },
        });

        if (rzpOrderRes.ok) {
          const rzpOrder = await rzpOrderRes.json();
          const expectedAmountPaise = Math.round(Number(order.finalTotal) * 100);
          if (rzpOrder.amount !== expectedAmountPaise || rzpOrder.currency !== 'INR') {
            return NextResponse.json(
              {
                success: false,
                error: `Razorpay order amount/currency mismatch (Expected: ${expectedAmountPaise} INR, Gateway: ${rzpOrder.amount} ${rzpOrder.currency}).`,
              },
              { status: 400 }
            );
          }
        }
      } catch (err) {
        console.warn('Razorpay order amount cross-check network warning:', err);
      }
    }

    // 5. Post-Verification Atomic ACID Transaction:
    //    - Conditional update: updates ONLY if paymentStatus != 'PAID'
    //    - Runs stock decrement and cart clearing ONLY if exactly 1 row was updated
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const hasRx = order.prescriptionStatus === 'PENDING_REVIEW' || order.doctorConsultRequired;

      // 5.1 Conditional update ensuring atomic transition
      const transitionResult = await tx.order.updateMany({
        where: {
          id: orderId,
          paymentStatus: { not: 'PAID' },
        },
        data: {
          paymentStatus: isCod ? 'PENDING' : 'PAID',
          orderStatus: hasRx ? 'RX_VERIFICATION' : 'PACKED',
          razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId || null,
          razorpaySignature: razorpaySignature || order.razorpaySignature || null,
        },
      });

      // 5.2 Execute fulfillment and stock deduction ONLY if this transaction won the atomic transition
      if (transitionResult.count === 1) {
        for (const item of order.items) {
          if (item.medicineId && item.itemType === 'MEDICINE') {
            const availableBatch = await tx.medicineBatch.findFirst({
              where: {
                medicineId: item.medicineId,
                isQuarantined: false,
                quantity: { gte: item.quantity },
              },
              orderBy: { expiryDate: 'asc' },
            });

            if (availableBatch) {
              await tx.medicineBatch.update({
                where: { id: availableBatch.id },
                data: { quantity: { decrement: item.quantity } },
              });
            }
          }
        }

        // 5.3 Clear user's DB cart ONLY on the winning payment confirmation
        await tx.cartItem.deleteMany({
          where: { userId },
        });
      }

      // Return the latest order state
      return await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
    });

    if (!updatedOrder) {
      return NextResponse.json({ success: false, error: 'Order not found after update' }, { status: 404 });
    }

    // 6. Write Audit Log (Non-blocking: payment confirmation must succeed even if audit logging fails)
    try {
      await prisma.auditLog.create({
        data: {
          actorName: order.customerName,
          actorRole: 'CUSTOMER',
          actionType: 'ORDER_PAYMENT_CONFIRMED',
          details: `Order #${orderId} verified and confirmed. Payment Status: ${updatedOrder.paymentStatus}. Cart cleared.`,
          newValue: updatedOrder.orderStatus,
        },
      });
    } catch (auditError) {
      console.warn('Non-fatal: Failed to record payment confirmation audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      order: updatedOrder,
      message: 'Payment verified successfully. Order confirmed.',
    });
  } catch (error: any) {
    console.error('Razorpay verification error:', error);
    // Sanitize technical/internal database exceptions so raw stack traces are never exposed to customers
    const rawMsg = error?.message || '';
    const isTechnicalDbError = /prisma|connectorerror|postgreserror|queryerror|syntaxerror|adminrole|22p02|p[0-9]{4}/i.test(rawMsg);
    const userMessage = isTechnicalDbError
      ? 'Payment was received, but order confirmation experienced a brief system delay. Please do not pay again. If amount was debited, your order will update shortly or contact MedNeed Support (+91 98330 11223).'
      : (rawMsg || 'Payment verification encountered an unexpected error. Please try again or contact support.');

    return NextResponse.json({ success: false, error: userMessage }, { status: 500 });
  }
}
