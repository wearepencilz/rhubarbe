import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products, cakeLeadTimeTiers, cakeAddonLinks } from '@/lib/db/schema';
import { asc, sql, and, eq } from 'drizzle-orm';
import { shopifyFetch } from '@/lib/shopify/client';

/**
 * Slugify a string for matching against CMS flavour handles.
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract the first numeric value from a string (e.g., "30 guests" → "30").
 */
function extractNumeric(str: string): string {
  const match = str.match(/\d+/);
  return match ? match[0] : '';
}

/**
 * Build a pricing grid from Shopify variants.
 * For two-option products: maps (Option1Value, slugified Option2Value) → price + variantId
 * For single-option products: maps (Option1Value, "default") → price + variantId
 */
function buildPricingGridFromShopifyVariants(
  variants: Array<{
    id: string;
    selectedOptions: Array<{ name: string; value: string }>;
    price: { amount: string };
  }>,
): Array<{ sizeValue: string; flavourHandle: string; priceInCents: number; shopifyVariantId: string }> {
  const grid: Array<{ sizeValue: string; flavourHandle: string; priceInCents: number; shopifyVariantId: string }> = [];

  for (const v of variants) {
    const opt1 = v.selectedOptions?.[0]?.value ?? '';
    const opt2 = v.selectedOptions?.[1]?.value ?? '';
    const sizeValue = extractNumeric(opt1) || opt1;
    const flavourHandle = opt2 ? slugify(opt2) : 'default';
    const priceInCents = Math.round(parseFloat(v.price?.amount ?? '0') * 100);

    grid.push({ sizeValue, flavourHandle, priceInCents, shopifyVariantId: v.id });
  }

  return grid;
}

/**
 * GET /api/storefront/cake-products
 *
 * Public endpoint — no auth required.
 * Returns cake-enabled products with lead time tiers, Shopify-sourced pricing,
 * flavour config, tier details, and linked add-on products.
 *
 * ALL pricing comes from Shopify variants at runtime — no CMS pricing grid needed.
 * The CMS provides: product type, flavour config (descriptions), tier details,
 * lead time tiers, add-on links, and other metadata.
 */
