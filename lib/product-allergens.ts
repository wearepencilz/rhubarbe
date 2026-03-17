import type { Allergen, DietaryClaim, Flavour, Ingredient, Modifier } from '@/types';

/**
 * Compute allergens and dietary claims for a complete product.
 * Aggregates data from all flavours (and their ingredients) plus modifiers.
 */
export interface ProductAllergenData {
  allergens: Allergen[];
  dietaryClaims: DietaryClaim[];
  hasAnimalDerived: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
}

/**
 * Compute allergens from flavours and modifiers
 */
export function computeProductAllergens(
  flavours: Flavour[],
  ingredients: Ingredient[],
  modifiers: Modifier[] = []
): ProductAllergenData {
  const allergenSet = new Set<Allergen>();
  let hasAnimalDerived = false;
  let allVegetarian = true;

  // Collect allergens from flavours
  flavours.forEach(flavour => {
    flavour.allergens?.forEach(allergen => allergenSet.add(allergen));
  });

  // Collect allergens from ingredients
  ingredients.forEach(ingredient => {
    ingredient.allergens?.forEach(allergen => allergenSet.add(allergen));
    
    if (ingredient.animalDerived) {
      hasAnimalDerived = true;
    }
    
    if (ingredient.vegetarian === false) {
      allVegetarian = false;
    }
  });

  // Collect allergens from modifiers
  modifiers.forEach(modifier => {
    modifier.allergens?.forEach(allergen => allergenSet.add(allergen));
    
    if (modifier.animalDerived) {
      hasAnimalDerived = true;
    }
    
    if (modifier.vegetarian === false) {
      allVegetarian = false;
    }
  });

  const allergens = Array.from(allergenSet);
  const isVegan = !hasAnimalDerived;
  const isVegetarian = allVegetarian;

  // Compute dietary claims
  const claims: DietaryClaim[] = [];
  
  // Contains claims
  if (allergens.includes('dairy')) claims.push('contains-dairy');
  if (allergens.includes('egg')) claims.push('contains-egg');
  if (allergens.includes('gluten')) claims.push('contains-gluten');
  if (allergens.includes('tree-nuts') || allergens.includes('peanuts')) {
    claims.push('contains-nuts');
  }
  
  // Free-from claims
  if (!allergens.includes('dairy')) claims.push('dairy-free');
  if (!allergens.includes('gluten')) claims.push('gluten-free');
  if (!allergens.includes('tree-nuts') && !allergens.includes('peanuts')) {
    claims.push('nut-free');
  }
  
  // Dietary compatibility
  if (isVegan) claims.push('vegan');
  if (isVegetarian) claims.push('vegetarian');

  return {
    allergens,
    dietaryClaims: claims,
    hasAnimalDerived,
    isVegetarian,
    isVegan,
  };
}

/**
 * Format allergen for display
 */
export function formatAllergen(allergen: Allergen): string {
  const labels: Record<Allergen, string> = {
    'dairy': 'Dairy',
    'egg': 'Egg',
    'gluten': 'Gluten',
    'tree-nuts': 'Tree Nuts',
    'peanuts': 'Peanuts',
    'sesame': 'Sesame',
    'soy': 'Soy',
  };
  return labels[allergen] || allergen;
}

/**
 * Format dietary claim for display
 */
export function formatDietaryClaim(claim: DietaryClaim): string {
  const labels: Record<DietaryClaim, string> = {
    'contains-dairy': 'Contains Dairy',
    'contains-egg': 'Contains Egg',
    'contains-gluten': 'Contains Gluten',
    'contains-nuts': 'Contains Nuts',
    'dairy-free': 'Dairy-Free',
    'gluten-free': 'Gluten-Free',
    'nut-free': 'Nut-Free',
    'vegan': 'Vegan',
    'vegetarian': 'Vegetarian',
  };
  return labels[claim] || claim;
}

/**
 * Get badge color for allergen
 */
export function getAllergenBadgeColor(allergen: Allergen): string {
  // All allergens are warnings (red/orange)
  return 'bg-red-100 text-red-800';
}

/**
 * Get badge color for dietary claim
 */
export function getDietaryClaimBadgeColor(claim: DietaryClaim): string {
  // Contains = warning (red)
  if (claim.startsWith('contains-')) {
    return 'bg-red-100 text-red-800';
  }
  // Free-from and dietary = positive (green)
  return 'bg-green-100 text-green-800';
}
