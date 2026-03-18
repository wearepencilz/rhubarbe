import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getIngredients, saveIngredients } from '@/lib/db';
import type { Ingredient, ErrorResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ingredients = await getIngredients() as Ingredient[];
    const ingredient = ingredients.find(i => i.id === params.id);
    
    if (!ingredient) {
      const errorResponse: ErrorResponse = {
        error: 'Ingredient not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    return NextResponse.json(ingredient);
  } catch (error) {
    console.error('Error fetching ingredient:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch ingredient',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session) {
    const errorResponse: ErrorResponse = {
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    const body = await request.json();
    const ingredients = await getIngredients() as Ingredient[];
    const index = ingredients.findIndex(i => i.id === params.id);
    
    if (index === -1) {
      const errorResponse: ErrorResponse = {
        error: 'Ingredient not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    // Check for duplicate name (excluding current ingredient)
    const duplicate = ingredients.find(
      ing => ing.id !== params.id && ing.name.toLowerCase() === body.name.toLowerCase()
    );
    
    if (duplicate) {
      const errorResponse: ErrorResponse = {
        error: 'An ingredient with this name already exists',
        code: 'DUPLICATE_NAME',
        details: { existingId: duplicate.id },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }
    
    ingredients[index] = {
      ...ingredients[index],
      ...body,
      id: params.id,
      updatedAt: new Date().toISOString(),
    };
    
    await saveIngredients(ingredients);
    
    return NextResponse.json(ingredients[index]);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to update ingredient',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session) {
    const errorResponse: ErrorResponse = {
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    // Flavours removed — no usage check needed
    
    const ingredients = await getIngredients() as Ingredient[];
    const filtered = ingredients.filter(i => i.id !== params.id);
    
    if (filtered.length === ingredients.length) {
      const errorResponse: ErrorResponse = {
        error: 'Ingredient not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    await saveIngredients(filtered);
    
    return NextResponse.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to delete ingredient',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
