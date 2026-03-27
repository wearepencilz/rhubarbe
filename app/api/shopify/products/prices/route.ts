import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminFetch } from '@/lib/shopify/admin';
import { isTaxOption } from '@/lib/tax/constants';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shopify/products/prices?ids=gid://shopify/Product/1,gid://shopify/Product/2
 * Returns Shopify prices for the given product IDs, excluding tax variants.
 * Response: { [shopifyProductId]: { price: number | null, range: [number, number] | null } }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({});
  }

  const ids = idsParam.split(',').filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({});
  }

  try {
    const data = await shopifyAdminFetch(
      `query getProductPrices($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            variants(first: 100) {
              edges {
                node {
                  id
                  price
                  selectedOptions { name value }
                }
              }
            }
          }
        }
      }`,
      { ids },
    );

    const result: Record<string, { price: number | null; range: [number, number] | null }> = {};

    for (const node of (data.nodes || [])) {
      if (!node?.id) continue;

      const allVariants = node.variants?.edges?.map((e: any) => e.node) || [];

      // Filter out tax-exempt variants
      const displayVariants = allVariants.filter((v: any) =>
        !v.selectedOptions?.some((o: any) => isTaxOption(o.name) && o.value === 'false')
      );

      if (displayVariants.length === 0) {
        result[node.id] = { price: null, range: null };
        continue;
      }

      const prices = displayVariants.map((v: any) => Math.round(parseFloat(v.price) * 100));
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      result[node.id] = {
        price: prices[0],
        range: min !== max ? [min, max] : null,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Shopify Prices] Error:', error);
    return NextResponse.json({});
  }
}
