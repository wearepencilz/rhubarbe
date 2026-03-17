/**
 * Database migration runner
 * Run with: npx tsx lib/game/migrations/run-migration.ts
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getPool, closePool } from '../../db-game.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, '001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded: 001_initial_schema.sql');
    console.log('🔗 Connecting to database...\n');

    // Get database pool
    const pool = getPool();

    // Execute the migration
    console.log('⚙️  Executing migration...\n');
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Created tables:');
    console.log('   - campaigns');
    console.log('   - game_sessions');
    console.log('   - scores');
    console.log('   - rewards');
    console.log('   - validation_logs');
    console.log('   - analytics_events\n');

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('campaigns', 'game_sessions', 'scores', 'rewards', 'validation_logs', 'analytics_events')
      ORDER BY table_name;
    `);

    console.log('✓ Verified tables in database:');
    result.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n🎉 Database is ready for the game feature!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run the migration
runMigration();
