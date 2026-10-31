import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_DIAGNOSTICS } from '@/data/mockData';
import { requireStaffSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    if (process.env.DATABASE_URL) {
      const whereClause: any = {};
      if (category && category !== 'All') {
        whereClause.category = category;
      }
      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ];
      }

      const tests = await prisma.diagnosticTest.findMany({
        where: whereClause,
        orderBy: { popular: 'desc' },
      });

      if (tests.length > 0) {
        const mapped = tests.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category as any,
          mrp: Number(t.mrp),
          discountedPrice: Number(t.discountedPrice),
          fastingHours: t.fastingHours,
          sampleType: t.sampleType as any,
          turnaroundHours: t.turnaroundHours,
          testCount: t.testCount,
          includes: t.parameters,
          popular: t.popular,
        }));
        return NextResponse.json({ success: true, data: mapped });
      }
    }

    // Fallback to verified catalog
    let results = INITIAL_DIAGNOSTICS;
    if (category && category !== 'All') {
      results = results.filter((t) => t.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.includes.some((p) => p.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireStaffSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'STORE_MANAGER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized staff role' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, mrp, discountedPrice, fastingHours, sampleType, turnaroundHours, testCount, includes } = body;

    if (!name || !mrp || !discountedPrice) {
      return NextResponse.json({ success: false, error: 'Missing required diagnostic test fields' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      const created = await prisma.diagnosticTest.create({
        data: {
          name,
          category: category || 'Full Body',
          mrp: Number(mrp),
          discountedPrice: Number(discountedPrice),
          fastingHours: Number(fastingHours) || 0,
          sampleType: sampleType || 'Blood',
          turnaroundHours: Number(turnaroundHours) || 12,
          testCount: Number(testCount) || 1,
          parameters: Array.isArray(includes) ? includes : [includes || 'Routine Panel'],
          popular: Boolean(body.popular),
        },
      });

      return NextResponse.json({ success: true, data: created });
    }

    return NextResponse.json({ success: true, message: 'Simulated diagnostic test creation' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
