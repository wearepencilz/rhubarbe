import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const data = await db.read('projects.json');
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const projects = (await db.read('projects.json')) || [];
    const newProject = {
      ...body,
      id: Date.now(),
      services:
        typeof body.services === 'string'
          ? body.services.split(',').map((s: string) => s.trim())
          : body.services,
    };
    projects.push(newProject);
    await db.write('projects.json', projects);
    return NextResponse.json(newProject);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
