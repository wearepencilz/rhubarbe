import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Flavours have been removed' }, { status: 410 });
}
