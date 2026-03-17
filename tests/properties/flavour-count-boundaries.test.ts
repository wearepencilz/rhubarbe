/**
 * Property Test: Flavour Count Boundaries
 * 
 * Property 14: Flavour Count Boundaries
 * Validates: Requirements 14.5, 14.6
 * 
 * Feature: launch-first-cms-model, Property 14: For any format with minFlavours
 * and maxFlavours constraints, attempting to create a sellable with fewer than
 * minFlavours or more than maxFlavours should be rejected.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { validateSellableComposition } from '../../lib/validation.js'
import type { Sellable, Format, Flavour, Modifier, FlavourType, FormatCategory } from '../../types/index.js'

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
 * Generate a format with specific min/max flavour constraints
 */
const formatWithBoundsGenerator = (): fc.Arbitrary<Format> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 20 }),
    slug: fc.string({ minLength: 3, maxLength: 20 }),
    category: fc.constantFrom<FormatCategory>('scoop', 'take-home', 'sandwich', 'twist', 'soft-serve'),
    requiresFlavours: fc.constant(true),
    minFlavours: fc.integer({ min: 1, max: 3 }),
    maxFlavours: fc.integer({ min: 1, max: 5 }),
    allowMixedTypes: fc.boolean(),
    canIncludeAddOns: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }).chain(format => {
    // Ensure maxFlavours >= minFlavours
    if (format.maxFlavours < format.minFlavours) {
      return fc.constant({
        ...format,
        maxFlavours: format.minFlavours
      })
    }
    return fc.constant(format)
  }) as fc.Arbitrary<Format>
}

/**
 * Generate a sellable with a specific number of flavours
 */
