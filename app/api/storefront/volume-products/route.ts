import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { shopifyFetch } from '@/lib/shopify/client';
import { isTaxOption } from '@/lib/tax/constants';
import * as settingsQueries from '@/lib/db/queries/settings';

/**
 * GET /api/storefront/volume-products
 *
 * Public endpoint — no auth required.
 * Returns volume-enabled products with lead time tiers.
 * Variants are fetched from Shopify (source of truth) when the CMS variants
 * JSONB is empty. Tax-only duplicate variants are filtered out.
 */
export async function GET() {
  try {
    const allSettings = await settingsQueries.getAll();
    const cateringTypeSettings = allSettings.cateringTypeSettings ?? {};

    const volumeProducts = await db
      .select({
        id: products.id,
        name: products.name,
        title: products.title,
        translations: products.translations,
        slug: products.slug,
        image: products.image,
        price: products.price,
        shopifyProductId: products.shopifyProductId,
        volumeDescription: products.volumeDescription,
        volumeInstructions: products.volumeInstructions,
        volumeMinOrderQuantity: products.volumeMinOrderQuantity,
        shortCardCopy: products.shortCardCopy,
        allergens: products.allergens,
        variants: products.variants,
        pickupOnly: products.pickupOnly,
        servesPerUnit: products.servesPerUnit,
        volumeUnitLabel: products.volumeUnitLabel,
        maxAdvanceDays: products.maxAdvanceDays,
        cateringType: products.cateringType,
        cateringDescription: products.cateringDescription,
        cateringEndDate: products.cateringEndDate,
        dietaryTags: products.dietaryTags,
        temperatureTags: products.temperatureTags,
        orderMinimum: products.orderMinimum,
        orderScope: products.orderScope,
        variantMinimum: products.variantMinimum,
        increment: products.increment,
      })
      .from(products)
      .where(
        eq(products.volumeEnabled, true),
      )
      .orderBy(asc(products.name));

    // Fetch Shopify variants — Shopify is the source of truth for catering variants
    const shopifyIds = volumeProducts
      .filter((p) => p.shopifyProductId)
      .map((p) => p.shopifyProductId!);

    const shopifyVariantsByGid = new Map<string, Array<{
      id: string;
      label: { en: string; fr: string };
      price: number | null;
      shopifyVariantId: string | null;
      image: string | null;
    }>>();

    // Capture price from "Default Title" single-variant products
    const defaultVariantPriceByGid = new Map<string, number>();

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
                      selectedOptions { name value }
                      price { amount currencyCode }
                      image { url altText }
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
          const variants: Array<{
            id: string;
            label: { en: string; fr: string };
            price: number | null;
            shopifyVariantId: string | null;
            image: string | null;
          }> = [];

          for (const edge of node.variants.edges) {
            const v = edge.node;
            // Filter out tax-only duplicate variants
            const hasTaxOption = v.selectedOptions?.some((o: any) => isTaxOption(o.name));
            const taxOption = v.selectedOptions?.find((o: any) => isTaxOption(o.name));
            if (hasTaxOption && taxOption?.value !== 'true') continue;

            // Skip "Default Title" single-variant products but capture their price
            if (v.title === 'Default Title') {
              if (v.price?.amount) {
                defaultVariantPriceByGid.set(node.id, Math.round(parseFloat(v.price.amount) * 100));
              }
              continue;
            }

            // Also capture first variant price as fallback for product price
            if (!defaultVariantPriceByGid.has(node.id) && v.price?.amount) {
              defaultVariantPriceByGid.set(node.id, Math.round(parseFloat(v.price.amount) * 100));
            }

            const optionLabel = v.selectedOptions
              ?.filter((o: any) => !isTaxOption(o.name) && o.name !== 'Title')
              .map((o: any) => o.value)
              .join(' / ') || v.title;

            variants.push({
              id: v.id,
              label: { en: optionLabel, fr: optionLabel },
              price: v.price?.amount ? Math.round(parseFloat(v.price.amount) * 100) : null,
              shopifyVariantId: v.id,
              image: v.image?.url ?? null,
            });
          }

          if (variants.length > 0) {
            shopifyVariantsByGid.set(node.id, variants);
          }
        }
      } catch (err) {
        console.error('Error fetching Shopify variants for volume products:', err);
      }
    }

    const result = volumeProducts.map((p) => {
      // Shopify is the source of truth for variants
      let productVariants: Array<{
        id: string;
        label: { en: string; fr: string };
        price: number | null;
        shopifyVariantId: string | null;
        description: { en: string; fr: string } | null;
        image: string | null;
      }>;

      if (p.shopifyProductId) {
        const shopifyVars = shopifyVariantsByGid.get(p.shopifyProductId) ?? [];
        productVariants = shopifyVars.map((v) => ({
          ...v,
          description: null,
        }));
      } else {
        productVariants = [];
      }

      // Use Shopify variant price if CMS price is missing or zero
      const shopifyDefaultPrice = p.shopifyProductId ? defaultVariantPriceByGid.get(p.shopifyProductId) : undefined;
      const resolvedPrice = (p.price && p.price > 0) ? p.price : (shopifyDefaultPrice ?? null);

      return {
        id: p.id,
        name: p.name,
        title: p.title ?? p.name,
        translations: p.translations ?? null,
        slug: p.slug,
        image: p.image ?? null,
        price: resolvedPrice,
        shopifyProductId: p.shopifyProductId ?? null,
        volumeDescription: p.volumeDescription ?? { en: '', fr: '' },
        volumeInstructions: p.volumeInstructions ?? { en: '', fr: '' },
        volumeMinOrderQuantity: p.volumeMinOrderQuantity ?? 1,
        shortCardCopy: p.shortCardCopy ?? null,
        allergens: p.allergens ?? [],
        pickupOnly: p.pickupOnly ?? false,
        servesPerUnit: p.servesPerUnit ?? null,
        volumeUnitLabel: p.volumeUnitLabel ?? 'quantity',
        maxAdvanceDays: p.maxAdvanceDays ?? null,
        cateringType: p.cateringType ?? null,
        cateringDescription: p.cateringDescription ?? null,
        cateringEndDate: p.cateringEndDate ?? null,
        dietaryTags: p.dietaryTags ?? [],
        temperatureTags: p.temperatureTags ?? [],
        orderMinimum: p.orderMinimum ?? null,
        orderScope: p.orderScope ?? null,
        variantMinimum: p.variantMinimum ?? null,
        increment: p.increment ?? null,
        variants: productVariants,
      };
    });

    return NextResponse.json(
      { products: result, cateringTypeSettings, deliveryMinForAnyday: allSettings.deliveryMinForAnyday ?? 200000, closedPickupDays: allSettings.closedPickupDays ?? [0] },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (error) {
    console.error('Error fetching storefront volume products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume products' },
      { status: 500 },
    );
  }
}
