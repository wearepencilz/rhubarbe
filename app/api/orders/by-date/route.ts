import { NextRequest, NextResponse } from 'next/server';
import * as ordersQuery from '@/lib/db/queries/orders';

const VALID_ORDER_TYPES = ['volume', 'cake'] as const;

function isValidISODate(value: string): boolean {
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * GET /api/orders/by-date?date=YYYY-MM-DD&orderType=volume|cake
 * Returns all orders + items for a given fulfillment date and order type.
 */
export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date');
    const orderType = request.nextUrl.searchParams.get('orderType');

    if (!date || !isValidISODate(date)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    if (
      !orderType ||
      !VALID_ORDER_TYPES.includes(orderType as (typeof VALID_ORDER_TYPES)[number])
    ) {
      return NextResponse.json({ error: 'Invalid orderType' }, { status: 400 });
    }

    const data = await ordersQuery.listByDate(date, orderType);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Orders by Date] Failed:', error?.message);
    return NextResponse.json([], { status: 500 });
  }
}
