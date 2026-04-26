import { NextResponse } from 'next/server';
import * as faqQueries from '@/lib/db/queries/faqs';

export async function GET() {
  try {
    const topics = await faqQueries.getTopics();
    return NextResponse.json(topics);
  } catch { return NextResponse.json([]); }
}
