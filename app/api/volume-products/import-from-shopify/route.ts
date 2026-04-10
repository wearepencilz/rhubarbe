import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProduct } from '@/lib/shopify/admin';
import * as productQueries from '@/lib/db/queries/products';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { shopifyProductId, cateringType } = await request.json();
    if (!shopifyProductId) return NextResponse.json({ error: 'shopifyProductId is required' }, { status: 400 });

    const existing = await productQueries.findByShopifyId(shopifyProductId);
    if (existing) return NextResponse.json({ error: 'Already exists', existingProductId: existing.id }, { status: 409 });

    const shopifyProduct = await getProduct(shopifyProductId);
    if (!shopifyProduct) return NextResponse.json({ error: 'Shopify product not found' }, { status: 404 });

    const minPrice = shopifyProduct.priceRangeV2?.minVariantPrice?.amount;
    const statusMap: Record<string, string> = { ACTIVE: 'active', DRAFT: 'draft', ARCHIVED: 'archived' };

    const newProduct = await productQueries.create({
      name: shopifyProduct.title,
      slug: shopifyProduct.handle,
      title: shopifyProduct.title,
      status: statusMap[shopifyProduct.status] ?? 'draft',
      image: shopifyProduct.featuredImage?.url ?? null,
      price: minPrice ? Math.round(parseFloat(minPrice) * 100) : 0,
      currency: 'CAD',
      shopifyProductId: shopifyProduct.id,
      shopifyProductHandle: shopifyProduct.handle,
      volumeEnabled: true,
      cateringType: cateringType || null,
      allergens: [],
      tags: [],
      keyNotes: [],
      variants: [],
      defaultMinQuantity: 1,
      defaultQuantityStep: 1,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error importing catering product from Shopify:', error);
    return NextResponse.json({ error: 'Failed to import', details: error?.message }, { status: 500 });
  }
}
