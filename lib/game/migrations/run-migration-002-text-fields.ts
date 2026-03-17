/**
 * Migration 002: Add campaign text fields
 * 
 * Run this script to add display_title, description, and reward fields.
 * 
 * Usage: npx tsx lib/game/migrations/run-migration-002-text-fields.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { raw } from '@/lib/db-game';

async function runMigration() {
  console.log('Starting migration 002: Add campaign text fields...');

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'lib/game/migrations/002_add_campaign_text_fields.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute the migration
    await raw(sql, []);

    console.log('✅ Migration 002 (text fields) completed successfully!');
    console.log('- Added display_title column');
    console.log('- Added description column');
    console.log('- Added ticket_success_title column');
    console.log('- Added ticket_success_message column');
    console.log('- Added reward_type column');
    console.log('- Added reward_description column');
  } catch (error) {
    console.error('❌ Migration 002 (text fields) failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
