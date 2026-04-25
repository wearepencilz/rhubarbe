import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { clerkClient } from '@clerk/nextjs/server';

// PUT /api/users/[id] — update role via Clerk public metadata
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionRole = session.user.role;
  if (sessionRole !== 'super_admin' && sessionRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { role } = await request.json();

    if (role === 'super_admin' && sessionRole !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can assign super admin role' }, { status: 403 });
    }

    if (params.id === session.user.id && role && role !== sessionRole) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(params.id, {
      publicMetadata: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 400 });
  }
}

// DELETE /api/users/[id] — remove user from Clerk
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can delete users' }, { status: 403 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 400 });
  }
}
