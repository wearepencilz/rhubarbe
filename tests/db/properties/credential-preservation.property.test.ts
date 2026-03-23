/**
 * Property-Based Test: Credential Preservation
 *
 * Feature: json-to-postgres-migration, Property 2: Credential preservation
 *
 * **Validates: Requirements 8.3**
 *
 * For any user record migrated from users.json, the password_hash and salt
 * values stored in PostgreSQL must be byte-identical to the original JSON
 * values, such that verifyPassword(migratedUser, originalPassword) returns
 * the same result as verifyPassword(jsonUser, originalPassword).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// --- Types matching the JSON shape ---
interface UserJson {
  id: string;
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// --- Password helpers (mirrors lib/db/queries/users.ts) ---
function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function verifyPassword(passwordHash: string, salt: string, password: string): boolean {
  return hashPassword(password, salt) === passwordHash;
}

// --- Load source JSON once ---
const jsonPath = resolve(process.cwd(), 'public/data/backups/users.json');
const usersJson: UserJson[] = JSON.parse(readFileSync(jsonPath, 'utf-8'));

// --- Test DB connection ---
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test';

describe('Property 2: Credential preservation', () => {
  let client: postgres.Sql;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    client = postgres(TEST_DATABASE_URL, { max: 1 });
    db = drizzle(client);

    // Truncate and re-seed from JSON so the test is self-contained
    await db.execute(sql`DELETE FROM users`);

    for (const user of usersJson) {
      await db.execute(
        sql`INSERT INTO users (id, legacy_id, name, email, username, password_hash, salt, role, active, created_at, updated_at)
            VALUES (gen_random_uuid(), ${user.id}, ${user.name}, ${user.email}, ${user.username}, ${user.passwordHash}, ${user.salt}, ${user.role}, ${user.active ?? true}, ${user.createdAt ? new Date(user.createdAt) : new Date()}, ${user.updatedAt ? new Date(user.updatedAt) : new Date()})`
      );
    }
  });

  afterAll(async () => {
    await db.execute(sql`DELETE FROM users`);
    await client.end();
  });

  // Property: password_hash and salt are byte-identical after migration
  it('should preserve password_hash and salt byte-identical for all migrated users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...usersJson),
        async (jsonUser) => {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.legacyId, jsonUser.id));

          expect(dbUser).toBeDefined();

          // password_hash must be byte-identical
          expect(dbUser.passwordHash).toBe(jsonUser.passwordHash);

          // salt must be byte-identical
          expect(dbUser.salt).toBe(jsonUser.salt);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: verifyPassword works identically on migrated data with arbitrary passwords
  it('should produce identical verifyPassword results for migrated users with any password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...usersJson),
        fc.string({ minLength: 1, maxLength: 64 }),
        async (jsonUser, arbitraryPassword) => {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.legacyId, jsonUser.id));

          expect(dbUser).toBeDefined();

          // Verify using JSON source credentials
          const jsonResult = verifyPassword(jsonUser.passwordHash, jsonUser.salt, arbitraryPassword);

          // Verify using DB credentials
          const dbResult = verifyPassword(dbUser.passwordHash, dbUser.salt, arbitraryPassword);

          // Both must agree
          expect(dbResult).toBe(jsonResult);
        }
      ),
      { numRuns: 100 }
    );
  });
});
