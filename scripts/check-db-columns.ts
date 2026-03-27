/**
 * Check which columns exist in the products table vs what the schema expects.
 * Usage: npx tsx scripts/check-db-columns.ts
 */
import { sql } from 'drizzle-orm';
import { db } from '../lib/db/client';

async function main() {
  const result = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'products'
    ORDER BY ordinal_position
  `);
  console.log('DB columns in products table:');
  for (const row of result) {
    console.log(' ', (row as any).column_name);
  }

  console.log('\n--- cake_pricing_tiers ---');
  const pt = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'cake_pricing_tiers'
    ORDER BY ordinal_position
  `);
  for (const row of pt) {
    console.log(' ', (row as any).column_name);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
