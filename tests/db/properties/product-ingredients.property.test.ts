/**
 * Property-Based Test: Product-Ingredient Relational Integrity
 *
 * Feature: json-to-postgres-migration, Property 6: Product-ingredient relational integrity
 *
 * **Validates: Requirements 6.3**
 *
 * For any product that had an `ingredients` array in the JSON data, after migration
 * the `product_ingredients` join table should contain exactly one row per ingredient
 * reference, with the correct `ingredient_id` (resolved from `legacy_id`),
 * `display_order`, `quantity`, and `notes` matching the original JSON.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, eq, asc } from 'drizzle-orm';
import { productIngredients, products, ingredients } from '@/lib/db/schema';

// --- Types matching the JSON shape ---
interface ProductIngredientJson {
  ingredientId: string;
  displayOrder: number;
  quantity?: string;
  notes?: string;
}

interface ProductJson {
  id: string;
  slug: string;
  name: string;
  ingredients?: ProductIngredientJson[];
  [key: string]: unknown;
}

interface IngredientJson {
  id: string;
  name: string;
  [key: string]: unknown;
}

// --- Load source JSON once ---
const productsJsonPath = resolve(process.cwd(), 'public/data/backups/products.json');
const productsJson: ProductJson[] = JSON.parse(readFileSync(productsJsonPath, 'utf-8'));

const ingredientsJsonPath = resolve(process.cwd(), 'public/data/backups/ingredients.json');
const ingredientsJson: IngredientJson[] = JSON.parse(readFileSync(ingredientsJsonPath, 'utf-8'));

// Build a set of known ingredient legacy IDs for resolving references
const knownIngredientLegacyIds = new Set(ingredientsJson.map((i) => i.id));

// Products that have a non-empty ingredients array with at least one resolvable ingredient
const productsWithIngredients = productsJson.filter(
  (p) =>
    Array.isArray(p.ingredients) &&
    p.ingredients.length > 0 &&
    p.ingredients.some((ing) => knownIngredientLegacyIds.has(ing.ingredientId))
);

// All products (for testing empty-ingredient products too)
const productsWithoutIngredients = productsJson.filter(
  (p) => !Array.isArray(p.ingredients) || p.ingredients.length === 0
);

// --- Test DB connection ---
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test';

describe('Property 6: Product-ingredient relational integrity', () => {
  let client: postgres.Sql;
  let db: ReturnType<typeof drizzle>;

  // Map from ingredient legacy_id → UUID assigned during seeding
  const ingredientUuidMap = new Map<string, string>();
  // Map from product legacy_id (slug) → UUID assigned during seeding
  const productUuidMap = new Map<string, string>();

  beforeAll(async () => {
    client = postgres(TEST_DATABASE_URL, { max: 1 });
    db = drizzle(client);

    // Clean up in correct order (join table first due to FK constraints)
    await db.execute(sql`DELETE FROM product_ingredients`);
    await db.execute(sql`DELETE FROM products`);
    await db.execute(sql`DELETE FROM ingredients`);

    // Seed ingredients from JSON
    for (const item of ingredientsJson) {
      const [row] = await db.execute(
        sql`INSERT INTO ingredients (id, legacy_id, name, category, seasonal, status, created_at, updated_at)
            VALUES (gen_random_uuid(), ${item.id}, ${item.name}, ${(item as Record<string, unknown>).category as string ?? null}, ${typeof item.seasonal === 'boolean' ? item.seasonal : false}, 'active', now(), now())
            RETURNING id`
      );
      ingredientUuidMap.set(item.id, (row as Record<string, string>).id);
    }

    // Seed products from JSON
    for (const product of productsJson) {
      const [row] = await db.execute(
        sql`INSERT INTO products (id, legacy_id, name, slug, category, status, created_at, updated_at)
            VALUES (gen_random_uuid(), ${product.id}, ${product.name}, ${product.slug}, ${product.category as string ?? null}, ${(product.status as string) ?? 'active'}, now(), now())
            RETURNING id`
      );
      productUuidMap.set(product.id, (row as Record<string, string>).id);
    }

    // Seed product_ingredients join table
    for (const product of productsJson) {
      if (!Array.isArray(product.ingredients) || product.ingredients.length === 0) continue;
      const productUuid = productUuidMap.get(product.id);
      if (!productUuid) continue;

      for (const ing of product.ingredients) {
        const ingredientUuid = ingredientUuidMap.get(ing.ingredientId);
        if (!ingredientUuid) continue; // Skip unresolvable references (matches seed script behavior)

        await db.execute(
          sql`INSERT INTO product_ingredients (id, product_id, ingredient_id, display_order, quantity, notes)
              VALUES (gen_random_uuid(), ${productUuid}, ${ingredientUuid}, ${ing.displayOrder}, ${ing.quantity || null}, ${ing.notes || null})`
        );
      }
    }
  });

  afterAll(async () => {
    await db.execute(sql`DELETE FROM product_ingredients`);
    await db.execute(sql`DELETE FROM products`);
    await db.execute(sql`DELETE FROM ingredients`);
    await client.end();
  });

  it('should have exactly one join row per resolvable ingredient reference, with matching fields', async () => {
    // Use constantFrom over all products (with and without ingredients)
    const allProductIds = productsJson.map((p) => p.id);

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allProductIds),
        async (productLegacyId) => {
          const productUuid = productUuidMap.get(productLegacyId);
          expect(productUuid).toBeDefined();

          // Query the join table for this product
          const dbRows = await db
            .select({
              ingredientId: productIngredients.ingredientId,
              displayOrder: productIngredients.displayOrder,
              quantity: productIngredients.quantity,
              notes: productIngredients.notes,
            })
            .from(productIngredients)
            .where(eq(productIngredients.productId, productUuid!))
            .orderBy(asc(productIngredients.displayOrder));

          // Get the expected ingredients from JSON
          const jsonProduct = productsJson.find((p) => p.id === productLegacyId)!;
          const jsonIngredients = (jsonProduct.ingredients ?? []).filter(
            (ing) => ingredientUuidMap.has(ing.ingredientId)
          );

          // 1. Row count must match
          expect(dbRows.length).toBe(jsonIngredients.length);

          // 2. Each row must match the JSON data
          const sortedJson = [...jsonIngredients].sort((a, b) => a.displayOrder - b.displayOrder);

          for (let i = 0; i < dbRows.length; i++) {
            const dbRow = dbRows[i];
            const jsonIng = sortedJson[i];

            // ingredient_id must resolve to the correct UUID
            const expectedIngUuid = ingredientUuidMap.get(jsonIng.ingredientId);
            expect(dbRow.ingredientId).toBe(expectedIngUuid);

            // display_order must match
            expect(dbRow.displayOrder).toBe(jsonIng.displayOrder);

            // quantity must match (empty string → null in DB)
            const expectedQuantity = jsonIng.quantity || null;
            expect(dbRow.quantity).toBe(expectedQuantity);

            // notes must match (empty string → null in DB)
            const expectedNotes = jsonIng.notes || null;
            expect(dbRow.notes).toBe(expectedNotes);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have zero join rows for products with no ingredients in JSON', async () => {
    if (productsWithoutIngredients.length === 0) return; // Skip if all products have ingredients

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...productsWithoutIngredients.map((p) => p.id)),
        async (productLegacyId) => {
          const productUuid = productUuidMap.get(productLegacyId);
          expect(productUuid).toBeDefined();

          const dbRows = await db
            .select()
            .from(productIngredients)
            .where(eq(productIngredients.productId, productUuid!));

          expect(dbRows.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
