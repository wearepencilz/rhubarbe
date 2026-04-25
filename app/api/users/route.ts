import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { clerkClient } from '@clerk/nextjs/server';

type UserRole = 'super_admin' | 'admin' | 'editor';

// GET /api/users — list all Clerk users
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'super_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await clerkClient();
    const { data: clerkUsers } = await client.users.getUserList({ limit: 100 });
    const users = clerkUsers.map((u) => ({
      id: u.id,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unnamed',
      email: u.emailAddresses[0]?.emailAddress ?? '',
      role: ((u.publicMetadata as any)?.role as UserRole) ?? 'editor',
      imageUrl: u.imageUrl,
      createdAt: u.createdAt,
      lastSignInAt: u.lastSignInAt,
    }));
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching Clerk users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users — invite a new user via Clerk
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'super_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { email, role: newRole } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (newRole === 'super_admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can invite super admins' }, { status: 403 });
    }

    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: newRole || 'editor' },
    });

    return NextResponse.json({ id: invitation.id, email, role: newRole || 'editor' }, { status: 201 });
  } catch (error: any) {
    console.error('Error inviting user:', error);
    const msg = error?.errors?.[0]?.longMessage || error.message || 'Failed to invite user';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
