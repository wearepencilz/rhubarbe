import { db } from '@/lib/db/client';
import { news } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * List all news items, ordered by most recent first.
 */
export async function list() {
  return db.select().from(news).orderBy(desc(news.createdAt));
}

/**
 * Get a single news item by UUID.
 */
export async function getById(id: string) {
  const [row] = await db.select().from(news).where(eq(news.id, id));
  return row ?? null;
}

/**
 * Create a new news item.
 */
export async function create(data: typeof news.$inferInsert) {
  const [created] = await db.insert(news).values(data).returning();
  return created;
}

/**
 * Update a news item by ID.
 */
export async function update(id: string, data: Partial<typeof news.$inferInsert>) {
  const [updated] = await db
    .update(news)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(news.id, id))
    .returning();
  return updated ?? null;
}

/**
 * Delete a news item by ID. Returns true if a row was deleted.
 */
export async function remove(id: string) {
  const [deleted] = await db.delete(news).where(eq(news.id, id)).returning();
  return !!deleted;
}
