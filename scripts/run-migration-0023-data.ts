/**
 * Data Migration for 0023: Catering Fields
 *
 * Idempotent script that:
 * 1. Backfills dietaryTags/temperatureTags on existing catering products
 * 2. Copies product-level allergens to cake_variants
 * 3. Seeds cateringOrderingRules and cateringLeadTimeDays in settings
 */

import { db } from '@/lib/db/client';
import { products, cakeVariants } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import * as settingsQueries from '@/lib/db/queries/settings';

async function run() {
  console.log('🔄 Running data migration 0023...');

  // Phase 1: Backfill catering products
  const cateringProducts = await db
    .select({ id: products.id, name: products.name, dietaryTags: products.dietaryTags, temperatureTags: products.temperatureTags })
    .from(products)
    .where(eq(products.volumeEnabled, true));

  let backfilled = 0;
  for (const p of cateringProducts) {
    if (p.dietaryTags === null || p.temperatureTags === null) {
      await db.update(products).set({
        dietaryTags: p.dietaryTags ?? [],
        temperatureTags: p.temperatureTags ?? [],
        updatedAt: new Date(),
      }).where(eq(products.id, p.id));
      backfilled++;
    }
  }
  console.log(`✓ Backfilled ${backfilled}/${cateringProducts.length} catering products (dietaryTags, temperatureTags).`);

  // Log products needing manual cateringType assignment
  const needsType = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(and(eq(products.volumeEnabled, true), isNull(products.cateringType)));
  if (needsType.length > 0) {
    console.log(`⚠️  ${needsType.length} catering products need manual cateringType assignment:`);
    for (const p of needsType) console.log(`   - ${p.name} (${p.id})`);
  }

  // Phase 2: Copy product-level allergens to cake_variants
  const cakeProducts = await db
    .select({ id: products.id, name: products.name, allergens: products.allergens })
    .from(products)
    .where(eq(products.cakeEnabled, true));

  let cakeMigrated = 0;
  for (const p of cakeProducts) {
    const allergens = p.allergens ?? [];
    const result = await db.update(cakeVariants).set({ allergens })
      .where(and(eq(cakeVariants.productId, p.id), isNull(cakeVariants.allergens)));
    cakeMigrated++;
  }
  console.log(`✓ Migrated allergens for ${cakeMigrated} cake products to their variants.`);

  // Phase 3: Seed settings
  const existingRules = await settingsQueries.getByKey('cateringOrderingRules');
  if (!existingRules) {
    await settingsQueries.upsertMany({
      cateringOrderingRules: {
        brunch: { minQuantity: 12, quantityStep: 6, label: { en: 'Brunch', fr: 'Brunch' } },
        lunch: { minQuantity: 6, quantityStep: 1, label: { en: 'Lunch', fr: 'Lunch' } },
        dinatoire: { minQuantity: 3, quantityStep: 1, label: { en: 'Dînatoire', fr: 'Dînatoire' } },
      },
    });
    console.log('✓ Seeded cateringOrderingRules defaults.');
  } else {
    console.log('⏭  cateringOrderingRules already exists, skipping.');
  }

  const existingLeadTime = await settingsQueries.getByKey('cateringLeadTimeDays');
  if (!existingLeadTime) {
    await settingsQueries.upsertMany({ cateringLeadTimeDays: 28 });
    console.log('✓ Seeded cateringLeadTimeDays default (28 days).');
  } else {
    console.log('⏭  cateringLeadTimeDays already exists, skipping.');
  }

  console.log('✅ Data migration 0023 complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Data migration 0023 failed:', err);
  process.exit(1);
});
