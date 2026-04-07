import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products, cakeLeadTimeTiers, cakePricingGrid, cakeAddonLinks } from '@/lib/db/schema';
import { asc, sql, and, eq } from 'drizzle-orm';
import { shopifyFetch } from '@/lib/shopify/client';

/**
 * GET /api/storefront/cake-products
 *
 * Public endpoint — no auth required.
 * Returns cake-enabled products with lead time tiers, pricing data, flavour config,
 * tier details, pricing grid, and linked add-on products.
 *
 * Legacy products (cakeProductType = null) continue using Shopify variant pricing.
 * Grid-based products use the cake_pricing_grid table for pricing.
 * Products with no pricing data (no legacy tiers AND no grid rows) are excluded.
 */
export async function GET() {
  try {
    // Fetch products where cakeEnabled = true AND at least one lead time tier exists
    const cakeProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        image: products.image,
        price: products.price,
        shopifyProductId: products.shopifyProductId,
        cakeDescription: products.cakeDescription,
        cakeInstructions: products.cakeInstructions,
        cakeMinPeople: products.cakeMinPeople,
        shortCardCopy: products.shortCardCopy,
        allergens: products.allergens,
        cakeFlavourNotes: products.cakeFlavourNotes,
        cakeDeliveryAvailable: products.cakeDeliveryAvailable,
        serves: products.serves,
        cakeProductType: products.cakeProductType,
        cakeFlavourConfig: products.cakeFlavourConfig,
        cakeTierDetailConfig: products.cakeTierDetailConfig,
        cakeMaxFlavours: products.cakeMaxFlavours,
      })
      .from(products)
      .where(
        and(
          eq(products.cakeEnabled, true),
          sql`(SELECT count(*) FROM cake_lead_time_tiers WHERE cake_lead_time_tiers.product_id = ${products.id}) > 0`,
        ),
      )
      .orderBy(asc(products.name));

    const productIds = cakeProducts.map((p) => p.id);

    // Fetch lead time tiers from CMS
    const allTiers = productIds.length > 0
      ? await db
          .select({
            productId: cakeLeadTimeTiers.productId,
            minPeople: cakeLeadTimeTiers.minPeople,
            leadTimeDays: cakeLeadTimeTiers.leadTimeDays,
            deliveryOnly: cakeLeadTimeTiers.deliveryOnly,
          })
          .from(cakeLeadTimeTiers)
          .where(sql`${cakeLeadTimeTiers.productId} IN ${productIds}`)
          .orderBy(asc(cakeLeadTimeTiers.minPeople))
      : [];

    // Group tiers by productId
    const tiersByProduct = new Map<string, Array<{ minPeople: number; leadTimeDays: number; deliveryOnly: boolean }>>();
    for (const tier of allTiers) {
      const list = tiersByProduct.get(tier.productId) ?? [];
      list.push({ minPeople: tier.minPeople, leadTimeDays: tier.leadTimeDays, deliveryOnly: tier.deliveryOnly });
      tiersByProduct.set(tier.productId, list);
    }

    // Fetch pricing grid rows for all products in one batch
    const allGridRows = productIds.length > 0
      ? await db
          .select({
            productId: cakePricingGrid.productId,
            sizeValue: cakePricingGrid.sizeValue,
            flavourHandle: cakePricingGrid.flavourHandle,
            priceInCents: cakePricingGrid.priceInCents,
            shopifyVariantId: cakePricingGrid.shopifyVariantId,
          })
          .from(cakePricingGrid)
          .where(sql`${cakePricingGrid.productId} IN ${productIds}`)
          .orderBy(asc(cakePricingGrid.sizeValue), asc(cakePricingGrid.flavourHandle))
      : [];

    // Group grid rows by productId
    const gridByProduct = new Map<string, Array<{
      sizeValue: string;
      flavourHandle: string;
      priceInCents: number;
      shopifyVariantId: string | null;
    }>>();
    for (const row of allGridRows) {
      const list = gridByProduct.get(row.productId) ?? [];
      list.push({
        sizeValue: row.sizeValue,
        flavourHandle: row.flavourHandle,
        priceInCents: row.priceInCents,
        shopifyVariantId: row.shopifyVariantId,
      });
      gridByProduct.set(row.productId, list);
    }

    // Fetch addon links for all products in one batch
    const allAddonLinks = productIds.length > 0
      ? await db
          .select({
            parentProductId: cakeAddonLinks.parentProductId,
            addonProductId: cakeAddonLinks.addonProductId,
            sortOrder: cakeAddonLinks.sortOrder,
          })
          .from(cakeAddonLinks)
          .where(sql`${cakeAddonLinks.parentProductId} IN ${productIds}`)
          .orderBy(asc(cakeAddonLinks.sortOrder))
      : [];

    // Group addon links by parentProductId
    const addonLinksByProduct = new Map<string, Array<{ addonProductId: string; sortOrder: number }>>();
    for (const link of allAddonLinks) {
      const list = addonLinksByProduct.get(link.parentProductId) ?? [];
      list.push({ addonProductId: link.addonProductId, sortOrder: link.sortOrder });
      addonLinksByProduct.set(link.parentProductId, list);
    }

    // Collect all unique addon product IDs to fetch their data
    const addonIdSet = new Set<string>();
    for (const link of allAddonLinks) addonIdSet.add(link.addonProductId);
    const allAddonProductIds = Array.from(addonIdSet);

    // Fetch addon product data
    const addonProducts = allAddonProductIds.length > 0
      ? await db
          .select({
            id: products.id,
            name: products.name,
            image: products.image,
            cakeDescription: products.cakeDescription,
          })
          .from(products)
          .where(sql`${products.id} IN ${allAddonProductIds}`)
      : [];

    const addonProductMap = new Map<string, { id: string; name: string; image: string | null; cakeDescription: { en: string; fr: string } | null }>(
      addonProducts.map((p) => [p.id, p]),
    );

    // Fetch pricing grid rows for addon products
    const addonGridRows = allAddonProductIds.length > 0
      ? await db
          .select({
            productId: cakePricingGrid.productId,
            sizeValue: cakePricingGrid.sizeValue,
            flavourHandle: cakePricingGrid.flavourHandle,
            priceInCents: cakePricingGrid.priceInCents,
            shopifyVariantId: cakePricingGrid.shopifyVariantId,
          })
          .from(cakePricingGrid)
          .where(sql`${cakePricingGrid.productId} IN ${allAddonProductIds}`)
          .orderBy(asc(cakePricingGrid.sizeValue), asc(cakePricingGrid.flavourHandle))
      : [];

    // Group addon grid rows by productId
    const addonGridByProduct = new Map<string, Array<{
      sizeValue: string;
      flavourHandle: string;
      priceInCents: number;
      shopifyVariantId: string | null;
    }>>();
    for (const row of addonGridRows) {
      const list = addonGridByProduct.get(row.productId) ?? [];
      list.push({
        sizeValue: row.sizeValue,
        flavourHandle: row.flavourHandle,
        priceInCents: row.priceInCents,
        shopifyVariantId: row.shopifyVariantId,
      });
      addonGridByProduct.set(row.productId, list);
    }

    // Fetch Shopify variant pricing for legacy products (cakeProductType = null)
    const legacyProducts = cakeProducts.filter((p) => !p.cakeProductType && p.shopifyProductId);
    const shopifyIds = legacyProducts.map((p) => p.shopifyProductId!);

    const shopifyVariantsByProductGid = new Map<string, Array<{
      shopifyVariantId: string;
      minPeople: number;
      priceInCents: number;
    }>>();

    if (shopifyIds.length > 0) {
      try {
        const query = `
          query getProductVariants($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      selectedOptions {
                        name
                        value
                      }
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        `;
        const response = await shopifyFetch<any>({
          query,
          variables: { ids: shopifyIds },
          cache: 'no-store',
        });

        const nodes = response.data?.nodes ?? [];
        for (const node of nodes) {
          if (!node?.id || !node?.variants) continue;
          const variants: Array<{ shopifyVariantId: string; minPeople: number; priceInCents: number }> = [];
          for (const edge of node.variants.edges) {
            const v = edge.node;
            // Try to find a numeric people count from:
            // 1. A "Serves" or "Portions" option
            // 2. The variant title itself (e.g. "30")
            let peopleCount = NaN;
            const servesOption = v.selectedOptions?.find(
              (o: any) => /^(serves|portions|personnes)$/i.test(o.name.trim()),
            );
            if (servesOption) {
              peopleCount = parseInt(servesOption.value);
            }
            // Fallback: try parsing the variant title as a number
            if (isNaN(peopleCount) && v.title) {
              peopleCount = parseInt(v.title);
            }
            if (!isNaN(peopleCount) && v.price?.amount) {
              variants.push({
                shopifyVariantId: v.id,
                minPeople: peopleCount,
                priceInCents: Math.round(parseFloat(v.price.amount) * 100),
              });
            }
          }
          variants.sort((a, b) => a.minPeople - b.minPeople);
          shopifyVariantsByProductGid.set(node.id, variants);
        }
      } catch (err) {
        console.error('Error fetching Shopify variants for cake products:', err);
        // Continue without pricing — products will still show but without prices
      }
    }

    // Assemble the response
    const result = cakeProducts
      .map((p) => {
        const isLegacy = !p.cakeProductType;
        const pricingGrid = gridByProduct.get(p.id) ?? [];

        // Legacy products get Shopify variant pricing; grid-based products use the grid
        const pricingTiers = isLegacy && p.shopifyProductId
          ? (shopifyVariantsByProductGid.get(p.shopifyProductId) ?? [])
          : [];

        // Filter active flavour config entries and sort by sortOrder
        const cakeFlavourConfig = (p.cakeFlavourConfig ?? [])
          .filter((f) => f.active)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        // Resolve addon products with their pricing data
        const addonLinks = addonLinksByProduct.get(p.id) ?? [];
        const addons = addonLinks
          .map((link) => {
            const addonProduct = addonProductMap.get(link.addonProductId);
            if (!addonProduct) return null;
            return {
              id: addonProduct.id,
              name: addonProduct.name,
              image: addonProduct.image ?? null,
              cakeDescription: addonProduct.cakeDescription ?? { en: '', fr: '' },
              pricingGrid: addonGridByProduct.get(addonProduct.id) ?? [],
            };
          })
          .filter((a): a is NonNullable<typeof a> => a !== null);

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.image ?? null,
          price: p.price ?? null,
          shopifyProductId: p.shopifyProductId ?? null,
          cakeDescription: p.cakeDescription ?? { en: '', fr: '' },
          cakeInstructions: p.cakeInstructions ?? { en: '', fr: '' },
          cakeMinPeople: p.cakeMinPeople ?? 1,
          shortCardCopy: p.shortCardCopy ?? null,
          allergens: p.allergens ?? [],
          cakeFlavourNotes: p.cakeFlavourNotes ?? null,
          cakeDeliveryAvailable: p.cakeDeliveryAvailable ?? true,
          serves: p.serves ?? null,
          leadTimeTiers: tiersByProduct.get(p.id) ?? [],
          pricingTiers,
          cakeProductType: p.cakeProductType ?? null,
          cakeFlavourConfig,
          cakeTierDetailConfig: p.cakeTierDetailConfig ?? [],
          cakeMaxFlavours: p.cakeMaxFlavours ?? null,
          pricingGrid,
          addons,
        };
      })
      // Exclude products with no pricing data (no legacy tiers AND no grid rows)
      .filter((p) => p.pricingTiers.length > 0 || p.pricingGrid.length > 0);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching storefront cake products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cake products' },
      { status: 500 },
    );
  }
}
