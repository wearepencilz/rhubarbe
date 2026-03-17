import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { pageName: string } }
) {
  try {
    const pages = (await db.read('pages.json')) || {};
    return NextResponse.json(pages[params.pageName] || {});
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
    const pages = (await db.read('pages.json')) || {};
    pages[params.pageName] = body;
    await db.write('pages.json', pages);
    return NextResponse.json(pages[params.pageName]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
