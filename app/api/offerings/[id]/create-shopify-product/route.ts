import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ error: 'Use /api/products/[id]/create-shopify-product instead' }, { status: 410 });
}
