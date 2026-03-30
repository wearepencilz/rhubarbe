import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { launches, launchProducts } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * GET /api/launches
 * List launches with optional status filter, sorted by pickup_date desc.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    const conditions = [];
    if (statusParam) {
      conditions.push(eq(launches.status, statusParam as 'draft' | 'active' | 'archived'));
    }

    const rows = await db
      .select({
        id: launches.id,
        title: launches.title,
        status: launches.status,
        orderOpens: launches.orderOpens,
        orderCloses: launches.orderCloses,
        pickupDate: launches.pickupDate,
        pickupWindowStart: launches.pickupWindowStart,
        pickupWindowEnd: launches.pickupWindowEnd,
        pickupLocationId: launches.pickupLocationId,
        createdAt: launches.createdAt,
        updatedAt: launches.updatedAt,
        productCount: sql<number>`(SELECT count(*)::int FROM launch_products WHERE launch_id = launches.id)`.as('product_count'),
      })
      .from(launches)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(launches.pickupDate));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching launches:', error);
    return NextResponse.json({ error: 'Failed to fetch launches' }, { status: 500 });
  }
}

function validateBilingual(value: any, fieldName: string): string | null {
  if (!value || typeof value !== 'object') return `${fieldName} is required`;
  if (!value.en || typeof value.en !== 'string') return `${fieldName}.en is required`;
  if (!value.fr || typeof value.fr !== 'string') return `${fieldName}.fr is required`;
  return null;
}

/**
 * POST /api/launches
 * Create a new launch.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const titleErr = validateBilingual(body.title, 'title');
    if (titleErr) return NextResponse.json({ error: titleErr }, { status: 400 });

    const introErr = validateBilingual(body.introCopy, 'introCopy');
    if (introErr) return NextResponse.json({ error: introErr }, { status: 400 });

    if (!body.orderOpens) return NextResponse.json({ error: 'orderOpens is required' }, { status: 400 });
    if (!body.orderCloses) return NextResponse.json({ error: 'orderCloses is required' }, { status: 400 });
    if (!body.pickupDate) return NextResponse.json({ error: 'pickupDate is required' }, { status: 400 });

    // Validate order closes before pickup date
    const closes = new Date(body.orderCloses);
    // For date-only fields, anchor at noon to avoid timezone day-shift
    const pickupRaw = body.pickupDate.length === 10 ? body.pickupDate + 'T12:00:00' : body.pickupDate;
    const pickup = new Date(pickupRaw);
    if (closes >= pickup) {
      return NextResponse.json({ error: 'orderCloses must be before pickupDate' }, { status: 400 });
    }

    const [created] = await db
      .insert(launches)
      .values({
        title: body.title,
        introCopy: body.introCopy,
        status: body.status ?? 'draft',
        orderOpens: new Date(body.orderOpens),
        orderCloses: closes,
        allowEarlyOrdering: body.allowEarlyOrdering ?? false,
        pickupDate: pickup,
        pickupLocationId: body.pickupLocationId || null,
        pickupInstructions: body.pickupInstructions || null,
        pickupSlotConfig: body.pickupSlotConfig || null,
        pickupSlots: body.pickupSlots ?? [],
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating launch:', error);
    const message = error instanceof Error ? error.message : 'Failed to create launch';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
