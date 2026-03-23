import { getByCategory, isValueUnique } from './db/queries/taxonomies'
import * as ingredientQueries from './db/queries/ingredients'
import * as settingsQueries from './db/queries/settings'

// Taxonomy Validation Functions

/**
 * Validates that eligibleFlavourTypes array contains only valid flavourType taxonomy IDs
 * Empty array or undefined is valid (means "accept all types")
 */
export async function validateEligibleFlavourTypes(eligibleFlavourTypes: string[] | undefined): Promise<{ valid: boolean; errors: any[] }> {
  const errors: any[] = []
  
  // Empty array or undefined is valid (accept all types)
  if (!eligibleFlavourTypes || eligibleFlavourTypes.length === 0) {
    return { valid: true, errors: [] }
  }
  
  // Get flavourTypes taxonomy from Postgres
  const flavourTypes = await getByCategory('flavourTypes')
  if (!flavourTypes || flavourTypes.length === 0) {
    errors.push({
      field: 'eligibleFlavourTypes',
      constraint: 'taxonomy-missing',
      message: 'flavourTypes taxonomy not found'
    })
    return { valid: false, errors }
  }
  
  const validFlavourTypes = flavourTypes.map((item) => item.id)
  
  // Check each provided type exists in taxonomy
  for (const typeId of eligibleFlavourTypes) {
    if (!validFlavourTypes.includes(typeId)) {
      errors.push({
        field: 'eligibleFlavourTypes',
        constraint: 'invalid-taxonomy-reference',
        value: typeId,
        message: `Flavour type '${typeId}' does not exist in flavourTypes taxonomy`
      })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export async function validateTaxonomyUniqueness(category: string, value: string, excludeId?: string): Promise<boolean> {
  return isValueUnique(category, value, excludeId)
}

export async function validateTaxonomyDeletion(category: string, id: string): Promise<{ canDelete: boolean; usedBy: any[] }> {
  const usedBy: any[] = []
  
  // Check usage based on category
  switch (category) {
    case 'ingredientCategories':
      const ingredients = await ingredientQueries.list()
      const usedInIngredients = ingredients.filter((ing: any) => ing.category === id)
      if (usedInIngredients.length > 0) {
        usedBy.push(...usedInIngredients.map((ing: any) => ({ type: 'ingredient', id: ing.id, name: ing.name })))
      }
      break
      
    case 'flavourTypes':
      // flavours removed
      break
      
    case 'modifierTypes':
      // modifiers removed
      break
      
    case 'allergens':
      const allIngredients = await ingredientQueries.list()
      const ingredientsWithValue = allIngredients.filter((ing: any) =>
        ing.allergens?.includes(id)
      )
      if (ingredientsWithValue.length > 0) {
        usedBy.push(...ingredientsWithValue.map((ing: any) => ({ type: 'ingredient', id: ing.id, name: ing.name })))
      }
      break
  }
  
  return {
    canDelete: usedBy.length === 0,
    usedBy
  }
}

export async function checkTaxonomyValueInUse(category: string, value: string): Promise<boolean> {
  const result = await validateTaxonomyDeletion(category, value)
  return result.usedBy.length > 0
}

// Product Name Generation
export function generateProductName(product: any, format: any, flavours: any[]): { title: string } {
  if (!format || !flavours || flavours.length === 0) {
    return { title: 'Untitled Product' }
  }

  const formatName = format.name
  const primaryFlavour = flavours[0]

  // Handle twist format (two flavours)
  if (format.category === 'twist' && flavours.length === 2) {
    return { title: `${flavours[0].name} + ${flavours[1].name} ${formatName}` }
  }

  // Handle sandwich format
  if (format.category === 'sandwich') {
    const filling = flavours.find((f: any) => f.type === 'gelato' || f.type === 'sorbet')
    const cookie = flavours.find((f: any) => f.type === 'cookie')
    if (filling && cookie) {
      return { title: `${filling.name} ${cookie.name} ${formatName}` }
    }
  }

  // Standard format (single flavour)
  return { title: `${primaryFlavour.name} ${formatName}` }
}

// Format Eligibility
export async function getFormatEligibility(flavourType: string): Promise<string[]> {
  const allSettings = await settingsQueries.getAll()
  if (!allSettings.formatEligibilityRules) {
    // Fallback to hardcoded rules if not in settings
    // These rules now use servingStyle values
    const defaultRules: Record<string, string[]> = {
      'gelato': ['scoop', 'take-home', 'twist', 'sandwich', 'pint', 'tub'],
      'sorbet': ['scoop', 'take-home', 'twist', 'pint', 'tub'],
      'soft-serve-base': ['soft-serve'],
      'cookie': ['sandwich'],
      'topping': [],
      'sauce': []
    }
    return defaultRules[flavourType] || []
  }
  
  return (allSettings.formatEligibilityRules as Record<string, string[]>)[flavourType] || []
}

export async function isEligibleForFormat(flavourType: string, formatIdentifier: string): Promise<boolean> {
  const eligibleFormats = await getFormatEligibility(flavourType)
  // Check against servingStyle, category, slug, or name (case-insensitive)
  const normalizedIdentifier = formatIdentifier?.toLowerCase() || '';
  return eligibleFormats.some(format => format.toLowerCase() === normalizedIdentifier);
}

export async function filterEligibleFlavours(flavours: any[], formatCategory: string): Promise<any[]> {
  const eligibleFlavours = []
  
  for (const flavour of flavours) {
    const isEligible = await isEligibleForFormat(flavour.type, formatCategory)
    if (isEligible) {
      eligibleFlavours.push(flavour)
    }
  }
  
  return eligibleFlavours
}

// Product Composition Validation
export async function validateProductComposition(product: any, format: any, flavours: any[]): Promise<{ valid: boolean; errors: any[] }> {
  const errors: any[] = []
  
  if (!format) {
    errors.push({ field: 'formatId', constraint: 'required', message: 'Format is required' })
    return { valid: false, errors }
  }
  
  if (!flavours || flavours.length === 0) {
    errors.push({ field: 'primaryFlavourIds', constraint: 'required', message: 'At least one flavour is required' })
    return { valid: false, errors }
  }
  
  // Check min/max flavour count
  if (format.minFlavours && flavours.length < format.minFlavours) {
    errors.push({
      field: 'primaryFlavourIds',
      constraint: 'min-flavours',
      value: flavours.length,
      message: `At least ${format.minFlavours} flavour(s) required for ${format.name}`
    })
  }
  
  if (format.maxFlavours && flavours.length > format.maxFlavours) {
    errors.push({
      field: 'primaryFlavourIds',
      constraint: 'max-flavours',
      value: flavours.length,
      message: `Maximum ${format.maxFlavours} flavour(s) allowed for ${format.name}`
    })
  }
  
  // Check type compatibility using format's eligibleFlavourTypes
  // If eligibleFlavourTypes is empty or undefined, all flavour types are allowed
  if (format.eligibleFlavourTypes && format.eligibleFlavourTypes.length > 0) {
    for (const flavour of flavours) {
      if (!format.eligibleFlavourTypes.includes(flavour.type)) {
        errors.push({
          field: 'primaryFlavourIds',
          constraint: 'type-compatibility',
          value: flavour.id,
          message: `Flavour type '${flavour.type}' is not eligible for format '${format.name}'. Allowed types: ${format.eligibleFlavourTypes.join(', ')}`
        });
      }
    }
  }
  
  // Twist format validation (check by servingStyle or name)
  const isTwistFormat = format.servingStyle?.toLowerCase() === 'twist' || 
                        format.slug?.toLowerCase() === 'twist' || 
                        format.name?.toLowerCase().includes('twist');
  
  if (isTwistFormat) {
    if (flavours.length !== 2) {
      errors.push({
        field: 'primaryFlavourIds',
        constraint: 'twist-flavour-count',
        value: flavours.length,
        expected: 'Twist format requires exactly 2 flavours'
      })
    }
    
    const validTypes = flavours.every((f: any) => f.type === 'gelato' || f.type === 'sorbet')
    if (!validTypes) {
      errors.push({
        field: 'primaryFlavourIds',
        constraint: 'twist-flavour-types',
        expected: 'Twist format requires gelato or sorbet flavours only'
      })
    }
  }
  
  // Sandwich format validation (check by servingStyle or name)
  const isSandwichFormat = format.servingStyle?.toLowerCase() === 'sandwich' || 
                           format.slug?.toLowerCase() === 'sandwich' || 
                           format.name?.toLowerCase().includes('sandwich');
  
  if (isSandwichFormat) {
    const fillings = flavours.filter((f: any) => f.type === 'gelato' || f.type === 'sorbet')
    const cookies = flavours.filter((f: any) => f.type === 'cookie')
    
    if (fillings.length !== 1) {
      errors.push({
        field: 'primaryFlavourIds',
        constraint: 'sandwich-filling-count',
        value: fillings.length,
        expected: 'Sandwich format requires exactly 1 filling flavour (gelato or sorbet)'
      })
    }
    
    if (cookies.length !== 2) {
      errors.push({
        field: 'componentIds',
        constraint: 'sandwich-cookie-count',
        value: cookies.length,
        expected: 'Sandwich format requires exactly 2 cookie components'
      })
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
