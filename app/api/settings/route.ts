import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as settingsQueries from '@/lib/db/queries/settings';
import { db } from '@/lib/db/client';
import { pickupLocations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await settingsQueries.getAll() as any;
    const result = Object.keys(data).length > 0 ? { ...data } : { logo: '', email: '', companyName: '' };

    // Enrich with pickup location's closed days
    const locationId = data.cateringPickupLocationId;
    if (locationId) {
      const [loc] = await db.select({ disabledPickupDays: pickupLocations.disabledPickupDays })
        .from(pickupLocations).where(eq(pickupLocations.id, locationId)).limit(1);
      if (loc?.disabledPickupDays) result.closedPickupDays = loc.disabledPickupDays;
    }
    if (!result.closedPickupDays) result.closedPickupDays = [0]; // default Sunday

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    });
  } catch (error) {
    return NextResponse.json({ logo: '', email: '', companyName: '' });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Never allow taxonomies to be overwritten via the settings route.
    // Taxonomies live in their own table and are managed via /api/settings/taxonomies.
    const { taxonomies: _dropped, ...safeBody } = body;
    await settingsQueries.upsertMany(safeBody);
    // Return the full merged settings
    const updated = await settingsQueries.getAll();
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
