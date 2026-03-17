import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { getPool, closePool } from '../../db-game.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('Running migration 003: Add display fields...');
  
  try {
    // Read SQL file
    const migrationSQL = readFileSync(
      join(__dirname, '003_add_display_fields.sql'),
      'utf-8'
    );
    
    // Get database pool
    const pool = getPool();
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✓ Migration 003 completed successfully!');
    console.log('Added columns:');
    console.log('  - display_title (TEXT)');
    console.log('  - description (TEXT)');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await closePool();
  }
  
  process.exit(0);
}

runMigration();
