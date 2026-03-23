import { NextRequest, NextResponse } from 'next/server';
import * as ordersQuery from '@/lib/db/queries/orders';

/**
 * GET /api/orders/by-launch/[launchId]
 * Returns all orders + items for a given menu/launch.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { launchId: string } },
) {
  try {
    const data = await ordersQuery.listByLaunch(params.launchId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Orders by Launch] Failed:', error?.message);
    return NextResponse.json([], { status: 500 });
  }
}
