import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getIngredients, saveIngredients } from '@/lib/db';
import type { Ingredient, PaginatedResponse, ErrorResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // Filter params
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');
    const allergen = searchParams.get('allergen');
    const seasonal = searchParams.get('seasonal');
    
    let ingredients = await getIngredients() as Ingredient[];
    
    // Apply filters
    if (search) {
      ingredients = ingredients.filter(ing => 
        ing.name.toLowerCase().includes(search) ||
        ing.latinName?.toLowerCase().includes(search) ||
        ing.origin.toLowerCase().includes(search)
      );
    }
    
    if (category) {
      ingredients = ingredients.filter(ing => ing.category === category);
    }
    
    if (allergen) {
      ingredients = ingredients.filter(ing => ing.allergens.includes(allergen as any));
    }
    
    if (seasonal !== null && seasonal !== undefined) {
      const isSeasonalFilter = seasonal === 'true';
      ingredients = ingredients.filter(ing => ing.seasonal === isSeasonalFilter);
    }
    
    // Calculate pagination
    const total = ingredients.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = ingredients.slice(startIndex, endIndex);
    
    const response: PaginatedResponse<Ingredient> = {
      data: paginatedData,
      total,
      page,
      pageSize
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch ingredients',
      timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    const body = await request.json();
    const ingredients = await getIngredients() as Ingredient[];
    
    // Check for duplicate name
    const duplicate = ingredients.find(
      ing => ing.name.toLowerCase() === body.name.toLowerCase()
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
    
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: body.name,
      latinName: body.latinName,
      category: body.category,
      origin: body.origin,
      allergens: body.allergens || [],
      animalDerived: body.animalDerived || false,
      vegetarian: body.vegetarian !== false, // Default to true
      seasonal: body.seasonal || false,
      availableMonths: body.availableMonths || [],
      image: body.image,
      imageAlt: body.imageAlt,
      description: body.description,
      story: body.story,
      tastingNotes: body.tastingNotes || [],
      supplier: body.supplier,
      farm: body.farm,
      isOrganic: body.isOrganic || false,
      roles: body.roles || [],
      descriptors: body.descriptors || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    ingredients.push(newIngredient);
    await saveIngredients(ingredients);
    
    return NextResponse.json(newIngredient, { status: 201 });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to create ingredient',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
