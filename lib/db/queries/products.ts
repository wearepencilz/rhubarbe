import { db } from '@/lib/db/client';
import { products, productIngredients, ingredients } from '@/lib/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import { TaxConfig } from '@/lib/tax/resolve-variant';

/**
 * List all products with optional in-memory filters.
 * Includes related ingredients via the product_ingredients join table.
 */
export async function list(filters?: {
  status?: string;
  formatId?: string;
  onlineOrderable?: boolean;
}) {
  const rows = await db
    .select()
    .from(products)
    .orderBy(asc(products.name));

  let result = rows;

  if (filters?.status) {
    result = result.filter((p) => p.status === filters.status);
  }
  if (filters?.formatId) {
    result = result.filter((p) => (p as any).formatId === filters.formatId);
  }
  if (filters?.onlineOrderable !== undefined) {
    result = result.filter((p) => p.onlineOrderable === filters.onlineOrderable);
  }

  return result;
}

/**
 * Get a single product by ID, including its linked ingredients.
 */
export async function getById(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (!product) return null;

  // Fetch linked ingredients
  const linkedIngredients = await db
    .select({
      id: productIngredients.id,
      ingredientId: productIngredients.ingredientId,
      displayOrder: productIngredients.displayOrder,
      quantity: productIngredients.quantity,
      notes: productIngredients.notes,
      ingredient: {
        id: ingredients.id,
        name: ingredients.name,
        category: ingredients.category,
        allergens: ingredients.allergens,
      },
    })
    .from(productIngredients)
    .innerJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id))
    .where(eq(productIngredients.productId, id))
    .orderBy(asc(productIngredients.displayOrder));

  return { ...product, ingredients: linkedIngredients };
}


/**
 * Find a product by its Shopify product ID. Returns the product or null.
 */
export async function findByShopifyId(shopifyProductId: string) {
  const [product] = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(eq(products.shopifyProductId, shopifyProductId));
  return product ?? null;
}

/**
 * Create a new product. Returns the inserted row.
 */
export async function create(data: typeof products.$inferInsert) {
  const [created] = await db.insert(products).values(data).returning();
  return created;
}

/**
 * Update a product by ID. Returns the updated row or null if not found.
 */
export async function update(id: string, data: Partial<typeof products.$inferInsert>) {
  const [updated] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Delete a product by ID. Returns true if a row was deleted.
 */
export async function remove(id: string) {
  const [deleted] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();

  return !!deleted;
}

/**
 * Set the product_ingredients rows for a product.
 * Replaces all existing rows (delete + insert).
 */
export async function setProductIngredients(
  productId: string,
  items: { ingredientId: string; displayOrder?: number; quantity?: string; notes?: string }[],
) {
  await db.delete(productIngredients).where(eq(productIngredients.productId, productId));

  if (items.length === 0) return [];

  const rows = items.map((item, idx) => ({
    productId,
    ingredientId: item.ingredientId,
    displayOrder: item.displayOrder ?? idx,
    quantity: item.quantity ?? null,
    notes: item.notes ?? null,
  }));

  return db.insert(productIngredients).values(rows).returning();
}

/**
 * Fetch tax configuration for multiple products in a single query.
 * Used by checkout APIs to resolve tax variants for all cart items at once.
 */
export async function getTaxConfigByIds(productIds: string[]): Promise<Map<string, TaxConfig>> {
  if (productIds.length === 0) return new Map();

  // Filter to valid UUIDs only — legacy slug-based IDs (e.g. from launch_products) are skipped
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validIds = productIds.filter((id) => uuidRegex.test(id));
  if (validIds.length === 0) return new Map();

  const rows = await db
    .select({
      id: products.id,
      taxBehavior: products.taxBehavior,
      taxThreshold: products.taxThreshold,
      taxUnitCount: products.taxUnitCount,
      shopifyTaxExemptVariantId: products.shopifyTaxExemptVariantId,
      variants: products.variants,
    })
    .from(products)
    .where(inArray(products.id, validIds));

  const map = new Map<string, TaxConfig>();
  for (const row of rows) {
    // Extract variant-level taxUnitCount from the JSONB variants array
    const variantTaxInfo = Array.isArray(row.variants)
      ? row.variants
          .filter((v: any) => v?.id && v?.taxUnitCount != null)
          .map((v: any) => ({ id: v.id as string, taxUnitCount: v.taxUnitCount as number }))
      : undefined;

    map.set(row.id, {
      taxBehavior: row.taxBehavior as TaxConfig['taxBehavior'],
      taxThreshold: row.taxThreshold,
      taxUnitCount: row.taxUnitCount,
      shopifyTaxExemptVariantId: row.shopifyTaxExemptVariantId,
      variants: variantTaxInfo?.length ? variantTaxInfo : undefined,
    });
  }
  return map;
}
