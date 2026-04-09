import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as volumeProductQueries from '@/lib/db/queries/volume-products';

// GET /api/volume-products - List all volume-enabled products
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const candidates = searchParams.get('candidates');

  try {
    if (candidates === 'true') {
      const products = await volumeProductQueries.listNonVolumeProducts();
      return NextResponse.json(products);
    }
    const products = await volumeProductQueries.listVolumeProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching volume products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume products', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

// POST /api/volume-products - Create a catering product directly or enable volume on existing
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    // Direct creation mode: name + slug + cateringType provided
    if (body.name && body.slug && body.cateringType) {
      const product = await volumeProductQueries.createCateringProduct({
        name: body.name,
        slug: body.slug,
        cateringType: body.cateringType,
        cateringDescription: body.cateringDescription ?? null,
        cateringFlavourName: body.cateringFlavourName ?? null,
        cateringEndDate: body.cateringEndDate ? new Date(body.cateringEndDate) : null,
        allergens: body.allergens ?? null,
        dietaryTags: body.dietaryTags ?? null,
        temperatureTags: body.temperatureTags ?? null,
      });
      return NextResponse.json(product, { status: 201 });
    }

    // Legacy mode: enable volume on existing product
    const { productId } = body;
    if (!productId) {
      return NextResponse.json({ error: 'productId is required (or provide name + slug + cateringType for direct creation)' }, { status: 400 });
    }

    const updated = await volumeProductQueries.updateVolumeConfig(productId, {
      volumeEnabled: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    console.error('Error creating/enabling volume product:', error);
    return NextResponse.json(
      { error: 'Failed to create/enable volume product', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
