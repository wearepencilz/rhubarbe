import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as ingredientQueries from '@/lib/db/queries/ingredients';
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
      timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const existingIngredients = await ingredientQueries.list();
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
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    switch (mode) {
      case 'replace':
        // Delete all existing, then insert new
        for (const existing of existingIngredients) {
          await ingredientQueries.remove(existing.id);
        }
        for (const ing of transformedIngredients) {
          await ingredientQueries.create({
            name: ing.name,
            latinName: ing.latinName ?? null,
            category: ing.category ?? null,
            origin: ing.origin ?? null,
            allergens: ing.allergens || [],
            animalDerived: ing.animalDerived || false,
            vegetarian: ing.vegetarian !== false,
            seasonal: ing.seasonal || false,
            availableMonths: ing.availableMonths || [],
            image: ing.image ?? null,
            imageAlt: ing.imageAlt ?? null,
            description: ing.description ?? null,
            story: ing.story ?? null,
            tastingNotes: ing.tastingNotes || [],
            supplier: ing.supplier ?? null,
            farm: ing.farm ?? null,
            isOrganic: ing.isOrganic || false,
            roles: ing.roles || [],
            descriptors: ing.descriptors || [],
            status: ing.status || 'active',
          });
          stats.seeded++;
        }
        stats.replaced = existingIngredients.length;
        break;

      case 'merge':
        for (const ing of transformedIngredients) {
          const existing = await ingredientQueries.getByName(ing.name);
          if (existing) {
            await ingredientQueries.update(existing.id, {
              latinName: ing.latinName ?? null,
              category: ing.category ?? null,
              origin: ing.origin ?? null,
              allergens: ing.allergens || [],
              roles: ing.roles || [],
              descriptors: ing.descriptors || [],
            });
            stats.replaced++;
          } else {
            await ingredientQueries.create({
              name: ing.name,
              latinName: ing.latinName ?? null,
              category: ing.category ?? null,
              origin: ing.origin ?? null,
              allergens: ing.allergens || [],
              animalDerived: ing.animalDerived || false,
              vegetarian: ing.vegetarian !== false,
              seasonal: ing.seasonal || false,
              availableMonths: ing.availableMonths || [],
              image: ing.image ?? null,
              imageAlt: ing.imageAlt ?? null,
              description: ing.description ?? null,
              story: ing.story ?? null,
              tastingNotes: ing.tastingNotes || [],
              supplier: ing.supplier ?? null,
              farm: ing.farm ?? null,
              isOrganic: ing.isOrganic || false,
              roles: ing.roles || [],
              descriptors: ing.descriptors || [],
              status: ing.status || 'active',
            });
            stats.seeded++;
          }
        }
        break;

      case 'skip':
      default:
        const existingNames = new Set(existingIngredients.map((i) => i.name.toLowerCase()));
        for (const ing of transformedIngredients) {
          if (existingNames.has(ing.name.toLowerCase())) {
            stats.skipped++;
          } else {
            await ingredientQueries.create({
              name: ing.name,
              latinName: ing.latinName ?? null,
              category: ing.category ?? null,
              origin: ing.origin ?? null,
              allergens: ing.allergens || [],
              animalDerived: ing.animalDerived || false,
              vegetarian: ing.vegetarian !== false,
              seasonal: ing.seasonal || false,
              availableMonths: ing.availableMonths || [],
              image: ing.image ?? null,
              imageAlt: ing.imageAlt ?? null,
              description: ing.description ?? null,
              story: ing.story ?? null,
              tastingNotes: ing.tastingNotes || [],
              supplier: ing.supplier ?? null,
              farm: ing.farm ?? null,
              isOrganic: ing.isOrganic || false,
              roles: ing.roles || [],
              descriptors: ing.descriptors || [],
              status: ing.status || 'active',
            });
            stats.seeded++;
          }
        }
        break;
    }

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
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
