import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as ingredientQueries from '@/lib/db/queries/ingredients';
import type { PaginatedResponse, ErrorResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Filter params
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const allergen = searchParams.get('allergen') || undefined;
    const seasonalParam = searchParams.get('seasonal');
    const seasonal =
      seasonalParam !== null && seasonalParam !== undefined
        ? seasonalParam === 'true'
        : undefined;

    const allFiltered = await ingredientQueries.list({ search, category, allergen, seasonal });

    // Calculate pagination
    const total = allFiltered.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = allFiltered.slice(startIndex, startIndex + pageSize);

    const response: PaginatedResponse<(typeof allFiltered)[number]> = {
      data: paginatedData,
      total,
      page,
      pageSize,
    };

    const res = NextResponse.json(response);
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res;
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch ingredients',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Check for duplicate name
    const duplicate = await ingredientQueries.getByName(body.name);
    if (duplicate) {
      const errorResponse: ErrorResponse = {
        error: 'An ingredient with this name already exists',
        code: 'DUPLICATE_NAME',
        details: { existingId: duplicate.id },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    const newIngredient = await ingredientQueries.create({
      name: body.name,
      latinName: body.latinName ?? null,
      category: body.category ?? null,
      origin: body.origin ?? null,
      allergens: body.allergens || [],
      animalDerived: body.animalDerived || false,
      vegetarian: body.vegetarian !== false,
      seasonal: body.seasonal || false,
      availableMonths: body.availableMonths || [],
      image: body.image ?? null,
      imageAlt: body.imageAlt ?? null,
      description: body.description ?? null,
      story: body.story ?? null,
      supplier: body.supplier ?? null,
      farm: body.farm ?? null,
      isOrganic: body.isOrganic || false,
      roles: body.roles || [],
      descriptors: body.descriptors || [],
      status: 'active',
    });

    return NextResponse.json(newIngredient, { status: 201 });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to create ingredient',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
