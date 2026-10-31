import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyServerSession } from '@/lib/serverAuth';

export async function GET(request: Request) {
  try {
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = authResult.auth;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, items: [] });
    }

    const dbCartItems = await prisma.cartItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (dbCartItems.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        subtotal: 0,
        discount: 0,
        deliveryFee: 0,
        finalTotal: 0,
        count: 0,
      });
    }

    // Hydrate cart items with latest trusted prices and stock from DB
    const medicineIds = dbCartItems
      .filter((i) => i.itemType !== 'DIAGNOSTIC_TEST')
      .map((i) => i.itemId);

    const diagnosticIds = dbCartItems
      .filter((i) => i.itemType === 'DIAGNOSTIC_TEST')
      .map((i) => i.itemId);

    const [medicines, diagnostics] = await Promise.all([
      medicineIds.length > 0
        ? prisma.medicine.findMany({
            where: { id: { in: medicineIds } },
            include: { batches: { where: { isQuarantined: false, quantity: { gt: 0 } }, orderBy: { expiryDate: 'asc' } } },
          })
        : [],
      diagnosticIds.length > 0
        ? prisma.diagnosticTest.findMany({
            where: { id: { in: diagnosticIds } },
          })
        : [],
    ]);

    const medMap = new Map(medicines.map((m) => [m.id, m]));
    const diagMap = new Map(diagnostics.map((d) => [d.id, d]));

    let subtotal = 0;
    let discount = 0;
    let count = 0;

    const hydratedItems = dbCartItems.map((cartItem) => {
      if (cartItem.itemType === 'DIAGNOSTIC_TEST') {
        const diag = diagMap.get(cartItem.itemId);
        const mrp = diag ? Number(diag.mrp) : 500;
        const sellingPrice = diag ? Number(diag.discountedPrice) : 400;
        const availableStock = 999;
        const qty = cartItem.quantity;

        subtotal += mrp * qty;
        discount += (mrp - sellingPrice) * qty;
        count += qty;

        return {
          id: cartItem.itemId,
          cartItemId: cartItem.id,
          title: diag ? diag.name : 'Diagnostic Test',
          type: 'DIAGNOSTIC_TEST' as const,
          mrp,
          sellingPrice,
          quantity: qty,
          availableStock,
          requiresPrescription: false,
          category: diag?.category || 'Diagnostic',
        };
      } else {
        const med = medMap.get(cartItem.itemId);
        const earliestBatch = med?.batches?.[0];
        const mrp = earliestBatch ? Number(earliestBatch.printedMrp) : (med ? Number(med.baseMrp) : 100);
        const discPercent = med ? Number(med.discountPercentage) : 15;
        const sellingPrice = Number((mrp * (1 - discPercent / 100)).toFixed(2));
        const totalBatchStock = med?.batches?.reduce((acc, b) => acc + b.quantity, 0) || 0;
        const availableStock = med ? totalBatchStock : 50;
        const qty = cartItem.quantity;

        subtotal += mrp * qty;
        discount += (mrp - sellingPrice) * qty;
        count += qty;

        return {
          id: cartItem.itemId,
          cartItemId: cartItem.id,
          title: med ? `${med.name} (${med.packaging})` : 'Medicine Item',
          type: 'MEDICINE' as const,
          mrp,
          sellingPrice,
          quantity: qty,
          availableStock,
          requiresPrescription: med?.requiresPrescription ?? false,
          batchNumber: earliestBatch?.batchNumber || 'LW-BATCH-CURR',
          category: med?.category || 'General',
        };
      }
    });

    subtotal = Number(subtotal.toFixed(2));
    discount = Number(discount.toFixed(2));
    const itemsTotal = Math.max(0, subtotal - discount);
    const deliveryFee = itemsTotal > 0 && itemsTotal < 200 ? 35 : 0;
    const finalTotal = Number((itemsTotal + deliveryFee).toFixed(2));

    return NextResponse.json({
      success: true,
      items: hydratedItems,
      subtotal,
      discount,
      deliveryFee,
      finalTotal,
      count,
    });
  } catch (error: any) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = authResult.auth;
    const body = await request.json();
    const { itemId, itemType = 'MEDICINE', quantity = 1 } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const cleanQty = Math.max(1, parseInt(quantity, 10) || 1);

    if (process.env.DATABASE_URL) {
      // Validate inventory stock if medicine
      if (itemType !== 'DIAGNOSTIC_TEST') {
        const med = await prisma.medicine.findUnique({
          where: { id: itemId },
          include: { batches: { where: { isQuarantined: false, quantity: { gt: 0 } } } },
        });
        const totalStock = med?.batches?.reduce((sum, b) => sum + b.quantity, 0) || 0;
        if (med && totalStock > 0 && cleanQty > totalStock) {
          return NextResponse.json(
            { success: false, error: `Only ${totalStock} units available in stock.` },
            { status: 400 }
          );
        }
      }

      await prisma.cartItem.upsert({
        where: {
          userId_itemId: {
            userId,
            itemId,
          },
        },
        update: {
          quantity: cleanQty,
          itemType,
        },
        create: {
          userId,
          itemId,
          itemType,
          quantity: cleanQty,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Cart updated successfully' });
  } catch (error: any) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await verifyServerSession(request);
    if (!authResult.success || !authResult.auth) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = authResult.auth;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (process.env.DATABASE_URL) {
      if (clearAll) {
        await prisma.cartItem.deleteMany({ where: { userId } });
      } else if (itemId) {
        await prisma.cartItem.deleteMany({
          where: { userId, itemId },
        });
      } else {
        return NextResponse.json({ success: false, error: 'itemId or clearAll required' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'Item removed from cart' });
  } catch (error: any) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
