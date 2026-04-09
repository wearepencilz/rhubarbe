import type { Allergen, DietaryClaim } from '@/types';

/**
 * Derive dietary claims directly from an allergen set.
 * No ingredient traversal — allergens are assigned directly to products/variants.
 */
export function deriveDietaryClaims(allergens: string[]): DietaryClaim[] {
  const claims: DietaryClaim[] = [];

  if (allergens.includes('dairy')) claims.push('contains-dairy');
  if (allergens.includes('egg')) claims.push('contains-egg');
  if (allergens.includes('gluten')) claims.push('contains-gluten');
  if (allergens.includes('tree-nuts') || allergens.includes('peanuts')) claims.push('contains-nuts');

  if (!allergens.includes('dairy')) claims.push('dairy-free');
  if (!allergens.includes('gluten')) claims.push('gluten-free');
  if (!allergens.includes('tree-nuts') && !allergens.includes('peanuts')) claims.push('nut-free');

  // Without ingredient data, vegan/vegetarian are derived from allergens only:
  // no dairy + no egg = vegan (approximation)
  const isVegan = !allergens.includes('dairy') && !allergens.includes('egg');
  const isVegetarian = true; // allergens alone can't determine this; default true
  if (isVegan) claims.push('vegan');
  if (isVegetarian) claims.push('vegetarian');

  return claims;
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
