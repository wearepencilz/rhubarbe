import { db } from '@/lib/db/client';
import { media } from '@/lib/db/schema';
import { eq, desc, ilike, or } from 'drizzle-orm';

export async function list(filters?: { search?: string }) {
  let rows = await db.select().from(media).orderBy(desc(media.createdAt));
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter((r) =>
      r.filename.toLowerCase().includes(s) ||
      (r.tags as string[] | null)?.some((t) => t.toLowerCase().includes(s))
    );
  }
  return rows;
}

export async function getById(id: string) {
  const [row] = await db.select().from(media).where(eq(media.id, id));
  return row ?? null;
}

export async function create(data: typeof media.$inferInsert) {
  const [created] = await db.insert(media).values(data).returning();
  return created;
}

export async function update(id: string, data: Partial<typeof media.$inferInsert>) {
  const [updated] = await db
    .update(media)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(media.id, id))
    .returning();
  return updated ?? null;
}

export async function remove(id: string) {
  const [deleted] = await db.delete(media).where(eq(media.id, id)).returning();
  return deleted ?? null;
}
