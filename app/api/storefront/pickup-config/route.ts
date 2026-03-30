import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { pickupLocations, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/storefront/pickup-config?orderType=volume|cake
 *
 * Public endpoint — no auth required.
 * Returns the pickup location and disabled pickup days for the given order type.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderType = searchParams.get('orderType');

  if (!orderType || !['volume', 'cake'].includes(orderType)) {
    return NextResponse.json({ disabledPickupDays: [] });
  }

  try {
    const settingKey = orderType === 'volume' ? 'cateringPickupLocationId' : 'cakePickupLocationId';
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, settingKey));

    if (!setting?.value) {
      return NextResponse.json({ disabledPickupDays: [], pickupLocationId: null });
    }

    const locationId = setting.value as string;
    const [location] = await db
      .select({
        id: pickupLocations.id,
        publicLabel: pickupLocations.publicLabel,
        address: pickupLocations.address,
        pickupInstructions: pickupLocations.pickupInstructions,
        disabledPickupDays: pickupLocations.disabledPickupDays,
      })
      .from(pickupLocations)
      .where(eq(pickupLocations.id, locationId));

    if (!location) {
      return NextResponse.json({ disabledPickupDays: [], pickupLocationId: null });
    }

    return NextResponse.json({
      pickupLocationId: location.id,
      publicLabel: location.publicLabel,
      address: location.address,
      pickupInstructions: location.pickupInstructions,
      disabledPickupDays: location.disabledPickupDays ?? [],
    });
  } catch (error) {
    console.error('Error fetching pickup config:', error);
    return NextResponse.json({ disabledPickupDays: [] });
  }
}
