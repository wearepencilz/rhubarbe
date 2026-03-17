/**
 * Property Test: Type Compatibility Validation
 * 
 * Property 5: Sellable Type Compatibility Validation
 * Validates: Requirements 3.4, 14.1, 14.2, 14.3, 14.4
 * 
 * Feature: launch-first-cms-model, Property 5: For any sellable creation or
 * update request, if the selected flavours are not type-compatible with the
 * selected format, the system should reject the request with a validation error.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { validateSellableComposition } from '../../lib/validation.js'
import { isEligibleForFormat } from '../../lib/format-eligibility.js'
import type { 
  Sellable, 
  Format, 
  Flavour, 
  Modifier,
  FlavourType, 
  FormatCategory 
} from '../../types/index.js'

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate a valid flavour with a specific type
 */
const flavourGenerator = (type?: FlavourType): fc.Arbitrary<Flavour> => {
  const typeArb = type 
    ? fc.constant(type)
    : fc.constantFrom<FlavourType>('gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce')
  
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    slug: fc.string({ minLength: 3, maxLength: 30 }),
    type: typeArb,
    ingredients: fc.constant([]),
    keyNotes: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
    allergens: fc.constant([]),
    dietaryTags: fc.constant([]),
    status: fc.constantFrom('active', 'archived', 'in-development', 'seasonal'),
    featured: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Flavour>
}

/**
 * Generate a valid format with a specific category
 */
const formatGenerator = (category?: FormatCategory): fc.Arbitrary<Format> => {
  const categoryArb = category
    ? fc.constant(category)
    : fc.constantFrom<FormatCategory>('scoop', 'take-home', 'sandwich', 'twist', 'soft-serve', 'special')
  
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 20 }),
    slug: fc.string({ minLength: 3, maxLength: 20 }),
    category: categoryArb,
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
 * Generate a sellable with specific flavour IDs
 */
