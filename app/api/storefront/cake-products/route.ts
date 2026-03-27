import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products, cakeLeadTimeTiers } from '@/lib/db/schema';
import { eq, asc, sql, and } from 'drizzle-orm';
import { shopifyFetch } from '@/lib/shopify/client';

/**
 * GET /api/storefront/cake-products
 *
 * Public endpoint — no auth required.
 * Returns cake-enabled products with lead time tiers and Shopify variant pricing.
 * Pricing comes from Shopify variants (source of truth) — the "Serves" option
 * value is the number of people, and the variant price is the tier price.
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
          })
          .from(cakeLeadTimeTiers)
          .where(sql`${cakeLeadTimeTiers.productId} IN ${productIds}`)
          .orderBy(asc(cakeLeadTimeTiers.minPeople))
      : [];

    // Group tiers by productId
    const tiersByProduct = new Map<string, Array<{ minPeople: number; leadTimeDays: number }>>();
    for (const tier of allTiers) {
      const list = tiersByProduct.get(tier.productId) ?? [];
      list.push({ minPeople: tier.minPeople, leadTimeDays: tier.leadTimeDays });
      tiersByProduct.set(tier.productId, list);
    }

    // Fetch Shopify variant pricing for each product that has a shopifyProductId
    const shopifyIds = cakeProducts
      .filter((p) => p.shopifyProductId)
      .map((p) => p.shopifyProductId!);

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
    const result = cakeProducts.map((p) => {
      const pricingTiers = p.shopifyProductId
        ? (shopifyVariantsByProductGid.get(p.shopifyProductId) ?? [])
        : [];

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
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching storefront cake products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cake products' },
      { status: 500 },
    );
  }
}
