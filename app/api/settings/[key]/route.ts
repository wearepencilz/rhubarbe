import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as settingsQuery from '@/lib/db/queries/settings';

export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const row = await settingsQuery.getByKey(params.key);
    return NextResponse.json(row ? { key: row.key, value: row.value } : { key: params.key, value: null });
  } catch {
    return NextResponse.json({ key: params.key, value: null });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { value } = await request.json();
    await settingsQuery.upsertMany({ [params.key]: value });
    return NextResponse.json({ key: params.key, value });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
