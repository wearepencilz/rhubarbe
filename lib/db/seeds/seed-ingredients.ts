/**
 * Seed script for ingredients table.
 *
 * Reads public/data/backups/ingredients.json, maps camelCase JSON fields to
 * snake_case DB columns, stores the original `id` as `legacy_id`,
 * normalizes jsonb arrays, and inserts using onConflictDoNothing()
 * for idempotent seeding.
 *
 * Run: npx tsx lib/db/seeds/seed-ingredients.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { db, client } from '../client';
import { ingredients } from '../schema';

interface IngredientJson {
  id?: string;
  name: string;
  latinName?: string;
  category?: string;
  taxonomyCategory?: string;
  origin?: string;
  description?: string;
  story?: string;
  image?: string;
  imageAlt?: string;
  allergens?: string[];
  roles?: string[];
  descriptors?: string[];
  tastingNotes?: string[];
  texture?: string[];
  process?: string[];
  attributes?: string[];
  usedAs?: string[];
  availableMonths?: number[];
  seasonal?: boolean;
  animalDerived?: boolean;
  vegetarian?: boolean;
  isOrganic?: boolean;
  sourceName?: string;
  sourceType?: string;
  supplier?: string;
  farm?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  // Fields present in JSON but not mapped to DB
  dietaryFlags?: string[];
}

/** Ensure a value is a proper array (never undefined). */
function toArray<T>(val: T[] | undefined | null): T[] {
  return Array.isArray(val) ? val : [];
}

/** Coerce a value to boolean, defaulting to the provided fallback. */
function toBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  return fallback;
}

async function seedIngredients() {
  const filePath = resolve(process.cwd(), 'public/data/backups/ingredients.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data: IngredientJson[] = JSON.parse(raw);

  const rows = data.map((item) => ({
    legacyId: item.id ?? null,
    name: item.name,
    latinName: item.latinName ?? null,
    category: item.category ?? null,
    taxonomyCategory: item.taxonomyCategory ?? null,
    origin: item.origin ?? null,
    description: item.description ?? null,
    story: item.story ?? null,
    image: item.image ?? null,
    imageAlt: item.imageAlt ?? null,

    // Normalize jsonb arrays — always store a proper array, never undefined
    allergens: toArray(item.allergens),
    roles: toArray(item.roles),
    descriptors: toArray(item.descriptors),
    tastingNotes: toArray(item.tastingNotes),
    texture: toArray(item.texture),
    process: toArray(item.process),
    attributes: toArray(item.attributes),
    usedAs: toArray(item.usedAs),
    availableMonths: toArray(item.availableMonths),

    // Booleans — coerce with sensible defaults matching schema
    seasonal: toBool(item.seasonal, false),
    animalDerived: toBool(item.animalDerived, false),
    vegetarian: toBool(item.vegetarian, true),
    isOrganic: toBool(item.isOrganic, false),

    // Supplier fields
    sourceName: item.sourceName ?? null,
    sourceType: item.sourceType ?? null,
    supplier: item.supplier ?? null,
    farm: item.farm ?? null,

    // Status
    status: item.status ?? 'active',

    // Preserve original timestamps if present
    ...(item.createdAt ? { createdAt: new Date(item.createdAt) } : {}),
    ...(item.updatedAt ? { updatedAt: new Date(item.updatedAt) } : {}),
  }));

  if (rows.length === 0) {
    console.log('No ingredient rows to seed.');
    await client.end();
    return;
  }

  await db
    .insert(ingredients)
    .values(rows)
    .onConflictDoNothing();

  console.log(`Seeded ${rows.length} ingredient rows (duplicates skipped).`);
  await client.end();
}

seedIngredients().catch((err) => {
  console.error('Ingredient seed failed:', err);
  process.exit(1);
});
