import { NextRequest, NextResponse } from 'next/server';
import * as ordersQuery from '@/lib/db/queries/orders';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const data = await ordersQuery.list({ status });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Orders API] List failed:', error?.message);
    return NextResponse.json([]);
  }
}
