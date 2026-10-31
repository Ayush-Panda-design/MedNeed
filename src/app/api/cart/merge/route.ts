import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerSession } from '@/lib/serverAuth';

interface GuestCartItemPayload {
  id: string;
  type?: 'MEDICINE' | 'DIAGNOSTIC_TEST';
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required for cart merge' },
        { status: 401 }
      );
    }

    const { userId } = authResult.auth;
    const body = await request.json();
    const guestCart: GuestCartItemPayload[] = body.guestCart || [];

    if (!Array.isArray(guestCart) || guestCart.length === 0) {
      // Nothing to merge, return existing DB cart
      const existingItems = await prisma.cartItem.findMany({ where: { userId } });
      return NextResponse.json({ success: true, count: existingItems.length, message: 'No guest items to merge' });
    }

    if (process.env.DATABASE_URL) {
      // 1. Fetch current user cart from DB
      const existingDbCart = await prisma.cartItem.findMany({
        where: { userId },
      });
      const dbCartMap = new Map(existingDbCart.map((i) => [i.itemId, i]));

      // 2. Fetch stock counts for all incoming items to respect inventory limits
      const medicineIds = guestCart
        .filter((g) => g.type !== 'DIAGNOSTIC_TEST')
        .map((g) => g.id);

      const medicines = medicineIds.length > 0
        ? await prisma.medicine.findMany({
            where: { id: { in: medicineIds } },
            include: { batches: { where: { isQuarantined: false, quantity: { gt: 0 } } } },
          })
        : [];

      const stockMap = new Map<string, number>();
      medicines.forEach((m) => {
        const total = m.batches.reduce((sum, b) => sum + b.quantity, 0);
        stockMap.set(m.id, total);
      });

      // 3. Merge each guest item
      for (const guestItem of guestCart) {
        if (!guestItem.id) continue;
        const itemType = guestItem.type === 'DIAGNOSTIC_TEST' ? 'DIAGNOSTIC_TEST' : 'MEDICINE';
        const existing = dbCartMap.get(guestItem.id);

        const currentQty = existing ? existing.quantity : 0;
        const requestedTotalQty = currentQty + Math.max(1, guestItem.quantity || 1);

        // Clamp to live stock if medicine
        let finalQty = requestedTotalQty;
        if (itemType === 'MEDICINE') {
          const available = stockMap.get(guestItem.id);
          if (available !== undefined && available > 0) {
            finalQty = Math.min(requestedTotalQty, available);
          }
        }

        await prisma.cartItem.upsert({
          where: {
            userId_itemId: {
              userId,
              itemId: guestItem.id,
            },
          },
          update: {
            quantity: finalQty,
            itemType,
          },
          create: {
            userId,
            itemId: guestItem.id,
            itemType,
            quantity: finalQty,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Guest cart successfully merged into user account',
    });
  } catch (error: any) {
    console.error('Cart merge error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
