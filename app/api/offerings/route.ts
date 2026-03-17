import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getOfferings } from '@/lib/db';

// LEGACY API - Backward compatibility layer
// This endpoint maps to /api/products for backward compatibility
// New code should use /api/products directly

// GET /api/offerings - List offerings (maps to products)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const formatId = searchParams.get('formatId');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);

    // Try to get products first (new model)
    let items = await getProducts();
    
    // Fallback to offerings if products is empty (during transition)
    if (items.length === 0) {
      items = await getOfferings();
    }

    // Apply filters
    if (status) {
      items = items.filter((item: any) => item.status === status);
    }

    if (formatId) {
      items = items.filter((item: any) => item.formatId === formatId);
    }

    if (tags && tags.length > 0) {
      items = items.filter((item: any) =>
        item.tags && tags.some(tag => item.tags.includes(tag))
      );
    }

    // Add deprecation warning header
    const response = NextResponse.json({ data: items });
    response.headers.set('X-API-Deprecated', 'true');
    response.headers.set('X-API-Deprecation-Message', 'This endpoint is deprecated. Please use /api/products instead.');
    
    return response;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offerings' },
      { status: 500 }
    );
  }
}

// POST /api/offerings - Create offering (deprecated, redirects to products)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to products API
    const response = await fetch(`${request.nextUrl.origin}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Add deprecation warning header
    const result = NextResponse.json(data, { status: 201 });
    result.headers.set('X-API-Deprecated', 'true');
    result.headers.set('X-API-Deprecation-Message', 'This endpoint is deprecated. Please use /api/products instead.');
    
    return result;
  } catch (error) {
    console.error('Error creating offering:', error);
    return NextResponse.json(
      { error: 'Failed to create offering' },
      { status: 500 }
    );
  }
}
