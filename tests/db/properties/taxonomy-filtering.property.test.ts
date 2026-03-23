/**
 * Property-Based Test: Taxonomy Category Filtering
 *
 * Feature: json-to-postgres-migration, Property 4: Taxonomy category filtering
 *
 * **Validates: Requirements 7.2**
 *
 * For any taxonomy category string, querying taxonomy_values filtered by that
 * category should return only rows where category equals the given string, and
 * the result set should match exactly the values that were in the original JSON
 * taxonomy object under that category key.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { getByCategory } from '@/lib/db/queries/taxonomies';

// --- Types matching the JSON shape ---
interface TaxonomyEntry {
  id?: string;
  label: string;
  value: string;
  description?: string;
  sortOrder?: number;
  archived?: boolean;
}

type TaxonomiesJson = Record<string, TaxonomyEntry[]>;

// --- Load source JSON once ---
const jsonPath = resolve(process.cwd(), 'public/data/backups/taxonomies.json');
const taxonomiesJson: TaxonomiesJson = JSON.parse(readFileSync(jsonPath, 'utf-8'));
const allCategories = Object.keys(taxonomiesJson);

// --- Test DB connection (separate from the app's db client) ---
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test';

describe('Property 4: Taxonomy category filtering', () => {
  let client: postgres.Sql;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    client = postgres(TEST_DATABASE_URL, { max: 1 });
    db = drizzle(client);

    // Ensure taxonomy_values table exists and is seeded.
    // Truncate and re-seed from JSON so the test is self-contained.
    await db.execute(sql`DELETE FROM taxonomy_values`);

    const rows = Object.entries(taxonomiesJson).flatMap(([category, entries]) =>
      entries.map((entry) => ({
        category,
        label: entry.label,
        value: entry.value,
        description: entry.description ?? null,
        sortOrder: entry.sortOrder ?? 0,
        archived: entry.archived ?? false,
      }))
    );

    if (rows.length > 0) {
      // Insert in batches to avoid parameter limits
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const valuesSql = batch
          .map(
            (r) =>
              sql`(gen_random_uuid(), ${r.category}, ${r.label}, ${r.value}, ${r.description}, ${r.sortOrder}, ${r.archived}, now(), now())`
          );

        // Build a single INSERT with multiple value tuples
        await db.execute(
          sql`INSERT INTO taxonomy_values (id, category, label, value, description, sort_order, archived, created_at, updated_at)
              VALUES ${sql.join(valuesSql, sql`, `)}`
        );
      }
    }
  });

  afterAll(async () => {
    await db.execute(sql`DELETE FROM taxonomy_values`);
    await client.end();
  });

  // Property: for any known category, getByCategory returns exactly the matching JSON entries
  it('should return only rows matching the queried category, matching the JSON source', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allCategories),
        async (category) => {
          const dbRows = await getByCategory(category);

          const expectedEntries = taxonomiesJson[category] ?? [];

          // 1. Count must match
          expect(dbRows.length).toBe(expectedEntries.length);

          // 2. Every returned row must have the correct category
          for (const row of dbRows) {
            expect(row.category).toBe(category);
          }

          // 3. The set of values must match exactly (order by sortOrder)
          const dbValues = dbRows
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((r) => ({ label: r.label, value: r.value }));

          const jsonValues = [...expectedEntries]
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((e) => ({ label: e.label, value: e.value }));

          expect(dbValues).toEqual(jsonValues);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: querying a category NOT in the JSON should return an empty array
  it('should return empty results for categories not present in the JSON source', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random strings that are unlikely to match real categories
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => !allCategories.includes(s)
        ),
        async (unknownCategory) => {
          const dbRows = await getByCategory(unknownCategory);
          expect(dbRows.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
