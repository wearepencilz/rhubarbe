/**
 * Run migration 0013: Create cake_pricing_tiers table
 * Usage: npx tsx scripts/run-migration-0013.ts
 */
import { sql } from 'drizzle-orm';
import { db } from '../lib/db/client';

async function main() {
  console.log('Running migration 0013: cake_pricing_tiers...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "cake_pricing_tiers" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "product_id" uuid NOT NULL,
      "min_people" integer NOT NULL,
      "price_in_cents" integer NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "cake_pricing_tiers_product_id_products_id_fk"
        FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "cake_pricing_tiers_product_id_idx"
    ON "cake_pricing_tiers" USING btree ("product_id")
  `);

  console.log('✓ Migration complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
