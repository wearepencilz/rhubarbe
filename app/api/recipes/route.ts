import { NextRequest, NextResponse } from 'next/server';
import * as recipesQuery from '@/lib/db/queries/recipes';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const data = await recipesQuery.list();
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
    const created = await recipesQuery.create({
      slug: body.slug || null,
      slugFr: body.slugFr || null,
      slugEn: body.slugEn || null,
      title: body.title,
      content: body.content,
      category: body.category,
      coverImage: body.coverImage,
      status: body.status ?? 'draft',
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create recipe';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
