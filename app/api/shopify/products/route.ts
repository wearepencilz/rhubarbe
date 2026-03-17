import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchProducts } from '@/lib/shopify/admin';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '*';
    const limit = parseInt(searchParams.get('limit') || '50');

    const products = await searchProducts(query, limit);

    return NextResponse.json({
      products,
      count: products.length,
    });

  } catch (error: any) {
    console.error('Error fetching Shopify products:', error);
    
    // Check for specific error types
    if (error.message.includes('Missing')) {
      return NextResponse.json(
        { 
          error: 'Shopify configuration error',
          details: error.message,
          code: 'MISSING_CREDENTIALS'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch Shopify products',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
