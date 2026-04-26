import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as mediaQueries from '@/lib/db/queries/media';
import type { ErrorResponse } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await mediaQueries.getById(params.id);
    if (!item) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 401 });

  try {
    const body = await request.json();
    const updated = await mediaQueries.update(params.id, { alt: body.alt, tags: body.tags });
    if (!updated) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 401 });

  try {
    const deleted = await mediaQueries.remove(params.id);
    if (!deleted) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 404 });

    // Try to delete from Vercel Blob if applicable
    if (deleted.url.includes('blob.vercel-storage.com') && process.env.PUB_READ_WRITE_TOKEN) {
      try {
        const { del } = await import('@vercel/blob');
        await del(deleted.url, { token: process.env.PUB_READ_WRITE_TOKEN });
      } catch { /* best effort */ }
    }

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 500 });
  }
}