export async function GET() {
  try {
    // Fetch cake-enabled products with at least one lead time tier
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
        cakeMaxPeople: products.cakeMaxPeople,
        shortCardCopy: products.shortCardCopy,
        allergens: products.allergens,
        cakeFlavourNotes: products.cakeFlavourNotes,
        cakeDeliveryAvailable: products.cakeDeliveryAvailable,
        serves: products.serves,
        cakeProductType: products.cakeProductType,
        cakeFlavourConfig: products.cakeFlavourConfig,
        cakeTierDetailConfig: products.cakeTierDetailConfig,
        cakeMaxFlavours: products.cakeMaxFlavours,
        maxAdvanceDays: products.maxAdvanceDays,
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

    // ── Lead time tiers (from CMS) ──
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

    const tiersByProduct = new Map<string, Array<{ minPeople: number; leadTimeDays: number; deliveryOnly: boolean }>>();
    for (const tier of allTiers) {
      const list = tiersByProduct.get(tier.productId) ?? [];
      list.push({ minPeople: tier.minPeople, leadTimeDays: tier.leadTimeDays, deliveryOnly: tier.deliveryOnly });
      tiersByProduct.set(tier.productId, list);
    }

    // ── Add-on links (from CMS) ──
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

    const addonLinksByProduct = new Map<string, Array<{ addonProductId: string; sortOrder: number }>>();
    for (const link of allAddonLinks) {
      const list = addonLinksByProduct.get(link.parentProductId) ?? [];
      list.push({ addonProductId: link.addonProductId, sortOrder: link.sortOrder });
      addonLinksByProduct.set(link.parentProductId, list);
    }

    // Collect addon product IDs
    const addonIdSet = new Set<string>();
    for (const link of allAddonLinks) addonIdSet.add(link.addonProductId);
    const allAddonProductIds = Array.from(addonIdSet);

    // Fetch addon product CMS data
    const addonProducts = allAddonProductIds.length > 0
      ? await db
          .select({
            id: products.id,
            name: products.name,
            title: products.title,
            image: products.image,
            shopifyProductId: products.shopifyProductId,
            cakeDescription: products.cakeDescription,
            translations: products.translations,
          })
          .from(products)
          .where(sql`${products.id} IN ${allAddonProductIds}`)
      : [];

    const addonProductMap = new Map(addonProducts.map((p) => [p.id, p]));

    // ── Fetch ALL pricing from Shopify variants ──
    // Collect all Shopify product IDs (main products + addons)
    const allShopifyIds = [
      ...cakeProducts.filter((p) => p.shopifyProductId).map((p) => p.shopifyProductId!),
      ...addonProducts.filter((p) => p.shopifyProductId).map((p) => p.shopifyProductId!),
    ];
    const uniqueShopifyIds = [...new Set(allShopifyIds)];

    // Map: shopifyProductId → parsed variant data
    const shopifyVariantsByGid = new Map<string, Array<{
      id: string;
      selectedOptions: Array<{ name: string; value: string }>;
      price: { amount: string };
    }>>();

    if (uniqueShopifyIds.length > 0) {
      try {
        const query = `
          query getProductVariants($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                variants(first: 250) {
                  edges {
                    node {
                      id
                      title
                      selectedOptions { name value }
                      price { amount currencyCode }
                    }
                  }
                }
              }
            }
          }
        `;
        const response = await shopifyFetch<any>({
          query,
          variables: { ids: uniqueShopifyIds },
          cache: 'no-store',
        });

        for (const node of (response.data?.nodes ?? [])) {
          if (!node?.id || !node?.variants) continue;
          const variants = node.variants.edges.map((e: any) => e.node);
          shopifyVariantsByGid.set(node.id, variants);
        }
      } catch (err) {
        console.error('Error fetching Shopify variants:', err);
      }
    }

    // Helper: build pricing data for a product from its Shopify variants
    function getPricingForProduct(shopifyProductId: string | null, isLegacy: boolean) {
      if (!shopifyProductId) return { pricingTiers: [], pricingGrid: [] };
      const variants = shopifyVariantsByGid.get(shopifyProductId) ?? [];
      if (variants.length === 0) return { pricingTiers: [], pricingGrid: [] };

      if (isLegacy) {
        // Legacy: single-axis (people → price)
        const tiers: Array<{ shopifyVariantId: string; minPeople: number; priceInCents: number }> = [];
        for (const v of variants) {
          let peopleCount = NaN;
          const servesOpt = v.selectedOptions?.find(
            (o: any) => /^(serves|portions|personnes|guests|people)$/i.test(o.name.trim()),
          );
          if (servesOpt) peopleCount = parseInt(servesOpt.value);
          if (isNaN(peopleCount) && v.selectedOptions?.[0]) {
            peopleCount = parseInt(extractNumeric(v.selectedOptions[0].value));
          }
          if (!isNaN(peopleCount) && v.price?.amount) {
            tiers.push({
              shopifyVariantId: v.id,
              minPeople: peopleCount,
              priceInCents: Math.round(parseFloat(v.price.amount) * 100),
            });
          }
        }
        tiers.sort((a, b) => a.minPeople - b.minPeople);
        return { pricingTiers: tiers, pricingGrid: [] };
      }

      // Grid-based: build from variant options
      return { pricingTiers: [], pricingGrid: buildPricingGridFromShopifyVariants(variants) };
    }

    // ── Assemble response ──
    const result = cakeProducts
      .map((p) => {
        const isLegacy = !p.cakeProductType;
        const { pricingTiers, pricingGrid } = getPricingForProduct(p.shopifyProductId, isLegacy);

        const cakeFlavourConfig = (p.cakeFlavourConfig ?? [])
          .filter((f) => f.active)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        // Resolve addon products with Shopify-sourced pricing
        const addonLinks = addonLinksByProduct.get(p.id) ?? [];
        const addons = addonLinks
          .map((link) => {
            const addonProduct = addonProductMap.get(link.addonProductId);
            if (!addonProduct) return null;
            const addonPricing = getPricingForProduct(addonProduct.shopifyProductId, false);
            const trans = (addonProduct.translations ?? {}) as Record<string, Record<string, string>>;
            const titleEn = addonProduct.title || addonProduct.name;
            const titleFr = trans?.fr?.title || titleEn;
            return {
              id: addonProduct.id,
              name: addonProduct.name,
              title: { en: titleEn, fr: titleFr },
              image: addonProduct.image ?? null,
              cakeDescription: addonProduct.cakeDescription ?? { en: '', fr: '' },
              pricingGrid: addonPricing.pricingGrid,
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
          cakeMaxPeople: p.cakeMaxPeople ?? null,
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
          maxAdvanceDays: p.maxAdvanceDays ?? null,
          pricingGrid,
          addons,
        };
      })
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
