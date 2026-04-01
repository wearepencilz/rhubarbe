import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { launches, launchProducts, pickupLocations } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * GET /api/launches/[id]
 * Return a launch with its products and pickup location.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [launch] = await db
      .select()
      .from(launches)
      .where(eq(launches.id, params.id));

    if (!launch) {
      return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
    }

    // Fetch linked products (name stored directly in launch_products)
    const linkedProducts = await db
      .select({
        id: launchProducts.id,
        productId: launchProducts.productId,
        productName: launchProducts.productName,
        sortOrder: launchProducts.sortOrder,
        minQuantityOverride: launchProducts.minQuantityOverride,
        maxQuantityOverride: launchProducts.maxQuantityOverride,
        quantityStepOverride: launchProducts.quantityStepOverride,
      })
      .from(launchProducts)
      .where(eq(launchProducts.launchId, params.id))
      .orderBy(asc(launchProducts.sortOrder));

    // Fetch pickup location if set
    let pickupLocation = null;
    if (launch.pickupLocationId) {
      const [loc] = await db
        .select()
        .from(pickupLocations)
        .where(eq(pickupLocations.id, launch.pickupLocationId));
      pickupLocation = loc || null;
    }

    return NextResponse.json({ ...launch, products: linkedProducts, pickupLocation });
  } catch (error) {
    console.error('Error fetching launch:', error);
    return NextResponse.json({ error: 'Failed to fetch launch' }, { status: 500 });
  }
}

function validateBilingual(value: any, fieldName: string): string | null {
  if (!value || typeof value !== 'object') return `${fieldName} is required`;
  if (!value.en || typeof value.en !== 'string') return `${fieldName}.en is required`;
  if (!value.fr || typeof value.fr !== 'string') return `${fieldName}.fr is required`;
  return null;
}

/**
 * PATCH /api/launches/[id]
 * Update an existing launch.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(launches)
      .where(eq(launches.id, params.id));

    if (!existing) {
      return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
    }

    // Validate bilingual fields if provided
    if (body.title !== undefined) {
      const err = validateBilingual(body.title, 'title');
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }
    if (body.introCopy !== undefined) {
      const err = validateBilingual(body.introCopy, 'introCopy');
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    // Validate order closes before pickup if either changes
    if (body.orderCloses !== undefined || body.pickupDate !== undefined) {
      const closes = new Date(body.orderCloses ?? existing.orderCloses);
      const pickupRaw = body.pickupDate ?? existing.pickupDate;
      const pickupStr = typeof pickupRaw === 'string' && pickupRaw.length === 10 ? pickupRaw + 'T12:00:00' : pickupRaw;
      const pickup = new Date(pickupStr);
      if (closes >= pickup) {
        return NextResponse.json({ error: 'orderCloses must be before pickupDate' }, { status: 400 });
      }
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.introCopy !== undefined) updateData.introCopy = body.introCopy;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.orderOpens !== undefined) updateData.orderOpens = new Date(body.orderOpens);
    if (body.orderCloses !== undefined) updateData.orderCloses = new Date(body.orderCloses);
    if (body.allowEarlyOrdering !== undefined) updateData.allowEarlyOrdering = body.allowEarlyOrdering;
    if (body.pickupDate !== undefined) {
      const raw = body.pickupDate.length === 10 ? body.pickupDate + 'T12:00:00' : body.pickupDate;
      updateData.pickupDate = new Date(raw);
    }
    if (body.pickupLocationId !== undefined) updateData.pickupLocationId = body.pickupLocationId || null;
    if (body.pickupInstructions !== undefined) updateData.pickupInstructions = body.pickupInstructions;
    if (body.pickupSlotConfig !== undefined) updateData.pickupSlotConfig = body.pickupSlotConfig;
    if (body.pickupSlots !== undefined) updateData.pickupSlots = body.pickupSlots;
    if (body.slug !== undefined) updateData.slug = body.slug || null;

    // Pickup window fields
    if (body.pickupWindowStart !== undefined) {
      updateData.pickupWindowStart = body.pickupWindowStart ? new Date(body.pickupWindowStart) : null;
    }
    if (body.pickupWindowEnd !== undefined) {
      updateData.pickupWindowEnd = body.pickupWindowEnd ? new Date(body.pickupWindowEnd) : null;
    }

    // Validate pickup window: end must be >= start when both are provided
    const resolvedStart = updateData.pickupWindowStart !== undefined
      ? updateData.pickupWindowStart
      : existing.pickupWindowStart;
    const resolvedEnd = updateData.pickupWindowEnd !== undefined
      ? updateData.pickupWindowEnd
      : existing.pickupWindowEnd;

    if (resolvedStart && resolvedEnd && resolvedEnd < resolvedStart) {
      return NextResponse.json(
        { error: 'pickupWindowEnd must be >= pickupWindowStart' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(launches)
      .set(updateData)
      .where(eq(launches.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating launch:', error);
    return NextResponse.json({ error: 'Failed to update launch' }, { status: 500 });
  }
}

/**
 * DELETE /api/launches/[id]
 * Soft delete — sets status to 'archived'.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [existing] = await db
      .select()
      .from(launches)
      .where(eq(launches.id, params.id));

    if (!existing) {
      return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
    }

    const [archived] = await db
      .update(launches)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(launches.id, params.id))
      .returning();

    return NextResponse.json({ success: true, launch: archived });
  } catch (error) {
    console.error('Error archiving launch:', error);
    return NextResponse.json({ error: 'Failed to archive launch' }, { status: 500 });
  }
}
