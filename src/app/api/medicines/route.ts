import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_MEDICINES } from '@/data/mockData';
import { requireStaffSession } from '@/lib/auth';
import { verifyServerSession } from '@/lib/serverAuth';
import { calculateEffectivePrice, RuleLike } from '@/lib/pricing';
import { DosageForm, Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const dosageForm = searchParams.get('dosageForm');
    const rxParam = searchParams.get('rx');
    const letter = searchParams.get('letter');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const sort = searchParams.get('sort') || 'name_asc';
    const query = searchParams.get('q')?.trim() || '';

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const skip = (page - 1) * limit;

    if (process.env.DATABASE_URL) {
      const dbCount = await prisma.medicine.count().catch(() => 0);

      if (dbCount > 0) {
        // 1. Fetch active discount rules for dynamic price calculation
        const activeRules: RuleLike[] = await prisma.discountRule
          .findMany({
            where: { isActive: true },
            select: { id: true, title: true, scope: true, targetCategory: true, discountPercentage: true, isActive: true },
          })
          .catch(() => []);

        // 2. Build where filter for standard attributes
        const whereClause: any = {};

        if (category && category !== 'All') {
          whereClause.category = { equals: category, mode: 'insensitive' };
        }

        if (dosageForm && dosageForm !== 'All') {
          const upperForm = dosageForm.toUpperCase();
          if (Object.values(DosageForm).includes(upperForm as DosageForm)) {
            whereClause.dosageForm = upperForm as DosageForm;
          }
        }

        if (rxParam !== null && rxParam !== undefined && rxParam !== '') {
          whereClause.requiresPrescription = rxParam === 'true';
        }

        if (letter && letter !== 'ALL') {
          if (letter === '0-9') {
            whereClause.name = {
              OR: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => ({
                startsWith: n,
              })),
            };
          } else {
            whereClause.name = { startsWith: letter, mode: 'insensitive' };
          }
        }

        if (minPrice !== null && !isNaN(minPrice)) {
          whereClause.baseMrp = { ...(whereClause.baseMrp || {}), gte: minPrice };
        }
        if (maxPrice !== null && !isNaN(maxPrice)) {
          whereClause.baseMrp = { ...(whereClause.baseMrp || {}), lte: maxPrice };
        }

        let total = 0;
        let medicinesList: any[] = [];

        // 3. Search: Try PostgreSQL pg_trgm + tsvector fuzzy matching if query exists
        if (query) {
          try {
            const sqlConditions: Prisma.Sql[] = [
              Prisma.sql`(
                m.name % ${query}
                OR m."saltComposition" % ${query}
                OR m.brand % ${query}
                OR to_tsvector('english', coalesce(m.name, '') || ' ' || coalesce(m.brand, '') || ' ' || coalesce(m."saltComposition", '') || ' ' || coalesce(m.category, '')) @@ plainto_tsquery('english', ${query})
                OR m.name ILIKE '%' || ${query} || '%'
                OR m."saltComposition" ILIKE '%' || ${query} || '%'
                OR m.brand ILIKE '%' || ${query} || '%'
              )`,
            ];

            if (category && category !== 'All') {
              sqlConditions.push(Prisma.sql`m.category ILIKE ${category}`);
            }
            if (dosageForm && dosageForm !== 'All') {
              const upperForm = dosageForm.toUpperCase();
              if (Object.values(DosageForm).includes(upperForm as DosageForm)) {
                sqlConditions.push(Prisma.sql`m."dosageForm" = ${upperForm}::"DosageForm"`);
              }
            }
            if (rxParam !== null && rxParam !== undefined && rxParam !== '') {
              sqlConditions.push(Prisma.sql`m."requiresPrescription" = ${rxParam === 'true'}`);
            }
            if (minPrice !== null && !isNaN(minPrice)) {
              sqlConditions.push(Prisma.sql`m."baseMrp" >= ${minPrice}`);
            }
            if (maxPrice !== null && !isNaN(maxPrice)) {
              sqlConditions.push(Prisma.sql`m."baseMrp" <= ${maxPrice}`);
            }

            const whereSql = Prisma.join(sqlConditions, ' AND ');

            // Raw query using pg_trgm similarity and Full Text Search tsvector
            const rawResults: any[] = await prisma.$queryRaw`
              SELECT m.id, m."localWellCode", m.name, m.brand, m.category, m."dosageForm",
                     m.packaging, m.schedule, m."requiresPrescription", m."isColdChain",
                     m.description, m."saltComposition", m."baseMrp", m."discountPercentage",
                     m."sellingPrice",
                     GREATEST(
                       similarity(m.name, ${query}),
                       similarity(m."saltComposition", ${query}),
                       similarity(m.brand, ${query}) * 0.9,
                       word_similarity(${query}, m.name) * 0.8,
                       word_similarity(${query}, m."saltComposition") * 0.8
                     ) AS search_rank
              FROM "Medicine" m
              WHERE ${whereSql}
              ORDER BY search_rank DESC, m.name ASC
              LIMIT ${limit} OFFSET ${skip}
            `;

            const countResult: any[] = await prisma.$queryRaw`
              SELECT COUNT(*)::int AS count
              FROM "Medicine" m
              WHERE ${whereSql}
            `;

            medicinesList = rawResults;
            total = countResult[0]?.count || rawResults.length;
          } catch (trgmErr) {
            // Fallback to standard Prisma case-insensitive search if pg_trgm extension isn't enabled yet
            whereClause.OR = [
              { name: { contains: query, mode: 'insensitive' } },
              { saltComposition: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } },
              { localWellCode: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ];

            const [count, results] = await Promise.all([
              prisma.medicine.count({ where: whereClause }),
              prisma.medicine.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy:
                  sort === 'price_asc'
                    ? { baseMrp: 'asc' }
                    : sort === 'price_desc'
                    ? { baseMrp: 'desc' }
                    : sort === 'discount_desc'
                    ? { discountPercentage: 'desc' }
                    : sort === 'name_desc'
                    ? { name: 'desc' }
                    : { name: 'asc' },
              }),
            ]);

            total = count;
            medicinesList = results;
          }
        } else {
          // Standard browse with Prisma pagination
          const [count, results] = await Promise.all([
            prisma.medicine.count({ where: whereClause }),
            prisma.medicine.findMany({
              where: whereClause,
              skip,
              take: limit,
              orderBy:
                sort === 'price_asc'
                  ? { baseMrp: 'asc' }
                  : sort === 'price_desc'
                  ? { baseMrp: 'desc' }
                  : sort === 'discount_desc'
                  ? { discountPercentage: 'desc' }
                  : sort === 'name_desc'
                  ? { name: 'desc' }
                  : { name: 'asc' },
            }),
          ]);

          total = count;
          medicinesList = results;
        }

        // 4. Batch & FEFO Stock join for retrieved items
        const medicineIds = medicinesList.map((m) => m.id);
        const batches =
          medicineIds.length > 0
            ? await prisma.medicineBatch.findMany({
                where: {
                  medicineId: { in: medicineIds },
                  isQuarantined: false,
                  expiryDate: { gt: new Date() },
                  quantity: { gt: 0 },
                },
                orderBy: { expiryDate: 'asc' },
              })
            : [];

        const batchMap = new Map<string, any[]>();
        for (const b of batches) {
          const arr = batchMap.get(b.medicineId) || [];
          arr.push(b);
          batchMap.set(b.medicineId, arr);
        }

        // 5. Hydrate each item with FEFO stock and dynamic discount pricing
        const hydratedData = medicinesList.map((m) => {
          const itemBatches = batchMap.get(m.id) || [];
          const totalStock = itemBatches.reduce((acc, b) => acc + b.quantity, 0);
          const earliestBatch = itemBatches[0];
          const printedMrp = earliestBatch ? Number(earliestBatch.printedMrp) : Number(m.baseMrp);

          // Calculate effective price dynamically with precedence (never mutating base table)
          const pricing = calculateEffectivePrice(
            printedMrp,
            Number(m.discountPercentage || 0),
            m.category,
            activeRules
          );

          return {
            id: m.id,
            name: m.name,
            brand: m.brand,
            salt: m.saltComposition || m.name,
            saltComposition: m.saltComposition || m.name,
            category: m.category,
            mrp: pricing.mrp,
            discountPercentage: pricing.discountPercentage,
            sellingPrice: pricing.sellingPrice,
            savings: pricing.savings,
            appliedDiscountTitle: pricing.appliedRuleTitle,
            costPrice: earliestBatch?.purchaseRate ? Number(earliestBatch.purchaseRate) : Number(m.baseMrp) * 0.75,
            requiresPrescription: Boolean(m.requiresPrescription),
            schedule: (m.schedule || 'OTC') as any,
            stockQty: totalStock > 0 ? totalStock : 0,
            batchNumber: earliestBatch?.batchNumber || 'LW-BATCH-CURR',
            expiryDate: earliestBatch ? new Date(earliestBatch.expiryDate).toISOString().substring(0, 7) : '2026-12',
            packaging: m.packaging || 'Strip of 10 Tablets',
            dosageForm: m.dosageForm || 'TABLET',
            localWellCode: m.localWellCode,
            description: m.description || '',
            batches: itemBatches.map((b) => ({
              id: b.id,
              batchNumber: b.batchNumber,
              printedMrp: Number(b.printedMrp),
              purchaseRate: Number(b.purchaseRate),
              quantity: b.quantity,
              expiryDate: b.expiryDate,
            })),
          };
        });

        return NextResponse.json({
          success: true,
          source: 'database',
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          data: hydratedData,
        });
      }
    }

    // Fallback: Filter from verified in-memory dataset if database is not yet seeded
    let results = [...INITIAL_MEDICINES];

    if (category && category !== 'All') {
      const catNorm = category.toLowerCase().replace(/[-_]/g, ' ');
      results = results.filter((m) => {
        const mCatNorm = m.category.toLowerCase().replace(/[-_]/g, ' ');
        return mCatNorm === catNorm || mCatNorm.includes(catNorm);
      });
    }

    if (dosageForm && dosageForm !== 'All') {
      results = results.filter((m) => m.dosageForm.toLowerCase() === dosageForm.toLowerCase());
    }

    if (rxParam !== null && rxParam !== undefined && rxParam !== '') {
      const rxVal = rxParam === 'true';
      results = results.filter((m) => m.requiresPrescription === rxVal);
    }

    if (letter && letter !== 'ALL') {
      if (letter === '0-9') {
        results = results.filter((m) => /^[0-9]/.test(m.name.trim()));
      } else {
        results = results.filter((m) => m.name.trim().toUpperCase().startsWith(letter.toUpperCase()));
      }
    }

    if (query) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.salt.toLowerCase().includes(q) ||
          m.brand.toLowerCase().includes(q) ||
          m.localWellCode.toLowerCase().includes(q)
      );
    }

    if (sort === 'price_asc') {
      results.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sort === 'price_desc') {
      results.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sort === 'discount_desc') {
      results.sort((a, b) => b.discountPercentage - a.discountPercentage);
    } else if (sort === 'name_desc') {
      results.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    const total = results.length;
    const paginated = results.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      source: 'dataset',
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: paginated,
    });
  } catch (error: any) {
    console.error('API Error /api/medicines:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let isStaffAuthorized = false;
    let actorName = 'Admin';
    let actorRole: 'SUPER_ADMIN' | 'STORE_MANAGER' = 'STORE_MANAGER';

    const cookieStaff = await requireStaffSession();
    if (cookieStaff && (cookieStaff.role === 'SUPER_ADMIN' || cookieStaff.role === 'STORE_MANAGER')) {
      isStaffAuthorized = true;
      actorName = cookieStaff.name;
      actorRole = cookieStaff.role as any;
    } else {
      const serverAuth = await verifyServerSession(request);
      if (
        serverAuth.success &&
        serverAuth.auth &&
        (serverAuth.auth.role === 'SUPER_ADMIN' || serverAuth.auth.role === 'STORE_MANAGER')
      ) {
        isStaffAuthorized = true;
        actorName = serverAuth.auth.name || 'Admin';
        actorRole = serverAuth.auth.role as any;
      }
    }

    if (!isStaffAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Super Admin or Store Manager credentials required to manage medicines.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, brand, category, saltComposition, baseMrp, localWellCode, batchNumber, stockQty, expiryDate } = body;

    if (!name || !baseMrp || !localWellCode) {
      return NextResponse.json({ success: false, error: 'Missing required medicine fields' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      const created = await prisma.medicine.create({
        data: {
          name,
          brand: brand || 'Generic',
          category: category || 'General',
          saltComposition: saltComposition || name,
          baseMrp: Number(baseMrp),
          sellingPrice: Number(baseMrp),
          packaging: body.packaging || 'Strip of 10 Tablets',
          localWellCode,
          batches: {
            create: {
              batchNumber: batchNumber || 'LW-INIT-01',
              printedMrp: Number(baseMrp),
              purchaseRate: Number(baseMrp) * 0.75,
              quantity: Number(stockQty) || 50,
              expiryDate: new Date(expiryDate || '2026-12-31'),
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          actorName,
          actorRole,
          actionType: 'LOCALWELL_STOCK_SYNCED',
          details: `Added new medicine SKU: ${name} (${localWellCode}) with batch ${batchNumber}.`,
          newValue: `₹${baseMrp}`,
        },
      });

      return NextResponse.json({ success: true, data: created });
    }

    return NextResponse.json({ success: true, message: 'Simulated creation (Connect DATABASE_URL for permanent persistence)' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
