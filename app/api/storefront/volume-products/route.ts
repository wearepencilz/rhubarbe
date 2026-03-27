import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products, volumeLeadTimeTiers, volumeVariants } from '@/lib/db/schema';
import { eq, asc, sql, and } from 'drizzle-orm';
import { shopifyFetch } from '@/lib/shopify/client';
import { isTaxOption } from '@/lib/tax/constants';

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
    const volumeProducts = await db
      .select({
        id: products.id,
        name: products.name,
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
      })
      .from(products)
      .where(
        and(
          eq(products.volumeEnabled, true),
          sql`(SELECT count(*) FROM volume_lead_time_tiers WHERE volume_lead_time_tiers.product_id = ${products.id}) > 0`,
        ),
      )
      .orderBy(asc(products.name));

    const productIds = volumeProducts.map((p) => p.id);

    const allTiers = productIds.length > 0
      ? await db
          .select({
            productId: volumeLeadTimeTiers.productId,
            minQuantity: volumeLeadTimeTiers.minQuantity,
            leadTimeDays: volumeLeadTimeTiers.leadTimeDays,
          })
          .from(volumeLeadTimeTiers)
          .where(sql`${volumeLeadTimeTiers.productId} IN ${productIds}`)
          .orderBy(asc(volumeLeadTimeTiers.minQuantity))
      : [];

    const tiersByProduct = new Map<string, Array<{ minQuantity: number; leadTimeDays: number }>>();
    for (const tier of allTiers) {
      const list = tiersByProduct.get(tier.productId) ?? [];
      list.push({ minQuantity: tier.minQuantity, leadTimeDays: tier.leadTimeDays });
      tiersByProduct.set(tier.productId, list);
    }

    // Fetch volume variants from the database
    const allVolumeVariants = productIds.length > 0
      ? await db
          .select({
            id: volumeVariants.id,
            productId: volumeVariants.productId,
            label: volumeVariants.label,
            shopifyVariantId: volumeVariants.shopifyVariantId,
            active: volumeVariants.active,
            sortOrder: volumeVariants.sortOrder,
            description: volumeVariants.description,
          })
          .from(volumeVariants)
          .where(sql`${volumeVariants.productId} IN ${productIds}`)
          .orderBy(asc(volumeVariants.sortOrder))
      : [];

    const dbVariantsByProduct = new Map<string, Array<{
      id: string;
      label: { en: string; fr: string };
      shopifyVariantId: string | null;
      active: boolean;
      sortOrder: number;
      description: { en: string; fr: string } | null;
    }>>();
    for (const v of allVolumeVariants) {
      const list = dbVariantsByProduct.get(v.productId) ?? [];
      list.push({
        id: v.id,
        label: v.label as { en: string; fr: string },
        shopifyVariantId: v.shopifyVariantId,
        active: v.active,
        sortOrder: v.sortOrder,
        description: v.description as { en: string; fr: string } | null,
      });
      dbVariantsByProduct.set(v.productId, list);
    }

    // Fetch Shopify variants for products that need them
    const shopifyIds = volumeProducts
      .filter((p) => p.shopifyProductId && (!p.variants || (p.variants as any[]).length === 0))
      .map((p) => p.shopifyProductId!);

    const shopifyVariantsByGid = new Map<string, Array<{
      id: string;
      label: { en: string; fr: string };
      price: number | null;
      shopifyVariantId: string | null;
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
          }> = [];

          for (const edge of node.variants.edges) {
            const v = edge.node;
            // Filter out tax-only duplicate variants
            const hasTaxOption = v.selectedOptions?.some((o: any) => isTaxOption(o.name));
            const taxOption = v.selectedOptions?.find((o: any) => isTaxOption(o.name));
            if (hasTaxOption && taxOption?.value !== 'true') continue;

            // Skip "Default Title" single-variant products
            if (v.title === 'Default Title') continue;

            const optionLabel = v.selectedOptions
              ?.filter((o: any) => !isTaxOption(o.name) && o.name !== 'Title')
              .map((o: any) => o.value)
              .join(' / ') || v.title;

            variants.push({
              id: v.id,
              label: { en: optionLabel, fr: optionLabel },
              price: v.price?.amount ? Math.round(parseFloat(v.price.amount) * 100) : null,
              shopifyVariantId: v.id,
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
      // Use DB volume variants if available, then CMS variants, then Shopify
      const dbVars = dbVariantsByProduct.get(p.id) ?? [];
      const cmsVariants = (p.variants ?? []) as any[];
      let productVariants: Array<{
        id: string;
        label: { en: string; fr: string };
        price: number | null;
        shopifyVariantId: string | null;
        description: { en: string; fr: string } | null;
      }>;

      if (dbVars.length > 0) {
        productVariants = dbVars
          .filter((v) => v.active)
          .map((v) => ({
            id: v.id,
            label: v.label,
            price: null,
            shopifyVariantId: v.shopifyVariantId,
            description: v.description ?? null,
          }));
      } else if (cmsVariants.length > 0) {
        productVariants = cmsVariants.map((v: any) => ({
          id: v.id || v.label || `${p.id}-${v.sortOrder ?? 0}`,
          label: {
            en: v.label || v.name || '',
            fr: v.labelFr || v.label || v.name || '',
          },
          price: v.price ?? null,
          shopifyVariantId: v.shopifyVariantId ?? null,
          description: null,
        }));
      } else if (p.shopifyProductId) {
        const shopifyVars = shopifyVariantsByGid.get(p.shopifyProductId) ?? [];
        productVariants = shopifyVars.map((v) => ({
          ...v,
          description: null,
        }));
      } else {
        productVariants = [];
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.image ?? null,
        price: p.price ?? null,
        shopifyProductId: p.shopifyProductId ?? null,
        volumeDescription: p.volumeDescription ?? { en: '', fr: '' },
        volumeInstructions: p.volumeInstructions ?? { en: '', fr: '' },
        volumeMinOrderQuantity: p.volumeMinOrderQuantity ?? 1,
        shortCardCopy: p.shortCardCopy ?? null,
        allergens: p.allergens ?? [],
        pickupOnly: p.pickupOnly ?? false,
        servesPerUnit: p.servesPerUnit ?? null,
        leadTimeTiers: tiersByProduct.get(p.id) ?? [],
        variants: productVariants,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching storefront volume products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume products' },
      { status: 500 },
    );
  }
}
