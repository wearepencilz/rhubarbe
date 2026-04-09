import { db } from '@/lib/db/client';
import { products, cakeLeadTimeTiers, cakePricingTiers, cakeVariants, cakePricingGrid, cakeAddonLinks } from '@/lib/db/schema';
import { eq, asc, sql } from 'drizzle-orm';

/**
 * List all products where cakeEnabled = false (candidates for enabling).
 */
export async function listNonCakeProducts() {
  return db
    .select({
      id: products.id,
      name: products.name,
      image: products.image,
      status: products.status,
    })
    .from(products)
    .where(eq(products.cakeEnabled, false))
    .orderBy(asc(products.name));
}

/**
 * List all products where cakeEnabled = true, with their lead time tier count.
 */
export async function listCakeProducts() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      image: products.image,
      cakeMinPeople: products.cakeMinPeople,
      cakeEnabled: products.cakeEnabled,
      status: products.status,
      tierCount: sql<number>`coalesce((
        SELECT count(*)::int FROM cake_lead_time_tiers t
        WHERE t.product_id = "products"."id"
      ), 0)`.mapWith(Number),
    })
    .from(products)
    .where(eq(products.cakeEnabled, true))
    .orderBy(asc(products.name));

  return rows;
}

/**
 * Get a single cake product by ID with its tiers, variants, pricing grid, and addon links.
 */
export async function getCakeProductById(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (!product) return null;

  const tiers = await getCakeLeadTimeTiers(id);
  const pricingTiers = await getCakePricingTiers(id);
  const variants = await getCakeVariants(id);
  const pricingGrid = await getCakePricingGrid(id);
  const addonLinks = await getCakeAddonLinks(id);

  return { ...product, leadTimeTiers: tiers, pricingTiers, cakeVariants: variants, pricingGrid, addonLinks };
}

/**
 * Update cake configuration fields on a product.
 */
export async function updateCakeConfig(
  id: string,
  data: {
    cakeEnabled?: boolean;
    cakeDescription?: { en: string; fr: string } | null;
    cakeInstructions?: { en: string; fr: string } | null;
    cakeMinPeople?: number | null;
    cakeFlavourNotes?: { en: string; fr: string } | null;
    cakeDeliveryAvailable?: boolean;
    cakeProductType?: string | null;
    cakeFlavourConfig?: { handle: string; label: { en: string; fr: string }; description: { en: string; fr: string } | null; pricingTierGroup: string | null; sortOrder: number; active: boolean; endDate: string | null }[] | null;
    cakeTierDetailConfig?: { sizeValue: string; layers: number; diameters: string; label: { en: string; fr: string } | null }[] | null;
    cakeMaxFlavours?: number | null;
    maxAdvanceDays?: number | null;
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
 * Get lead time tiers for a product, ordered by ascending minPeople.
 */
export async function getCakeLeadTimeTiers(productId: string) {
  return db
    .select()
    .from(cakeLeadTimeTiers)
    .where(eq(cakeLeadTimeTiers.productId, productId))
    .orderBy(asc(cakeLeadTimeTiers.minPeople));
}

/**
 * Validate and replace lead time tiers for a product.
 * Tiers must have strictly ascending minPeople values.
 * Uses a transaction to delete existing tiers and insert new ones.
 */
export async function setCakeLeadTimeTiers(
  productId: string,
  tiers: { minPeople: number; leadTimeDays: number; deliveryOnly?: boolean }[],
) {
  // Validate ascending minPeople order
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].minPeople <= tiers[i - 1].minPeople) {
      throw new Error(
        `Lead time tiers must have strictly ascending minPeople values. ` +
        `Tier at index ${i} (minPeople=${tiers[i].minPeople}) is not greater than ` +
        `tier at index ${i - 1} (minPeople=${tiers[i - 1].minPeople}).`,
      );
    }
  }

  return db.transaction(async (tx) => {
    await tx
      .delete(cakeLeadTimeTiers)
      .where(eq(cakeLeadTimeTiers.productId, productId));

    if (tiers.length === 0) return [];

    const rows = tiers.map((tier) => ({
      productId,
      minPeople: tier.minPeople,
      leadTimeDays: tier.leadTimeDays,
      deliveryOnly: tier.deliveryOnly ?? false,
    }));

    return tx.insert(cakeLeadTimeTiers).values(rows).returning();
  });
}

/**
 * Get cake variants for a product, ordered by sortOrder.
 */
export async function getCakeVariants(productId: string) {
  return db
    .select()
    .from(cakeVariants)
    .where(eq(cakeVariants.productId, productId))
    .orderBy(asc(cakeVariants.sortOrder));
}

/**
 * Replace cake variants for a product.
 * Uses a transaction to delete existing variants and insert new ones.
 */
