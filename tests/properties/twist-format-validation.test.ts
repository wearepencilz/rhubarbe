/**
 * Property Test: Twist Format Validation
 * 
 * Property 6: Twist Format Validation
 * **Validates: Requirements 3.5, 17.4**
 * 
 * Feature: launch-first-cms-model, Property 6: For any sellable with a twist format,
 * the system should validate that exactly two flavours are selected and both are
 * either gelato or sorbet type.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { validateTwistFormat } from '../../lib/validation.js'
import type { Sellable, Flavour, FlavourType } from '../../types/index.js'

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
 * Generate a sellable with specific flavour IDs
 */
const sellableGenerator = (
  primaryIds: string[] = [],
  secondaryIds: string[] = []
): fc.Arbitrary<Sellable> => {
  return fc.record({
    id: fc.uuid(),
    internalName: fc.string({ minLength: 5, maxLength: 30 }),
    publicName: fc.string({ minLength: 5, maxLength: 50 }),
    slug: fc.string({ minLength: 5, maxLength: 30 }),
    status: fc.constantFrom('draft', 'active', 'archived', 'out-of-stock'),
    formatId: fc.constant('fmt-twist'),
    primaryFlavourIds: fc.constant(primaryIds),
    secondaryFlavourIds: fc.constant(secondaryIds.length > 0 ? secondaryIds : undefined),
    price: fc.integer({ min: 100, max: 2000 }),
    inventoryTracked: fc.boolean(),
    onlineOrderable: fc.boolean(),
    pickupOnly: fc.boolean(),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Sellable>
}

/**
 * Generate a gelato or sorbet flavour
 */
const gelatoOrSorbetGenerator = (): fc.Arbitrary<Flavour> => {
  return fc.constantFrom<FlavourType>('gelato', 'sorbet').chain(type => flavourGenerator(type))
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 6: Twist Format Validation', () => {
  it('should accept exactly 2 gelato or sorbet flavours', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: Valid twist requires exactly 2 gelato/sorbet flavours
    
    fc.assert(
      fc.property(
        gelatoOrSorbetGenerator(),
        gelatoOrSorbetGenerator(),
        (flavour1, flavour2) => {
          const flavours = [flavour1, flavour2]
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: [flavour1.id],
            secondaryFlavourIds: [flavour2.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          // Should be valid when both are gelato or sorbet
          expect(result.valid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should reject twist with fewer than 2 flavours', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: Twist must have exactly 2 flavours, not fewer
    
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }),
        flavourGenerator('gelato'),
        (count, flavour) => {
          const flavours = count === 1 ? [flavour] : []
          const flavourIds = flavours.map(f => f.id)
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: flavourIds,
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about exact count
          const hasCountError = result.errors.some(e => 
            e.code === 'TWIST_EXACT_COUNT' || e.message.includes('exactly 2 flavours')
          )
          expect(hasCountError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should reject twist with more than 2 flavours', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: Twist must have exactly 2 flavours, not more
    
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 5 }),
        (count) => {
          const flavours: Flavour[] = []
          for (let i = 0; i < count; i++) {
            flavours.push({
              id: `flav-${i}`,
              name: `Flavour ${i}`,
              slug: `flavour-${i}`,
              type: i % 2 === 0 ? 'gelato' : 'sorbet',
              ingredients: [],
              keyNotes: [],
              allergens: [],
              dietaryTags: [],
              status: 'active',
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: flavours.map(f => f.id),
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about exact count
          const hasCountError = result.errors.some(e => 
            e.code === 'TWIST_EXACT_COUNT' || e.message.includes('exactly 2 flavours')
          )
          expect(hasCountError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should reject twist with non-gelato/sorbet flavours', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: Both flavours must be gelato or sorbet type
    
    fc.assert(
      fc.property(
        fc.constantFrom<FlavourType>('soft-serve-base', 'cookie', 'topping', 'sauce'),
        flavourGenerator('gelato'),
        (invalidType, validFlavour) => {
          const invalidFlavour: Flavour = {
            id: 'flav-invalid',
            name: 'Invalid Flavour',
            slug: 'invalid-flavour',
            type: invalidType,
            ingredients: [],
            keyNotes: [],
            allergens: [],
            dietaryTags: [],
            status: 'active',
            featured: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const flavours = [validFlavour, invalidFlavour]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: [validFlavour.id, invalidFlavour.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about type incompatibility
          const hasTypeError = result.errors.some(e => 
            e.code === 'TWIST_TYPE_INCOMPATIBLE' || 
            e.message.includes('gelato or sorbet')
          )
          expect(hasTypeError).toBe(true)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept gelato + gelato combination', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: Two gelato flavours is valid
    
    fc.assert(
      fc.property(
        flavourGenerator('gelato'),
        flavourGenerator('gelato'),
        (flavour1, flavour2) => {
          const flavours = [flavour1, flavour2]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: [flavour1.id, flavour2.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          expect(result.valid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept sorbet + sorbet combination', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: Two sorbet flavours is valid
    
    fc.assert(
      fc.property(
        flavourGenerator('sorbet'),
        flavourGenerator('sorbet'),
        (flavour1, flavour2) => {
          const flavours = [flavour1, flavour2]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: [flavour1.id, flavour2.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          expect(result.valid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept gelato + sorbet combination', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: Mixed gelato and sorbet is valid
    
    fc.assert(
      fc.property(
        flavourGenerator('gelato'),
        flavourGenerator('sorbet'),
        (gelatoFlavour, sorbetFlavour) => {
          const flavours = [gelatoFlavour, sorbetFlavour]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: [gelatoFlavour.id, sorbetFlavour.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          expect(result.valid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should handle flavours split between primary and secondary arrays', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: Validation should work regardless of how flavours are split
    
    fc.assert(
      fc.property(
        flavourGenerator('gelato'),
        flavourGenerator('sorbet'),
        (flavour1, flavour2) => {
          const flavours = [flavour1, flavour2]
          
          // Test with one in primary, one in secondary
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: [flavour1.id],
            secondaryFlavourIds: [flavour2.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          expect(result.valid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should return error when flavour not found', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: Should handle missing flavour references gracefully
    
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (id1, id2) => {
          const flavours: Flavour[] = [] // Empty flavours array
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: [id1, id2],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about flavour not found
          const hasNotFoundError = result.errors.some(e => 
            e.code === 'FLAVOUR_NOT_FOUND' || e.message.includes('not found')
          )
          expect(hasNotFoundError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should accumulate multiple errors when multiple rules violated', () => {
    // **Validates: Requirements 3.5, 17.4**
    // Property: All validation errors should be reported
    
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 5 }),
        (count) => {
          // Create flavours with invalid types
          const flavours: Flavour[] = []
          for (let i = 0; i < count; i++) {
            flavours.push({
              id: `flav-${i}`,
              name: `Cookie ${i}`,
              slug: `cookie-${i}`,
              type: 'cookie', // Invalid type for twist
              ingredients: [],
              keyNotes: [],
              allergens: [],
              dietaryTags: [],
              status: 'active',
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Twist',
            publicName: 'Test Twist',
            slug: 'test-twist',
            status: 'active',
            formatId: 'fmt-twist',
            primaryFlavourIds: flavours.map(f => f.id),
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateTwistFormat(sellable, flavours)
          
          // Should be invalid with multiple errors
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(1)
          
          // Should have both count error and type errors
          const hasCountError = result.errors.some(e => e.code === 'TWIST_EXACT_COUNT')
          const hasTypeError = result.errors.some(e => e.code === 'TWIST_TYPE_INCOMPATIBLE')
          
          expect(hasCountError).toBe(true)
          expect(hasTypeError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  describe('Edge Cases', () => {
    it('should handle empty flavour arrays', () => {
      // Property: Empty flavour selection should be invalid
      
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Twist',
        publicName: 'Test Twist',
        slug: 'test-twist',
        status: 'active',
        formatId: 'fmt-twist',
        primaryFlavourIds: [],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const result = validateTwistFormat(sellable, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle undefined secondaryFlavourIds', () => {
      // Property: Should work when secondaryFlavourIds is undefined
      
      fc.assert(
        fc.property(
          flavourGenerator('gelato'),
          flavourGenerator('sorbet'),
          (flavour1, flavour2) => {
            const flavours = [flavour1, flavour2]
            
            const sellable: Sellable = {
              id: 'sell-1',
              internalName: 'Test Twist',
              publicName: 'Test Twist',
              slug: 'test-twist',
              status: 'active',
              formatId: 'fmt-twist',
              primaryFlavourIds: [flavour1.id, flavour2.id],
              secondaryFlavourIds: undefined, // Explicitly undefined
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateTwistFormat(sellable, flavours)
            
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Consistency Properties', () => {
    it('should return consistent results for the same inputs', () => {
      // Property: Same inputs should always produce same outputs
      
      fc.assert(
        fc.property(
          flavourGenerator('gelato'),
          flavourGenerator('sorbet'),
          (flavour1, flavour2) => {
            const flavours = [flavour1, flavour2]
            
            const sellable: Sellable = {
              id: 'sell-1',
              internalName: 'Test Twist',
              publicName: 'Test Twist',
              slug: 'test-twist',
              status: 'active',
              formatId: 'fmt-twist',
              primaryFlavourIds: [flavour1.id, flavour2.id],
              price: 500,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result1 = validateTwistFormat(sellable, flavours)
            const result2 = validateTwistFormat(sellable, flavours)
            const result3 = validateTwistFormat(sellable, flavours)
            
            expect(result1.valid).toBe(result2.valid)
            expect(result2.valid).toBe(result3.valid)
            expect(result1.errors.length).toBe(result2.errors.length)
            expect(result2.errors.length).toBe(result3.errors.length)
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
