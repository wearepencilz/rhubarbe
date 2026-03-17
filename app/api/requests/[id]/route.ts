import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const requests = (await db.read('requests.json')) || [];
  const idx = requests.findIndex((r: any) => String(r.id) === params.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  requests[idx] = { ...requests[idx], ...body };
  await db.write('requests.json', requests);
  return NextResponse.json(requests[idx]);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = (await db.read('requests.json')) || [];
  const filtered = requests.filter((r: any) => String(r.id) !== params.id);
  await db.write('requests.json', filtered);
  return NextResponse.json({ ok: true });
}
