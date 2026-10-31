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
      return NextResponse.json({ success: true, addresses: [] });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, addresses });
  } catch (error: any) {
    console.error('Addresses GET error:', error);
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
    const { fullName, phone, streetAddress, landmark, city = 'Bhubaneswar', state = 'Odisha', pincode, isDefault = false } = body;

    if (!fullName?.trim() || !phone?.trim() || !streetAddress?.trim() || !pincode?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name, phone number, address, and pincode are required.' },
        { status: 400 }
      );
    }

    // Validate 6 digit pincode
    const cleanPin = pincode.toString().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 6-digit postal pincode.' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, address: body });
    }

    // If setting as default, unmark other default addresses for this user
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the user's first address, make it default automatically
    const existingCount = await prisma.address.count({ where: { userId } });
    const markDefault = isDefault || existingCount === 0;

    const address = await prisma.address.create({
      data: {
        userId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        streetAddress: streetAddress.trim(),
        landmark: landmark?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        pincode: cleanPin,
        isDefault: markDefault,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    console.error('Addresses POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
