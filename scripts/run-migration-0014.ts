/**
 * Run migration 0014: Add shopify_variant_id to cake_pricing_tiers
 * Usage: npx tsx scripts/run-migration-0014.ts
 */
import { sql } from 'drizzle-orm';
import { db } from '../lib/db/client';

async function main() {
  console.log('Running migration 0014: add shopify_variant_id to cake_pricing_tiers...');

  await db.execute(sql`
    ALTER TABLE "cake_pricing_tiers"
    ADD COLUMN IF NOT EXISTS "shopify_variant_id" text
  `);

  console.log('✓ Migration complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