export async function setCakeVariants(
  productId: string,
  variants: {
    label: { en: string; fr: string };
    shopifyVariantId?: string | null;
    sortOrder?: number;
    active?: boolean;
  }[],
) {
  return db.transaction(async (tx) => {
    await tx
      .delete(cakeVariants)
      .where(eq(cakeVariants.productId, productId));

    if (variants.length === 0) return [];

    const rows = variants.map((variant, idx) => ({
      productId,
      label: variant.label,
      shopifyVariantId: variant.shopifyVariantId ?? null,
      sortOrder: variant.sortOrder ?? idx,
      active: variant.active ?? true,
    }));

    return tx.insert(cakeVariants).values(rows).returning();
  });
}


/**
 * Get pricing tiers for a product, ordered by ascending minPeople.
 */
export async function getCakePricingTiers(productId: string) {
  return db
    .select()
    .from(cakePricingTiers)
    .where(eq(cakePricingTiers.productId, productId))
    .orderBy(asc(cakePricingTiers.minPeople));
}

/**
 * Validate and replace pricing tiers for a product.
 * Tiers must have strictly ascending minPeople values.
 */
export async function setCakePricingTiers(
  productId: string,
  tiers: { minPeople: number; priceInCents: number; shopifyVariantId?: string | null }[],
) {
  // Validate ascending minPeople order
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].minPeople <= tiers[i - 1].minPeople) {
      throw new Error(
        `Pricing tiers must have strictly ascending minPeople values. ` +
        `Tier at index ${i} (minPeople=${tiers[i].minPeople}) is not greater than ` +
        `tier at index ${i - 1} (minPeople=${tiers[i - 1].minPeople}).`,
      );
    }
  }

  return db.transaction(async (tx) => {
    await tx
      .delete(cakePricingTiers)
      .where(eq(cakePricingTiers.productId, productId));

    if (tiers.length === 0) return [];

    const rows = tiers.map((tier) => ({
      productId,
      minPeople: tier.minPeople,
      priceInCents: tier.priceInCents,
      shopifyVariantId: tier.shopifyVariantId ?? null,
    }));

    return tx.insert(cakePricingTiers).values(rows).returning();
  });
}


/**
 * Get pricing grid rows for a product, ordered by sizeValue ASC, flavourHandle ASC.
 */
export async function getCakePricingGrid(productId: string) {
  return db
    .select({
      sizeValue: cakePricingGrid.sizeValue,
      flavourHandle: cakePricingGrid.flavourHandle,
      priceInCents: cakePricingGrid.priceInCents,
      shopifyVariantId: cakePricingGrid.shopifyVariantId,
    })
    .from(cakePricingGrid)
    .where(eq(cakePricingGrid.productId, productId))
    .orderBy(asc(cakePricingGrid.sizeValue), asc(cakePricingGrid.flavourHandle));
}

/**
 * Replace pricing grid rows for a product.
 * Uses a transaction to delete existing rows and insert new ones.
 */
export async function setCakePricingGrid(
  productId: string,
  rows: { sizeValue: string; flavourHandle: string; priceInCents: number; shopifyVariantId?: string | null }[],
) {
  return db.transaction(async (tx) => {
    await tx
      .delete(cakePricingGrid)
      .where(eq(cakePricingGrid.productId, productId));

    if (rows.length === 0) return [];

    const insertRows = rows.map((row) => ({
      productId,
      sizeValue: row.sizeValue,
      flavourHandle: row.flavourHandle,
      priceInCents: row.priceInCents,
      shopifyVariantId: row.shopifyVariantId ?? null,
    }));

    return tx.insert(cakePricingGrid).values(insertRows).returning();
  });
}

/**
 * Get addon links for a product, ordered by sortOrder ASC.
 * Returns the addonProductId and sortOrder.
 */
export async function getCakeAddonLinks(productId: string) {
  return db
    .select({
      addonProductId: cakeAddonLinks.addonProductId,
      sortOrder: cakeAddonLinks.sortOrder,
    })
    .from(cakeAddonLinks)
    .where(eq(cakeAddonLinks.parentProductId, productId))
    .orderBy(asc(cakeAddonLinks.sortOrder));
}

/**
 * Replace addon links for a product.
 * Uses a transaction to delete existing links and insert new ones.
 */
export async function setCakeAddonLinks(
  productId: string,
  links: { addonProductId: string; sortOrder?: number }[],
) {
  return db.transaction(async (tx) => {
    await tx
      .delete(cakeAddonLinks)
      .where(eq(cakeAddonLinks.parentProductId, productId));

    if (links.length === 0) return [];

    const insertRows = links.map((link, idx) => ({
      parentProductId: productId,
      addonProductId: link.addonProductId,
      sortOrder: link.sortOrder ?? idx,
    }));

    return tx.insert(cakeAddonLinks).values(insertRows).returning();
  });
}
