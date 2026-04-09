import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProduct } from '@/lib/shopify/admin';
import * as productQueries from '@/lib/db/queries/products';

/**
 * GET /api/products/[id]/sync-shopify-status
 *
 * Fetches current status and image from Shopify and updates the CMS product.
 * Returns the synced fields.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const product = await productQueries.getById(params.id);
    if (!product || !product.shopifyProductId) {
      return NextResponse.json({ error: 'Not linked to Shopify' }, { status: 404 });
    }

    const shopifyProduct = await getProduct(product.shopifyProductId);
    if (!shopifyProduct) {
      return NextResponse.json({ error: 'Shopify product not found' }, { status: 404 });
    }

    const statusMap: Record<string, string> = { ACTIVE: 'active', DRAFT: 'draft', ARCHIVED: 'archived' };
    const status = statusMap[shopifyProduct.status] ?? product.status;
    const image = shopifyProduct.featuredImage?.url ?? product.image;
    const name = shopifyProduct.title ?? product.name;
    const slug = shopifyProduct.handle ?? product.slug;

    // Update CMS if changed
    const updates: Record<string, any> = {};
    if (status !== product.status) updates.status = status;
    if (image !== product.image) updates.image = image;
    if (name !== product.name) updates.name = name;
    if (slug !== product.slug) updates.slug = slug;
    if (Object.keys(updates).length > 0) {
      await productQueries.update(params.id, updates);
    }

    return NextResponse.json({ status, image, name, slug });
  } catch (error: any) {
    console.error('Error syncing Shopify status:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
