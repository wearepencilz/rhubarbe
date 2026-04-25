import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// ── Types ──────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'editor';

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

// ── Query helpers ──────────────────────────────────────────────────

async function byUsername(username: string): Promise<PublicUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`);
  return row ? toPublicUser(row) : null;
}

async function byEmail(email: string): Promise<PublicUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`);
  return row ? toPublicUser(row) : null;
}

export async function list(): Promise<PublicUser[]> {
  const rows = await db.select().from(users);
  return rows.map(toPublicUser);
}

export async function create(data: {
  name: string;
  email: string;
  username: string;
  role: UserRole;
}): Promise<PublicUser> {
  const existingUsername = await byUsername(data.username);
  if (existingUsername) throw new Error('Username already exists');

  const existingEmail = await byEmail(data.email);
  if (existingEmail) throw new Error('Email already exists');

  const [created] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      username: data.username,
      passwordHash: '',
      salt: '',
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

export async function remove(id: string): Promise<void> {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  if (!deleted) throw new Error('User not found');
}

