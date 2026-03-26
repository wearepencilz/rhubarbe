import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { products, volumeLeadTimeTiers } from '@/lib/db/schema';
import { eq, asc, sql, and } from 'drizzle-orm';

/**
 * GET /api/storefront/volume-products
 *
 * Public endpoint — no auth required.
 * Returns volume-enabled products that have at least one lead time tier configured.
 * Uses the product's own variants (from the variants JSONB column) — not the
 * volume_variants table, which is redundant.
 * Does NOT reference any launch, menu, or launch-product data.
 */
export async function GET() {
  try {
    // Fetch products where volumeEnabled = true AND at least one lead time tier exists
    const volumeProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        image: products.image,
        price: products.price,
        volumeDescription: products.volumeDescription,
        volumeInstructions: products.volumeInstructions,
        volumeMinOrderQuantity: products.volumeMinOrderQuantity,
        allergens: products.allergens,
        variants: products.variants,
      })
      .from(products)
      .where(
        and(
          eq(products.volumeEnabled, true),
          sql`(SELECT count(*) FROM volume_lead_time_tiers WHERE volume_lead_time_tiers.product_id = ${products.id}) > 0`,
        ),
      )
      .orderBy(asc(products.name));

    // Fetch tiers for each product
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

    // Group tiers by productId
    const tiersByProduct = new Map<string, Array<{ minQuantity: number; leadTimeDays: number }>>();
    for (const tier of allTiers) {
      const list = tiersByProduct.get(tier.productId) ?? [];
      list.push({ minQuantity: tier.minQuantity, leadTimeDays: tier.leadTimeDays });
      tiersByProduct.set(tier.productId, list);
    }

    // Assemble the response — use the product's own variants JSONB
    const result = volumeProducts.map((p) => {
      // Map product variants to the storefront shape
      const productVariants = (p.variants ?? []).map((v: any) => ({
        id: v.id || v.label || `${p.id}-${v.sortOrder ?? 0}`,
        label: {
          en: v.label || v.name || '',
          fr: v.labelFr || v.label || v.name || '',
        },
        price: v.price ?? null,
        shopifyVariantId: v.shopifyVariantId ?? null,
      }));

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.image ?? null,
        price: p.price ?? null,
        volumeDescription: p.volumeDescription ?? { en: '', fr: '' },
        volumeInstructions: p.volumeInstructions ?? { en: '', fr: '' },
        volumeMinOrderQuantity: p.volumeMinOrderQuantity ?? 1,
        allergens: p.allergens ?? [],
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
