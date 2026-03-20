import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { launchProducts, launches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/launches/[id]/products
 * Replace all products for a launch (full sync).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [launch] = await db.select().from(launches).where(eq(launches.id, params.id));
    if (!launch) {
      return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
    }

    const body = await request.json();
    const products: Array<{
      productId: string;
      productName: string;
      sortOrder: number;
      minQuantityOverride?: number | null;
      maxQuantityOverride?: number | null;
      quantityStepOverride?: number | null;
    }> = body.products || [];

    // Delete existing products for this launch
    await db.delete(launchProducts).where(eq(launchProducts.launchId, params.id));

    // Insert new products
    if (products.length > 0) {
      await db.insert(launchProducts).values(
        products.map((p) => ({
          launchId: params.id,
          productId: p.productId,
          productName: p.productName || '',
          sortOrder: p.sortOrder ?? 0,
          minQuantityOverride: p.minQuantityOverride ?? null,
          maxQuantityOverride: p.maxQuantityOverride ?? null,
          quantityStepOverride: p.quantityStepOverride ?? null,
        }))
      );
    }

    // Return updated list
    const updated = await db
      .select()
      .from(launchProducts)
      .where(eq(launchProducts.launchId, params.id));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error syncing launch products:', error);
    return NextResponse.json({ error: 'Failed to sync products' }, { status: 500 });
  }
}
