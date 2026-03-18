import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    ingredientId: params.id,
    usageCount: 0,
    flavours: [],
  });
}
