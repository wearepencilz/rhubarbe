#!/usr/bin/env tsx
/**
 * Run platform sprites migration
 * Adds platform_wood_sprite_url, platform_stone_sprite_url, platform_ice_sprite_url, bridge_sprite_url columns
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or POSTGRES_URL environment variable not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log('🚀 Running platform sprites migration...\n');

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'lib/game/migrations/007_add_platform_sprites.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns' 
      AND column_name IN (
        'platform_wood_sprite_url',
        'platform_stone_sprite_url',
        'platform_ice_sprite_url',
        'bridge_sprite_url'
      )
      ORDER BY column_name;
    `);

    console.log('📋 New columns added:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✨ Platform sprites feature is ready to use!');
    console.log('   Upload sprites in the campaign editor under "Game Assets" tab.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
