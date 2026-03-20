/**
 * Database Connection Check Script
 * 
 * Verifies that the database connection is working correctly.
 * Useful for troubleshooting connection issues.
 * 
 * Usage:
 *   npx tsx scripts/check-db.ts
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const isProduction = process.env.VERCEL === '1';

async function checkConnection() {
  console.log('🔍 Checking database connection...');
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
  
  // Get database URL
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL or POSTGRES_URL must be set');
    console.error('\nFor local development:');
    console.error('  1. Start PostgreSQL: npm run docker:up');
    console.error('  2. Set DATABASE_URL in .env.local');
    process.exit(1);
  }
  
  // Hide password in output
  const displayUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`Database URL: ${displayUrl}`);
  
  try {
    // Create test connection
    const client = postgres(databaseUrl, { max: 1 });
    
    // Test query
    const result = await client`SELECT version()`;
    
    console.log('\n✅ Connection successful!');
    console.log(`PostgreSQL version: ${result[0].version.split(' ')[1]}`);
    
    // Close connection
    await client.end();
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:', error);
    console.error('\nTroubleshooting:');
    console.error('  1. Check if PostgreSQL is running: npm run docker:up');
    console.error('  2. Verify DATABASE_URL in .env.local');
    console.error('  3. Check Docker logs: npm run docker:logs');
    process.exit(1);
  }
}

checkConnection();
