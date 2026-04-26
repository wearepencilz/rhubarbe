import { db } from '@/lib/db/client';
import { pages } from '@/lib/db/schema';
import { eq, or, asc } from 'drizzle-orm';

export async function list() {
  return db.select().from(pages).orderBy(asc(pages.pageName));
}

export async function getByName(pageName: string) {
  const [row] = await db.select().from(pages).where(eq(pages.pageName, pageName));
  return row ?? null;
}

/** Resolve a page by locale-specific slug (e.g. "recettes" → recipes page) */
export async function getBySlug(slug: string) {
  const [row] = await db.select().from(pages)
    .where(or(eq(pages.slugEn, slug), eq(pages.slugFr, slug), eq(pages.pageName, slug)));
  return row ?? null;
}

/**
 * Upsert a page — insert or update content by page name.
 */
export async function upsert(pageName: string, content: Record<string, unknown>, meta?: { title?: any; slugEn?: string; slugFr?: string }) {
  const [row] = await db
    .insert(pages)
    .values({
      pageName,
      content,
      title: meta?.title || null,
      slugEn: meta?.slugEn || pageName,
      slugFr: meta?.slugFr || pageName,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pages.pageName,
      set: {
        content,
        ...(meta?.title ? { title: meta.title } : {}),
        ...(meta?.slugEn ? { slugEn: meta.slugEn } : {}),
        ...(meta?.slugFr ? { slugFr: meta.slugFr } : {}),
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
