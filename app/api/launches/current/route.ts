import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { launches, launchProducts, pickupLocations, products } from '@/lib/db/schema';
import { eq, asc, desc, and, gte } from 'drizzle-orm';
import { getByCategory } from '@/lib/db/queries/taxonomies';

/**
 * GET /api/launches/current
 * Return all active launches whose order window is still open.
 * Enriches launch products with data from products.json.
 */
export async function GET() {
  try {
    const now = new Date();

    // Get all active launches where orderCloses is in the future
    const activeLaunches = await db
      .select()
      .from(launches)
      .where(and(eq(launches.status, 'active'), gte(launches.orderCloses, now)))
      .orderBy(asc(launches.pickupDate));

    if (activeLaunches.length === 0) {
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      });
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

    const results = [];

    for (const launch of activeLaunches) {
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
          price: dbProduct?.price || null,
          description: dbProduct?.description || null,
          category: catSlug,
          categoryLabel: catSlug ? (categoryLabelMap.get(catSlug) || catSlug) : null,
          slug: dbProduct?.slug || lp.productId,
          shopifyProductId: dbProduct?.shopifyProductId || null,
          shopifyProductHandle: dbProduct?.shopifyProductHandle || null,
          allergens: dbProduct?.allergens || [],
          serves: dbProduct?.serves || null,
          translations: dbProduct?.translations || null,
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
        products: enrichedProducts,
        pickupLocation,
      });
    }

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('Error fetching current launches:', error);
    return NextResponse.json({ error: 'Failed to fetch current launches' }, { status: 500 });
  }
}
