import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

// ── Types ──────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'editor';

export interface CmsUser {
  id: string;
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  createdAt: Date | string;
  updatedAt: Date | string;
  active: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: Date | string;
  updatedAt: Date | string;
  active: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────

function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    role: row.role as UserRole,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    active: row.active,
  };
}

function toCmsUser(row: typeof users.$inferSelect): CmsUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    passwordHash: row.passwordHash,
    salt: row.salt,
    role: row.role as UserRole,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    active: row.active,
  };
}

// ── Query helpers ──────────────────────────────────────────────────

export async function byUsername(username: string): Promise<CmsUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`);
  return row ? toCmsUser(row) : null;
}

export async function byEmail(email: string): Promise<CmsUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`);
  return row ? toCmsUser(row) : null;
}

export async function byId(id: string): Promise<CmsUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));
  return row ? toCmsUser(row) : null;
}

export async function list(): Promise<PublicUser[]> {
  const rows = await db.select().from(users);
  return rows.map(toPublicUser);
}

export async function create(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
}): Promise<PublicUser> {
  // Check uniqueness
  const existingUsername = await byUsername(data.username);
  if (existingUsername) throw new Error('Username already exists');

  const existingEmail = await byEmail(data.email);
  if (existingEmail) throw new Error('Email already exists');

  const salt = generateSalt();
  const [created] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      username: data.username,
      passwordHash: hashPassword(data.password, salt),
      salt,
      role: data.role,
      active: true,
    })
    .returning();

  return toPublicUser(created);
}

export async function update(
  id: string,
  data: Partial<{ name: string; email: string; username: string; role: UserRole; active: boolean }>
): Promise<PublicUser> {
  // Check uniqueness if changing username/email
  if (data.username) {
    const conflict = await byUsername(data.username);
    if (conflict && conflict.id !== id) throw new Error('Username already exists');
  }
  if (data.email) {
    const conflict = await byEmail(data.email);
    if (conflict && conflict.id !== id) throw new Error('Email already exists');
  }

  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!updated) throw new Error('User not found');
  return toPublicUser(updated);
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  const salt = generateSalt();
  const [updated] = await db
    .update(users)
    .set({
      salt,
      passwordHash: hashPassword(newPassword, salt),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  if (!updated) throw new Error('User not found');
}

export async function remove(id: string): Promise<void> {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  if (!deleted) throw new Error('User not found');
}

export async function verifyPassword(user: CmsUser, password: string): Promise<boolean> {
  const hash = hashPassword(password, user.salt);
  return hash === user.passwordHash;
}

/** Seed a default super_admin if no users exist */
export async function ensureDefaultUser(): Promise<void> {
  const [row] = await db.select({ id: users.id }).from(users).limit(1);
  if (!row) {
    await create({
      name: 'Admin',
      email: 'admin@janine.com',
      username: 'admin',
      password: 'admin123',
      role: 'super_admin',
    });
    console.log('✓ Default admin user created (admin / admin123)');
  }
}
