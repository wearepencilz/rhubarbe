import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminFetch } from '@/lib/shopify/admin';

/**
 * GET /api/shopify/products/[id]/variants
 * Fetch all variants for a Shopify product, including taxable status.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // The ID comes URL-encoded, e.g. "gid%3A%2F%2Fshopify%2FProduct%2F123"
    const shopifyProductId = decodeURIComponent(params.id);

    // Ensure it's a valid Shopify GID
    const gid = shopifyProductId.startsWith('gid://')
      ? shopifyProductId
      : `gid://shopify/Product/${shopifyProductId}`;

    console.log('[Shopify Variants] Fetching for GID:', gid);

    const data = await shopifyAdminFetch(
      `query getProductVariants($id: ID!) {
        product(id: $id) {
          variants(first: 100) {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                taxable
                selectedOptions { name value }
              }
            }
          }
        }
      }`,
      { id: gid },
    );

    if (!data.product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const variants = data.product.variants.edges.map((e: any) => e.node);

    return NextResponse.json({ variants });
  } catch (error) {
    console.error('[Shopify] Failed to fetch variants:', error);
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
  }
}
