import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { isNotNull } from 'drizzle-orm';

export async function GET() {
  const rows = await db
    .select({ shopifyProductId: products.shopifyProductId })
    .from(products)
    .where(isNotNull(products.shopifyProductId));
  return NextResponse.json(rows.map((r) => r.shopifyProductId));
}
