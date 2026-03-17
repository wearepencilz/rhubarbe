#!/usr/bin/env tsx
import { readFileSync } from 'fs';
import { getPool, closePool } from '../lib/db-game';

async function runMigration() {
  console.log('🚀 Running migration 007...\n');
  
  const sql = readFileSync('lib/game/migrations/007_add_contact_and_qr.sql', 'utf-8');
  const pool = getPool();
  
  try {
    await pool.query(sql);
    console.log('✅ Migration 007 completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

runMigration();
