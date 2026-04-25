import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { list, create, type UserRole } from '@/lib/db/queries/users';

// GET /api/users
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role && role !== 'super_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await list();
  return NextResponse.json(users);
}

// POST /api/users
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any)?.role ?? 'super_admin';
  if (role !== 'super_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, username, role: newRole } = body;

    if (!name || !email || !username || !newRole) {
      return NextResponse.json({ error: 'Name, email, username, and role are required' }, { status: 400 });
    }

    // Only super_admin can create other super_admins
    if (newRole === 'super_admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can create super admin accounts' }, { status: 403 });
    }

    const user = await create({ name, email, username, role: newRole as UserRole });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
