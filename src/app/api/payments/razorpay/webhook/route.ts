import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Razorpay Webhook Handler
 * 
 * Verifies X-Razorpay-Signature against raw body, handles payment.captured,
 * order.paid, and payment.failed events with strict idempotency.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSecret || webhookSecret.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Server webhook configuration error: Secret not configured.' },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing X-Razorpay-Signature header.' },
        { status: 400 }
      );
    }

    // 1. Verify HMAC-SHA256 signature with constant-time equality check
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const providedBuffer = Buffer.from(signature, 'utf8');

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature.' },
        { status: 400 }
      );
    }

    // 2. Parse Event Payload
    const eventPayload = JSON.parse(rawBody);
    const event = eventPayload.event;
    const payment = eventPayload.payload?.payment?.entity;
    const razorpayPaymentId = payment?.id;
    const razorpayOrderId = payment?.order_id;
    const orderNotes = payment?.notes || {};
    const fallbackOrderId = orderNotes.orderId || orderNotes.receipt;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, message: 'Database URL not set, webhook acknowledged' });
    }

    // 3. Handle Payment Captured / Order Paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            ...(razorpayOrderId ? [{ razorpayOrderId }] : []),
            ...(fallbackOrderId ? [{ id: fallbackOrderId }] : []),
          ],
        },
        include: { items: true },
      });

      if (!order) {
        // Acknowledge webhook to prevent infinite retries if order was not found
        return NextResponse.json({ success: true, message: 'Order record not found for webhook event' });
      }

      // Idempotency check: If already marked PAID, return 200 without duplicate deduction
      if (order.paymentStatus === 'PAID') {
        return NextResponse.json({
          success: true,
          message: 'Order already fulfilled and marked PAID',
          orderId: order.id,
        });
      }

      const hasRx = order.prescriptionStatus === 'PENDING_REVIEW' || order.doctorConsultRequired;

      // Atomic transition: Update only if paymentStatus != 'PAID'
      await prisma.$transaction(async (tx) => {
        const transitionResult = await tx.order.updateMany({
          where: {
            id: order.id,
            paymentStatus: { not: 'PAID' },
          },
          data: {
            paymentStatus: 'PAID',
            orderStatus: hasRx ? 'RX_VERIFICATION' : 'PACKED',
            razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId || null,
          },
        });

        // Deduct FEFO batch stock and clear cart ONLY if this transaction won the atomic transition
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

          if (order.userId && order.userId !== 'usr-system') {
            await tx.cartItem.deleteMany({
              where: { userId: order.userId },
            });
          }
        }
      });

      // Immutable regulatory audit log (Rule 5: Zero PII/OTPs logged)
      try {
        await prisma.auditLog.create({
          data: {
            actorName: 'Razorpay Webhook Gateway',
            actorRole: 'CUSTOMER',
            actionType: 'ORDER_PAYMENT_CONFIRMED',
            details: `Order #${order.id} verified via webhook event (${event}). Payment marked PAID. Cart cleared.`,
            newValue: 'PAID',
          },
        });
      } catch (auditError) {
        console.warn('Non-fatal webhook audit log error:', auditError);
      }

      return NextResponse.json({ success: true, message: 'Payment captured and processed', orderId: order.id });
    }

    // 4. Handle Payment Failed
    if (event === 'payment.failed') {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            ...(razorpayOrderId ? [{ razorpayOrderId }] : []),
            ...(fallbackOrderId ? [{ id: fallbackOrderId }] : []),
          ],
        },
      });

      if (order && order.paymentStatus === 'PENDING') {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' },
        });

        try {
          await prisma.auditLog.create({
            data: {
              actorName: 'Razorpay Webhook Gateway',
              actorRole: 'CUSTOMER',
              actionType: 'ORDER_STATUS_UPDATED',
              details: `Order #${order.id} marked as FAILED via webhook event (${event}). Cart preserved.`,
              newValue: 'FAILED',
            },
          });
        } catch (auditError) {
          console.warn('Non-fatal webhook failure audit log error:', auditError);
        }
      }

      return NextResponse.json({ success: true, message: 'Payment failure acknowledged', orderId: order?.id });
    }

    // Acknowledge other unhandled webhook events gracefully
    return NextResponse.json({ success: true, message: `Event ${event} acknowledged` });
  } catch (error: any) {
    console.error('Razorpay webhook handler error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
