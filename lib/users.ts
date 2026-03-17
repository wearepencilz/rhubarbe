/**
 * User management for the CMS admin system.
 * Users are stored in the DB (same adapter as other data).
 * Passwords are hashed with SHA-256 + salt (no bcrypt dep needed).
 */

import { db } from './db.js';
import crypto from 'crypto';

export type UserRole = 'super_admin' | 'admin' | 'editor';

export interface CmsUser {
  id: string;
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
};

function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateId(): string {
  return crypto.randomBytes(8).toString('hex');
}

async function getUsers(): Promise<CmsUser[]> {
  const data = await db.read('users.json');
  return data || [];
}

async function saveUsers(users: CmsUser[]): Promise<void> {
  await db.write('users.json', users);
}

export function toPublicUser(user: CmsUser): PublicUser {
  const { passwordHash, salt, ...pub } = user;
  return pub;
}

export async function getAllUsers(): Promise<PublicUser[]> {
  const users = await getUsers();
  return users.map(toPublicUser);
}

export async function getUserById(id: string): Promise<CmsUser | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function getUserByUsername(username: string): Promise<CmsUser | null> {
  const users = await getUsers();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export async function verifyPassword(user: CmsUser, password: string): Promise<boolean> {
  const hash = hashPassword(password, user.salt);
  return hash === user.passwordHash;
}

export async function createUser(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
}): Promise<PublicUser> {
  const users = await getUsers();

  // Check uniqueness
  if (users.find((u) => u.username.toLowerCase() === data.username.toLowerCase())) {
    throw new Error('Username already exists');
  }
  if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('Email already exists');
  }

  const salt = generateSalt();
  const now = new Date().toISOString();
  const user: CmsUser = {
    id: generateId(),
    name: data.name,
    email: data.email,
    username: data.username,
    passwordHash: hashPassword(data.password, salt),
    salt,
    role: data.role,
    createdAt: now,
    updatedAt: now,
    active: true,
  };

  users.push(user);
  await saveUsers(users);
  return toPublicUser(user);
}

export async function updateUser(
  id: string,
  data: Partial<{ name: string; email: string; username: string; role: UserRole; active: boolean }>
): Promise<PublicUser> {
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('User not found');

  // Check uniqueness if changing username/email
  if (data.username) {
    const conflict = users.find(
      (u) => u.username.toLowerCase() === data.username!.toLowerCase() && u.id !== id
    );
    if (conflict) throw new Error('Username already exists');
  }
  if (data.email) {
    const conflict = users.find(
      (u) => u.email.toLowerCase() === data.email!.toLowerCase() && u.id !== id
    );
    if (conflict) throw new Error('Email already exists');
  }

  users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
  await saveUsers(users);
  return toPublicUser(users[idx]);
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('User not found');

  const salt = generateSalt();
  users[idx] = {
    ...users[idx],
    salt,
    passwordHash: hashPassword(newPassword, salt),
    updatedAt: new Date().toISOString(),
  };
  await saveUsers(users);
}

export async function deleteUser(id: string): Promise<void> {
  const users = await getUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) throw new Error('User not found');
  await saveUsers(filtered);
}

/** Seed a default super_admin if no users exist */
export async function ensureDefaultUser(): Promise<void> {
  const users = await getUsers();
  if (users.length === 0) {
    await createUser({
      name: 'Admin',
      email: 'admin@janine.com',
      username: 'admin',
      password: 'admin123',
      role: 'super_admin',
    });
    console.log('✓ Default admin user created (admin / admin123)');
  }
}
