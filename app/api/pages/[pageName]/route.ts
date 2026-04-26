import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as pageQueries from '@/lib/db/queries/pages';

export async function GET(
  request: NextRequest,
  { params }: { params: { pageName: string } }
) {
  try {
    const page = await pageQueries.getByName(params.pageName);
    const res = NextResponse.json(page?.content ?? {});
    res.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    return res;
  } catch (error) {
    return NextResponse.json({});
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { pageName: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slugEn, slugFr, ...content } = body;
    const page = await pageQueries.upsert(params.pageName, content, { title, slugEn, slugFr });
    return NextResponse.json(page.content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { pageName: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const deleted = await pageQueries.remove(params.pageName);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
