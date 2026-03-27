import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as cakeProductQueries from '@/lib/db/queries/cake-products';

// GET /api/cake-products - List all cake-enabled products
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
      const products = await cakeProductQueries.listNonCakeProducts();
      return NextResponse.json(products);
    }
    const products = await cakeProductQueries.listCakeProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching cake products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cake products', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

// POST /api/cake-products - Enable cake ordering on a product
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

    const updated = await cakeProductQueries.updateCakeConfig(productId, {
      cakeEnabled: true,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    console.error('Error enabling cake product:', error);
    return NextResponse.json(
      { error: 'Failed to enable cake ordering', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
