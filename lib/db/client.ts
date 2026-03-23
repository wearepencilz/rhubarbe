import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema';

// Load .env.local for standalone scripts (seeds, migrations)
// Next.js handles this automatically for the app runtime
dotenv.config({ path: '.env.local' });

// Determine environment
const isProduction = process.env.VERCEL === '1';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

// Get database URL from environment
const getDatabaseUrl = (): string => {
  // For tests, use a test database
  if (isTest) {
    return process.env.TEST_DATABASE_URL || 'postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test';
  }
  
  // For production, use Vercel Postgres URL
  if (isProduction) {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) {
      throw new Error('POSTGRES_URL or DATABASE_URL must be set in production');
    }
    return url;
  }
  
  // For development, use local PostgreSQL
  return process.env.DATABASE_URL || 'postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe';
};

// Create PostgreSQL client
const connectionString = getDatabaseUrl();
// Strip params that postgres.js doesn't understand (it treats them as part of the DB name)
// - channel_binding: Neon adds this, postgres.js doesn't support it
// - sslmode: we handle SSL via the `ssl` option instead
const cleanedConnectionString = connectionString
  .replace(/[?&](channel_binding|sslmode)=[^&]*/g, '')
  .replace(/\?&/, '?')
  .replace(/\?$/, '');

// Detect if connecting to a remote/cloud database that needs SSL
const needsSsl = cleanedConnectionString.includes('neon.tech') || cleanedConnectionString.includes('sslmode=require') || isProduction;

// Configure connection based on environment
const client = postgres(cleanedConnectionString, {
  // In production (Vercel), use connection pooling
  max: isProduction ? 10 : 1,
  // Idle timeout
  idle_timeout: isProduction ? 20 : undefined,
  // Connection timeout
  connect_timeout: 10,
  // SSL required for Neon and other cloud providers
  ssl: needsSsl ? 'require' : undefined,
});

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export the client for direct access if needed
export { client };
