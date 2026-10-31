import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_AUDIT_LOGS } from '@/data/mockData';
import { requireStaffSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireStaffSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Staff credentials required to view regulatory audit trails' },
        { status: 401 }
      );
    }

    if (process.env.DATABASE_URL) {
      const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 200,
      });
      return NextResponse.json({ success: true, data: logs });
    }

    return NextResponse.json({ success: true, data: INITIAL_AUDIT_LOGS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
