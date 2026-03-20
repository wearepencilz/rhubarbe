import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { pickupLocations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/pickup-locations/[id]
 *
 * Returns a single pickup location by ID.
 * Returns 404 if not found.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [location] = await db
      .select()
      .from(pickupLocations)
      .where(eq(pickupLocations.id, params.id));

    if (!location) {
      return NextResponse.json(
        { error: 'Pickup location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error fetching pickup location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pickup location' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pickup-locations/[id]
 *
 * Updates an existing pickup location.
 * Validates bilingual content if provided.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(pickupLocations)
      .where(eq(pickupLocations.id, params.id));

    if (!existing) {
      return NextResponse.json(
        { error: 'Pickup location not found' },
        { status: 404 }
      );
    }

    // Validate bilingual content if provided
    if (body.publicLabel) {
      if (!body.publicLabel.en || !body.publicLabel.fr) {
        return NextResponse.json(
          { error: 'Public label is required in both English and French' },
          { status: 400 }
        );
      }
    }
    if (body.pickupInstructions) {
      if (!body.pickupInstructions.en || !body.pickupInstructions.fr) {
        return NextResponse.json(
          { error: 'Pickup instructions are required in both English and French' },
          { status: 400 }
        );
      }
    }

    const updateData: any = { updatedAt: new Date() };

    if (body.internalName !== undefined) updateData.internalName = body.internalName;
    if (body.publicLabel !== undefined) updateData.publicLabel = body.publicLabel;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.pickupInstructions !== undefined) updateData.pickupInstructions = body.pickupInstructions;
    if (body.contactDetails !== undefined) updateData.contactDetails = body.contactDetails;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.mapOrDirectionsLink !== undefined) updateData.mapOrDirectionsLink = body.mapOrDirectionsLink;
    if (body.operationalNotesForStaff !== undefined) updateData.operationalNotesForStaff = body.operationalNotesForStaff;

    const [updated] = await db
      .update(pickupLocations)
      .set(updateData)
      .where(eq(pickupLocations.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating pickup location:', error);
    return NextResponse.json(
      { error: 'Failed to update pickup location' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pickup-locations/[id]
 *
 * Soft delete: sets active to false.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [existing] = await db
      .select()
      .from(pickupLocations)
      .where(eq(pickupLocations.id, params.id));

    if (!existing) {
      return NextResponse.json(
        { error: 'Pickup location not found' },
        { status: 404 }
      );
    }

    const [deleted] = await db
      .update(pickupLocations)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(pickupLocations.id, params.id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Pickup location deactivated successfully',
      location: deleted,
    });
  } catch (error) {
    console.error('Error deleting pickup location:', error);
    return NextResponse.json(
      { error: 'Failed to delete pickup location' },
      { status: 500 }
    );
  }
}
