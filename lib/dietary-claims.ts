import type { Allergen, DietaryClaim, Ingredient } from '@/types';

/**
 * Compute dietary claims from ingredient facts.
 * This is the single source of truth for deriving customer-facing labels.
 */
export function computeDietaryClaims(ingredients: Ingredient[]): DietaryClaim[] {
  if (!ingredients || ingredients.length === 0) {
    return [];
  }

  const claims: DietaryClaim[] = [];
  
  // Check for allergen presence
  const hasAllergen = (allergen: Allergen) => 
    ingredients.some(ing => ing.allergens?.includes(allergen));
  
  if (hasAllergen('dairy')) claims.push('contains-dairy');
  if (hasAllergen('egg')) claims.push('contains-egg');
  if (hasAllergen('gluten')) claims.push('contains-gluten');
  if (hasAllergen('tree-nuts') || hasAllergen('peanuts')) claims.push('contains-nuts');
  
  // Check for allergen absence (free-from claims)
  if (!hasAllergen('dairy')) claims.push('dairy-free');
  if (!hasAllergen('gluten')) claims.push('gluten-free');
  if (!hasAllergen('tree-nuts') && !hasAllergen('peanuts')) claims.push('nut-free');
  
  // Check dietary compatibility
  const hasAnimalDerived = ingredients.some(ing => ing.animalDerived === true);
  const allVegetarian = ingredients.every(ing => ing.vegetarian !== false);
  
  if (!hasAnimalDerived) {
    claims.push('vegan');
  }
  
  if (allVegetarian) {
    claims.push('vegetarian');
  }
  
  return claims;
}
