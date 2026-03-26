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

// POST /api/volume-products - Enable volume ordering on a product
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  try {
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const updated = await volumeProductQueries.updateVolumeConfig(productId, {
      volumeEnabled: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    console.error('Error enabling volume product:', error);
    return NextResponse.json(
      { error: 'Failed to enable volume ordering', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
