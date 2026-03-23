import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { update, remove, type UserRole } from '@/lib/db/queries/users';

// PUT /api/users/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionRole = (session.user as any)?.role ?? 'super_admin';
  const sessionId = session.user?.id;

  if (sessionRole !== 'super_admin' && sessionRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, username, role, active } = body;

    if (role === 'super_admin' && sessionRole !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can assign super admin role' }, { status: 403 });
    }

    if (params.id === sessionId && role && role !== sessionRole) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    const updated = await update(params.id, { name, email, username, role: role as UserRole, active });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/users/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionRole = (session.user as any)?.role ?? 'super_admin';
  const sessionId = session.user?.id;

  if (sessionRole !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can delete users' }, { status: 403 });
  }

  if (params.id === sessionId) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  try {
    await remove(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
