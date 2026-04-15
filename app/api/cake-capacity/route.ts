import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { orders } from '@/lib/db/schema';
import { sql, and } from 'drizzle-orm';
import * as settingsQueries from '@/lib/db/queries/settings';

export const dynamic = 'force-dynamic';

const DEFAULT_MAX_CAKES = 7;
const FALLBACK_LEAD_TIME = 7;

async function getMaxCakes() {
  const raw = await settingsQueries.getByKey('cakeCapacity');
  const val = (raw?.value ?? {}) as Record<string, unknown>;
  return typeof val.maxCakes === 'number' ? val.maxCakes : DEFAULT_MAX_CAKES;
}

/**
 * For a candidate delivery date D with lead time L, count existing cake orders
 * whose production window overlaps the candidate's production window [D-L, D].
 *
 * Each existing order uses its own stored lead_time_days (falling back to FALLBACK).
 * Overlap: existing order's window [E - E_lead, E] intersects [D - L, D]
 *   => E >= D - L AND E - E_lead <= D
 */
async function countConflicts(candidateDate: string, candidateLeadTime: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        sql`${orders.orderType} = 'cake'`,
        sql`${orders.status} IN ('pending', 'confirmed')`,
        sql`${orders.fulfillmentDate} IS NOT NULL`,
        // Existing delivery date is within candidate's production window start
        sql`${orders.fulfillmentDate}::date >= (${candidateDate}::date - ${candidateLeadTime} * interval '1 day')::date`,
        // Existing order's production start is before or on candidate's delivery date
        sql`(${orders.fulfillmentDate}::date - COALESCE(${orders.leadTimeDays}, ${FALLBACK_LEAD_TIME}) * interval '1 day')::date <= ${candidateDate}::date`,
      ),
    );
  return row?.count ?? 0;
}

/**
 * GET /api/cake-capacity?from=YYYY-MM-DD&to=YYYY-MM-DD&leadTime=7
 * Returns { maxCakes, blockedDates: string[] }
 *
 * leadTime param = the lead time of the cake being ordered (from product tiers).
 * Falls back to 7 if not provided.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const candidateLeadTime = parseInt(searchParams.get('leadTime') || '') || FALLBACK_LEAD_TIME;

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to query params required' }, { status: 400 });
    }

    const maxCakes = await getMaxCakes();

    const start = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const maxRange = 90;
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > maxRange || diffDays < 0) {
      return NextResponse.json({ error: `Date range must be 0-${maxRange} days` }, { status: 400 });
    }

    const blockedDates: string[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const conflicts = await countConflicts(dateStr, candidateLeadTime);
      if (conflicts >= maxCakes) {
        blockedDates.push(dateStr);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const res = NextResponse.json({ maxCakes, blockedDates });
    res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res;
  } catch (error) {
    console.error('[Cake Capacity] Error:', error);
    return NextResponse.json({ error: 'Failed to check capacity' }, { status: 500 });
  }
}
