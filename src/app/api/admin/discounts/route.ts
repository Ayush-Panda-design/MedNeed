import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffSession } from '@/lib/auth';

/**
 * GET: Fetch all discount rules for staff administration.
 */
export async function GET() {
  try {
    const session = await requireStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'STORE_MANAGER' && session.role !== 'AUDIT_OFFICER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Staff credentials required' }, { status: 401 });
    }

    if (process.env.DATABASE_URL) {
      const rules = await prisma.discountRule.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, rules });
    }

    return NextResponse.json({ success: true, rules: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Create a new discount rule without mutating baseline catalogue records.
 */
export async function POST(request: Request) {
  try {
    const session = await requireStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'STORE_MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Owner or Store Manager privileges required' },
        { status: 403 }
      );
    }

    const { scope, percentage, targetCategory, title } = await request.json();

    const discountNum = Number(percentage);
    if (isNaN(discountNum) || discountNum < 0 || discountNum > 50) {
      return NextResponse.json(
        { success: false, error: 'Discount percentage must be between 0 and 50%' },
        { status: 400 }
      );
    }

    if (scope !== 'ALL_MEDICINES' && scope !== 'CATEGORY') {
      return NextResponse.json(
        { success: false, error: 'Scope must be ALL_MEDICINES or CATEGORY' },
        { status: 400 }
      );
    }

    if (scope === 'CATEGORY' && (!targetCategory || !targetCategory.trim())) {
      return NextResponse.json(
        { success: false, error: 'Target category is required for category-scoped discounts' },
        { status: 400 }
      );
    }

    const ruleTitle = title?.trim() || (
      scope === 'ALL_MEDICINES'
        ? `Storewide Flat ${discountNum}% OFF`
        : `${targetCategory.trim()} Special ${discountNum}% OFF`
    );

    if (process.env.DATABASE_URL) {
      // 1. Create rule in DiscountRule table (zero raw SQL, zero base table mutation)
      const rule = await prisma.discountRule.create({
        data: {
          title: ruleTitle,
          scope,
          targetCategory: scope === 'CATEGORY' ? targetCategory.trim() : null,
          discountPercentage: discountNum,
          isActive: true,
          updatedBy: session.name,
        },
      });

      // 2. Write immutable audit log
      await prisma.auditLog.create({
        data: {
          actorName: session.name,
          actorRole: session.role as any,
          actionType: 'BULK_DISCOUNT_APPLIED',
          details: `Created active discount rule: "${ruleTitle}" (${discountNum}% on ${scope === 'ALL_MEDICINES' ? 'ALL MEDICINES' : targetCategory}). Effective prices computed dynamically on demand.`,
          newValue: `${discountNum}%`,
        },
      });

      return NextResponse.json({ success: true, rule });
    }

    return NextResponse.json({
      success: true,
      message: `Simulated bulk discount rule created: ${ruleTitle}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH: Toggle active status or update a discount rule.
 * Toggling isActive = false automatically restores baseline prices on all affected medicines.
 */
export async function PATCH(request: Request) {
  try {
    const session = await requireStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Staff credentials required' }, { status: 403 });
    }

    const { id, isActive, discountPercentage } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Discount rule ID is required' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      const existing = await prisma.discountRule.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: `Discount rule #${id} not found` }, { status: 404 });
      }

      const updateData: any = {
        updatedBy: session.name,
      };

      if (typeof isActive === 'boolean') {
        updateData.isActive = isActive;
      }

      if (discountPercentage !== undefined) {
        const num = Number(discountPercentage);
        if (!isNaN(num) && num >= 0 && num <= 50) {
          updateData.discountPercentage = num;
        }
      }

      const updated = await prisma.discountRule.update({
        where: { id },
        data: updateData,
      });

      await prisma.auditLog.create({
        data: {
          actorName: session.name,
          actorRole: session.role as any,
          actionType: 'BULK_DISCOUNT_APPLIED',
          details: `Discount rule "${updated.title}" set to ${updated.isActive ? 'ACTIVE' : 'INACTIVE'} by ${session.name}. Baseline prices automatically restored if disabled.`,
          oldValue: existing.isActive ? 'ACTIVE' : 'INACTIVE',
          newValue: updated.isActive ? 'ACTIVE' : 'INACTIVE',
        },
      });

      return NextResponse.json({ success: true, rule: updated });
    }

    return NextResponse.json({ success: true, message: `Simulated update of discount rule #${id}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE: Remove a discount rule completely.
 */
export async function DELETE(request: Request) {
  try {
    const session = await requireStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Staff credentials required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Discount rule ID is required' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      const existing = await prisma.discountRule.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Discount rule not found' }, { status: 404 });
      }

      await prisma.discountRule.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          actorName: session.name,
          actorRole: session.role as any,
          actionType: 'BULK_DISCOUNT_APPLIED',
          details: `Deleted discount rule "${existing.title}". Catalog prices restored to baseline.`,
          oldValue: existing.title,
        },
      });

      return NextResponse.json({ success: true, message: 'Discount rule deleted successfully' });
    }

    return NextResponse.json({ success: true, message: `Simulated deletion of discount rule #${id}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
