import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get all settings as a flat key-value object.
 * Reconstructs the shape that the old JSON adapter returned.
 */
export async function getAll(): Promise<Record<string, unknown>> {
  const rows = await db.select().from(settings);

  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

/**
 * Get a single setting by key.
 */
export async function getByKey(key: string) {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key));

  return row ?? null;
}

/**
 * Upsert multiple settings from a flat key-value object.
 * Each top-level key becomes a row in the settings table.
 */
export async function upsertMany(data: Record<string, unknown>) {
  const now = new Date();

  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(data)) {
      await tx
        .insert(settings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: now },
        });
    }
  });
}
