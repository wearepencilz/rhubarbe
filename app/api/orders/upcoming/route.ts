import { NextRequest, NextResponse } from 'next/server';
import * as ordersQuery from '@/lib/db/queries/orders';

const VALID_ORDER_TYPES = ['volume', 'cake', 'launch'] as const;

/**
 * GET /api/orders/upcoming?orderType=volume|cake|launch
 * Returns all upcoming (non-cancelled, non-fulfilled) orders for the given type,
 * ordered by fulfillment date ascending.
 */
export async function GET(request: NextRequest) {
  try {
    const orderType = request.nextUrl.searchParams.get('orderType');

    if (
      !orderType ||
      !VALID_ORDER_TYPES.includes(orderType as (typeof VALID_ORDER_TYPES)[number])
    ) {
      return NextResponse.json({ error: 'Invalid orderType' }, { status: 400 });
    }

    const data = await ordersQuery.listUpcoming(orderType);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Orders Upcoming] Failed:', error?.message);
    return NextResponse.json([], { status: 500 });
  }
}
