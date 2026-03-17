import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const data = await db.read('settings.json');
    return NextResponse.json(data || { logo: '', email: '', companyName: '' });
  } catch (error) {
    return NextResponse.json({ logo: '', email: '', companyName: '' });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Never allow taxonomies to be overwritten via the settings route.
    // Taxonomies live in taxonomies.json and are managed via /api/settings/taxonomies.
    const { taxonomies: _dropped, ...safeBody } = body;
    const existing = await db.read('settings.json') || {};
    await db.write('settings.json', { ...existing, ...safeBody });
    return NextResponse.json({ ...existing, ...safeBody });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
