import { NextRequest, NextResponse } from 'next/server';
import * as journalQuery from '@/lib/db/queries/journal';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const data = await journalQuery.list();
    const res = NextResponse.json(data);
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res;
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const created = await journalQuery.create({
      slug: body.slug,
      slugFr: body.slugFr,
      slugEn: body.slugEn,
      title: body.title,
      subtitle: body.subtitle,
      content: body.content,
      category: body.category,
      tags: body.tags,
      coverImage: body.coverImage,
      status: body.status ?? 'draft',
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create journal entry';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
