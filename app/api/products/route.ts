import { NextRequest, NextResponse } from 'next/server';
import * as productQueries from '@/lib/db/queries/products';
import { availabilityCache } from '@/lib/cache/availability-cache';

const PRODUCT_LIST_TTL = 120; // 120 seconds

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const formatId = searchParams.get('formatId') || undefined;
    const onlineOrderableParam = searchParams.get('onlineOrderable');
    const onlineOrderable =
      onlineOrderableParam === 'true' ? true : onlineOrderableParam === 'false' ? false : undefined;

    // Build cache key from filters
    const cacheKey = `products:orderable:${status || 'all'}:${formatId || 'all'}:${onlineOrderableParam || 'all'}`;

    // Check cache
    const cached = availabilityCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const products = await productQueries.list({ status, formatId, onlineOrderable });

    // Cache the result
    availabilityCache.set(cacheKey, products, PRODUCT_LIST_TTL);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title && !body.name) {
      return NextResponse.json({ error: 'Title or name is required' }, { status: 400 });
    }

    const newProduct = await productQueries.create({
      name: body.name || body.title,
      slug: body.slug || `product-${Date.now()}`,
      title: body.title || body.name,
      status: body.status || 'draft',
      description: body.description ?? null,
      shortCardCopy: body.shortCardCopy ?? null,
      image: body.image ?? null,
      price: body.price || 0,
      currency: body.currency || 'CAD',
      tags: body.tags || [],
      shopifyProductId: body.shopifyProductId ?? null,
      shopifyProductHandle: body.shopifyProductHandle ?? null,
      inventoryTracked: body.inventoryTracked || false,
      onlineOrderable: body.onlineOrderable || false,
      pickupOnly: body.pickupOnly || false,
      keyNotes: body.keyNotes || [],
      allergens: body.allergens || [],
      category: body.category ?? null,
      serves: body.serves ?? null,
      variants: body.variants || [],
      availabilityMode: body.availabilityMode ?? undefined,
      defaultMinQuantity: body.defaultMinQuantity ?? 1,
      defaultQuantityStep: body.defaultQuantityStep ?? 1,
      defaultMaxQuantity: body.defaultMaxQuantity ?? null,
      defaultPickupRequired: body.defaultPickupRequired ?? false,
      dateSelectionType: body.dateSelectionType ?? undefined,
      slotSelectionType: body.slotSelectionType ?? undefined,
    });

    // If ingredients were provided, link them
    if (body.ingredients && Array.isArray(body.ingredients) && body.ingredients.length > 0) {
      await productQueries.setProductIngredients(
        newProduct.id,
        body.ingredients.map((ing: any, idx: number) => ({
          ingredientId: ing.ingredientId || ing.id,
          displayOrder: ing.displayOrder ?? idx,
          quantity: ing.quantity ?? null,
          notes: ing.notes ?? null,
        })),
      );
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    const msg = error?.message || 'Unknown error';
    const cause = error?.cause?.message || error?.cause || '';
    const code = error?.code || '';
    return NextResponse.json({ error: 'Failed to create product', details: msg, cause: String(cause), code }, { status: 500 });
  }
}
