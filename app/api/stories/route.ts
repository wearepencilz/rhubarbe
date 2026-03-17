import { NextRequest, NextResponse } from 'next/server';
import { getStories, saveStories } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const stories = await getStories();
    return NextResponse.json(stories || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const stories = (await getStories()) || [];
    const newStory = {
      ...body,
      id: `story_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    stories.push(newStory);
    await saveStories(stories);
    return NextResponse.json(newStory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
