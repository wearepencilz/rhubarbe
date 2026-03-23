/**
 * Seed script for expanding products with migration columns and
 * populating the product_ingredients join table.
 *
 * Reads public/data/backups/products.json, upserts product rows with the new
 * migration columns (legacy_id, description, category, price, etc.),
 * then resolves ingredient references via legacy_id and inserts into
 * product_ingredients using onConflictDoNothing().
 *
 * Run: npx tsx lib/db/seeds/seed-products-expand.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { eq } from 'drizzle-orm';
import { db, client } from '../client';
import { products, ingredients, productIngredients } from '../schema';

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
  category?: string;
  description?: string;
  serves?: string | null;
  price?: number | null;
  currency?: string;
  allergens?: string[];
  image?: string;
  status?: string;
  title?: string;
  shortCardCopy?: string;
  tags?: string[];
  inventoryTracked?: boolean;
  onlineOrderable?: boolean;
  pickupOnly?: boolean;
  keyNotes?: string[];
  tastingNotes?: string;
  ingredients?: ProductIngredientJson[];
  availabilityMode?: string;
  defaultMinQuantity?: number;
  defaultQuantityStep?: number;
  defaultPickupRequired?: boolean;
  dateSelectionType?: string;
  slotSelectionType?: string;
  variantType?: string;
  variants?: Record<string, unknown>[];
  shopifyProductId?: string;
  shopifyProductHandle?: string;
  syncStatus?: string;
  lastSyncedAt?: string;
  syncError?: string | null;
  updatedAt?: string;
}

function toArray<T>(val: T[] | undefined | null): T[] {
  return Array.isArray(val) ? val : [];
}

async function seedProductsExpand() {
  const filePath = resolve(process.cwd(), 'public/data/backups/products.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data: ProductJson[] = JSON.parse(raw);

  if (data.length === 0) {
    console.log('No product rows to seed.');
    await client.end();
    return;
  }

  // Build a lookup map of ingredient legacy_id → uuid
  const allIngredients = await db.select({
    id: ingredients.id,
    legacyId: ingredients.legacyId,
  }).from(ingredients);

  const ingredientMap = new Map<string, string>();
  for (const ing of allIngredients) {
    if (ing.legacyId) {
      ingredientMap.set(ing.legacyId, ing.id);
    }
  }

  let upsertedCount = 0;
  let ingredientLinksCount = 0;
  const warnings: string[] = [];

  for (const item of data) {
    // Try to find existing product by slug
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, item.slug))
      .limit(1);

    const updateFields = {
      legacyId: item.id,
      name: item.name,
      title: item.title ?? null,
      description: item.description ?? null,
      category: item.category ?? null,
      price: item.price ?? null,
      currency: item.currency ?? 'CAD',
      image: item.image ?? null,
      serves: item.serves ?? null,
      shortCardCopy: item.shortCardCopy ?? null,
      tastingNotes: item.tastingNotes ?? null,
      status: item.status ?? null,
      allergens: toArray(item.allergens),
      tags: toArray(item.tags),
      keyNotes: toArray(item.keyNotes),
      variants: toArray(item.variants),
      inventoryTracked: item.inventoryTracked ?? false,
      availabilityMode: item.availabilityMode ?? 'always_available',
      dateSelectionType: item.dateSelectionType ?? 'none',
      slotSelectionType: item.slotSelectionType ?? 'none',
      variantType: item.variantType ?? null,
      shopifyProductId: item.shopifyProductId ?? null,
      shopifyProductHandle: item.shopifyProductHandle ?? null,
      syncStatus: item.syncStatus ?? null,
      lastSyncedAt: item.lastSyncedAt ? new Date(item.lastSyncedAt) : null,
      syncError: item.syncError ?? null,
      onlineOrderable: item.onlineOrderable ?? true,
      pickupOnly: item.pickupOnly ?? false,
      defaultMinQuantity: item.defaultMinQuantity ?? 1,
      defaultQuantityStep: item.defaultQuantityStep ?? 1,
      defaultPickupRequired: item.defaultPickupRequired ?? false,
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    };

    let productId: string;

    if (existing.length > 0) {
      // Update existing product with new columns
      productId = existing[0].id;
      await db
        .update(products)
        .set(updateFields)
        .where(eq(products.id, productId));
    } else {
      // Insert new product
      const [inserted] = await db
        .insert(products)
        .values({
          slug: item.slug,
          ...updateFields,
        })
        .returning({ id: products.id });
      productId = inserted.id;
    }

    upsertedCount++;

    // Populate product_ingredients join table
    const ingredientRefs = toArray(item.ingredients);
    for (const ref of ingredientRefs) {
      const ingredientUuid = ingredientMap.get(ref.ingredientId);
      if (!ingredientUuid) {
        warnings.push(
          `Product "${item.name}" (${item.slug}): unresolved ingredient reference "${ref.ingredientId}"`
        );
        continue;
      }

      await db
        .insert(productIngredients)
        .values({
          productId,
          ingredientId: ingredientUuid,
          displayOrder: ref.displayOrder ?? 0,
          quantity: ref.quantity || null,
          notes: ref.notes || null,
        })
        .onConflictDoNothing();

      ingredientLinksCount++;
    }
  }

  console.log(`Upserted ${upsertedCount} product rows.`);
  console.log(`Inserted ${ingredientLinksCount} product-ingredient links.`);

  if (warnings.length > 0) {
    console.warn(`\n⚠ ${warnings.length} unresolved ingredient reference(s):`);
    for (const w of warnings) {
      console.warn(`  - ${w}`);
    }
  }

  await client.end();
}

seedProductsExpand().catch((err) => {
  console.error('Product expand seed failed:', err);
  process.exit(1);
});
