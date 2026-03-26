import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { launches, launchProducts, pickupLocations, products } from '@/lib/db/schema';
import { eq, asc, desc, and, or, gte, gt } from 'drizzle-orm';
import { getByCategory } from '@/lib/db/queries/taxonomies';
import { getInventoryLevels, shopifyAdminFetch } from '@/lib/shopify/admin';

/**
 * GET /api/launches/current
 * Return all active launches whose order window is still open,
 * plus future launches that have allowEarlyOrdering enabled.
 * Enriches launch products with data from products.json.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();

    // Get active launches where:
    // 1. Order window is currently open (orderCloses in the future), OR
    // 2. Order window hasn't opened yet but allowEarlyOrdering is on and orderCloses is in the future
    const activeLaunches = await db
      .select()
      .from(launches)
      .where(
        and(
          eq(launches.status, 'active'),
          gte(launches.orderCloses, now),
        )
      )
      .orderBy(asc(launches.pickupDate));

    if (activeLaunches.length === 0) {
      return NextResponse.json([]);
    }

    // Load all products from Postgres for enrichment
    const allProducts = await db.select().from(products).orderBy(asc(products.name));
    const productMap = new Map<string, any>();
    for (const p of allProducts) {
      productMap.set(p.id, p);
      if ((p as any).slug) productMap.set((p as any).slug, p);
      if ((p as any).legacyId) productMap.set((p as any).legacyId, p);
    }

    // Load product category taxonomy for label resolution
    const categoryTaxonomy = await getByCategory('productCategories').catch(() => []);
    const categoryLabelMap = new Map<string, string>();
    for (const t of categoryTaxonomy) {
      categoryLabelMap.set(t.value, t.label);
    }

    // Fetch Shopify prices for linked products
    const shopifyPriceMap = new Map<string, number>(); // shopifyProductId → price in cents
    const shopifyProductIds = allProducts
      .filter((p) => p.shopifyProductId)
      .map((p) => p.shopifyProductId!);

    if (shopifyProductIds.length > 0) {
      try {
        const data = await shopifyAdminFetch(
          `query getProductPrices($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                variants(first: 1) {
                  edges {
                    node {
                      price
                    }
                  }
                }
              }
            }
          }`,
          { ids: shopifyProductIds },
        );
        for (const node of (data.nodes || [])) {
          if (!node?.id) continue;
          const priceStr = node.variants?.edges?.[0]?.node?.price;
          if (priceStr) {
            shopifyPriceMap.set(node.id, Math.round(parseFloat(priceStr) * 100));
          }
        }
      } catch (err) {
        console.error('[Launches] Failed to fetch Shopify prices:', err);
        // Fall back to CMS prices
      }
    }

    const results = [];

    for (const launch of activeLaunches) {
      const orderingOpen = new Date(launch.orderOpens) <= now;

      // Skip future menus that don't allow early ordering
      if (!orderingOpen && !launch.allowEarlyOrdering) continue;

      // Fetch linked products from launch_products (name stored directly)
      const linked = await db
        .select()
        .from(launchProducts)
        .where(eq(launchProducts.launchId, launch.id))
        .orderBy(asc(launchProducts.sortOrder));

      // Enrich with Postgres product data
      const enrichedProducts = linked.map((lp) => {
        const dbProduct = productMap.get(lp.productId);
        const catSlug = dbProduct?.category || null;
        return {
          id: lp.id,
          productId: lp.productId,
          productName: lp.productName || dbProduct?.name || dbProduct?.title || lp.productId,
          sortOrder: lp.sortOrder,
          minQuantityOverride: lp.minQuantityOverride,
          maxQuantityOverride: lp.maxQuantityOverride,
          quantityStepOverride: lp.quantityStepOverride,
          // Enriched from Postgres
          image: dbProduct?.image || null,
          // Use Shopify price if available, fall back to CMS price
          price: (dbProduct?.shopifyProductId && shopifyPriceMap.has(dbProduct.shopifyProductId))
            ? shopifyPriceMap.get(dbProduct.shopifyProductId)!
            : (dbProduct?.price || null),
          description: dbProduct?.description || null,
          category: catSlug,
          categoryLabel: catSlug ? (categoryLabelMap.get(catSlug) || catSlug) : null,
          slug: dbProduct?.slug || lp.productId,
          shopifyProductId: dbProduct?.shopifyProductId || null,
          shopifyProductHandle: dbProduct?.shopifyProductHandle || null,
          allergens: dbProduct?.allergens || [],
          serves: dbProduct?.serves || null,
          translations: dbProduct?.translations || null,
          variantType: dbProduct?.variantType || 'none',
          variants: dbProduct?.variants || [],
        };
      });

      // Fetch pickup location
      let pickupLocation = null;
      if (launch.pickupLocationId) {
        const [loc] = await db
          .select()
          .from(pickupLocations)
          .where(eq(pickupLocations.id, launch.pickupLocationId));
        pickupLocation = loc || null;
      }

      results.push({
        ...launch,
        orderingOpen,
        products: enrichedProducts,
        pickupLocation,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching current launches:', error);
    return NextResponse.json({ error: 'Failed to fetch current launches' }, { status: 500 });
  }
}
