import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { launches, launchProducts } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * POST /api/launches/[id]/duplicate
 * Create a copy of a launch (as draft) with all its products.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [source] = await db.select().from(launches).where(eq(launches.id, params.id));
    if (!source) {
      return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
    }

    // Copy launch as draft with "(Copy)" suffix
    const titleEn = (source.title as any)?.en || '';
    const titleFr = (source.title as any)?.fr || '';
    const [created] = await db
      .insert(launches)
      .values({
        title: { en: `${titleEn} (Copy)`, fr: `${titleFr} (Copie)` },
        introCopy: source.introCopy,
        status: 'draft',
        orderOpens: source.orderOpens,
        orderCloses: source.orderCloses,
        allowEarlyOrdering: source.allowEarlyOrdering,
        pickupDate: source.pickupDate,
        pickupLocationId: source.pickupLocationId,
        pickupInstructions: source.pickupInstructions,
        pickupSlotConfig: source.pickupSlotConfig,
        pickupSlots: source.pickupSlots,
      })
      .returning();

    // Copy linked products
    const sourceProducts = await db
      .select()
      .from(launchProducts)
      .where(eq(launchProducts.launchId, params.id))
      .orderBy(asc(launchProducts.sortOrder));

    if (sourceProducts.length > 0) {
      await db.insert(launchProducts).values(
        sourceProducts.map((p) => ({
          launchId: created.id,
          productId: p.productId,
          productName: p.productName,
          sortOrder: p.sortOrder,
          minQuantityOverride: p.minQuantityOverride,
          maxQuantityOverride: p.maxQuantityOverride,
          quantityStepOverride: p.quantityStepOverride,
        }))
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error duplicating launch:', error);
    return NextResponse.json({ error: 'Failed to duplicate launch' }, { status: 500 });
  }
}
