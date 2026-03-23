/**
 * Seed script for taxonomy_values table.
 *
 * Reads public/data/backups/taxonomies.json, flattens category→values into rows,
 * and inserts them into the taxonomy_values table using onConflictDoNothing()
 * for idempotent seeding.
 *
 * Run: npx tsx lib/db/seeds/seed-taxonomies.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { db, client } from '../client';
import { taxonomyValues } from '../schema';

interface TaxonomyEntry {
  id?: string;
  label: string;
  value: string;
  description?: string;
  sortOrder?: number;
  archived?: boolean;
}

type TaxonomiesJson = Record<string, TaxonomyEntry[]>;

async function seedTaxonomies() {
  const filePath = resolve(process.cwd(), 'public/data/backups/taxonomies.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data: TaxonomiesJson = JSON.parse(raw);

  const rows = Object.entries(data).flatMap(([category, entries]) =>
    entries.map((entry) => ({
      category,
      label: entry.label,
      value: entry.value,
      description: entry.description ?? null,
      sortOrder: entry.sortOrder ?? 0,
      archived: entry.archived ?? false,
    }))
  );

  if (rows.length === 0) {
    console.log('No taxonomy rows to seed.');
    await client.end();
    return;
  }

  const result = await db
    .insert(taxonomyValues)
    .values(rows)
    .onConflictDoNothing({ target: [taxonomyValues.category, taxonomyValues.value] });

  console.log(`Seeded ${rows.length} taxonomy rows (duplicates skipped).`);
  await client.end();
}

seedTaxonomies().catch((err) => {
  console.error('Taxonomy seed failed:', err);
  process.exit(1);
});
