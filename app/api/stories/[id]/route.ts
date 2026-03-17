import { NextRequest, NextResponse } from 'next/server';
import { getStories, saveStories } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stories = (await getStories()) || [];
    const story = stories.find((s: any) => s.id === params.id || s.slug === params.id);
    if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(story);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const stories = (await getStories()) || [];
    const index = stories.findIndex((s: any) => s.id === params.id);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    stories[index] = { ...body, id: params.id, updatedAt: new Date().toISOString() };
    await saveStories(stories);
    return NextResponse.json(stories[index]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const stories = (await getStories()) || [];
    const filtered = stories.filter((s: any) => s.id !== params.id);
    await saveStories(filtered);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
