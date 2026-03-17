/**
 * Property Test: Referential Integrity on Deletion
 * 
 * Property 13: Referential Integrity on Deletion
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 20.5**
 * 
 * This test verifies that the system prevents deletion of objects when they
 * are referenced by other objects, maintaining referential integrity across
 * the data model.
 * 
 * Test scenarios:
 * 1. Ingredients cannot be deleted if referenced by flavours
 * 2. Flavours cannot be deleted if referenced by sellables or launches
 * 3. Formats cannot be deleted if referenced by sellables
 * 4. Modifiers cannot be deleted if referenced by sellables
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import type { 
  Ingredient, 
  Flavour, 
  Format, 
  Modifier, 
  Sellable,
  Launch,
  FlavourType,
  FormatCategory,
  ModifierType
} from '../../types/index.js'

// ============================================================================
// Referential Integrity Check Functions
// ============================================================================

/**
 * Check if an ingredient can be deleted (not referenced by any flavour)
 */
function canDeleteIngredient(ingredientId: string, flavours: Flavour[]): boolean {
  const referencingFlavours = flavours.filter(f => 
    f.ingredients?.some(ing => ing.ingredientId === ingredientId)
  )
  return referencingFlavours.length === 0
}

/**
 * Check if a flavour can be deleted (not referenced by any sellable or launch)
 */
function canDeleteFlavour(flavourId: string, sellables: Sellable[], launches: Launch[]): boolean {
  const referencingSellables = sellables.filter(s => 
    s.primaryFlavourIds?.includes(flavourId) ||
    s.secondaryFlavourIds?.includes(flavourId) ||
    s.componentIds?.includes(flavourId)
  )
  
  const referencingLaunches = launches.filter(l => 
    l.featuredFlavourIds?.includes(flavourId)
  )
  
  return referencingSellables.length === 0 && referencingLaunches.length === 0
}

/**
 * Check if a format can be deleted (not referenced by any sellable)
 */
function canDeleteFormat(formatId: string, sellables: Sellable[]): boolean {
  const referencingSellables = sellables.filter(s => s.formatId === formatId)
  return referencingSellables.length === 0
}

/**
 * Check if a modifier can be deleted (not referenced by any sellable)
 */
function canDeleteModifier(modifierId: string, sellables: Sellable[]): boolean {
  const referencingSellables = sellables.filter(s => 
    s.toppingIds?.includes(modifierId)
  )
  return referencingSellables.length === 0
}

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate a valid ingredient
 */
const ingredientGenerator = (): fc.Arbitrary<Ingredient> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    category: fc.constantFrom('fruit', 'dairy', 'herb', 'spice', 'nut'),
    roles: fc.constant(['primary-flavour']),
    descriptors: fc.constant(['fresh']),
    seasonal: fc.boolean(),
    allergens: fc.constant([]),
    dietaryFlags: fc.constant([]),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Ingredient>
}

/**
 * Generate a valid flavour
 */
const flavourGenerator = (ingredientIds?: string[]): fc.Arbitrary<Flavour> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    slug: fc.string({ minLength: 3, maxLength: 30 }),
    type: fc.constantFrom<FlavourType>('gelato', 'sorbet', 'soft-serve-base', 'cookie'),
    ingredients: ingredientIds 
      ? fc.constant(ingredientIds.map(id => ({ ingredientId: id, role: 'primary-flavour' as const })))
      : fc.constant([]),
    keyNotes: fc.constant(['sweet']),
    allergens: fc.constant([]),
    dietaryTags: fc.constant([]),
    status: fc.constantFrom('active', 'archived'),
    featured: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Flavour>
}

/**
 * Generate a valid format
 */
const formatGenerator = (): fc.Arbitrary<Format> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 20 }),
    slug: fc.string({ minLength: 3, maxLength: 20 }),
    category: fc.constantFrom<FormatCategory>('scoop', 'take-home', 'sandwich', 'twist', 'soft-serve'),
    requiresFlavours: fc.boolean(),
    minFlavours: fc.integer({ min: 0, max: 3 }),
    maxFlavours: fc.integer({ min: 1, max: 5 }),
    allowMixedTypes: fc.boolean(),
    canIncludeAddOns: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Format>
}

/**
 * Generate a valid modifier
 */
const modifierGenerator = (): fc.Arbitrary<Modifier> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    slug: fc.string({ minLength: 3, maxLength: 30 }),
    type: fc.constantFrom<ModifierType>('topping', 'sauce', 'crunch', 'drizzle'),
    price: fc.integer({ min: 0, max: 1000 }),
    allergens: fc.constant([]),
    dietaryFlags: fc.constant([]),
    availableForFormatIds: fc.constant([]),
    status: fc.constantFrom('active', 'archived'),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Modifier>
}

