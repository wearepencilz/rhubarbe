import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { queryWithRetry } from '@/lib/db-game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function rollbackMigration() {
  try {
    console.log('Rolling back migration 002: Remove asset management...');

    // Read SQL file
    const sqlPath = join(__dirname, '002_rollback.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute rollback
    await queryWithRetry(sql);

    console.log('✅ Migration 002 rolled back successfully!');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

rollbackMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
