import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { queryWithRetry, getPool } from '@/lib/db-game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('Running migration 002: Add asset management...');

    // Read SQL file
    const sqlPath = join(__dirname, '002_add_assets.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute migration
    await queryWithRetry(sql);

    console.log('✅ Migration 002 completed successfully!');
    console.log('\nAsset columns added to campaigns table:');
    console.log('  - player_sprite_url');
    console.log('  - icecream_sprite_url');
    console.log('  - ingredient_sprite_url');
    console.log('  - platform_sprite_url');
    console.log('  - background_url');
    console.log('  - hazard_sprite_url');
    console.log('  - asset_config');
    
    // Close pool
    const pool = getPool();
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
