import { NextRequest, NextResponse } from 'next/server';
import { getFlavours, getIngredients } from '@/lib/db';
import type { Flavour, Ingredient, IngredientWithDetails, Allergen, DietaryClaim, ErrorResponse } from '@/types';

// Helper function to calculate allergens from ingredients
function calculateAllergens(ingredients: Ingredient[]): Allergen[] {
  const allergenSet = new Set<Allergen>();
  ingredients.forEach(ing => {
    ing.allergens.forEach(allergen => allergenSet.add(allergen));
  });
  return Array.from(allergenSet);
}

// Helper function to determine dietary claims
function calculateDietaryFlags(ingredients: Ingredient[]): DietaryClaim[] {
  if (ingredients.length === 0) return [];
  
  const claims: DietaryClaim[] = [];
  
  // Check if vegan (no dairy, eggs, or animal products)
  const hasAnimalProducts = ingredients.some(ing => 
    ing.allergens.includes('dairy') || ing.allergens.includes('egg')
  );
  if (!hasAnimalProducts) {
    claims.push('vegan');
    claims.push('vegetarian');
  } else {
    claims.push('vegetarian');
  }
  
  // Check if gluten-free
  const hasGluten = ingredients.some(ing => ing.allergens.includes('gluten'));
  if (!hasGluten) claims.push('gluten-free');
  
  // Check if dairy-free
  const hasDairy = ingredients.some(ing => ing.allergens.includes('dairy'));
  if (!hasDairy) claims.push('dairy-free');
  
  // Check if nut-free
  const hasNuts = ingredients.some(ing => ing.allergens.includes('tree-nuts') || ing.allergens.includes('peanuts'));
  if (!hasNuts) claims.push('nut-free');
  
  return claims;
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
    
    const allIngredients = await getIngredients() as Ingredient[];
    
    // Build detailed ingredient list with full ingredient data
    const detailedIngredients: IngredientWithDetails[] = flavour.ingredients
      .map(fi => {
        const ingredient = allIngredients.find(ing => ing.id === fi.ingredientId);
        if (!ingredient) return null;
        
        return {
          ...ingredient,
          quantity: fi.quantity,
          displayOrder: fi.displayOrder,
          notes: fi.notes
        };
      })
      .filter(Boolean) as IngredientWithDetails[];
    
    // Sort by display order
    detailedIngredients.sort((a, b) => a.displayOrder - b.displayOrder);
    
    // Calculate allergens and dietary flags
    const ingredientObjects = detailedIngredients.map(di => {
      const { quantity, displayOrder, notes, ...ingredient } = di;
      return ingredient as Ingredient;
    });
    
    const allergens = calculateAllergens(ingredientObjects);
    const dietaryFlags = calculateDietaryFlags(ingredientObjects);
    const hasSeasonalIngredients = ingredientObjects.some(ing => ing.seasonal);
    
    return NextResponse.json({
      flavourId: flavour.id,
      flavourName: flavour.name,
      ingredients: detailedIngredients,
      allergens,
      dietaryFlags,
      hasSeasonalIngredients
    });
  } catch (error) {
    console.error('Error fetching flavour ingredients:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch flavour ingredients',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
