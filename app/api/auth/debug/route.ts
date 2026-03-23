import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

export async function GET() {
  const checks: Record<string, unknown> = {
    VERCEL: process.env.VERCEL,
    AUTH_SECRET_SET: !!process.env.AUTH_SECRET,
    NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    POSTGRES_URL_SET: !!process.env.POSTGRES_URL,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
  };

  try {
    const rows = await db.select({ id: users.id, username: users.username }).from(users);
    checks.db_connected = true;
    checks.user_count = rows.length;
    checks.usernames = rows.map((r) => r.username);
  } catch (e: any) {
    checks.db_connected = false;
    checks.db_error = e.message || String(e);
    checks.db_cause = e.cause?.message || undefined;
  }

  return NextResponse.json(checks);
}
