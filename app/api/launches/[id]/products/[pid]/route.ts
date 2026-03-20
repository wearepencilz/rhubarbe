import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { launchProducts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/launches/[id]/products/[pid]
 * Update a launch product's sort order or overrides.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; pid: string } }
) {
  try {
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(launchProducts)
      .where(and(eq(launchProducts.launchId, params.id), eq(launchProducts.id, params.pid)));

    if (!existing) {
      return NextResponse.json({ error: 'Launch product not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.minQuantityOverride !== undefined) updateData.minQuantityOverride = body.minQuantityOverride;
    if (body.maxQuantityOverride !== undefined) updateData.maxQuantityOverride = body.maxQuantityOverride;
    if (body.quantityStepOverride !== undefined) updateData.quantityStepOverride = body.quantityStepOverride;

    const [updated] = await db
      .update(launchProducts)
      .set(updateData)
      .where(and(eq(launchProducts.launchId, params.id), eq(launchProducts.id, params.pid)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating launch product:', error);
    return NextResponse.json({ error: 'Failed to update launch product' }, { status: 500 });
  }
}

/**
 * DELETE /api/launches/[id]/products/[pid]
 * Remove a product from a launch.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pid: string } }
) {
  try {
    const [deleted] = await db
      .delete(launchProducts)
      .where(and(eq(launchProducts.launchId, params.id), eq(launchProducts.id, params.pid)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Launch product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing launch product:', error);
    return NextResponse.json({ error: 'Failed to remove product' }, { status: 500 });
  }
}