/**
 * Generate a valid sellable
 */
const sellableGenerator = (formatId: string, flavourIds: string[], modifierIds?: string[]): fc.Arbitrary<Sellable> => {
  return fc.record({
    id: fc.uuid(),
    internalName: fc.string({ minLength: 5, maxLength: 40 }),
    publicName: fc.string({ minLength: 5, maxLength: 40 }),
    slug: fc.string({ minLength: 5, maxLength: 40 }),
    status: fc.constantFrom('active', 'archived'),
    formatId: fc.constant(formatId),
    primaryFlavourIds: fc.constant(flavourIds),
    toppingIds: modifierIds ? fc.constant(modifierIds) : fc.constant([]),
    price: fc.integer({ min: 100, max: 2000 }),
    inventoryTracked: fc.boolean(),
    onlineOrderable: fc.boolean(),
    pickupOnly: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Sellable>
}

/**
 * Generate a valid launch
 */
const launchGenerator = (flavourIds: string[], sellableIds: string[]): fc.Arbitrary<Launch> => {
  return fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 40 }),
    slug: fc.string({ minLength: 5, maxLength: 40 }),
    status: fc.constantFrom('active', 'archived'),
    featuredFlavourIds: fc.constant(flavourIds),
    featuredSellableIds: fc.constant(sellableIds),
    featured: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Launch>
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 13: Referential Integrity on Deletion', () => {
  describe('Requirement 10.1: Ingredient Deletion Prevention', () => {
    it('should prevent deletion when ingredient is referenced by flavour', () => {
      // **Validates: Requirements 10.1**
      
      fc.assert(
        fc.property(
          ingredientGenerator(),
          flavourGenerator(),
          (ingredient, flavour) => {
            // Create a flavour that references the ingredient
            const flavourWithIngredient: Flavour = {
              ...flavour,
              ingredients: [{ ingredientId: ingredient.id, role: 'primary-flavour' }]
            }
            
            // Check if ingredient can be deleted
            const canDelete = canDeleteIngredient(ingredient.id, [flavourWithIngredient])
            
            // Should NOT be able to delete (referenced by flavour)
            expect(canDelete).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should allow deletion when ingredient is not referenced', () => {
      // **Validates: Requirements 10.1**
      
      fc.assert(
        fc.property(
          ingredientGenerator(),
          fc.array(flavourGenerator(), { maxLength: 10 }),
          (ingredient, flavours) => {
            // Ensure no flavour references this ingredient
            const flavoursWithoutIngredient = flavours.map(f => ({
              ...f,
              ingredients: f.ingredients?.filter(ing => ing.ingredientId !== ingredient.id) || []
            }))
            
            // Check if ingredient can be deleted
            const canDelete = canDeleteIngredient(ingredient.id, flavoursWithoutIngredient)
            
            // Should be able to delete (not referenced)
            expect(canDelete).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Requirement 10.2: Flavour Deletion Prevention', () => {
    it('should prevent deletion when flavour is referenced by sellable', () => {
      // **Validates: Requirements 10.2**
      
      fc.assert(
        fc.property(
          flavourGenerator(),
          formatGenerator(),
          (flavour, format) => {
            // Create a sellable that references the flavour
            const sellable = fc.sample(sellableGenerator(format.id, [flavour.id]), 1)[0]
            
            // Check if flavour can be deleted
            const canDelete = canDeleteFlavour(flavour.id, [sellable], [])
            
            // Should NOT be able to delete (referenced by sellable)
            expect(canDelete).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should prevent deletion when flavour is referenced by launch', () => {
      // **Validates: Requirements 10.2, 20.5**
      
      fc.assert(
        fc.property(
          flavourGenerator(),
          (flavour) => {
            // Create a launch that references the flavour
            const launch = fc.sample(launchGenerator([flavour.id], []), 1)[0]
            
            // Check if flavour can be deleted
            const canDelete = canDeleteFlavour(flavour.id, [], [launch])
            
            // Should NOT be able to delete (referenced by launch)
            expect(canDelete).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should allow deletion when flavour is not referenced', () => {
      // **Validates: Requirements 10.2**
      
      fc.assert(
        fc.property(
          flavourGenerator(),
          fc.array(sellableGenerator('fmt-1', ['other-flavour-id']), { maxLength: 10 }),
          fc.array(launchGenerator(['other-flavour-id'], []), { maxLength: 10 }),
          (flavour, sellables, launches) => {
            // Ensure no sellable or launch references this flavour
            const sellablesWithoutFlavour = sellables.map(s => ({
              ...s,
              primaryFlavourIds: s.primaryFlavourIds?.filter(id => id !== flavour.id) || [],
              secondaryFlavourIds: s.secondaryFlavourIds?.filter(id => id !== flavour.id) || [],
              componentIds: s.componentIds?.filter(id => id !== flavour.id) || []
            }))
            
            const launchesWithoutFlavour = launches.map(l => ({
              ...l,
              featuredFlavourIds: l.featuredFlavourIds?.filter(id => id !== flavour.id) || []
            }))
            
            // Check if flavour can be deleted
            const canDelete = canDeleteFlavour(flavour.id, sellablesWithoutFlavour, launchesWithoutFlavour)
            
            // Should be able to delete (not referenced)
            expect(canDelete).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Requirement 10.3: Format Deletion Prevention', () => {
    it('should prevent deletion when format is referenced by sellable', () => {
      // **Validates: Requirements 10.3**
      
      fc.assert(
        fc.property(
          formatGenerator(),
          flavourGenerator(),
          (format, flavour) => {
            // Create a sellable that references the format
            const sellable = fc.sample(sellableGenerator(format.id, [flavour.id]), 1)[0]
            
            // Check if format can be deleted
            const canDelete = canDeleteFormat(format.id, [sellable])
            
            // Should NOT be able to delete (referenced by sellable)
            expect(canDelete).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should allow deletion when format is not referenced', () => {
      // **Validates: Requirements 10.3**
      
      fc.assert(
        fc.property(
          formatGenerator(),
          fc.array(sellableGenerator('other-format-id', ['flav-1']), { maxLength: 10 }),
          (format, sellables) => {
            // Ensure no sellable references this format
            const sellablesWithoutFormat = sellables.map(s => ({
              ...s,
              formatId: s.formatId === format.id ? 'other-format-id' : s.formatId
            }))
            
            // Check if format can be deleted
            const canDelete = canDeleteFormat(format.id, sellablesWithoutFormat)
            
            // Should be able to delete (not referenced)
            expect(canDelete).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Requirement 10.4: Modifier Deletion Prevention', () => {
    it('should prevent deletion when modifier is referenced by sellable', () => {
      // **Validates: Requirements 10.4**
      
      fc.assert(
        fc.property(
          modifierGenerator(),
          formatGenerator(),
          flavourGenerator(),
          (modifier, format, flavour) => {
            // Create a sellable that references the modifier
            const sellable = fc.sample(sellableGenerator(format.id, [flavour.id], [modifier.id]), 1)[0]
            
            // Check if modifier can be deleted
            const canDelete = canDeleteModifier(modifier.id, [sellable])
            
            // Should NOT be able to delete (referenced by sellable)
            expect(canDelete).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should allow deletion when modifier is not referenced', () => {
      // **Validates: Requirements 10.4**
      
      fc.assert(
        fc.property(
          modifierGenerator(),
          fc.array(sellableGenerator('fmt-1', ['flav-1'], ['other-modifier-id']), { maxLength: 10 }),
          (modifier, sellables) => {
            // Ensure no sellable references this modifier
            const sellablesWithoutModifier = sellables.map(s => ({
              ...s,
              toppingIds: s.toppingIds?.filter(id => id !== modifier.id) || []
            }))
            
            // Check if modifier can be deleted
            const canDelete = canDeleteModifier(modifier.id, sellablesWithoutModifier)
            
            // Should be able to delete (not referenced)
            expect(canDelete).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Cross-Entity Referential Integrity', () => {
    it('should maintain integrity across the entire data model', () => {
      // Property: Referential integrity should be maintained across all entity types
      
      fc.assert(
        fc.property(
          ingredientGenerator(),
          formatGenerator(),
          modifierGenerator(),
          (ingredient, format, modifier) => {
            // Create a complete chain of references
            // Ingredient -> Flavour -> Sellable -> Launch
            
            const flavour = fc.sample(flavourGenerator([ingredient.id]), 1)[0]
            const sellable = fc.sample(sellableGenerator(format.id, [flavour.id], [modifier.id]), 1)[0]
            const launch = fc.sample(launchGenerator([flavour.id], [sellable.id]), 1)[0]
            
            // Verify each entity cannot be deleted when referenced
            expect(canDeleteIngredient(ingredient.id, [flavour])).toBe(false)
            expect(canDeleteFlavour(flavour.id, [sellable], [launch])).toBe(false)
            expect(canDeleteFormat(format.id, [sellable])).toBe(false)
            expect(canDeleteModifier(modifier.id, [sellable])).toBe(false)
            
            // Verify each entity CAN be deleted when not referenced
            expect(canDeleteIngredient(ingredient.id, [])).toBe(true)
            expect(canDeleteFlavour(flavour.id, [], [])).toBe(true)
            expect(canDeleteFormat(format.id, [])).toBe(true)
            expect(canDeleteModifier(modifier.id, [])).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should handle multiple references correctly', () => {
      // Property: An entity referenced by multiple objects should not be deletable
      
      fc.assert(
        fc.property(
          flavourGenerator(),
          formatGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (flavour, format, count) => {
            // Create multiple sellables that reference the same flavour
            const sellables = Array.from({ length: count }, () => 
              fc.sample(sellableGenerator(format.id, [flavour.id]), 1)[0]
            )
            
            // Flavour should not be deletable (referenced by multiple sellables)
            expect(canDeleteFlavour(flavour.id, sellables, [])).toBe(false)
            
            // Even if we remove all but one reference, still not deletable
            expect(canDeleteFlavour(flavour.id, [sellables[0]], [])).toBe(false)
            
            // Only deletable when all references are removed
            expect(canDeleteFlavour(flavour.id, [], [])).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle flavours referenced by both sellables and launches', () => {
      // Property: Flavour referenced by both sellables and launches should not be deletable
      
      fc.assert(
        fc.property(
          flavourGenerator(),
          formatGenerator(),
          (flavour, format) => {
            const sellable = fc.sample(sellableGenerator(format.id, [flavour.id]), 1)[0]
            const launch = fc.sample(launchGenerator([flavour.id], []), 1)[0]
            
            // Flavour should not be deletable (referenced by both)
            expect(canDeleteFlavour(flavour.id, [sellable], [launch])).toBe(false)
            
            // Not deletable even if only referenced by sellable
            expect(canDeleteFlavour(flavour.id, [sellable], [])).toBe(false)
            
            // Not deletable even if only referenced by launch
            expect(canDeleteFlavour(flavour.id, [], [launch])).toBe(false)
            
            // Only deletable when both references are removed
            expect(canDeleteFlavour(flavour.id, [], [])).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty reference arrays correctly', () => {
      // Property: Empty reference arrays should allow deletion
      
      fc.assert(
        fc.property(
          ingredientGenerator(),
          flavourGenerator(),
          formatGenerator(),
          modifierGenerator(),
          (ingredient, flavour, format, modifier) => {
            // All entities should be deletable with empty reference arrays
            expect(canDeleteIngredient(ingredient.id, [])).toBe(true)
            expect(canDeleteFlavour(flavour.id, [], [])).toBe(true)
            expect(canDeleteFormat(format.id, [])).toBe(true)
            expect(canDeleteModifier(modifier.id, [])).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should handle sellables with multiple flavour fields', () => {
      // Property: Flavour referenced in any flavour field should prevent deletion
      
      fc.assert(
        fc.property(
          flavourGenerator(),
          formatGenerator(),
          fc.constantFrom('primaryFlavourIds', 'secondaryFlavourIds', 'componentIds'),
          (flavour, format, fieldName) => {
            // Create sellable with flavour in different fields
            const baseSellable = fc.sample(sellableGenerator(format.id, []), 1)[0]
            const sellable: Sellable = {
              ...baseSellable,
              primaryFlavourIds: fieldName === 'primaryFlavourIds' ? [flavour.id] : [],
              secondaryFlavourIds: fieldName === 'secondaryFlavourIds' ? [flavour.id] : [],
              componentIds: fieldName === 'componentIds' ? [flavour.id] : []
            }
            
            // Flavour should not be deletable regardless of which field it's in
            expect(canDeleteFlavour(flavour.id, [sellable], [])).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should be consistent across multiple checks', () => {
      // Property: Same inputs should always produce same results
      
      fc.assert(
        fc.property(
          ingredientGenerator(),
          flavourGenerator(),
          (ingredient, flavour) => {
            const flavourWithIngredient: Flavour = {
              ...flavour,
              ingredients: [{ ingredientId: ingredient.id, role: 'primary-flavour' }]
            }
            
            // Multiple checks should return same result
            const result1 = canDeleteIngredient(ingredient.id, [flavourWithIngredient])
            const result2 = canDeleteIngredient(ingredient.id, [flavourWithIngredient])
            const result3 = canDeleteIngredient(ingredient.id, [flavourWithIngredient])
            
            expect(result1).toBe(result2)
            expect(result2).toBe(result3)
            expect(result1).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
