import { db } from '@/lib/db/client';
import { recipes } from '@/lib/db/schema';
import { eq, or, desc } from 'drizzle-orm';

export async function list() {
  return db.select().from(recipes).orderBy(desc(recipes.createdAt));
}

export async function getByIdOrSlug(idOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const [row] = await db
    .select()
    .from(recipes)
    .where(isUuid ? or(eq(recipes.id, idOrSlug), eq(recipes.slug, idOrSlug)) : or(eq(recipes.slug, idOrSlug), eq(recipes.slugFr, idOrSlug), eq(recipes.slugEn, idOrSlug)));
  return row ?? null;
}

export async function getById(id: string) {
  const [row] = await db.select().from(recipes).where(eq(recipes.id, id));
  return row ?? null;
}

export async function listPublished(limit?: number) {
  const rows = await db
    .select()
    .from(recipes)
    .where(eq(recipes.status, 'published'))
    .orderBy(desc(recipes.publishedAt));
  return limit ? rows.slice(0, limit) : rows;
}

export async function create(data: typeof recipes.$inferInsert) {
  const [created] = await db.insert(recipes).values(data).returning();
  return created;
}

export async function update(id: string, data: Partial<typeof recipes.$inferInsert>) {
  const [updated] = await db
    .update(recipes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(recipes.id, id))
    .returning();
  return updated ?? null;
}

export async function remove(id: string) {
  const [deleted] = await db.delete(recipes).where(eq(recipes.id, id)).returning();
  return !!deleted;
}
