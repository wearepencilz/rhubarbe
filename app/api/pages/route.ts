import { NextResponse } from 'next/server';
import * as pageQueries from '@/lib/db/queries/pages';

export async function GET() {
  try {
    const all = await pageQueries.list();
    return NextResponse.json(all);
  } catch {
    return NextResponse.json([]);
  }
}
