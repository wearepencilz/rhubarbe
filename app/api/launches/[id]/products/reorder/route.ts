import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { launchProducts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/launches/[id]/products/reorder
 * Bulk reorder products within a launch.
 * Body: { order: [{ id: string, sortOrder: number }] }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const order: Array<{ id: string; sortOrder: number }> = body.order;

    if (!Array.isArray(order) || order.length === 0) {
      return NextResponse.json({ error: 'order array is required' }, { status: 400 });
    }

    // Update each product's sort order
    await Promise.all(
      order.map(({ id, sortOrder }) =>
        db
          .update(launchProducts)
          .set({ sortOrder })
          .where(and(eq(launchProducts.launchId, params.id), eq(launchProducts.id, id)))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering launch products:', error);
    return NextResponse.json({ error: 'Failed to reorder products' }, { status: 500 });
  }
}
