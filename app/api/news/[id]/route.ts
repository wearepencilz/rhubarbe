import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const news = (await db.read('news.json')) || [];
    const index = news.findIndex((n: any) => n.id === parseInt(params.id));
    
    if (index !== -1) {
      news[index] = { ...body, id: parseInt(params.id) };
      await db.write('news.json', news);
      return NextResponse.json(news[index]);
    }
    
    return NextResponse.json({ error: 'News not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const news = (await db.read('news.json')) || [];
    const filtered = news.filter((n: any) => n.id !== parseInt(params.id));
    await db.write('news.json', filtered);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