const sellableGenerator = (
  formatId: string,
  primaryFlavourIds: string[],
  secondaryFlavourIds?: string[],
  componentIds?: string[]
): fc.Arbitrary<Sellable> => {
  return fc.record({
    id: fc.uuid(),
    internalName: fc.string({ minLength: 5, maxLength: 30 }),
    publicName: fc.string({ minLength: 5, maxLength: 30 }),
    slug: fc.string({ minLength: 5, maxLength: 30 }),
    status: fc.constantFrom('draft', 'active', 'archived', 'out-of-stock'),
    formatId: fc.constant(formatId),
    primaryFlavourIds: fc.constant(primaryFlavourIds),
    secondaryFlavourIds: fc.constant(secondaryFlavourIds),
    componentIds: fc.constant(componentIds),
    price: fc.integer({ min: 100, max: 2000 }),
    inventoryTracked: fc.boolean(),
    onlineOrderable: fc.boolean(),
    pickupOnly: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Sellable>
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 5: Sellable Type Compatibility Validation', () => {
  it('should reject sellables with incompatible flavour-format combinations', () => {
    // Feature: launch-first-cms-model, Property 5: For any sellable with
    // incompatible flavours, the system should reject with validation error
    
    fc.assert(
      fc.property(
        formatGenerator(),
        fc.array(flavourGenerator(), { minLength: 1, maxLength: 5 }),
        (format, allFlavours) => {
          // Find flavours that are NOT eligible for this format
          const incompatibleFlavours = allFlavours.filter(f => 
            !isEligibleForFormat(f.type, format.category)
          )
          
          // If there are incompatible flavours, test with them
          if (incompatibleFlavours.length > 0) {
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: format.id,
              primaryFlavourIds: incompatibleFlavours.map(f => f.id),
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(sellable, format, allFlavours, [])
            
            // Validation should fail
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
            
            // Should have type incompatibility errors
            const typeErrors = result.errors.filter(e => 
              e.code === 'FLAVOUR_TYPE_INCOMPATIBLE'
            )
            expect(typeErrors.length).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept sellables with compatible flavour-format combinations', () => {
    // Property: Compatible flavours should pass validation
    
    fc.assert(
      fc.property(
        formatGenerator(),
        fc.array(flavourGenerator(), { minLength: 1, maxLength: 10 }),
        (format, allFlavours) => {
          // Find flavours that ARE eligible for this format
          const compatibleFlavours = allFlavours.filter(f => 
            isEligibleForFormat(f.type, format.category)
          )
          
          // If there are compatible flavours, test with them
          if (compatibleFlavours.length > 0) {
            // Select a valid number of flavours (within format bounds)
            const count = Math.min(
              Math.max(compatibleFlavours.length, format.minFlavours),
              format.maxFlavours
            )
            const selectedFlavours = compatibleFlavours.slice(0, count)
            
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: format.id,
              primaryFlavourIds: selectedFlavours.map(f => f.id),
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(sellable, format, allFlavours, [])
            
            // Should not have type incompatibility errors
            const typeErrors = result.errors.filter(e => 
              e.code === 'FLAVOUR_TYPE_INCOMPATIBLE'
            )
            expect(typeErrors).toHaveLength(0)
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should provide descriptive error messages for incompatible types', () => {
    // Property: Error messages should clearly identify the incompatibility
    
    fc.assert(
      fc.property(
        formatGenerator(),
        flavourGenerator(),
        (format, flavour) => {
          // Only test if flavour is incompatible with format
          if (!isEligibleForFormat(flavour.type, format.category)) {
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: format.id,
              primaryFlavourIds: [flavour.id],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(sellable, format, [flavour], [])
            
            // Should have error with descriptive message
            const typeError = result.errors.find(e => 
              e.code === 'FLAVOUR_TYPE_INCOMPATIBLE'
            )
            
            expect(typeError).toBeDefined()
            expect(typeError?.message).toContain(flavour.name)
            expect(typeError?.message).toContain(flavour.type)
            expect(typeError?.message).toContain(format.name)
            expect(typeError?.message).toContain(format.category)
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  describe('Format-Specific Type Compatibility', () => {
    it('should reject non-gelato/sorbet flavours for scoop format', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<FlavourType>('soft-serve-base', 'cookie', 'topping', 'sauce'),
          (incompatibleType) => {
            const scoopFormat: Format = {
              id: 'fmt-scoop',
              name: 'Scoop',
              slug: 'scoop',
              category: 'scoop',
              requiresFlavours: true,
              minFlavours: 1,
              maxFlavours: 3,
              allowMixedTypes: true,
              canIncludeAddOns: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const incompatibleFlavour: Flavour = {
              id: 'flav-1',
              name: 'Test Flavour',
              slug: 'test-flavour',
              type: incompatibleType,
              ingredients: [],
              keyNotes: [],
              allergens: [],
              dietaryTags: [],
              status: 'active',
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: scoopFormat.id,
              primaryFlavourIds: [incompatibleFlavour.id],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(
              sellable, 
              scoopFormat, 
              [incompatibleFlavour], 
              []
            )
            
            expect(result.valid).toBe(false)
            expect(result.errors.some(e => e.code === 'FLAVOUR_TYPE_INCOMPATIBLE')).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should reject non-soft-serve-base flavours for soft-serve format', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<FlavourType>('gelato', 'sorbet', 'cookie', 'topping', 'sauce'),
          (incompatibleType) => {
            const softServeFormat: Format = {
              id: 'fmt-soft-serve',
              name: 'Soft Serve',
              slug: 'soft-serve',
              category: 'soft-serve',
              requiresFlavours: true,
              minFlavours: 1,
              maxFlavours: 1,
              allowMixedTypes: false,
              canIncludeAddOns: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const incompatibleFlavour: Flavour = {
              id: 'flav-1',
              name: 'Test Flavour',
              slug: 'test-flavour',
              type: incompatibleType,
              ingredients: [],
              keyNotes: [],
              allergens: [],
              dietaryTags: [],
              status: 'active',
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: softServeFormat.id,
              primaryFlavourIds: [incompatibleFlavour.id],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(
              sellable, 
              softServeFormat, 
              [incompatibleFlavour], 
              []
            )
            
            expect(result.valid).toBe(false)
            expect(result.errors.some(e => e.code === 'FLAVOUR_TYPE_INCOMPATIBLE')).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should accept gelato and sorbet for twist format', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<FlavourType>('gelato', 'sorbet'),
          fc.constantFrom<FlavourType>('gelato', 'sorbet'),
          (type1, type2) => {
            const twistFormat: Format = {
              id: 'fmt-twist',
              name: 'Twist',
              slug: 'twist',
              category: 'twist',
              requiresFlavours: true,
              minFlavours: 2,
              maxFlavours: 2,
              allowMixedTypes: true,
              canIncludeAddOns: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const flavour1: Flavour = {
              id: 'flav-1',
              name: 'Flavour 1',
              slug: 'flavour-1',
              type: type1,
              ingredients: [],
              keyNotes: [],
              allergens: [],
              dietaryTags: [],
              status: 'active',
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const flavour2: Flavour = {
              id: 'flav-2',
              name: 'Flavour 2',
              slug: 'flavour-2',
              type: type2,
              ingredients: [],
              keyNotes: [],
              allergens: [],
              dietaryTags: [],
              status: 'active',
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Twist',
              publicName: 'Test Twist',
              slug: 'test-twist',
              status: 'draft',
              formatId: twistFormat.id,
              primaryFlavourIds: [flavour1.id, flavour2.id],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(
              sellable, 
              twistFormat, 
              [flavour1, flavour2], 
              []
            )
            
            // Should not have type incompatibility errors
            const typeErrors = result.errors.filter(e => e.code === 'FLAVOUR_TYPE_INCOMPATIBLE')
            expect(typeErrors).toHaveLength(0)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should reject modifier types (topping, sauce) for all formats', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<FormatCategory>('scoop', 'take-home', 'sandwich', 'twist', 'soft-serve'),
          fc.constantFrom<FlavourType>('topping', 'sauce'),
          (formatCategory, modifierType) => {
            const format: Format = {
              id: 'fmt-test',
              name: 'Test Format',
              slug: 'test-format',
              category: formatCategory,
              requiresFlavours: true,
              minFlavours: 1,
              maxFlavours: 3,
              allowMixedTypes: true,
              canIncludeAddOns: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const modifierFlavour: Flavour = {
              id: 'flav-modifier',
              name: 'Modifier Flavour',
              slug: 'modifier-flavour',
              type: modifierType,
              ingredients: [],
              keyNotes: [],
              allergens: [],
              dietaryTags: [],
              status: 'active',
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: format.id,
              primaryFlavourIds: [modifierFlavour.id],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(
              sellable, 
              format, 
              [modifierFlavour], 
              []
            )
            
            // Modifier types should always be rejected as flavours
            expect(result.valid).toBe(false)
            expect(result.errors.some(e => e.code === 'FLAVOUR_TYPE_INCOMPATIBLE')).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Multiple Flavour Validation', () => {
    it('should reject if any flavour is incompatible', () => {
      // Property: If even one flavour is incompatible, validation should fail
      
      fc.assert(
        fc.property(
          formatGenerator(),
          fc.array(flavourGenerator(), { minLength: 2, maxLength: 5 }),
          (format, allFlavours) => {
            // Find at least one compatible and one incompatible flavour
            const compatibleFlavours = allFlavours.filter(f => 
              isEligibleForFormat(f.type, format.category)
            )
            const incompatibleFlavours = allFlavours.filter(f => 
              !isEligibleForFormat(f.type, format.category)
            )
            
            // Only test if we have both types
            if (compatibleFlavours.length > 0 && incompatibleFlavours.length > 0) {
              // Mix compatible and incompatible flavours
              const mixedFlavours = [
                ...compatibleFlavours.slice(0, 1),
                ...incompatibleFlavours.slice(0, 1)
              ]
              
              const sellable: Sellable = {
                id: 'sell-test',
                internalName: 'Test Sellable',
                publicName: 'Test Sellable',
                slug: 'test-sellable',
                status: 'draft',
                formatId: format.id,
                primaryFlavourIds: mixedFlavours.map(f => f.id),
                price: 500,
                inventoryTracked: false,
                onlineOrderable: true,
                pickupOnly: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
              
              const result = validateSellableComposition(sellable, format, allFlavours, [])
              
              // Should fail because of the incompatible flavour
              expect(result.valid).toBe(false)
              expect(result.errors.some(e => e.code === 'FLAVOUR_TYPE_INCOMPATIBLE')).toBe(true)
            }
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should validate all flavour arrays (primary, secondary, components)', () => {
      // Property: All flavour arrays should be validated for type compatibility
      
      fc.assert(
        fc.property(
          formatGenerator(),
          flavourGenerator(),
          flavourGenerator(),
          flavourGenerator(),
          (format, primaryFlavour, secondaryFlavour, componentFlavour) => {
            const allFlavours = [primaryFlavour, secondaryFlavour, componentFlavour]
            
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: format.id,
              primaryFlavourIds: [primaryFlavour.id],
              secondaryFlavourIds: [secondaryFlavour.id],
              componentIds: [componentFlavour.id],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(sellable, format, allFlavours, [])
            
            // Check if any flavour is incompatible
            const hasIncompatible = allFlavours.some(f => 
              !isEligibleForFormat(f.type, format.category)
            )
            
            if (hasIncompatible) {
              // Should have type incompatibility errors
              expect(result.errors.some(e => e.code === 'FLAVOUR_TYPE_INCOMPATIBLE')).toBe(true)
            } else {
              // Should not have type incompatibility errors
              const typeErrors = result.errors.filter(e => e.code === 'FLAVOUR_TYPE_INCOMPATIBLE')
              expect(typeErrors).toHaveLength(0)
            }
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing flavours gracefully', () => {
      // Property: If a flavour ID doesn't exist, should return FLAVOUR_NOT_FOUND error
      
      fc.assert(
        fc.property(
          formatGenerator(),
          fc.uuid(),
          (format, missingFlavourId) => {
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: format.id,
              primaryFlavourIds: [missingFlavourId],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(sellable, format, [], [])
            
            expect(result.valid).toBe(false)
            expect(result.errors.some(e => e.code === 'FLAVOUR_NOT_FOUND')).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should handle empty flavour arrays', () => {
      // Property: Empty flavour arrays should be validated against min/max bounds
      
      fc.assert(
        fc.property(
          formatGenerator(),
          (format) => {
            const sellable: Sellable = {
              id: 'sell-test',
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: format.id,
              primaryFlavourIds: [],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(sellable, format, [], [])
            
            // If format requires flavours, should fail
            if (format.requiresFlavours && format.minFlavours > 0) {
              expect(result.valid).toBe(false)
              expect(result.errors.some(e => e.code === 'MIN_FLAVOURS_NOT_MET')).toBe(true)
            }
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
