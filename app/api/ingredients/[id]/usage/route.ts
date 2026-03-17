import { NextRequest, NextResponse } from 'next/server';
import { getFlavours } from '@/lib/db';
import type { Flavour, ErrorResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flavours = await getFlavours() as Flavour[];
    
    // Find all flavours using this ingredient
    const usedInFlavours = flavours.filter(f => 
      f.ingredients?.some(ing => ing.ingredientId === params.id)
    );
    
    const usage = {
      ingredientId: params.id,
      usageCount: usedInFlavours.length,
      flavours: usedInFlavours.map(f => ({
        id: f.id,
        name: f.name,
        status: f.status,
        quantity: f.ingredients.find(ing => ing.ingredientId === params.id)?.quantity,
        displayOrder: f.ingredients.find(ing => ing.ingredientId === params.id)?.displayOrder
      }))
    };
    
    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching ingredient usage:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch ingredient usage',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
