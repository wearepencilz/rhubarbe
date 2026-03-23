import { db } from '@/lib/db/client';
import { requests } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * List all requests, ordered by most recent first.
 */
export async function list() {
  return db.select().from(requests).orderBy(desc(requests.createdAt));
}

/**
 * Get a single request by UUID.
 */
export async function getById(id: string) {
  const [row] = await db.select().from(requests).where(eq(requests.id, id));
  return row ?? null;
}

/**
 * Create a new request.
 */
export async function create(data: typeof requests.$inferInsert) {
  const [created] = await db.insert(requests).values(data).returning();
  return created;
}

/**
 * Update a request by ID.
 */
export async function update(id: string, data: Partial<typeof requests.$inferInsert>) {
  const [updated] = await db
    .update(requests)
    .set(data)
    .where(eq(requests.id, id))
    .returning();
  return updated ?? null;
}

/**
 * Delete a request by ID. Returns true if a row was deleted.
 */
export async function remove(id: string) {
  const [deleted] = await db.delete(requests).where(eq(requests.id, id)).returning();
  return !!deleted;
}
