import { NextRequest, NextResponse } from 'next/server';
import * as storiesQuery from '@/lib/db/queries/stories';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const data = await storiesQuery.list();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const newStory = await storiesQuery.create({
      slug: body.slug,
      title: body.title,
      subtitle: body.subtitle,
      content: body.content,
      category: body.category,
      tags: body.tags,
      coverImage: body.coverImage,
      status: body.status ?? 'draft',
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
    });
    return NextResponse.json(newStory, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
