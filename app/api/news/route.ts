import { NextRequest, NextResponse } from 'next/server';
import * as newsQuery from '@/lib/db/queries/news';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const data = await newsQuery.list();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newItem = await newsQuery.create({
      title: body.title,
      content: body.content,
    });
    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
