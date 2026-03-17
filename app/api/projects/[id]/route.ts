import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const projects = (await db.read('projects.json')) || [];
    const index = projects.findIndex((p: any) => p.id === parseInt(params.id));
    
    if (index !== -1) {
      projects[index] = {
        ...body,
        id: parseInt(params.id),
        services:
          typeof body.services === 'string'
            ? body.services.split(',').map((s: string) => s.trim())
            : body.services,
      };
      await db.write('projects.json', projects);
      return NextResponse.json(projects[index]);
    }
    
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = (await db.read('projects.json')) || [];
    const filtered = projects.filter((p: any) => p.id !== parseInt(params.id));
    await db.write('projects.json', filtered);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
