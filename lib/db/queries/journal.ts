import { db } from '@/lib/db/client';
import { journal } from '@/lib/db/schema';
import { eq, or, desc } from 'drizzle-orm';

export async function list() {
  return db.select().from(journal).orderBy(desc(journal.createdAt));
}

export async function getByIdOrSlug(idOrSlug: string) {
  const [row] = await db
    .select()
    .from(journal)
    .where(or(eq(journal.id, idOrSlug), eq(journal.slug, idOrSlug)));
  return row ?? null;
}

export async function getById(id: string) {
  const [row] = await db.select().from(journal).where(eq(journal.id, id));
  return row ?? null;
}

export async function listPublished(limit?: number) {
  const rows = await db
    .select()
    .from(journal)
    .where(eq(journal.status, 'published'))
    .orderBy(desc(journal.publishedAt));
  return limit ? rows.slice(0, limit) : rows;
}

export async function create(data: typeof journal.$inferInsert) {
  const [created] = await db.insert(journal).values(data).returning();
  return created;
}

export async function update(id: string, data: Partial<typeof journal.$inferInsert>) {
  const [updated] = await db
    .update(journal)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(journal.id, id))
    .returning();
  return updated ?? null;
}

export async function remove(id: string) {
  const [deleted] = await db.delete(journal).where(eq(journal.id, id)).returning();
  return !!deleted;
}
