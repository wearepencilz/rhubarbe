/**
 * Database migration rollback
 * Run with: npx tsx lib/game/migrations/rollback-migration.ts
 */

import dotenv from 'dotenv';
import { getPool, closePool } from '../../db-game.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function rollbackMigration() {
  console.log('🔄 Starting database rollback...\n');

  try {
    console.log('🔗 Connecting to database...\n');
    const pool = getPool();

    console.log('⚙️  Dropping tables and functions...\n');

    // Drop tables in reverse order (respecting foreign key constraints)
    await pool.query(`
      -- Drop triggers first
      DROP TRIGGER IF EXISTS decrement_rewards_on_insert ON rewards;
      DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
      
      -- Drop functions
      DROP FUNCTION IF EXISTS decrement_campaign_rewards();
      DROP FUNCTION IF EXISTS update_updated_at_column();
      
      -- Drop tables (in reverse dependency order)
      DROP TABLE IF EXISTS analytics_events CASCADE;
      DROP TABLE IF EXISTS validation_logs CASCADE;
      DROP TABLE IF EXISTS rewards CASCADE;
      DROP TABLE IF EXISTS scores CASCADE;
      DROP TABLE IF EXISTS game_sessions CASCADE;
      DROP TABLE IF EXISTS campaigns CASCADE;
    `);

    console.log('✅ Rollback completed successfully!\n');
    console.log('📊 Dropped tables:');
    console.log('   - analytics_events');
    console.log('   - validation_logs');
    console.log('   - rewards');
    console.log('   - scores');
    console.log('   - game_sessions');
    console.log('   - campaigns\n');

    // Verify tables were dropped
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('campaigns', 'game_sessions', 'scores', 'rewards', 'validation_logs', 'analytics_events')
      ORDER BY table_name;
    `);

    if (result.rows.length === 0) {
      console.log('✓ All game tables have been removed from the database\n');
    } else {
      console.warn('⚠️  Some tables still exist:');
      result.rows.forEach((row) => {
        console.warn(`   - ${row.table_name}`);
      });
    }

    console.log('🎉 Database rollback complete!');
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run the rollback
rollbackMigration();