const sellableWithFlavourCountGenerator = (
  flavourCount: number,
  formatId: string,
  flavourIds: string[]
): Sellable => {
  const selectedIds = flavourIds.slice(0, flavourCount)
  
  return {
    id: `sellable-${Date.now()}`,
    internalName: 'Test Sellable',
    publicName: 'Test Sellable',
    slug: 'test-sellable',
    status: 'draft',
    formatId,
    primaryFlavourIds: selectedIds,
    secondaryFlavourIds: [],
    componentIds: [],
    toppingIds: [],
    price: 500,
    inventoryTracked: false,
    onlineOrderable: true,
    pickupOnly: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 14: Flavour Count Boundaries', () => {
  it('should reject sellables with fewer flavours than minFlavours', () => {
    // Feature: launch-first-cms-model, Property 14: Attempting to create a
    // sellable with fewer than minFlavours should be rejected
    
    fc.assert(
      fc.property(
        formatWithBoundsGenerator(),
        fc.array(flavourGenerator('gelato'), { minLength: 5, maxLength: 10 }),
        (format, flavours) => {
          // Only test if minFlavours > 0
          if (format.minFlavours === 0) return true
          
          // Create a sellable with fewer flavours than minimum
          const flavourCount = Math.max(0, format.minFlavours - 1)
          const flavourIds = flavours.map(f => f.id)
          const sellable = sellableWithFlavourCountGenerator(flavourCount, format.id, flavourIds)
          
          const result = validateSellableComposition(sellable, format, flavours, [])
          
          // Validation should fail
          expect(result.valid).toBe(false)
          
          // Should have an error about minimum flavours
          const minFlavourError = result.errors.find(e => e.code === 'MIN_FLAVOURS_NOT_MET')
          expect(minFlavourError).toBeDefined()
          expect(minFlavourError?.message).toContain(`at least ${format.minFlavours}`)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should reject sellables with more flavours than maxFlavours', () => {
    // Feature: launch-first-cms-model, Property 14: Attempting to create a
    // sellable with more than maxFlavours should be rejected
    
    fc.assert(
      fc.property(
        formatWithBoundsGenerator(),
        fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
        (format, flavours) => {
          // Create a sellable with more flavours than maximum
          const flavourCount = format.maxFlavours + 1
          const flavourIds = flavours.map(f => f.id)
          const sellable = sellableWithFlavourCountGenerator(flavourCount, format.id, flavourIds)
          
          const result = validateSellableComposition(sellable, format, flavours, [])
          
          // Validation should fail
          expect(result.valid).toBe(false)
          
          // Should have an error about maximum flavours
          const maxFlavourError = result.errors.find(e => e.code === 'MAX_FLAVOURS_EXCEEDED')
          expect(maxFlavourError).toBeDefined()
          expect(maxFlavourError?.message).toContain(`at most ${format.maxFlavours}`)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept sellables with flavour count within bounds', () => {
    // Feature: launch-first-cms-model, Property 14: Sellables with flavour
    // count between minFlavours and maxFlavours should be accepted
    
    fc.assert(
      fc.property(
        formatWithBoundsGenerator(),
        fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
        (format, flavours) => {
          // Generate a valid count within bounds
          const validCount = fc.sample(
            fc.integer({ min: format.minFlavours, max: format.maxFlavours }),
            1
          )[0]
          
          const flavourIds = flavours.map(f => f.id)
          const sellable = sellableWithFlavourCountGenerator(validCount, format.id, flavourIds)
          
          const result = validateSellableComposition(sellable, format, flavours, [])
          
          // Should not have min/max flavour errors
          const minFlavourError = result.errors.find(e => e.code === 'MIN_FLAVOURS_NOT_MET')
          const maxFlavourError = result.errors.find(e => e.code === 'MAX_FLAVOURS_EXCEEDED')
          
          expect(minFlavourError).toBeUndefined()
          expect(maxFlavourError).toBeUndefined()
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept sellables with exactly minFlavours', () => {
    // Boundary test: Exactly minFlavours should be valid
    
    fc.assert(
      fc.property(
        formatWithBoundsGenerator(),
        fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
        (format, flavours) => {
          const flavourIds = flavours.map(f => f.id)
          const sellable = sellableWithFlavourCountGenerator(format.minFlavours, format.id, flavourIds)
          
          const result = validateSellableComposition(sellable, format, flavours, [])
          
          // Should not have min/max flavour errors
          const minFlavourError = result.errors.find(e => e.code === 'MIN_FLAVOURS_NOT_MET')
          const maxFlavourError = result.errors.find(e => e.code === 'MAX_FLAVOURS_EXCEEDED')
          
          expect(minFlavourError).toBeUndefined()
          expect(maxFlavourError).toBeUndefined()
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept sellables with exactly maxFlavours', () => {
    // Boundary test: Exactly maxFlavours should be valid
    
    fc.assert(
      fc.property(
        formatWithBoundsGenerator(),
        fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
        (format, flavours) => {
          const flavourIds = flavours.map(f => f.id)
          const sellable = sellableWithFlavourCountGenerator(format.maxFlavours, format.id, flavourIds)
          
          const result = validateSellableComposition(sellable, format, flavours, [])
          
          // Should not have min/max flavour errors
          const minFlavourError = result.errors.find(e => e.code === 'MIN_FLAVOURS_NOT_MET')
          const maxFlavourError = result.errors.find(e => e.code === 'MAX_FLAVOURS_EXCEEDED')
          
          expect(minFlavourError).toBeUndefined()
          expect(maxFlavourError).toBeUndefined()
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should count all flavour arrays (primary, secondary, components)', () => {
    // Property: Total flavour count should include all flavour arrays
    
    fc.assert(
      fc.property(
        formatWithBoundsGenerator(),
        fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
        (format, flavours) => {
          const flavourIds = flavours.map(f => f.id)
          
          // Create a sellable that exceeds maxFlavours when all arrays are combined
          const primaryCount = Math.min(2, format.maxFlavours)
          const secondaryCount = Math.min(2, format.maxFlavours)
          const componentCount = Math.max(1, format.maxFlavours - primaryCount - secondaryCount + 1)
          
          const sellable: Sellable = {
            id: `sellable-${Date.now()}`,
            internalName: 'Test Sellable',
            publicName: 'Test Sellable',
            slug: 'test-sellable',
            status: 'draft',
            formatId: format.id,
            primaryFlavourIds: flavourIds.slice(0, primaryCount),
            secondaryFlavourIds: flavourIds.slice(primaryCount, primaryCount + secondaryCount),
            componentIds: flavourIds.slice(primaryCount + secondaryCount, primaryCount + secondaryCount + componentCount),
            toppingIds: [],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const totalCount = primaryCount + secondaryCount + componentCount
          const result = validateSellableComposition(sellable, format, flavours, [])
          
          // If total exceeds max, should have error
          if (totalCount > format.maxFlavours) {
            expect(result.valid).toBe(false)
            const maxFlavourError = result.errors.find(e => e.code === 'MAX_FLAVOURS_EXCEEDED')
            expect(maxFlavourError).toBeDefined()
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  describe('Edge Cases', () => {
    it('should handle format with minFlavours = maxFlavours (exact count required)', () => {
      // Property: When min equals max, only that exact count should be valid
      
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
          (exactCount, flavours) => {
            const format: Format = {
              id: 'fmt-exact',
              name: 'Exact Format',
              slug: 'exact-format',
              category: 'scoop',
              requiresFlavours: true,
              minFlavours: exactCount,
              maxFlavours: exactCount,
              allowMixedTypes: false,
              canIncludeAddOns: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const flavourIds = flavours.map(f => f.id)
            
            // Test with exact count (should pass)
            const validSellable = sellableWithFlavourCountGenerator(exactCount, format.id, flavourIds)
            const validResult = validateSellableComposition(validSellable, format, flavours, [])
            
            const validMinError = validResult.errors.find(e => e.code === 'MIN_FLAVOURS_NOT_MET')
            const validMaxError = validResult.errors.find(e => e.code === 'MAX_FLAVOURS_EXCEEDED')
            expect(validMinError).toBeUndefined()
            expect(validMaxError).toBeUndefined()
            
            // Test with one less (should fail)
            if (exactCount > 0) {
              const tooFewSellable = sellableWithFlavourCountGenerator(exactCount - 1, format.id, flavourIds)
              const tooFewResult = validateSellableComposition(tooFewSellable, format, flavours, [])
              expect(tooFewResult.valid).toBe(false)
            }
            
            // Test with one more (should fail)
            const tooManySellable = sellableWithFlavourCountGenerator(exactCount + 1, format.id, flavourIds)
            const tooManyResult = validateSellableComposition(tooManySellable, format, flavours, [])
            expect(tooManyResult.valid).toBe(false)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should handle format with minFlavours = 0', () => {
      // Property: When minFlavours is 0, zero flavours should be valid
      
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
          (maxFlavours, flavours) => {
            const format: Format = {
              id: 'fmt-optional',
              name: 'Optional Format',
              slug: 'optional-format',
              category: 'special',
              requiresFlavours: false,
              minFlavours: 0,
              maxFlavours,
              allowMixedTypes: true,
              canIncludeAddOns: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const flavourIds = flavours.map(f => f.id)
            
            // Test with zero flavours (should pass min check)
            const zeroSellable = sellableWithFlavourCountGenerator(0, format.id, flavourIds)
            const result = validateSellableComposition(zeroSellable, format, flavours, [])
            
            const minError = result.errors.find(e => e.code === 'MIN_FLAVOURS_NOT_MET')
            expect(minError).toBeUndefined()
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should handle empty flavour arrays correctly', () => {
      // Property: Empty arrays should count as zero flavours
      
      fc.assert(
        fc.property(
          formatWithBoundsGenerator(),
          fc.array(flavourGenerator('gelato'), { minLength: 5, maxLength: 10 }),
          (format, flavours) => {
            const sellable: Sellable = {
              id: `sellable-${Date.now()}`,
              internalName: 'Test Sellable',
              publicName: 'Test Sellable',
              slug: 'test-sellable',
              status: 'draft',
              formatId: format.id,
              primaryFlavourIds: [],
              secondaryFlavourIds: [],
              componentIds: [],
              toppingIds: [],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSellableComposition(sellable, format, flavours, [])
            
            // If minFlavours > 0, should fail
            if (format.minFlavours > 0) {
              expect(result.valid).toBe(false)
              const minError = result.errors.find(e => e.code === 'MIN_FLAVOURS_NOT_MET')
              expect(minError).toBeDefined()
            }
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should provide clear error messages with actual counts', () => {
      // Property: Error messages should include the actual and expected counts
      
      fc.assert(
        fc.property(
          formatWithBoundsGenerator(),
          fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
          (format, flavours) => {
            const flavourIds = flavours.map(f => f.id)
            
            // Test below minimum
            if (format.minFlavours > 0) {
              const tooFewCount = format.minFlavours - 1
              const tooFewSellable = sellableWithFlavourCountGenerator(tooFewCount, format.id, flavourIds)
              const tooFewResult = validateSellableComposition(tooFewSellable, format, flavours, [])
              
              const minError = tooFewResult.errors.find(e => e.code === 'MIN_FLAVOURS_NOT_MET')
              if (minError) {
                expect(minError.message).toContain(format.minFlavours.toString())
                expect(minError.message).toContain(tooFewCount.toString())
              }
            }
            
            // Test above maximum
            const tooManyCount = format.maxFlavours + 1
            const tooManySellable = sellableWithFlavourCountGenerator(tooManyCount, format.id, flavourIds)
            const tooManyResult = validateSellableComposition(tooManySellable, format, flavours, [])
            
            const maxError = tooManyResult.errors.find(e => e.code === 'MAX_FLAVOURS_EXCEEDED')
            if (maxError) {
              expect(maxError.message).toContain(format.maxFlavours.toString())
              expect(maxError.message).toContain(tooManyCount.toString())
            }
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Consistency Properties', () => {
    it('should return consistent results for the same inputs', () => {
      // Property: Same inputs should always produce same validation results
      
      fc.assert(
        fc.property(
          formatWithBoundsGenerator(),
          fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
          fc.integer({ min: 0, max: 6 }),
          (format, flavours, flavourCount) => {
            const flavourIds = flavours.map(f => f.id)
            const sellable = sellableWithFlavourCountGenerator(flavourCount, format.id, flavourIds)
            
            const result1 = validateSellableComposition(sellable, format, flavours, [])
            const result2 = validateSellableComposition(sellable, format, flavours, [])
            const result3 = validateSellableComposition(sellable, format, flavours, [])
            
            expect(result1.valid).toBe(result2.valid)
            expect(result2.valid).toBe(result3.valid)
            expect(result1.errors.length).toBe(result2.errors.length)
            expect(result2.errors.length).toBe(result3.errors.length)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should validate boundaries independently of other validation rules', () => {
      // Property: Flavour count validation should work regardless of other errors
      
      fc.assert(
        fc.property(
          formatWithBoundsGenerator(),
          fc.array(flavourGenerator('gelato'), { minLength: 10, maxLength: 15 }),
          (format, flavours) => {
            const flavourIds = flavours.map(f => f.id)
            
            // Create a sellable that violates max count
            const tooManyCount = format.maxFlavours + 1
            const sellable = sellableWithFlavourCountGenerator(tooManyCount, format.id, flavourIds)
            
            const result = validateSellableComposition(sellable, format, flavours, [])
            
            // Should always have the max flavour error, regardless of other errors
            const maxError = result.errors.find(e => e.code === 'MAX_FLAVOURS_EXCEEDED')
            expect(maxError).toBeDefined()
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
