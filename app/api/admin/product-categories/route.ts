import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchAllProductCategories } from '@/lib/shopify/queries/product-categories';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const categories = await fetchAllProductCategories();
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('[product-categories] Failed to fetch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
