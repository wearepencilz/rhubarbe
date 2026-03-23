import { NextRequest, NextResponse } from 'next/server';
import * as requestsQuery from '@/lib/db/queries/requests';

export async function GET() {
  try {
    const data = await requestsQuery.list();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newItem = await requestsQuery.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      date: body.date,
      time: body.time,
      guests: body.guests,
      eventType: body.eventType,
      delivery: body.delivery,
      address: body.address,
      notes: body.notes,
      type: body.type,
      status: 'new',
    });

    // Future: trigger Klaviyo or other integrations here
    // await klaviyo.track('Form Submitted', { ...newItem });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
