import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Flavours have been removed' }, { status: 410 });
}
