import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFlavours, saveFlavours, getIngredients } from '@/lib/db';
import { withDeleteProtection, withUpdateProtection } from '@/lib/api-middleware';
import { createBackup } from '@/lib/data-protection';
import type { Flavour, Ingredient, Allergen, DietaryClaim, ErrorResponse } from '@/types';

// Helper function to calculate allergens from ingredients
function calculateAllergens(ingredientIds: string[], allIngredients: Ingredient[]): Allergen[] {
  const allergenSet = new Set<Allergen>();
  
  ingredientIds.forEach(id => {
    const ingredient = allIngredients.find(ing => ing.id === id);
    if (ingredient) {
      ingredient.allergens.forEach(allergen => allergenSet.add(allergen));
    }
  });
  
  return Array.from(allergenSet);
}

// Helper function to determine dietary flags
function calculateDietaryClaims(ingredientIds: string[], allIngredients: Ingredient[]): DietaryClaim[] {
  const ingredients = ingredientIds
    .map(id => allIngredients.find(ing => ing.id === id))
    .filter(Boolean) as Ingredient[];
  
  if (ingredients.length === 0) return [];
  
  const flags: DietaryClaim[] = [];
  
  // Check if vegan (no dairy, eggs, or animal products)
  const hasAnimalProducts = ingredients.some(ing => 
    ing.allergens.includes('dairy') || ing.allergens.includes('egg')
  );
  if (!hasAnimalProducts) {
    flags.push('vegan');
    flags.push('vegetarian'); // vegan implies vegetarian
  } else if (!ingredients.some(ing => ing.allergens.includes('egg'))) {
    // Vegetarian if no meat (we assume no meat category exists, so just check it's not vegan)
    flags.push('vegetarian');
  }
  
  // Check if gluten-free
  const hasGluten = ingredients.some(ing => ing.allergens.includes('gluten'));
  if (!hasGluten) {
    flags.push('gluten-free');
  }
  
  // Check if dairy-free
  const hasDairy = ingredients.some(ing => ing.allergens.includes('dairy'));
  if (!hasDairy) {
    flags.push('dairy-free');
  }
  
  // Check if nut-free
  const hasNuts = ingredients.some(ing => ing.allergens.includes('tree-nuts') || ing.allergens.includes('peanuts'));
  if (!hasNuts) {
    flags.push('nut-free');
  }
  
  return flags;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flavours = await getFlavours() as Flavour[];
    const flavour = flavours.find(f => f.id === params.id);
    
    if (!flavour) {
      const errorResponse: ErrorResponse = {
        error: 'Flavour not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    return NextResponse.json(flavour);
  } catch (error) {
    console.error('Error fetching flavour:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch flavour',
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
    const flavours = await getFlavours() as Flavour[];
    const index = flavours.findIndex(f => f.id === params.id);
    
    if (index === -1) {
      const errorResponse: ErrorResponse = {
        error: 'Flavour not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    // Check for duplicate name (excluding current flavour)
    const duplicate = flavours.find(
      f => f.id !== params.id && f.name.toLowerCase() === body.name.toLowerCase()
    );
    
    if (duplicate) {
      const errorResponse: ErrorResponse = {
        error: 'A flavour with this name already exists',
        code: 'DUPLICATE_NAME',
        details: { existingId: duplicate.id },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }
    
    const updatedFlavour: Flavour = {
      ...flavours[index],
      ...body,
      id: params.id,
      updatedAt: new Date().toISOString(),
    };
    
    // If Shopify product was just linked, set sync status to pending and trigger sync
    if (body.shopifyProductId && !flavours[index].shopifyProductId) {
      updatedFlavour.syncStatus = 'pending';
      
      // Trigger sync in background (fire and forget)
      fetch(`${request.nextUrl.origin}/api/shopify/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          flavourId: params.id,
          productId: body.shopifyProductId
        })
      }).catch(err => console.error('Failed to trigger sync:', err));
    }
    
    flavours[index] = updatedFlavour;
    await saveFlavours(flavours);
    
    return NextResponse.json(updatedFlavour);
  } catch (error) {
    console.error('Error updating flavour:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to update flavour',
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

  return withDeleteProtection('flavour', params.id, async () => {
    const flavours = await getFlavours() as Flavour[];
    const filtered = flavours.filter(f => f.id !== params.id);
    
    if (filtered.length === flavours.length) {
      return NextResponse.json(
        {
          error: 'Flavour not found',
          code: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
    
    await saveFlavours(filtered);
    
    return { message: 'Flavour deleted successfully' };
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', timestamp: new Date().toISOString() }, { status: 401 });
  }

  try {
    const body = await request.json();
    const flavours = await getFlavours() as Flavour[];
    const index = flavours.findIndex(f => f.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'Flavour not found', timestamp: new Date().toISOString() }, { status: 404 });
    }

    // Merge only the provided fields
    flavours[index] = {
      ...flavours[index],
      ...body,
      id: params.id,
      updatedAt: new Date().toISOString(),
    };

    await saveFlavours(flavours);
    return NextResponse.json(flavours[index]);
  } catch (error) {
    console.error('Error patching flavour:', error);
    return NextResponse.json({ error: 'Failed to update flavour', timestamp: new Date().toISOString() }, { status: 500 });
  }
}
