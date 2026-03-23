import { db } from '@/lib/db/client';
import { ingredients } from '@/lib/db/schema';
import { eq, ilike, asc } from 'drizzle-orm';

/**
 * List ingredients with optional filters: category, allergen, seasonal, search.
 */
export async function list(filters?: {
  search?: string;
  category?: string;
  allergen?: string;
  seasonal?: boolean;
}) {
  let rows = await db.select().from(ingredients).orderBy(asc(ingredients.name));

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        r.latinName?.toLowerCase().includes(s) ||
        r.origin?.toLowerCase().includes(s),
    );
  }

  if (filters?.category) {
    rows = rows.filter((r) => r.category === filters.category);
  }

  if (filters?.allergen) {
    rows = rows.filter((r) => (r.allergens as string[] | null)?.includes(filters.allergen!) ?? false);
  }

  if (filters?.seasonal !== undefined) {
    rows = rows.filter((r) => r.seasonal === filters.seasonal);
  }

  return rows;
}

/**
 * Get a single ingredient by ID.
 */
export async function getById(id: string) {
  const [row] = await db.select().from(ingredients).where(eq(ingredients.id, id));
  return row ?? null;
}

/**
 * Get a single ingredient by legacy ID.
 */
export async function getByLegacyId(legacyId: string) {
  const [row] = await db.select().from(ingredients).where(eq(ingredients.legacyId, legacyId));
  return row ?? null;
}

/**
 * Find ingredient by name (case-insensitive). Used for duplicate checks.
 */
export async function getByName(name: string) {
  const [row] = await db
    .select()
    .from(ingredients)
    .where(ilike(ingredients.name, name));
  return row ?? null;
}

/**
 * Create a new ingredient.
 */
export async function create(data: typeof ingredients.$inferInsert) {
  const [created] = await db.insert(ingredients).values(data).returning();
  return created;
}

/**
 * Update an ingredient by ID.
 */
export async function update(id: string, data: Partial<typeof ingredients.$inferInsert>) {
  const [updated] = await db
    .update(ingredients)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(ingredients.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Delete an ingredient by ID. Returns true if a row was deleted.
 */
export async function remove(id: string) {
  const [deleted] = await db
    .delete(ingredients)
    .where(eq(ingredients.id, id))
    .returning();

  return !!deleted;
}
