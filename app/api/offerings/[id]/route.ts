import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getOfferings } from '@/lib/db';

// LEGACY API - Backward compatibility layer
// This endpoint maps to /api/products/[id] for backward compatibility
// New code should use /api/products/[id] directly

// GET /api/offerings/[id] - Get offering by ID (maps to product)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try products first (new model)
    let items = await getProducts();
    let item = items.find((p: any) => p.id === params.id);
    
    // Fallback to offerings if not found (during transition)
    if (!item) {
      items = await getOfferings();
      item = items.find((o: any) => o.id === params.id);
    }

    if (!item) {
      return NextResponse.json(
        { error: 'Offering not found' },
        { status: 404 }
      );
    }

    // Add deprecation warning header
    const response = NextResponse.json(item);
    response.headers.set('X-API-Deprecated', 'true');
    response.headers.set('X-API-Deprecation-Message', 'This endpoint is deprecated. Please use /api/products/[id] instead.');
    
    return response;
  } catch (error) {
    console.error('Error fetching offering:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offering' },
      { status: 500 }
    );
  }
}

// PUT /api/offerings/[id] - Update offering (deprecated, forwards to products)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Forward to products API
    const response = await fetch(`${request.nextUrl.origin}/api/products/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Add deprecation warning header
    const result = NextResponse.json(data);
    result.headers.set('X-API-Deprecated', 'true');
    result.headers.set('X-API-Deprecation-Message', 'This endpoint is deprecated. Please use /api/products/[id] instead.');
    
    return result;
  } catch (error) {
    console.error('Error updating offering:', error);
    return NextResponse.json(
      { error: 'Failed to update offering' },
      { status: 500 }
    );
  }
}

// DELETE /api/offerings/[id] - Delete offering (deprecated, forwards to products)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Forward to products API
    const response = await fetch(`${request.nextUrl.origin}/api/products/${params.id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Add deprecation warning header
    const result = NextResponse.json(data);
    result.headers.set('X-API-Deprecated', 'true');
    result.headers.set('X-API-Deprecation-Message', 'This endpoint is deprecated. Please use /api/products/[id] instead.');
    
    return result;
  } catch (error) {
    console.error('Error deleting offering:', error);
    return NextResponse.json(
      { error: 'Failed to delete offering' },
      { status: 500 }
    );
  }
}
