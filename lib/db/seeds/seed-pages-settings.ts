/**
 * Seed script for pages and settings tables.
 *
 * Reads public/data/backups/pages.json — one row per page name with full content as jsonb.
 * Reads public/data/backups/settings.json — one row per setting key.
 * Uses onConflictDoNothing() for idempotent seeding.
 *
 * Run: npx tsx lib/db/seeds/seed-pages-settings.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { db, client } from '../client';
import { pages, settings } from '../schema';

type PagesJson = Record<string, Record<string, unknown>>;
type SettingsJson = Record<string, unknown>;

async function seedPagesAndSettings() {
  // --- Seed pages ---
  const pagesPath = resolve(process.cwd(), 'public/data/backups/pages.json');
  const pagesRaw = readFileSync(pagesPath, 'utf-8');
  const pagesData: PagesJson = JSON.parse(pagesRaw);

  const pageRows = Object.entries(pagesData).map(([pageName, content]) => ({
    pageName,
    content,
  }));

  if (pageRows.length > 0) {
    await db
      .insert(pages)
      .values(pageRows)
      .onConflictDoNothing();
    console.log(`Seeded ${pageRows.length} page rows (duplicates skipped).`);
  } else {
    console.log('No page rows to seed.');
  }

  // --- Seed settings ---
  const settingsPath = resolve(process.cwd(), 'public/data/backups/settings.json');
  const settingsRaw = readFileSync(settingsPath, 'utf-8');
  const settingsData: SettingsJson = JSON.parse(settingsRaw);

  const settingRows = Object.entries(settingsData).map(([key, value]) => ({
    key,
    value,
  }));

  if (settingRows.length > 0) {
    await db
      .insert(settings)
      .values(settingRows)
      .onConflictDoNothing();
    console.log(`Seeded ${settingRows.length} setting rows (duplicates skipped).`);
  } else {
    console.log('No setting rows to seed.');
  }

  await client.end();
}

seedPagesAndSettings().catch((err) => {
  console.error('Pages/settings seed failed:', err);
  process.exit(1);
});
