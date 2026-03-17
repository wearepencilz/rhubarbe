#!/usr/bin/env tsx
/**
 * Add player_jump_sprite_url column to campaigns table
 * Run with: npx tsx scripts/add-player-jump-sprite-column.ts
 */

import { queryWithRetry } from '../lib/db-game';

async function addColumn() {
  try {
    console.log('🎮 Adding player_jump_sprite_url column to campaigns table...\n');

    // Add the column
    await queryWithRetry(`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS player_jump_sprite_url TEXT
    `);

    console.log('✅ Column added successfully!');
    console.log('\nYou can now upload jump sprites in the campaign editor.');

  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

// Run the migration
addColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
