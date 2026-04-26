import { NextRequest, NextResponse } from 'next/server';
import * as faqQueries from '@/lib/db/queries/faqs';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const topic = new URL(req.url).searchParams.get('topic');
    const data = topic ? await faqQueries.listByTopic(topic) : await faqQueries.list();
    return NextResponse.json(data);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const created = await faqQueries.create({ topic: body.topic, question: body.question, answer: body.answer, sortOrder: body.sortOrder ?? 0 });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
