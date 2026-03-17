import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getIngredients, saveIngredients } from '@/lib/db';
import { transformSeedToIngredient } from '@/lib/seeds/ingredients';
import type { Ingredient, ErrorResponse } from '@/types';

/**
 * POST /api/ingredients/seed/upload
 * Upload and process ingredient seed file
 * Requires authentication
 */
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
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'skip';
    
    // Parse JSON body
    const uploadedSeeds = await request.json();
    
    if (!Array.isArray(uploadedSeeds)) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid file format. Expected an array of ingredient seeds.',
        code: 'INVALID_FORMAT',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const existingIngredients = await getIngredients() as Ingredient[];
    let finalIngredients: Ingredient[] = [];
    let stats = {
      existing: existingIngredients.length,
      seeded: 0,
      skipped: 0,
      replaced: 0,
      errors: 0,
    };

    // Transform and validate uploaded seeds
    const transformedIngredients: Ingredient[] = [];
    for (const seed of uploadedSeeds) {
      try {
        const ingredient = transformSeedToIngredient(seed);
        transformedIngredients.push(ingredient);
      } catch (error) {
        console.error('Error transforming seed:', seed, error);
        stats.errors++;
      }
    }

    if (transformedIngredients.length === 0) {
      const errorResponse: ErrorResponse = {
        error: 'No valid ingredients found in uploaded file',
        code: 'NO_VALID_DATA',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    switch (mode) {
      case 'replace':
        finalIngredients = transformedIngredients;
        stats.replaced = existingIngredients.length;
        stats.seeded = transformedIngredients.length;
        break;

      case 'merge':
        const existingMap = new Map(existingIngredients.map(ing => [ing.id, ing]));
        
        transformedIngredients.forEach(ing => {
          if (existingMap.has(ing.id)) {
            existingMap.set(ing.id, {
              ...existingMap.get(ing.id)!,
              ...ing,
              updatedAt: new Date().toISOString(),
            });
            stats.replaced++;
          } else {
            existingMap.set(ing.id, ing);
            stats.seeded++;
          }
        });
        
        finalIngredients = Array.from(existingMap.values());
        break;

      case 'skip':
      default:
        const existingIds = new Set(existingIngredients.map(ing => ing.id));
        const newIngredients = transformedIngredients.filter(ing => {
          if (existingIds.has(ing.id)) {
            stats.skipped++;
            return false;
          }
          stats.seeded++;
          return true;
        });
        
        finalIngredients = [...existingIngredients, ...newIngredients];
        break;
    }

    await saveIngredients(finalIngredients);

    return NextResponse.json({
      success: true,
      message: `Upload completed in '${mode}' mode`,
      stats,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading ingredients:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to process uploaded file',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
