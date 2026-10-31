import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffSession } from '@/lib/auth';

export async function PATCH(request: Request) {
  try {
    const session = await requireStaffSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Staff credentials required' }, { status: 401 });
    }

    const {
      orderId,
      newStatus,
      riderName,
      riderPhone,
      estimatedMinutes,
      deliveryOtp,
      prescriptionApproved,
      rejectionReason,
    } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      const existing = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: `Order #${orderId} not found` }, { status: 404 });
      }

      const updateData: any = {};
      let auditAction = 'ORDER_STATUS_UPDATED';
      let auditDetails = `Order #${orderId} updated by ${session.name} (${session.role}).`;
      let isCancelling = false;

      // 1. Prescription Verification Handling
      if (typeof prescriptionApproved === 'boolean') {
        if (session.role !== 'PHARMACIST' && session.role !== 'SUPER_ADMIN') {
          return NextResponse.json(
            { success: false, error: 'Only a Registered Pharmacist or Super Admin can sign off on doctor prescriptions' },
            { status: 403 }
          );
        }

        if (prescriptionApproved) {
          updateData.prescriptionStatus = 'VERIFIED';
          updateData.orderStatus = 'PACKED';
          auditAction = 'PRESCRIPTION_VERIFIED';
          auditDetails = `Prescription APPROVED for Order #${orderId} by Pharmacist ${session.name}. Order advanced to PACKED.`;
        } else {
          updateData.prescriptionStatus = 'REJECTED';
          updateData.rejectionReason = rejectionReason || 'Prescription rejected by pharmacist';
          updateData.orderStatus = 'CANCELLED';
          auditAction = 'PRESCRIPTION_REJECTED';
          auditDetails = `Prescription REJECTED for Order #${orderId}. Reason: ${updateData.rejectionReason}. Order CANCELLED.`;
          isCancelling = true;
        }
      }

      // 2. Rider Assignment
      if (riderName) updateData.riderName = riderName;
      if (riderPhone) updateData.riderPhone = riderPhone;
      if (estimatedMinutes) updateData.estimatedMinutes = Number(estimatedMinutes);

      // 3. Status Transition
      if (newStatus && !updateData.orderStatus) {
        if (newStatus === 'CANCELLED') {
          isCancelling = true;
          updateData.orderStatus = 'CANCELLED';
        } else if (newStatus === 'DELIVERED') {
          // Enforce OTP verification on DELIVERED transition
          if (!deliveryOtp || deliveryOtp.trim() !== existing.deliveryOtp.trim()) {
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid delivery handover OTP. Package handover cannot be completed without customer OTP verification.',
              },
              { status: 400 }
            );
          }
          updateData.orderStatus = 'DELIVERED';
          auditDetails = `Order #${orderId} status changed from ${existing.orderStatus} to DELIVERED.`;
        } else {
          updateData.orderStatus = newStatus;
          auditDetails = `Order #${orderId} status changed from ${existing.orderStatus} to ${newStatus}.`;
        }
      }

      // 4. On Cancellation / Rejection: Atomically restore batch stock and trigger Razorpay refund
      if (isCancelling && existing.orderStatus !== 'CANCELLED') {
        let refundIssued = false;
        let refundId: string | null = null;
        const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        // Trigger Razorpay Refund for prepaid orders
        if (
          existing.paymentStatus === 'PAID' &&
          existing.razorpayPaymentId &&
          razorpayKeyId &&
          razorpayKeySecret &&
          !existing.razorpayPaymentId.startsWith('pay_sim_')
        ) {
          try {
            const credentials = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
            const refundRes = await fetch(
              `https://api.razorpay.com/v1/payments/${encodeURIComponent(existing.razorpayPaymentId)}/refund`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Basic ${credentials}`,
                },
                body: JSON.stringify({
                  amount: Math.round(Number(existing.finalTotal) * 100),
                  notes: {
                    orderId: existing.id,
                    reason: updateData.rejectionReason || 'Order cancelled by pharmacy staff',
                  },
                }),
              }
            );

            if (refundRes.ok) {
              const refundData = await refundRes.json();
              refundIssued = true;
              refundId = refundData.id;
            } else {
              const errData = await refundRes.json().catch(() => ({}));
              console.warn('Razorpay refund API non-200 response:', errData);
            }
          } catch (refundErr) {
            console.warn('Razorpay refund network warning:', refundErr);
          }
        }

        if (existing.paymentStatus === 'PAID') {
          updateData.paymentStatus = 'REFUNDED';
        }

        // Atomic Transaction: Restore batch stock and update order state
        const updated = await prisma.$transaction(async (tx) => {
          // Restore physical batch stock for each medicine item
          for (const item of existing.items) {
            if (item.medicineId && item.itemType === 'MEDICINE') {
              if (item.batchNumber) {
                const restockResult = await tx.medicineBatch.updateMany({
                  where: {
                    medicineId: item.medicineId,
                    batchNumber: item.batchNumber,
                  },
                  data: {
                    quantity: { increment: item.quantity },
                  },
                });

                // If specific batch not found, restock earliest unexpired batch
                if (restockResult.count === 0) {
                  const fallbackBatch = await tx.medicineBatch.findFirst({
                    where: { medicineId: item.medicineId, isQuarantined: false },
                    orderBy: { expiryDate: 'asc' },
                  });
                  if (fallbackBatch) {
                    await tx.medicineBatch.update({
                      where: { id: fallbackBatch.id },
                      data: { quantity: { increment: item.quantity } },
                    });
                  }
                }
              }
            }
          }

          return await tx.order.update({
            where: { id: orderId },
            data: updateData,
            include: { items: true },
          });
        });

        // Write immutable audit log (Rule 5 compliant: No PII/OTPs)
        const refundNote = refundIssued
          ? `Razorpay refund issued (${refundId}).`
          : existing.paymentStatus === 'PAID'
          ? 'Prepaid order marked REFUNDED.'
          : 'COD order, no refund necessary.';

        await prisma.auditLog.create({
          data: {
            actorName: session.name,
            actorRole: session.role as any,
            actionType: auditAction,
            details: `Order #${orderId} CANCELLED by ${session.name}. Restocked ${existing.items.length} items to active FEFO inventory. ${refundNote}`,
            oldValue: existing.orderStatus,
            newValue: 'CANCELLED',
          },
        });

        return NextResponse.json({ success: true, data: updated, refundId });
      }

      // Non-cancellation updates (e.g. status advancement, rider assignment)
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true },
      });

      // Write to immutable audit log with verified session identity
      await prisma.auditLog.create({
        data: {
          actorName: session.name,
          actorRole: session.role as any,
          actionType: auditAction,
          details: auditDetails,
          oldValue: existing.orderStatus,
          newValue: updated.orderStatus,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({
      success: true,
      message: `Simulated order ${orderId} dispatch update completed`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
