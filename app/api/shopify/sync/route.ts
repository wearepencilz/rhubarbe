import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Shopify sync via flavours has been removed' }, { status: 410 });
}
