/**
 * Migration 004: Remove reward_remaining logic
 * 
 * Run this script to remove the reward_remaining column and trigger
 * since we now use completion order instead.
 * 
 * Usage: npx tsx lib/game/migrations/run-migration-004.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { raw } from '@/lib/db-game';

async function runMigration() {
  console.log('Starting migration 004: Remove reward_remaining logic...');

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'lib/game/migrations/004_remove_reward_remaining.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute the migration
    await raw(sql, []);

    console.log('✅ Migration 004 completed successfully!');
    console.log('- Removed decrement_rewards_on_insert trigger');
    console.log('- Removed decrement_campaign_rewards function');
    console.log('- Removed reward_remaining column from campaigns');
    console.log('- Removed valid_contact constraint from rewards');
  } catch (error) {
    console.error('❌ Migration 004 failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
