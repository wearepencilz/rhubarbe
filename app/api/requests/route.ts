import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const data = await db.read('requests.json');
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requests = (await db.read('requests.json')) || [];
    const newItem = {
      ...body,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    requests.push(newItem);
    await db.write('requests.json', requests);

    // Future: trigger Klaviyo or other integrations here
    // await klaviyo.track('Form Submitted', { ...newItem });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
