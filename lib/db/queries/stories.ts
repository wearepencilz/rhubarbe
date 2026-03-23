import { db } from '@/lib/db/client';
import { stories } from '@/lib/db/schema';
import { eq, or, asc, desc } from 'drizzle-orm';

/**
 * List all stories, ordered by most recent first.
 */
export async function list() {
  return db.select().from(stories).orderBy(desc(stories.createdAt));
}

/**
 * Get a single story by UUID or slug.
 */
export async function getByIdOrSlug(idOrSlug: string) {
  const [row] = await db
    .select()
    .from(stories)
    .where(or(eq(stories.id, idOrSlug), eq(stories.slug, idOrSlug)));
  return row ?? null;
}

/**
 * Get a single story by UUID.
 */
export async function getById(id: string) {
  const [row] = await db.select().from(stories).where(eq(stories.id, id));
  return row ?? null;
}

/**
 * Create a new story.
 */
export async function create(data: typeof stories.$inferInsert) {
  const [created] = await db.insert(stories).values(data).returning();
  return created;
}

/**
 * Update a story by ID.
 */
export async function update(id: string, data: Partial<typeof stories.$inferInsert>) {
  const [updated] = await db
    .update(stories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(stories.id, id))
    .returning();
  return updated ?? null;
}

/**
 * Delete a story by ID. Returns true if a row was deleted.
 */
export async function remove(id: string) {
  const [deleted] = await db.delete(stories).where(eq(stories.id, id)).returning();
  return !!deleted;
}
