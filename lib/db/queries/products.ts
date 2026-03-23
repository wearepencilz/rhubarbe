import { db } from '@/lib/db/client';
import { products, productIngredients, ingredients } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

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
