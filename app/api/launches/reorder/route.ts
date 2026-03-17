import { NextRequest, NextResponse } from 'next/server';
import { getLaunches, saveLaunches } from '@/lib/db.js';
import { auth } from '@/lib/auth';

// PATCH /api/launches/reorder
// Body: { ids: string[] } — ordered list of launch IDs
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids)) return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });

    const launches = await getLaunches();
    const updated = (launches as any[]).map((l) => {
      const idx = ids.indexOf(l.id);
      return idx !== -1 ? { ...l, sortOrder: idx + 1, updatedAt: new Date().toISOString() } : l;
    });

    await saveLaunches(updated);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
