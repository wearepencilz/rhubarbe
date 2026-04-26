import { db } from '@/lib/db/client';
import { pages } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function list() {
  return db.select().from(pages).orderBy(asc(pages.pageName));
}

/**
 * Get a page by its page name.
 * Returns the content jsonb object, or null if not found.
 */
export async function getByName(pageName: string) {
  const [row] = await db
    .select()
    .from(pages)
    .where(eq(pages.pageName, pageName));

  return row ?? null;
}

/**
 * Upsert a page — insert or update content by page name.
 */
export async function upsert(pageName: string, content: Record<string, unknown>) {
  const [row] = await db
    .insert(pages)
    .values({
      pageName,
      content,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pages.pageName,
      set: {
        content,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

export async function remove(pageName: string) {
  const [deleted] = await db.delete(pages).where(eq(pages.pageName, pageName)).returning();
  return !!deleted;
}
