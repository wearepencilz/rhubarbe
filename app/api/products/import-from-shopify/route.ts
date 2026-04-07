import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProduct } from '@/lib/shopify/admin';
import * as productQueries from '@/lib/db/queries/products';

/**
 * POST /api/products/import-from-shopify
 *
 * Creates a CMS product from an existing Shopify product.
 * Pulls title, handle, image, price, description, and variants from Shopify
 * and creates a linked CMS product record.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { shopifyProductId } = await request.json();

    if (!shopifyProductId) {
      return NextResponse.json({ error: 'shopifyProductId is required' }, { status: 400 });
    }

    // Check if a CMS product already exists with this Shopify ID
    const existing = await productQueries.findByShopifyId(shopifyProductId);
    if (existing) {
      return NextResponse.json(
        { error: 'A product linked to this Shopify product already exists', existingProductId: existing.id },
        { status: 409 },
      );
    }

    // Fetch product data from Shopify
    const shopifyProduct = await getProduct(shopifyProductId);
    if (!shopifyProduct) {
      return NextResponse.json({ error: 'Shopify product not found' }, { status: 404 });
    }

    // Extract price from Shopify (min variant price in cents)
    const minPrice = shopifyProduct.priceRangeV2?.minVariantPrice?.amount;
    const priceInCents = minPrice ? Math.round(parseFloat(minPrice) * 100) : 0;

    // Extract image
    const image = shopifyProduct.featuredImage?.url ?? null;

    // Map Shopify status to CMS status
    const statusMap: Record<string, string> = {
      ACTIVE: 'active',
      DRAFT: 'draft',
      ARCHIVED: 'archived',
    };
    const status = statusMap[shopifyProduct.status] ?? 'draft';

    // Create the CMS product
    const newProduct = await productQueries.create({
      name: shopifyProduct.title,
      slug: shopifyProduct.handle,
      title: shopifyProduct.title,
      status,
      description: null,
      shortCardCopy: null,
      image,
      price: priceInCents,
      currency: 'CAD',
      tags: [],
      shopifyProductId: shopifyProduct.id,
      shopifyProductHandle: shopifyProduct.handle,
      inventoryTracked: false,
      onlineOrderable: false,
      pickupOnly: false,
      keyNotes: [],
      tastingNotes: null,
      allergens: [],
      category: null,
      serves: null,
      variants: [],
      defaultMinQuantity: 1,
      defaultQuantityStep: 1,
      defaultMaxQuantity: null,
      defaultPickupRequired: false,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error importing product from Shopify:', error);
    return NextResponse.json(
      { error: 'Failed to import product from Shopify', details: error?.message },
      { status: 500 },
    );
  }
}
