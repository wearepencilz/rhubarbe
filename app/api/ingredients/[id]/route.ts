import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as ingredientQueries from '@/lib/db/queries/ingredients';
import type { ErrorResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ingredient = await ingredientQueries.getById(params.id);

    if (!ingredient) {
      const errorResponse: ErrorResponse = {
        error: 'Ingredient not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error('Error fetching ingredient:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch ingredient',
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check ingredient exists
    const existing = await ingredientQueries.getById(params.id);
    if (!existing) {
      const errorResponse: ErrorResponse = {
        error: 'Ingredient not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check for duplicate name (excluding current ingredient)
    if (body.name) {
      const duplicate = await ingredientQueries.getByName(body.name);
      if (duplicate && duplicate.id !== params.id) {
        const errorResponse: ErrorResponse = {
          error: 'An ingredient with this name already exists',
          code: 'DUPLICATE_NAME',
          details: { existingId: duplicate.id },
          timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: 409 });
      }
    }

    const updated = await ingredientQueries.update(params.id, body);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to update ingredient',
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    const deleted = await ingredientQueries.remove(params.id);

    if (!deleted) {
      const errorResponse: ErrorResponse = {
        error: 'Ingredient not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    return NextResponse.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to delete ingredient',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
