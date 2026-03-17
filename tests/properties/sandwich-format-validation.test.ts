/**
 * Property Test: Sandwich Format Validation
 * 
 * Property 7: Sandwich Format Validation
 * **Validates: Requirements 3.6, 7.2, 7.3**
 * 
 * Feature: launch-first-cms-model, Property 7: For any sellable with a sandwich format,
 * the system should validate that exactly one filling flavour (gelato or sorbet) and
 * exactly two cookie components are selected.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { validateSandwichFormat } from '../../lib/validation.js'
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
 * Generate a gelato or sorbet flavour (valid filling)
 */
const fillingGenerator = (): fc.Arbitrary<Flavour> => {
  return fc.constantFrom<FlavourType>('gelato', 'sorbet').chain(type => flavourGenerator(type))
}

/**
 * Generate a cookie flavour (valid component)
 */
const cookieGenerator = (): fc.Arbitrary<Flavour> => {
  return flavourGenerator('cookie')
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 7: Sandwich Format Validation', () => {
  it('should accept exactly 1 filling + 2 cookie components', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Valid sandwich requires exactly 1 filling and 2 cookies
    
    fc.assert(
      fc.property(
        fillingGenerator(),
        cookieGenerator(),
        cookieGenerator(),
        (filling, cookie1, cookie2) => {
          const flavours = [filling]
          const components = [cookie1, cookie2]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [filling.id],
            componentIds: [cookie1.id, cookie2.id],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          // Should be valid
          expect(result.valid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should reject sandwich with no filling', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Sandwich must have exactly 1 filling, not zero
    
    fc.assert(
      fc.property(
        cookieGenerator(),
        cookieGenerator(),
        (cookie1, cookie2) => {
          const flavours: Flavour[] = []
          const components = [cookie1, cookie2]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [], // No filling
            componentIds: [cookie1.id, cookie2.id],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about filling count
          const hasFillingError = result.errors.some(e => 
            e.code === 'SANDWICH_FILLING_COUNT' || e.message.includes('exactly 1 filling')
          )
          expect(hasFillingError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should reject sandwich with multiple fillings', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Sandwich must have exactly 1 filling, not more
    
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        cookieGenerator(),
        cookieGenerator(),
        (fillingCount, cookie1, cookie2) => {
          const flavours: Flavour[] = []
          for (let i = 0; i < fillingCount; i++) {
            flavours.push({
              id: `filling-${i}`,
              name: `Filling ${i}`,
              slug: `filling-${i}`,
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
          
          const components = [cookie1, cookie2]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: flavours.map(f => f.id),
            componentIds: [cookie1.id, cookie2.id],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about filling count
          const hasFillingError = result.errors.some(e => 
            e.code === 'SANDWICH_FILLING_COUNT' || e.message.includes('exactly 1 filling')
          )
          expect(hasFillingError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should reject sandwich with fewer than 2 cookies', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Sandwich must have exactly 2 cookies, not fewer
    
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }),
        fillingGenerator(),
        (cookieCount, filling) => {
          const flavours = [filling]
          const components: Flavour[] = []
          
          for (let i = 0; i < cookieCount; i++) {
            components.push({
              id: `cookie-${i}`,
              name: `Cookie ${i}`,
              slug: `cookie-${i}`,
              type: 'cookie',
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
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [filling.id],
            componentIds: components.map(c => c.id),
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about component count
          const hasComponentError = result.errors.some(e => 
            e.code === 'SANDWICH_COMPONENT_COUNT' || e.message.includes('exactly 2 cookie')
          )
          expect(hasComponentError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should reject sandwich with more than 2 cookies', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Sandwich must have exactly 2 cookies, not more
    
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 5 }),
        fillingGenerator(),
        (cookieCount, filling) => {
          const flavours = [filling]
          const components: Flavour[] = []
          
          for (let i = 0; i < cookieCount; i++) {
            components.push({
              id: `cookie-${i}`,
              name: `Cookie ${i}`,
              slug: `cookie-${i}`,
              type: 'cookie',
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
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [filling.id],
            componentIds: components.map(c => c.id),
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about component count
          const hasComponentError = result.errors.some(e => 
            e.code === 'SANDWICH_COMPONENT_COUNT' || e.message.includes('exactly 2 cookie')
          )
          expect(hasComponentError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should reject sandwich with non-gelato/sorbet filling', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Filling must be gelato or sorbet type
    
    fc.assert(
      fc.property(
        fc.constantFrom<FlavourType>('soft-serve-base', 'cookie', 'topping', 'sauce'),
        cookieGenerator(),
        cookieGenerator(),
        (invalidType, cookie1, cookie2) => {
          const invalidFilling: Flavour = {
            id: 'filling-invalid',
            name: 'Invalid Filling',
            slug: 'invalid-filling',
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
          
          const flavours = [invalidFilling]
          const components = [cookie1, cookie2]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [invalidFilling.id],
            componentIds: [cookie1.id, cookie2.id],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about filling type
          const hasTypeError = result.errors.some(e => 
            e.code === 'SANDWICH_FILLING_TYPE' || 
            e.message.includes('gelato or sorbet')
          )
          expect(hasTypeError).toBe(true)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should reject sandwich with non-cookie components', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Components must be cookie type
    
    fc.assert(
      fc.property(
        fc.constantFrom<FlavourType>('gelato', 'sorbet', 'soft-serve-base', 'topping', 'sauce'),
        fillingGenerator(),
        cookieGenerator(),
        (invalidType, filling, validCookie) => {
          const invalidComponent: Flavour = {
            id: 'component-invalid',
            name: 'Invalid Component',
            slug: 'invalid-component',
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
          
          const flavours = [filling]
          const components = [validCookie, invalidComponent]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [filling.id],
            componentIds: [validCookie.id, invalidComponent.id],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          // Should be invalid if component is not cookie type
          if (invalidType !== 'cookie') {
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
            
            // Should have error about component type
            const hasComponentTypeError = result.errors.some(e => 
              e.code === 'SANDWICH_COMPONENT_TYPE' || 
              e.message.includes('cookie type')
            )
            expect(hasComponentTypeError).toBe(true)
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept gelato filling with 2 cookies', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Gelato filling is valid
    
    fc.assert(
      fc.property(
        flavourGenerator('gelato'),
        cookieGenerator(),
        cookieGenerator(),
        (gelatoFilling, cookie1, cookie2) => {
          const flavours = [gelatoFilling]
          const components = [cookie1, cookie2]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [gelatoFilling.id],
            componentIds: [cookie1.id, cookie2.id],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          expect(result.valid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept sorbet filling with 2 cookies', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Sorbet filling is valid
    
    fc.assert(
      fc.property(
        flavourGenerator('sorbet'),
        cookieGenerator(),
        cookieGenerator(),
        (sorbetFilling, cookie1, cookie2) => {
          const flavours = [sorbetFilling]
          const components = [cookie1, cookie2]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [sorbetFilling.id],
            componentIds: [cookie1.id, cookie2.id],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          expect(result.valid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should return error when filling not found', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Should handle missing filling references gracefully
    
    fc.assert(
      fc.property(
        fc.uuid(),
        cookieGenerator(),
        cookieGenerator(),
        (fillingId, cookie1, cookie2) => {
          const flavours: Flavour[] = [] // Empty flavours array
          const components = [cookie1, cookie2]
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [fillingId],
            componentIds: [cookie1.id, cookie2.id],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
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

  it('should return error when component not found', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: Should handle missing component references gracefully
    
    fc.assert(
      fc.property(
        fillingGenerator(),
        fc.uuid(),
        fc.uuid(),
        (filling, cookieId1, cookieId2) => {
          const flavours = [filling]
          const components: Flavour[] = [] // Empty components array
          
          const sellable: Sellable = {
            id: 'sell-1',
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: [filling.id],
            componentIds: [cookieId1, cookieId2],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          // Should be invalid
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have error about component not found
          const hasNotFoundError = result.errors.some(e => 
            e.code === 'COMPONENT_NOT_FOUND' || e.message.includes('not found')
          )
          expect(hasNotFoundError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should accumulate multiple errors when multiple rules violated', () => {
    // **Validates: Requirements 3.6, 7.2, 7.3**
    // Property: All validation errors should be reported
    
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        fc.integer({ min: 0, max: 1 }),
        (fillingCount, cookieCount) => {
          // Create multiple fillings (invalid)
          const flavours: Flavour[] = []
          for (let i = 0; i < fillingCount; i++) {
            flavours.push({
              id: `filling-${i}`,
              name: `Cookie Filling ${i}`,
              slug: `cookie-filling-${i}`,
              type: 'cookie', // Invalid type for filling
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
          
          // Create too few cookies (invalid)
          const components: Flavour[] = []
          for (let i = 0; i < cookieCount; i++) {
            components.push({
              id: `cookie-${i}`,
              name: `Cookie ${i}`,
              slug: `cookie-${i}`,
              type: 'cookie',
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
            internalName: 'Test Sandwich',
            publicName: 'Test Sandwich',
            slug: 'test-sandwich',
            status: 'active',
            formatId: 'fmt-sandwich',
            primaryFlavourIds: flavours.map(f => f.id),
            componentIds: components.map(c => c.id),
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateSandwichFormat(sellable, flavours, components)
          
          // Should be invalid with multiple errors
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(1)
          
          // Should have both filling and component errors
          const hasFillingError = result.errors.some(e => 
            e.code === 'SANDWICH_FILLING_COUNT' || e.code === 'SANDWICH_FILLING_TYPE'
          )
          const hasComponentError = result.errors.some(e => 
            e.code === 'SANDWICH_COMPONENT_COUNT'
          )
          
          expect(hasFillingError).toBe(true)
          expect(hasComponentError).toBe(true)
        }
      ),
      { numRuns: 50 }
    )
  })

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      // Property: Empty selection should be invalid
      
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sandwich',
        publicName: 'Test Sandwich',
        slug: 'test-sandwich',
        status: 'active',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: [],
        componentIds: [],
        price: 600,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const result = validateSandwichFormat(sellable, [], [])
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle undefined componentIds', () => {
      // Property: Should work when componentIds is undefined
      
      fc.assert(
        fc.property(
          fillingGenerator(),
          (filling) => {
            const flavours = [filling]
            
            const sellable: Sellable = {
              id: 'sell-1',
              internalName: 'Test Sandwich',
              publicName: 'Test Sandwich',
              slug: 'test-sandwich',
              status: 'active',
              formatId: 'fmt-sandwich',
              primaryFlavourIds: [filling.id],
              componentIds: undefined, // Explicitly undefined
              price: 600,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSandwichFormat(sellable, flavours, [])
            
            // Should be invalid (needs 2 cookies)
            expect(result.valid).toBe(false)
            
            const hasComponentError = result.errors.some(e => 
              e.code === 'SANDWICH_COMPONENT_COUNT'
            )
            expect(hasComponentError).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Consistency Properties', () => {
    it('should return consistent results for the same inputs', () => {
      // **Validates: Requirements 3.6, 7.2, 7.3**
      // Property: Same inputs should always produce same outputs
      
      fc.assert(
        fc.property(
          fillingGenerator(),
          cookieGenerator(),
          cookieGenerator(),
          (filling, cookie1, cookie2) => {
            const flavours = [filling]
            const components = [cookie1, cookie2]
            
            const sellable: Sellable = {
              id: 'sell-1',
              internalName: 'Test Sandwich',
              publicName: 'Test Sandwich',
              slug: 'test-sandwich',
              status: 'active',
              formatId: 'fmt-sandwich',
              primaryFlavourIds: [filling.id],
              componentIds: [cookie1.id, cookie2.id],
              price: 600,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result1 = validateSandwichFormat(sellable, flavours, components)
            const result2 = validateSandwichFormat(sellable, flavours, components)
            const result3 = validateSandwichFormat(sellable, flavours, components)
            
            expect(result1.valid).toBe(result2.valid)
            expect(result2.valid).toBe(result3.valid)
            expect(result1.errors.length).toBe(result2.errors.length)
            expect(result2.errors.length).toBe(result3.errors.length)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should validate same cookie used twice', () => {
      // **Validates: Requirements 3.6, 7.2, 7.3**
      // Property: Same cookie can be used for both components
      
      fc.assert(
        fc.property(
          fillingGenerator(),
          cookieGenerator(),
          (filling, cookie) => {
            const flavours = [filling]
            const components = [cookie]
            
            const sellable: Sellable = {
              id: 'sell-1',
              internalName: 'Test Sandwich',
              publicName: 'Test Sandwich',
              slug: 'test-sandwich',
              status: 'active',
              formatId: 'fmt-sandwich',
              primaryFlavourIds: [filling.id],
              componentIds: [cookie.id, cookie.id], // Same cookie twice
              price: 600,
              inventoryTracked: false,
              onlineOrderable: true,
              pickupOnly: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateSandwichFormat(sellable, flavours, components)
            
            // Should be valid - same cookie can be used twice
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
