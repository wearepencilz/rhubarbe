import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

// GET /api/auth/reset-users — one-time reset, delete after use
export async function GET() {
  try {
    // Clear all users so ensureDefaultUser re-seeds on next login
    await db.delete(users);
    return NextResponse.json({ ok: true, message: 'Users cleared. Next login will create default admin (admin / admin123).' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
