import { NextRequest, NextResponse } from 'next/server';
import { getInventoryLevels } from '@/lib/shopify/admin';
import { availabilityCache } from '@/lib/cache/availability-cache';

const INVENTORY_CACHE_TTL = 30; // 30 seconds — short TTL for near-real-time stock

/**
 * GET /api/shopify/inventory?ids=gid://shopify/Product/1,gid://shopify/Product/2
 * Returns { inventory: { "gid://...": number | null } }
 * null = unlimited (product doesn't track inventory)
 * Public endpoint (no auth) — customers need this for the order page.
 */
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 });
  }

  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ inventory: {} });
  }

  // Check cache
  const cacheKey = `shopify:inventory:${ids.sort().join(',')}`;
  const cached = availabilityCache.get<Record<string, number | null>>(cacheKey);
  if (cached) {
    return NextResponse.json({ inventory: cached }, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  }

  try {
    const inventory = await getInventoryLevels(ids);

    // Cache the result
    availabilityCache.set(cacheKey, inventory, INVENTORY_CACHE_TTL);

    return NextResponse.json({ inventory }, {
      headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch (error: any) {
    console.error('Error fetching Shopify inventory:', error?.message);
    return NextResponse.json({ inventory: {} }, { status: 200 });
  }
}
