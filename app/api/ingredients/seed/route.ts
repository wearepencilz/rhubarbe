import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getIngredients, saveIngredients } from '@/lib/db';
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
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'skip'; // 'skip', 'replace', or 'merge'
    
    const existingIngredients = await getIngredients() as Ingredient[];
    let finalIngredients: Ingredient[] = [];
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
        // Replace all existing data with seed data
        finalIngredients = seedIngredients;
        stats.replaced = existingIngredients.length;
        stats.seeded = seedIngredients.length;
        break;

      case 'merge':
        // Merge: update existing by ID, add new ones
        const existingMap = new Map(existingIngredients.map(ing => [ing.id, ing]));
        
        seedIngredients.forEach(seedIng => {
          if (existingMap.has(seedIng.id)) {
            // Update existing
            existingMap.set(seedIng.id, {
              ...existingMap.get(seedIng.id)!,
              ...seedIng,
              updatedAt: new Date().toISOString(),
            });
            stats.replaced++;
          } else {
            // Add new
            existingMap.set(seedIng.id, seedIng);
            stats.seeded++;
          }
        });
        
        finalIngredients = Array.from(existingMap.values());
        break;

      case 'skip':
      default:
        // Skip: only add ingredients that don't exist
        const existingIds = new Set(existingIngredients.map(ing => ing.id));
        const newIngredients = seedIngredients.filter(seedIng => {
          if (existingIds.has(seedIng.id)) {
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
      message: `Seeding completed in '${mode}' mode`,
      stats,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Error seeding ingredients:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to seed ingredients',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
