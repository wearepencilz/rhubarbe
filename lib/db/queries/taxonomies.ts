import { db } from '@/lib/db/client';
import { taxonomyValues } from '@/lib/db/schema';
import { eq, and, asc, sql } from 'drizzle-orm';

/**
 * Get all taxonomy values grouped by category.
 * Returns a Record<string, TaxonomyValue[]> matching the old JSON shape.
 */
export async function getAllGroupedByCategory() {
  const rows = await db
    .select()
    .from(taxonomyValues)
    .orderBy(asc(taxonomyValues.category), asc(taxonomyValues.sortOrder));

  const grouped: Record<string, typeof rows> = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push(row);
  }
  return grouped;
}

/**
 * Get taxonomy values for a specific category.
 */
export async function getByCategory(category: string) {
  return db
    .select()
    .from(taxonomyValues)
    .where(eq(taxonomyValues.category, category))
    .orderBy(asc(taxonomyValues.sortOrder));
}

/**
 * Create a new taxonomy value in a category.
 */
export async function create(
  category: string,
  data: { label: string; value: string; description?: string; sortOrder?: number; archived?: boolean }
) {
  // If no sortOrder provided, put it at the end
  let sortOrder = data.sortOrder;
  if (sortOrder === undefined) {
    const [maxRow] = await db
      .select({ max: sql<number>`coalesce(max(${taxonomyValues.sortOrder}), 0)` })
      .from(taxonomyValues)
      .where(eq(taxonomyValues.category, category));
    sortOrder = (maxRow?.max ?? 0) + 1;
  }

  const [created] = await db
    .insert(taxonomyValues)
    .values({
      category,
      label: data.label,
      value: data.value,
      description: data.description ?? null,
      sortOrder,
      archived: data.archived ?? false,
    })
    .returning();

  return created;
}

/**
 * Update a taxonomy value by ID.
 */
export async function update(
  id: string,
  data: Partial<{ label: string; value: string; description: string; sortOrder: number; archived: boolean }>
) {
  const [updated] = await db
    .update(taxonomyValues)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(taxonomyValues.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Taxonomy value ${id} not found`);
  }
  return updated;
}

/**
 * Delete a taxonomy value by ID.
 */
export async function remove(id: string) {
  const [deleted] = await db
    .delete(taxonomyValues)
    .where(eq(taxonomyValues.id, id))
    .returning();

  if (!deleted) {
    throw new Error(`Taxonomy value ${id} not found`);
  }
  return true;
}

/**
 * Reorder taxonomy values within a category.
 * Accepts an array of { id, sortOrder } pairs.
 */
export async function reorder(category: string, items: { id: string; sortOrder: number }[]) {
  await db.transaction(async (tx) => {
    for (const item of items) {
      await tx
        .update(taxonomyValues)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(and(eq(taxonomyValues.id, item.id), eq(taxonomyValues.category, category)));
    }
  });
}

/**
 * Check if a value is unique within a category (optionally excluding an ID).
 */
export async function isValueUnique(category: string, value: string, excludeId?: string) {
  const conditions = [
    eq(taxonomyValues.category, category),
    eq(taxonomyValues.value, value),
  ];

  const rows = await db
    .select({ id: taxonomyValues.id })
    .from(taxonomyValues)
    .where(and(...conditions));

  if (excludeId) {
    return rows.every((r) => r.id !== excludeId);
  }
  return rows.length === 0;
}
