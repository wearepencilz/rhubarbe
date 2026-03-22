import { NextResponse } from 'next/server';
import { db } from '@/lib/db.js';

// GET /api/auth/reset-users — one-time reset, delete after use
export async function GET() {
  try {
    // Clear the users key so ensureDefaultUser re-seeds on next login
    await db.write('users.json', []);
    return NextResponse.json({ ok: true, message: 'Users cleared. Next login will create default admin (admin / admin123).' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
