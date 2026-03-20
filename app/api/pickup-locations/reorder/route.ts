import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { pickupLocations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/pickup-locations/reorder
 *
 * Updates sort_order for multiple pickup locations in a single operation.
 *
 * Body: Array of { id: string, sort_order: number }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be an array of { id, sort_order } objects' },
        { status: 400 }
      );
    }

    if (body.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of body) {
      if (!item.id || typeof item.id !== 'string') {
        return NextResponse.json(
          { error: 'Each item must have a valid id' },
          { status: 400 }
        );
      }
      if (item.sort_order === undefined || typeof item.sort_order !== 'number') {
        return NextResponse.json(
          { error: 'Each item must have a numeric sort_order' },
          { status: 400 }
        );
      }
    }

    // Update each location's sort_order
    const updates = await Promise.all(
      body.map(({ id, sort_order }: { id: string; sort_order: number }) =>
        db
          .update(pickupLocations)
          .set({ sortOrder: sort_order, updatedAt: new Date() })
          .where(eq(pickupLocations.id, id))
          .returning()
      )
    );

    const updated = updates.flat();

    return NextResponse.json({
      success: true,
      updated: updated.length,
      locations: updated,
    });
  } catch (error) {
    console.error('Error reordering pickup locations:', error);
    return NextResponse.json(
      { error: 'Failed to reorder pickup locations' },
      { status: 500 }
    );
  }
}
