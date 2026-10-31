import { NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/serverAuth';
import { createPrescriptionSignedUrl } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const path = searchParams.get('path');

    if (!orderId && !path) {
      return NextResponse.json({ success: false, error: 'orderId or storage path is required.' }, { status: 400 });
    }

    // 1. Strict Server Session Verification (Zero-Trust)
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized: Sign in required to view medical prescriptions.' },
        { status: 401 }
      );
    }

    const { userId, isStaff } = authResult.auth;

    let targetPath = path || '';

    // 2. If orderId is provided, verify order ownership or staff permissions
    if (orderId && process.env.DATABASE_URL) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true, prescriptionUrl: true },
      });

      if (!order) {
        return NextResponse.json({ success: false, error: `Order #${orderId} not found.` }, { status: 404 });
      }

      if (order.userId !== userId && !isStaff) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to view this prescription.' },
          { status: 403 }
        );
      }

      targetPath = order.prescriptionUrl || targetPath;
    } else if (!isStaff && !orderId) {
      // Direct path access requires staff credentials or order association to prevent BOLA
      return NextResponse.json(
        { success: false, error: 'Order ID is required to authorize prescription access.' },
        { status: 403 }
      );
    }

    if (!targetPath) {
      return NextResponse.json({ success: false, error: 'No prescription attached to this record.' }, { status: 404 });
    }

    // If it's a simulated or external demo URL, return directly
    if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
      return NextResponse.json({ success: true, signedUrl: targetPath });
    }

    // 3. Generate short-lived signed URL (300 seconds / 5 mins)
    const signedUrl = await createPrescriptionSignedUrl(targetPath, 300);

    if (!signedUrl) {
      return NextResponse.json(
        { success: false, error: 'Unable to generate secure prescription access link.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('Prescription view API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error generating prescription link' }, { status: 500 });
  }
}
