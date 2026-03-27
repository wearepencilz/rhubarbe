import { db } from '@/lib/db/client';
import { products, volumeLeadTimeTiers, volumeVariants } from '@/lib/db/schema';
import { eq, asc, sql } from 'drizzle-orm';

/**
 * List all products where volumeEnabled = false (candidates for enabling).
 */
export async function listNonVolumeProducts() {
  return db
    .select({
      id: products.id,
      name: products.name,
      image: products.image,
      status: products.status,
    })
    .from(products)
    .where(eq(products.volumeEnabled, false))
    .orderBy(asc(products.name));
}

/**
 * List all products where volumeEnabled = true, with their lead time tier count.
 */
export async function listVolumeProducts() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      image: products.image,
      volumeMinOrderQuantity: products.volumeMinOrderQuantity,
      volumeEnabled: products.volumeEnabled,
      status: products.status,
      tierCount: sql<number>`coalesce((
        SELECT count(*)::int FROM volume_lead_time_tiers t
        WHERE t.product_id = "products"."id"
      ), 0)`.mapWith(Number),
    })
    .from(products)
    .where(eq(products.volumeEnabled, true))
    .orderBy(asc(products.name));

  return rows;
}

/**
 * Get a single volume product by ID with its tiers and variants.
 */
export async function getVolumeProductById(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (!product) return null;

  const tiers = await getLeadTimeTiers(id);
  const variants = await getVolumeVariants(id);

  return { ...product, leadTimeTiers: tiers, volumeVariants: variants };
}

/**
 * Update volume configuration fields on a product.
 */
export async function updateVolumeConfig(
  id: string,
  data: {
    volumeEnabled?: boolean;
    volumeDescription?: { en: string; fr: string } | null;
    volumeInstructions?: { en: string; fr: string } | null;
    volumeMinOrderQuantity?: number | null;
  },
) {
  const [updated] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Get lead time tiers for a product, ordered by ascending minQuantity.
 */
export async function getLeadTimeTiers(productId: string) {
  return db
    .select()
    .from(volumeLeadTimeTiers)
    .where(eq(volumeLeadTimeTiers.productId, productId))
    .orderBy(asc(volumeLeadTimeTiers.minQuantity));
}

/**
 * Validate and replace lead time tiers for a product.
 * Tiers must have strictly ascending minQuantity values.
 * Uses a transaction to delete existing tiers and insert new ones.
 */
export async function setLeadTimeTiers(
  productId: string,
  tiers: { minQuantity: number; leadTimeDays: number }[],
) {
  // Validate ascending minQuantity order
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].minQuantity <= tiers[i - 1].minQuantity) {
      throw new Error(
        `Lead time tiers must have strictly ascending minQuantity values. ` +
        `Tier at index ${i} (minQuantity=${tiers[i].minQuantity}) is not greater than ` +
        `tier at index ${i - 1} (minQuantity=${tiers[i - 1].minQuantity}).`,
      );
    }
  }

  return db.transaction(async (tx) => {
    await tx
      .delete(volumeLeadTimeTiers)
      .where(eq(volumeLeadTimeTiers.productId, productId));

    if (tiers.length === 0) return [];

    const rows = tiers.map((tier) => ({
      productId,
      minQuantity: tier.minQuantity,
      leadTimeDays: tier.leadTimeDays,
    }));

    return tx.insert(volumeLeadTimeTiers).values(rows).returning();
  });
}

/**
 * Get volume variants for a product, ordered by sortOrder.
 */
export async function getVolumeVariants(productId: string) {
  return db
    .select()
    .from(volumeVariants)
    .where(eq(volumeVariants.productId, productId))
    .orderBy(asc(volumeVariants.sortOrder));
}

/**
 * Replace volume variants for a product.
 * Uses a transaction to delete existing variants and insert new ones.
 */
export async function setVolumeVariants(
  productId: string,
  variants: {
    label: { en: string; fr: string };
    shopifyVariantId?: string | null;
    sortOrder?: number;
    active?: boolean;
    description?: { en: string; fr: string } | null;
  }[],
) {
  return db.transaction(async (tx) => {
    await tx
      .delete(volumeVariants)
      .where(eq(volumeVariants.productId, productId));

    if (variants.length === 0) return [];

    const rows = variants.map((variant, idx) => ({
      productId,
      label: variant.label,
      shopifyVariantId: variant.shopifyVariantId ?? null,
      sortOrder: variant.sortOrder ?? idx,
      active: variant.active ?? true,
      description: variant.description ?? null,
    }));

    return tx.insert(volumeVariants).values(rows).returning();
  });
}
