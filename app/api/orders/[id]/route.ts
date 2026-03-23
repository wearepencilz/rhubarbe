import { NextRequest, NextResponse } from 'next/server';
import * as ordersQuery from '@/lib/db/queries/orders';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const order = await ordersQuery.getById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('[Orders API] Get failed:', error?.message);
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const updated = await ordersQuery.updateStatus(params.id, body.status);
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Orders API] Update failed:', error?.message);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
