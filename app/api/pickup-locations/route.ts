import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { pickupLocations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/pickup-locations
 *
 * Returns a list of pickup locations with optional filtering.
 *
 * Query Parameters:
 * - active: Filter by active status (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get('active');

    const conditions = [];

    if (activeParam !== null) {
      const isActive = activeParam === 'true';
      conditions.push(eq(pickupLocations.active, isActive));
    }

    const locations = await db
      .select()
      .from(pickupLocations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(pickupLocations.sortOrder);

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching pickup locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pickup locations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pickup-locations
 *
 * Creates a new pickup location with bilingual validation.
 *
 * Validation Rules:
 * - internalName, address, contactDetails are required
 * - publicLabel requires both en and fr
 * - pickupInstructions requires both en and fr
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.internalName) {
      return NextResponse.json({ error: 'Internal name is required' }, { status: 400 });
    }
    if (!body.address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    if (!body.contactDetails) {
      return NextResponse.json({ error: 'Contact details are required' }, { status: 400 });
    }

    // Validate bilingual content
    if (!body.publicLabel || !body.publicLabel.en || !body.publicLabel.fr) {
      return NextResponse.json(
        { error: 'Public label is required in both English and French' },
        { status: 400 }
      );
    }
    if (!body.pickupInstructions || !body.pickupInstructions.en || !body.pickupInstructions.fr) {
      return NextResponse.json(
        { error: 'Pickup instructions are required in both English and French' },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(pickupLocations)
      .values({
        internalName: body.internalName,
        publicLabel: body.publicLabel,
        address: body.address,
        pickupInstructions: body.pickupInstructions,
        contactDetails: body.contactDetails,
        active: body.active !== undefined ? body.active : true,
        sortOrder: body.sortOrder !== undefined ? body.sortOrder : 0,
        mapOrDirectionsLink: body.mapOrDirectionsLink,
        operationalNotesForStaff: body.operationalNotesForStaff,
        disabledPickupDays: body.disabledPickupDays ?? [],
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating pickup location:', error);
    return NextResponse.json(
      { error: 'Failed to create pickup location' },
      { status: 500 }
    );
  }
}
