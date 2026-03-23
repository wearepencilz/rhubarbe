/**
 * Property-Based Test: Ingredient Filter Equivalence
 *
 * Feature: json-to-postgres-migration, Property 5: Ingredient filter equivalence
 *
 * **Validates: Requirements 10.2**
 *
 * For any combination of filter parameters (category, allergen, seasonal),
 * the set of ingredients returned by the Postgres-backed query should be
 * identical to the set that would be returned by applying the same filters
 * in-memory on the original JSON array.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { list } from '@/lib/db/queries/ingredients';

// --- Types matching the JSON shape ---
interface IngredientJson {
  id?: string;
  name: string;
  category?: string;
  allergens?: string[];
  seasonal?: boolean;
  [key: string]: unknown;
}

// --- Load source JSON once ---
const jsonPath = resolve(process.cwd(), 'public/data/backups/ingredients.json');
const ingredientsJson: IngredientJson[] = JSON.parse(readFileSync(jsonPath, 'utf-8'));

// Extract distinct filter values from the JSON data
const allCategories = [...new Set(ingredientsJson.map((i) => i.category).filter(Boolean))] as string[];
const allAllergens = [...new Set(ingredientsJson.flatMap((i) => i.allergens ?? []))];

/** Ensure a value is a proper array. */
function toArray<T>(val: T[] | undefined | null): T[] {
  return Array.isArray(val) ? val : [];
}

/** Coerce to boolean with fallback. */
function toBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  return fallback;
}

/**
 * Apply filters in-memory on the JSON array, mirroring the Postgres query logic.
 */
function filterJsonInMemory(
  data: IngredientJson[],
  filters: { category?: string; allergen?: string; seasonal?: boolean }
): string[] {
  let result = [...data];

  if (filters.category) {
    result = result.filter((r) => r.category === filters.category);
  }

  if (filters.allergen) {
    result = result.filter((r) => toArray(r.allergens).includes(filters.allergen!));
  }

  if (filters.seasonal !== undefined) {
    result = result.filter((r) => toBool(r.seasonal, false) === filters.seasonal);
  }

  // Sort by name to match DB ordering
  result.sort((a, b) => a.name.localeCompare(b.name));

  // Return legacy IDs for comparison
  return result.map((r) => r.id!);
}

// --- Test DB connection ---
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test';

describe('Property 5: Ingredient filter equivalence', () => {
  let client: postgres.Sql;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    client = postgres(TEST_DATABASE_URL, { max: 1 });
    db = drizzle(client);

    // Truncate and re-seed from JSON so the test is self-contained
    await db.execute(sql`DELETE FROM ingredients`);

    for (const item of ingredientsJson) {
      await db.execute(
        sql`INSERT INTO ingredients (
          id, legacy_id, name, latin_name, category, taxonomy_category, origin,
          description, story, image, image_alt,
          allergens, roles, descriptors, tasting_notes, texture, process, attributes, used_as, available_months,
          seasonal, animal_derived, vegetarian, is_organic,
          source_name, source_type, supplier, farm, status,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${item.id ?? null},
          ${item.name},
          ${(item as Record<string, unknown>).latinName as string ?? null},
          ${item.category ?? null},
          ${(item as Record<string, unknown>).taxonomyCategory as string ?? null},
          ${(item as Record<string, unknown>).origin as string ?? null},
          ${(item as Record<string, unknown>).description as string ?? null},
          ${(item as Record<string, unknown>).story as string ?? null},
          ${(item as Record<string, unknown>).image as string ?? null},
          ${(item as Record<string, unknown>).imageAlt as string ?? null},
          ${JSON.stringify(toArray(item.allergens))}::jsonb,
          ${JSON.stringify(toArray((item as Record<string, unknown>).roles as string[]))}::jsonb,
          ${JSON.stringify(toArray((item as Record<string, unknown>).descriptors as string[]))}::jsonb,
          ${JSON.stringify(toArray((item as Record<string, unknown>).tastingNotes as string[]))}::jsonb,
          ${JSON.stringify(toArray((item as Record<string, unknown>).texture as string[]))}::jsonb,
          ${JSON.stringify(toArray((item as Record<string, unknown>).process as string[]))}::jsonb,
          ${JSON.stringify(toArray((item as Record<string, unknown>).attributes as string[]))}::jsonb,
          ${JSON.stringify(toArray((item as Record<string, unknown>).usedAs as string[]))}::jsonb,
          ${JSON.stringify(toArray((item as Record<string, unknown>).availableMonths as number[]))}::jsonb,
          ${toBool(item.seasonal, false)},
          ${toBool((item as Record<string, unknown>).animalDerived, false)},
          ${toBool((item as Record<string, unknown>).vegetarian, true)},
          ${toBool((item as Record<string, unknown>).isOrganic, false)},
          ${(item as Record<string, unknown>).sourceName as string ?? null},
          ${(item as Record<string, unknown>).sourceType as string ?? null},
          ${(item as Record<string, unknown>).supplier as string ?? null},
          ${(item as Record<string, unknown>).farm as string ?? null},
          ${(item as Record<string, unknown>).status as string ?? 'active'},
          ${(item as Record<string, unknown>).createdAt ? new Date((item as Record<string, unknown>).createdAt as string) : sql`now()`},
          ${(item as Record<string, unknown>).updatedAt ? new Date((item as Record<string, unknown>).updatedAt as string) : sql`now()`}
        )`
      );
    }
  });

  afterAll(async () => {
    await db.execute(sql`DELETE FROM ingredients`);
    await client.end();
  });

  // Arbitrary for filter combinations
  const filterArb = fc.record({
    category: fc.option(fc.constantFrom(...allCategories), { nil: undefined }),
    allergen: fc.option(
      allAllergens.length > 0 ? fc.constantFrom(...allAllergens) : fc.constant('dairy'),
      { nil: undefined }
    ),
    seasonal: fc.option(fc.boolean(), { nil: undefined }),
  });

  it('should return the same ingredient set as in-memory filtering on the JSON source', async () => {
    await fc.assert(
      fc.asyncProperty(filterArb, async (filters) => {
        // Query via Postgres-backed list function
        const dbRows = await list(filters);
        const dbLegacyIds = dbRows.map((r) => r.legacyId).sort();

        // Apply same filters in-memory on JSON
        const jsonIds = filterJsonInMemory(ingredientsJson, filters).sort();

        // The sets must be identical
        expect(dbLegacyIds).toEqual(jsonIds);
      }),
      { numRuns: 100 }
    );
  });
});
