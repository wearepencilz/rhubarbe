/**
 * Seed script for users table.
 *
 * Reads public/data/backups/users.json, preserves password_hash and salt
 * byte-identical for auth continuity, stores the original hex ID
 * as legacy_id, and inserts using onConflictDoNothing() for
 * idempotent seeding.
 *
 * Run: npx tsx lib/db/seeds/seed-users.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { db, client } from '../client';
import { users } from '../schema';

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

async function seedUsers() {
  const filePath = resolve(process.cwd(), 'public/data/backups/users.json');
  const raw = readFileSync(filePath, 'utf-8');
  const data: UserJson[] = JSON.parse(raw);

  const rows = data.map((user) => ({
    legacyId: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    // Preserve password_hash and salt byte-identical — no transformation
    passwordHash: user.passwordHash,
    salt: user.salt,
    role: user.role,
    active: user.active ?? true,
    // Preserve original timestamps if present
    ...(user.createdAt ? { createdAt: new Date(user.createdAt) } : {}),
    ...(user.updatedAt ? { updatedAt: new Date(user.updatedAt) } : {}),
  }));

  if (rows.length === 0) {
    console.log('No user rows to seed.');
    await client.end();
    return;
  }

  await db
    .insert(users)
    .values(rows)
    .onConflictDoNothing();

  console.log(`Seeded ${rows.length} user rows (duplicates skipped).`);
  await client.end();
}

seedUsers().catch((err) => {
  console.error('User seed failed:', err);
  process.exit(1);
});
