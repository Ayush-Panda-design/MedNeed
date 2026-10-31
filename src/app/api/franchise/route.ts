import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_FRANCHISE_INQUIRIES } from '@/data/mockData';
import { requireStaffSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireStaffSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Staff credentials required' }, { status: 401 });
    }

    if (process.env.DATABASE_URL) {
      const inquiries = await prisma.franchiseInquiry.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: inquiries });
    }

    return NextResponse.json({ success: true, data: INITIAL_FRANCHISE_INQUIRIES });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      email,
      city,
      proposedArea,
      commercialSpaceSqFt,
      ownershipType,
      investmentBudget,
      hasPharmaExperience,
      notes,
    } = body;

    if (!fullName || !phone || !email || !city || !proposedArea) {
      return NextResponse.json(
        { success: false, error: 'Full name, phone, email, city, and proposed area are required' },
        { status: 400 }
      );
    }

    // Validate phone and email
    if (!/^\+?[0-9\s\-]{8,15}$/.test(phone.trim())) {
      return NextResponse.json({ success: false, error: 'Please provide a valid contact mobile number' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address' }, { status: 400 });
    }

    const generatedId = `FRAN-${Math.floor(100 + Math.random() * 900)}`;

    if (process.env.DATABASE_URL) {
      const created = await prisma.franchiseInquiry.create({
        data: {
          id: generatedId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          city: city.trim(),
          proposedArea: proposedArea.trim(),
          commercialSpaceSqFt: Number(commercialSpaceSqFt) || 300,
          ownershipType: ownershipType === 'RENTED' ? 'RENTED' : 'OWNED',
          investmentBudget: investmentBudget || '10_TO_20_LAKHS',
          hasPharmaExperience: Boolean(hasPharmaExperience),
          status: 'NEW',
          notes: notes || null,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorName: fullName.trim(),
          actorRole: 'STORE_MANAGER',
          actionType: 'FRANCHISE_STATUS_CHANGED',
          details: `New Franchise Inquiry #${generatedId} registered for ${city} (${proposedArea}) by ${fullName}. Space: ${commercialSpaceSqFt} sq ft.`,
          newValue: 'NEW',
        },
      });

      return NextResponse.json({ success: true, inquiryId: generatedId, data: created });
    }

    return NextResponse.json({
      success: true,
      inquiryId: generatedId,
      message: 'Franchise inquiry submitted successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireStaffSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Staff credentials required' }, { status: 401 });
    }

    const { id, status, notes } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Inquiry ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['NEW', 'CONTACTED', 'SITE_VISIT', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid franchise inquiry status' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      const existing = await prisma.franchiseInquiry.findUnique({ where: { id } });
      const oldStatus = existing?.status || 'NEW';

      const updated = await prisma.franchiseInquiry.update({
        where: { id },
        data: {
          status,
          ...(notes ? { notes } : {}),
        },
      });

      await prisma.auditLog.create({
        data: {
          actorName: session.name,
          actorRole: session.role as any,
          actionType: 'FRANCHISE_STATUS_CHANGED',
          details: `Franchise Lead #${id} (${updated.fullName}) updated to ${status}. Notes: ${notes || updated.notes || 'Updated'}.`,
          oldValue: oldStatus,
          newValue: status,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({
      success: true,
      message: `Simulated franchise lead ${id} status updated to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
