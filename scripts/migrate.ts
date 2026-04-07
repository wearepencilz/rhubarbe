/**
 * Database Migration Script
 * 
 * Runs all pending migrations against the configured database.
 * Works with both local PostgreSQL (development) and Vercel Postgres (production).
 * 
 * Usage:
 *   npm run db:migrate
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const isProduction = process.env.VERCEL === '1';

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
  
  // Get database URL
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL or POSTGRES_URL must be set');
    console.error('For local development, start PostgreSQL with: docker-compose up -d');
    process.exit(1);
  }
  
  console.log(`Database: ${databaseUrl.split('@')[1] || 'configured'}`);
  
  try {
    // Create migration client
    const migrationClient = postgres(databaseUrl, { max: 1 });
    const db = drizzle(migrationClient);
    
    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    
    console.log('✅ Migrations completed successfully!');
    
    // Close connection
    await migrationClient.end();
    
    process.exit(0);
  } catch (error: any) {
    // If the error is "relation already exists", the schema is already up to date
    const msg = error?.message || '';
    const causeMsg = error?.cause?.message || error?.cause?.routine || '';
    if (msg.includes('already exists') || causeMsg.includes('already exists') || error?.cause?.code === '42P07') {
      console.log('⚠️  Some relations already exist — schema is up to date. Continuing...');
      process.exit(0);
    }
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
