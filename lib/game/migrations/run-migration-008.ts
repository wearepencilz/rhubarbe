/**
 * Migration 008: Add walking sprite columns to campaigns
 * 
 * Run this script to add sprite animation fields to campaigns table
 * 
 * Usage: npx tsx lib/game/migrations/run-migration-008.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { raw } from '@/lib/db-game';

async function runMigration() {
  console.log('Starting migration 008: Add walking sprite columns...');

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'lib/game/migrations/008_add_walking_sprite_columns.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute the migration
    await raw(sql, []);

    console.log('✅ Migration 008 completed successfully!');
    console.log('- Added idle_sprite_url column to campaigns');
    console.log('- Added walk_sprite_url column to campaigns');
    console.log('- Added jump_sprite_url column to campaigns');
    console.log('- Added sprite_frame_width column to campaigns');
    console.log('- Added sprite_frame_height column to campaigns');
    console.log('- Added sprite_walk_frames column to campaigns');
    console.log('- Added sprite_frame_rate column to campaigns');
  } catch (error) {
    console.error('❌ Migration 008 failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
