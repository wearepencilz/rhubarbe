/**
 * Migration 005: Remove minimum completion time constraint
 * 
 * Run this script to remove the 10-second minimum completion time check.
 * 
 * Usage: npx tsx lib/game/migrations/run-migration-005.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { raw } from '@/lib/db-game';

async function runMigration() {
  console.log('Starting migration 005: Remove minimum completion time constraint...');

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'lib/game/migrations/005_remove_min_completion_time.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute the migration
    await raw(sql, []);

    console.log('✅ Migration 005 completed successfully!');
    console.log('- Removed 10-second minimum completion time constraint');
    console.log('- Added non-negative completion time constraint');
  } catch (error) {
    console.error('❌ Migration 005 failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
