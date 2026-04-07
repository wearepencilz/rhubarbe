import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as ordersQuery from '@/lib/db/queries/orders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const data = await ordersQuery.listForPrep({
      dateFrom: params.get('dateFrom') || undefined,
      dateTo: params.get('dateTo') || undefined,
      paymentStatus: params.get('paymentStatus') || undefined,
      orderType: params.get('orderType') || undefined,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Orders Prep] Failed:', error?.message);
    return NextResponse.json([], { status: 500 });
  }
}
