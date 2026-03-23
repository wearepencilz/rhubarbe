import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as ingredientQueries from '@/lib/db/queries/ingredients';
import { ingredientsSeed, transformSeedToIngredient } from '@/lib/seeds/ingredients';
import type { Ingredient, ErrorResponse } from '@/types';

/**
 * POST /api/ingredients/seed
 * Seeds the database with initial ingredient data
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

    const existingIngredients = await ingredientQueries.list();
    let stats = {
      existing: existingIngredients.length,
      seeded: 0,
      skipped: 0,
      replaced: 0,
    };

    // Transform seed data to full Ingredient format
    const seedIngredients = ingredientsSeed.map(transformSeedToIngredient);

    switch (mode) {
      case 'replace':
        // Delete all existing, then insert seeds
        for (const existing of existingIngredients) {
          await ingredientQueries.remove(existing.id);
        }
        for (const seedIng of seedIngredients) {
          await ingredientQueries.create({
            name: seedIng.name,
            latinName: seedIng.latinName ?? null,
            category: seedIng.category ?? null,
            origin: seedIng.origin ?? null,
            allergens: seedIng.allergens || [],
            animalDerived: seedIng.animalDerived || false,
            vegetarian: seedIng.vegetarian !== false,
            seasonal: seedIng.seasonal || false,
            availableMonths: seedIng.availableMonths || [],
            image: seedIng.image ?? null,
            imageAlt: seedIng.imageAlt ?? null,
            description: seedIng.description ?? null,
            story: seedIng.story ?? null,
            tastingNotes: seedIng.tastingNotes || [],
            supplier: seedIng.supplier ?? null,
            farm: seedIng.farm ?? null,
            isOrganic: seedIng.isOrganic || false,
            roles: seedIng.roles || [],
            descriptors: seedIng.descriptors || [],
            status: seedIng.status || 'active',
          });
          stats.seeded++;
        }
        stats.replaced = existingIngredients.length;
        break;

      case 'merge':
        for (const seedIng of seedIngredients) {
          const existing = await ingredientQueries.getByName(seedIng.name);
          if (existing) {
            await ingredientQueries.update(existing.id, {
              latinName: seedIng.latinName ?? null,
              category: seedIng.category ?? null,
              origin: seedIng.origin ?? null,
              allergens: seedIng.allergens || [],
              roles: seedIng.roles || [],
              descriptors: seedIng.descriptors || [],
            });
            stats.replaced++;
          } else {
            await ingredientQueries.create({
              name: seedIng.name,
              latinName: seedIng.latinName ?? null,
              category: seedIng.category ?? null,
              origin: seedIng.origin ?? null,
              allergens: seedIng.allergens || [],
              animalDerived: seedIng.animalDerived || false,
              vegetarian: seedIng.vegetarian !== false,
              seasonal: seedIng.seasonal || false,
              availableMonths: seedIng.availableMonths || [],
              image: seedIng.image ?? null,
              imageAlt: seedIng.imageAlt ?? null,
              description: seedIng.description ?? null,
              story: seedIng.story ?? null,
              tastingNotes: seedIng.tastingNotes || [],
              supplier: seedIng.supplier ?? null,
              farm: seedIng.farm ?? null,
              isOrganic: seedIng.isOrganic || false,
              roles: seedIng.roles || [],
              descriptors: seedIng.descriptors || [],
              status: seedIng.status || 'active',
            });
            stats.seeded++;
          }
        }
        break;

      case 'skip':
      default:
        const existingNames = new Set(existingIngredients.map((i) => i.name.toLowerCase()));
        for (const seedIng of seedIngredients) {
          if (existingNames.has(seedIng.name.toLowerCase())) {
            stats.skipped++;
          } else {
            await ingredientQueries.create({
              name: seedIng.name,
              latinName: seedIng.latinName ?? null,
              category: seedIng.category ?? null,
              origin: seedIng.origin ?? null,
              allergens: seedIng.allergens || [],
              animalDerived: seedIng.animalDerived || false,
              vegetarian: seedIng.vegetarian !== false,
              seasonal: seedIng.seasonal || false,
              availableMonths: seedIng.availableMonths || [],
              image: seedIng.image ?? null,
              imageAlt: seedIng.imageAlt ?? null,
              description: seedIng.description ?? null,
              story: seedIng.story ?? null,
              tastingNotes: seedIng.tastingNotes || [],
              supplier: seedIng.supplier ?? null,
              farm: seedIng.farm ?? null,
              isOrganic: seedIng.isOrganic || false,
              roles: seedIng.roles || [],
              descriptors: seedIng.descriptors || [],
              status: seedIng.status || 'active',
            });
            stats.seeded++;
          }
        }
        break;
    }

    return NextResponse.json({
      success: true,
      message: `Seeding completed in '${mode}' mode`,
      stats,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error('Error seeding ingredients:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to seed ingredients',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
