import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProduct } from '@/lib/shopify/admin';

// GET /api/shopify/products/verify?id=gid://shopify/Product/123
// Also supports batch: ?ids=gid://shopify/Product/1,gid://shopify/Product/2
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Batch mode
  const idsParam = request.nextUrl.searchParams.get('ids');
  if (idsParam) {
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    const results: Record<string, boolean> = {};

    await Promise.all(
      ids.map(async (id) => {
        try {
          const product = await getProduct(id);
          results[id] = !!product;
        } catch {
          results[id] = false;
        }
      })
    );

    return NextResponse.json({ results });
  }

  // Single mode
  const shopifyId = request.nextUrl.searchParams.get('id');
  if (!shopifyId) {
    return NextResponse.json({ error: 'Missing id or ids parameter' }, { status: 400 });
  }

  try {
    const product = await getProduct(shopifyId);
    return NextResponse.json({ exists: !!product });
  } catch (error: any) {
    console.error('Error verifying Shopify product:', error?.message);
    // Any error fetching means the product is effectively unreachable
    return NextResponse.json({ exists: false });
  }
}
