/**
 * Migration 007: Add platform sprite fields
 * 
 * Run this script to add platform_wood_sprite_url, platform_stone_sprite_url,
 * platform_ice_sprite_url, and bridge_sprite_url columns.
 * 
 * Usage: npx tsx lib/game/migrations/run-migration-007-platform-sprites.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { raw } from '@/lib/db-game';

async function runMigration() {
  console.log('Starting migration 007: Add platform sprite fields...');

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'lib/game/migrations/007_add_platform_sprites.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute the migration
    await raw(sql, []);

    console.log('✅ Migration 007 (platform sprites) completed successfully!');
    console.log('- Added platform_wood_sprite_url column');
    console.log('- Added platform_stone_sprite_url column');
    console.log('- Added platform_ice_sprite_url column');
    console.log('- Added bridge_sprite_url column');
    console.log('\n📋 You can now upload platform sprites in the campaign editor!');
    console.log('   Go to /admin/games/[id] → Game Assets tab → Platform Sprites section');
  } catch (error) {
    console.error('❌ Migration 007 (platform sprites) failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
