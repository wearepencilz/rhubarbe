import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const checks: Record<string, unknown> = {
    VERCEL: process.env.VERCEL,
    AUTH_SECRET_SET: !!process.env.AUTH_SECRET,
    AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length,
    NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    POSTGRES_URL_SET: !!process.env.POSTGRES_URL,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
  };

  // Check cookies
  const cookieNames = request.cookies.getAll().map(c => c.name);
  checks.cookies = cookieNames;
  checks.has_session_cookie = cookieNames.some(n => n.includes('next-auth') || n.includes('authjs'));

  // Try to read JWT token (same params as middleware)
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      salt: '__Secure-authjs.session-token',
      cookieName: '__Secure-authjs.session-token',
    });
    checks.jwt_token_secure = token ? { id: token.id, username: token.username } : null;
  } catch (e: any) {
    checks.jwt_error_secure = e.message;
  }

  // Also try without secure prefix (for localhost/http)
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      salt: 'authjs.session-token',
      cookieName: 'authjs.session-token',
    });
    checks.jwt_token_plain = token ? { id: token.id, username: token.username } : null;
  } catch (e: any) {
    checks.jwt_error_plain = e.message;
  }

  // Try default next-auth getToken (no overrides)
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    checks.jwt_token_default = token ? { id: token.id, username: token.username } : null;
  } catch (e: any) {
    checks.jwt_error_default = e.message;
  }

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
