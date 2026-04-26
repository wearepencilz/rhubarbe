import { NextRequest, NextResponse } from 'next/server';
import * as journalQuery from '@/lib/db/queries/journal';
import { auth } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await journalQuery.getByIdOrSlug(params.id);
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const updated = await journalQuery.update(params.id, {
      slug: body.slug || null,
      slugFr: body.slugFr || null,
      slugEn: body.slugEn || null,
      title: body.title,
      subtitle: body.subtitle,
      content: body.content,
      category: body.category,
      tags: body.tags,
      coverImage: body.coverImage,
      status: body.status,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
    });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const deleted = await journalQuery.remove(params.id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
