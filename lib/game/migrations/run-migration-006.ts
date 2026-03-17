/**
 * Migration 006: Add winner_count field to campaigns
 * 
 * Run this script to add the configurable winner count field.
 * 
 * Usage: npx tsx lib/game/migrations/run-migration-006.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { raw } from '@/lib/db-game';

async function runMigration() {
  console.log('Starting migration 006: Add winner_count field...');

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'lib/game/migrations/006_add_winner_count.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute the migration
    await raw(sql, []);

    console.log('✅ Migration 006 completed successfully!');
    console.log('- Added winner_count column to campaigns (default: 100)');
    console.log('- Added valid_winner_count constraint');
  } catch (error) {
    console.error('❌ Migration 006 failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
