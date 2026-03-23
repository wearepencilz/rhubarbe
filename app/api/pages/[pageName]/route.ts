import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as pageQueries from '@/lib/db/queries/pages';

export async function GET(
  request: NextRequest,
  { params }: { params: { pageName: string } }
) {
  try {
    const page = await pageQueries.getByName(params.pageName);
    return NextResponse.json(page?.content ?? {});
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
    const page = await pageQueries.upsert(params.pageName, body);
    return NextResponse.json(page.content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
