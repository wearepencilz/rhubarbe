import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getFormats } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flavourId = params.id;

    const [products, formats] = await Promise.all([getProducts(), getFormats()]);
    const formatMap = new Map(formats.map((f: any) => [f.id, f]));

    const usageProducts = products
      .filter((p: any) => p.primaryFlavourIds?.includes(flavourId))
      .map((p: any) => {
        const format: any = formatMap.get(p.formatId);
        return {
          id: p.id,
          name: p.publicName || p.internalName,
          formatName: format?.name || 'Unknown format',
          status: p.status || 'draft',
        };
      });

    return NextResponse.json({
      usageCount: usageProducts.length,
      offerings: usageProducts,
    });
  } catch (error) {
    console.error('Error fetching flavour usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flavour usage' },
      { status: 500 }
    );
  }
}
