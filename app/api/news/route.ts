import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const data = await db.read('news.json');
    return NextResponse.json(data || []);
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
    const news = (await db.read('news.json')) || [];
    const newItem = { ...body, id: Date.now() };
    news.push(newItem);
    await db.write('news.json', news);
    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
