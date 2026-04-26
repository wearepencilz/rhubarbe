import { db } from '@/lib/db/client';
import { faqs } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function list() {
  return db.select().from(faqs).orderBy(asc(faqs.topic), asc(faqs.sortOrder));
}

export async function listByTopic(topic: string) {
  return db.select().from(faqs).where(eq(faqs.topic, topic)).orderBy(asc(faqs.sortOrder));
}

export async function getTopics(): Promise<string[]> {
  const rows = await db.selectDistinct({ topic: faqs.topic }).from(faqs).orderBy(asc(faqs.topic));
  return rows.map((r) => r.topic);
}

export async function getById(id: string) {
  const [row] = await db.select().from(faqs).where(eq(faqs.id, id));
  return row ?? null;
}

export async function create(data: typeof faqs.$inferInsert) {
  const [created] = await db.insert(faqs).values(data).returning();
  return created;
}

export async function update(id: string, data: Partial<typeof faqs.$inferInsert>) {
  const [updated] = await db.update(faqs).set({ ...data, updatedAt: new Date() }).where(eq(faqs.id, id)).returning();
  return updated ?? null;
}

export async function remove(id: string) {
  const [deleted] = await db.delete(faqs).where(eq(faqs.id, id)).returning();
  return !!deleted;
}
