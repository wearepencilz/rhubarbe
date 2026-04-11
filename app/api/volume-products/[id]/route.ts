import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as volumeProductQueries from '@/lib/db/queries/volume-products';

// GET /api/volume-products/[id] - Get a single volume product with tiers and variants
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  try {
    const product = await volumeProductQueries.getVolumeProductById(params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Volume product not found', timestamp: new Date().toISOString() },
        { status: 404 },
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching volume product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume product', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

// PUT /api/volume-products/[id] - Update volume config, tiers, and variants
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    // Check product exists
    const existing = await volumeProductQueries.getVolumeProductById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Volume product not found', timestamp: new Date().toISOString() },
        { status: 404 },
      );
    }

    // Update volume config fields
    const configFields: Record<string, unknown> = {};

    const passthrough = [
      'volumeEnabled', 'volumeDescription', 'volumeInstructions',
      'volumeMinOrderQuantity', 'volumeUnitLabel', 'maxAdvanceDays',
      'cateringType', 'cateringDescription', 'cateringFlavourName',
      'allergens', 'dietaryTags', 'temperatureTags', 'servesPerUnit',
      'orderMinimum', 'orderScope', 'variantMinimum', 'increment',
    ] as const;

    for (const key of passthrough) {
      if (body[key] !== undefined) configFields[key] = body[key];
    }
    if (body.cateringEndDate !== undefined) {
      configFields.cateringEndDate = body.cateringEndDate ? new Date(body.cateringEndDate) : null;
    }

    if (Object.keys(configFields).length > 0) {
      await volumeProductQueries.updateVolumeConfig(params.id, configFields);
    }

    // Update lead time tiers if provided
    if (body.leadTimeTiers !== undefined) {
      try {
        await volumeProductQueries.setLeadTimeTiers(params.id, body.leadTimeTiers);
      } catch (err: any) {
        return NextResponse.json(
          {
            error: 'Invalid lead time tier configuration',
            details: err.message,
            timestamp: new Date().toISOString(),
          },
          { status: 400 },
        );
      }
    }

    // Update volume variants if provided
    if (body.volumeVariants !== undefined) {
      await volumeProductQueries.setVolumeVariants(params.id, body.volumeVariants);
    }

    // Return the updated product with tiers and variants
    const updated = await volumeProductQueries.getVolumeProductById(params.id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating volume product:', error);
    return NextResponse.json(
      { error: 'Failed to update volume product', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
