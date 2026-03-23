import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resetPassword } from '@/lib/db/queries/users';

// PUT /api/users/[id]/password
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionRole = (session.user as any)?.role;
  const sessionId = session.user?.id;

  // Users can reset their own password; admins can reset any
  const isSelf = params.id === sessionId;
  const isAdmin = sessionRole === 'super_admin' || sessionRole === 'admin';

  if (!isSelf && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { password } = await request.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    await resetPassword(params.id, password);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
