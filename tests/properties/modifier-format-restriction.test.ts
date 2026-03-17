/**
 * Property Test: Modifier Format Restriction
 * 
 * Property 8: Modifier Format Restriction
 * Validates: Requirements 4.4
 * 
 * Feature: launch-first-cms-model, Property 8: For any format that disallows
 * modifiers (canIncludeAddOns = false), attempting to create a sellable with
 * that format and any modifiers should be rejected.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { validateModifierAvailability } from '../../lib/validation.js'
import type { Modifier, Format, ModifierType, FormatCategory } from '../../types/index.js'

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate a valid modifier
 */
const modifierGenerator = (availableForFormatIds?: string[]): fc.Arbitrary<Modifier> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    slug: fc.string({ minLength: 3, maxLength: 30 }),
    type: fc.constantFrom<ModifierType>('topping', 'sauce', 'crunch', 'drizzle', 'premium-addon', 'pack-in'),
    price: fc.integer({ min: 0, max: 1000 }),
    allergens: fc.constant([]),
    dietaryFlags: fc.constant([]),
    availableForFormatIds: availableForFormatIds 
      ? fc.constant(availableForFormatIds)
      : fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
    status: fc.constantFrom('active', 'archived'),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Modifier>
}

/**
 * Generate a format with specific canIncludeAddOns value
 */
const formatGenerator = (canIncludeAddOns?: boolean): fc.Arbitrary<Format> => {
  const addOnsArb = canIncludeAddOns !== undefined
    ? fc.constant(canIncludeAddOns)
    : fc.boolean()
  
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 20 }),
    slug: fc.string({ minLength: 3, maxLength: 20 }),
    category: fc.constantFrom<FormatCategory>('scoop', 'take-home', 'sandwich', 'twist', 'soft-serve', 'special'),
    requiresFlavours: fc.boolean(),
    minFlavours: fc.integer({ min: 0, max: 3 }),
    maxFlavours: fc.integer({ min: 1, max: 5 }),
    allowMixedTypes: fc.boolean(),
    canIncludeAddOns: addOnsArb,
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString())
  }) as fc.Arbitrary<Format>
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 8: Modifier Format Restriction', () => {
  it('should reject modifiers when format disallows add-ons', () => {
    // Feature: launch-first-cms-model, Property 8: For any format that disallows
    // modifiers (canIncludeAddOns = false), modifiers should be rejected
    
    fc.assert(
      fc.property(
        modifierGenerator(),
        formatGenerator(false), // canIncludeAddOns = false
        (modifier, format) => {
          const result = validateModifierAvailability(modifier, format)
          
          // Validation should fail
          expect(result.valid).toBe(false)
          
          // Should have at least one error
          expect(result.errors.length).toBeGreaterThan(0)
          
          // Should have FORMAT_NO_MODIFIERS error
          const hasFormatError = result.errors.some(
            err => err.code === 'FORMAT_NO_MODIFIERS'
          )
          expect(hasFormatError).toBe(true)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should reject modifiers when not in availableForFormatIds', () => {
    // Property: Modifiers should be rejected when format ID is not in availableForFormatIds
    
    fc.assert(
      fc.property(
        fc.uuid(), // Format ID that modifier is NOT available for
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }), // Different format IDs
        (formatId, otherFormatIds) => {
          // Ensure formatId is not in otherFormatIds
          const availableIds = otherFormatIds.filter(id => id !== formatId)
          
          const modifier: Modifier = {
            id: 'mod-1',
            name: 'Test Modifier',
            slug: 'test-modifier',
            type: 'topping',
            price: 100,
            allergens: [],
            dietaryFlags: [],
            availableForFormatIds: availableIds,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const format: Format = {
            id: formatId,
            name: 'Test Format',
            slug: 'test-format',
            category: 'scoop',
            requiresFlavours: true,
            minFlavours: 1,
            maxFlavours: 3,
            allowMixedTypes: true,
            canIncludeAddOns: true, // Format allows add-ons
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateModifierAvailability(modifier, format)
          
          // Validation should fail
          expect(result.valid).toBe(false)
          
          // Should have MODIFIER_NOT_AVAILABLE error
          const hasAvailabilityError = result.errors.some(
            err => err.code === 'MODIFIER_NOT_AVAILABLE'
          )
          expect(hasAvailabilityError).toBe(true)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should accept modifiers when both conditions are met', () => {
    // Property: Modifiers should be accepted when format allows add-ons AND
    // modifier is available for that format
    
    fc.assert(
      fc.property(
        fc.uuid(), // Format ID
        (formatId) => {
          const modifier: Modifier = {
            id: 'mod-1',
            name: 'Test Modifier',
            slug: 'test-modifier',
            type: 'topping',
            price: 100,
            allergens: [],
            dietaryFlags: [],
            availableForFormatIds: [formatId], // Modifier is available for this format
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const format: Format = {
            id: formatId,
            name: 'Test Format',
            slug: 'test-format',
            category: 'scoop',
            requiresFlavours: true,
            minFlavours: 1,
            maxFlavours: 3,
            allowMixedTypes: true,
            canIncludeAddOns: true, // Format allows add-ons
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateModifierAvailability(modifier, format)
          
          // Validation should pass
          expect(result.valid).toBe(true)
          expect(result.errors).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should reject modifiers when format disallows add-ons even if modifier is available', () => {
    // Property: canIncludeAddOns = false should reject regardless of availableForFormatIds
    
    fc.assert(
      fc.property(
        fc.uuid(),
        (formatId) => {
          const modifier: Modifier = {
            id: 'mod-1',
            name: 'Test Modifier',
            slug: 'test-modifier',
            type: 'topping',
            price: 100,
            allergens: [],
            dietaryFlags: [],
            availableForFormatIds: [formatId], // Modifier IS available for this format
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const format: Format = {
            id: formatId,
            name: 'Test Format',
            slug: 'test-format',
            category: 'twist',
            requiresFlavours: true,
            minFlavours: 2,
            maxFlavours: 2,
            allowMixedTypes: true,
            canIncludeAddOns: false, // Format does NOT allow add-ons
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateModifierAvailability(modifier, format)
          
          // Validation should fail due to format restriction
          expect(result.valid).toBe(false)
          
          // Should have FORMAT_NO_MODIFIERS error
          const hasFormatError = result.errors.some(
            err => err.code === 'FORMAT_NO_MODIFIERS'
          )
          expect(hasFormatError).toBe(true)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should have both errors when format disallows and modifier not available', () => {
    // Property: When both conditions fail, both errors should be present
    
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        (formatId, otherFormatIds) => {
          const availableIds = otherFormatIds.filter(id => id !== formatId)
          
          const modifier: Modifier = {
            id: 'mod-1',
            name: 'Test Modifier',
            slug: 'test-modifier',
            type: 'topping',
            price: 100,
            allergens: [],
            dietaryFlags: [],
            availableForFormatIds: availableIds, // NOT available for this format
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const format: Format = {
            id: formatId,
            name: 'Test Format',
            slug: 'test-format',
            category: 'sandwich',
            requiresFlavours: true,
            minFlavours: 3,
            maxFlavours: 3,
            allowMixedTypes: false,
            canIncludeAddOns: false, // Format does NOT allow add-ons
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const result = validateModifierAvailability(modifier, format)
          
          // Validation should fail
          expect(result.valid).toBe(false)
          
          // Should have both errors
          expect(result.errors.length).toBeGreaterThanOrEqual(2)
          
          const hasFormatError = result.errors.some(
            err => err.code === 'FORMAT_NO_MODIFIERS'
          )
          const hasAvailabilityError = result.errors.some(
            err => err.code === 'MODIFIER_NOT_AVAILABLE'
          )
          
          expect(hasFormatError).toBe(true)
          expect(hasAvailabilityError).toBe(true)
        }
      ),
      { numRuns: 10 }
    )
  })

  describe('Edge Cases', () => {
    it('should handle modifier available for multiple formats', () => {
      // Property: Modifier available for multiple formats should work for any of them
      
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
          (formatIds) => {
            const modifier: Modifier = {
              id: 'mod-1',
              name: 'Test Modifier',
              slug: 'test-modifier',
              type: 'topping',
              price: 100,
              allergens: [],
              dietaryFlags: [],
              availableForFormatIds: formatIds, // Available for multiple formats
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            // Test with each format ID
            formatIds.forEach(formatId => {
              const format: Format = {
                id: formatId,
                name: 'Test Format',
                slug: 'test-format',
                category: 'scoop',
                requiresFlavours: true,
                minFlavours: 1,
                maxFlavours: 3,
                allowMixedTypes: true,
                canIncludeAddOns: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
              
              const result = validateModifierAvailability(modifier, format)
              
              // Should be valid for all formats in the list
              expect(result.valid).toBe(true)
              expect(result.errors).toHaveLength(0)
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle modifier with empty availableForFormatIds', () => {
      // Property: Modifier with no available formats should always fail availability check
      
      fc.assert(
        fc.property(
          formatGenerator(true), // Format allows add-ons
          (format) => {
            const modifier: Modifier = {
              id: 'mod-1',
              name: 'Test Modifier',
              slug: 'test-modifier',
              type: 'topping',
              price: 100,
              allergens: [],
              dietaryFlags: [],
              availableForFormatIds: [], // Not available for any format
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateModifierAvailability(modifier, format)
            
            // Should fail availability check
            expect(result.valid).toBe(false)
            
            const hasAvailabilityError = result.errors.some(
              err => err.code === 'MODIFIER_NOT_AVAILABLE'
            )
            expect(hasAvailabilityError).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should handle all modifier types consistently', () => {
      // Property: Validation should work the same for all modifier types
      
      const modifierTypes: ModifierType[] = ['topping', 'sauce', 'crunch', 'drizzle', 'premium-addon', 'pack-in']
      
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom(...modifierTypes),
          (formatId, modifierType) => {
            const modifier: Modifier = {
              id: 'mod-1',
              name: 'Test Modifier',
              slug: 'test-modifier',
              type: modifierType,
              price: 100,
              allergens: [],
              dietaryFlags: [],
              availableForFormatIds: [formatId],
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const format: Format = {
              id: formatId,
              name: 'Test Format',
              slug: 'test-format',
              category: 'scoop',
              requiresFlavours: true,
              minFlavours: 1,
              maxFlavours: 3,
              allowMixedTypes: true,
              canIncludeAddOns: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateModifierAvailability(modifier, format)
            
            // Should be valid regardless of modifier type
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Consistency Properties', () => {
    it('should return consistent results for the same inputs', () => {
      // Property: Same inputs should always produce same outputs
      
      fc.assert(
        fc.property(
          modifierGenerator(),
          formatGenerator(),
          (modifier, format) => {
            const result1 = validateModifierAvailability(modifier, format)
            const result2 = validateModifierAvailability(modifier, format)
            const result3 = validateModifierAvailability(modifier, format)
            
            expect(result1.valid).toBe(result2.valid)
            expect(result2.valid).toBe(result3.valid)
            expect(result1.errors.length).toBe(result2.errors.length)
            expect(result2.errors.length).toBe(result3.errors.length)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should not mutate input objects', () => {
      // Property: Validation should not modify the modifier or format objects
      
      fc.assert(
        fc.property(
          modifierGenerator(),
          formatGenerator(),
          (modifier, format) => {
            const modifierCopy = JSON.parse(JSON.stringify(modifier))
            const formatCopy = JSON.parse(JSON.stringify(format))
            
            validateModifierAvailability(modifier, format)
            
            // Objects should remain unchanged
            expect(modifier).toEqual(modifierCopy)
            expect(format).toEqual(formatCopy)
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Real-World Scenarios', () => {
    it('should validate twist format correctly (no modifiers allowed)', () => {
      // Twist format typically doesn't allow modifiers
      
      fc.assert(
        fc.property(
          modifierGenerator(),
          (modifier) => {
            const twistFormat: Format = {
              id: 'fmt-twist',
              name: 'Twist',
              slug: 'twist',
              category: 'twist',
              requiresFlavours: true,
              minFlavours: 2,
              maxFlavours: 2,
              allowMixedTypes: true,
              canIncludeAddOns: false, // Twist doesn't allow modifiers
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateModifierAvailability(modifier, twistFormat)
            
            // Should always fail for twist format
            expect(result.valid).toBe(false)
            
            const hasFormatError = result.errors.some(
              err => err.code === 'FORMAT_NO_MODIFIERS'
            )
            expect(hasFormatError).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should validate scoop format correctly (modifiers allowed)', () => {
      // Scoop format typically allows modifiers
      
      fc.assert(
        fc.property(
          fc.uuid(),
          (formatId) => {
            const modifier: Modifier = {
              id: 'mod-sprinkles',
              name: 'Rainbow Sprinkles',
              slug: 'rainbow-sprinkles',
              type: 'topping',
              price: 50,
              allergens: [],
              dietaryFlags: [],
              availableForFormatIds: [formatId],
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const scoopFormat: Format = {
              id: formatId,
              name: 'Scoop',
              slug: 'scoop',
              category: 'scoop',
              requiresFlavours: true,
              minFlavours: 1,
              maxFlavours: 3,
              allowMixedTypes: true,
              canIncludeAddOns: true, // Scoop allows modifiers
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateModifierAvailability(modifier, scoopFormat)
            
            // Should be valid
            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should validate sandwich format correctly (no modifiers allowed)', () => {
      // Sandwich format typically doesn't allow modifiers
      
      fc.assert(
        fc.property(
          modifierGenerator(),
          (modifier) => {
            const sandwichFormat: Format = {
              id: 'fmt-sandwich',
              name: 'Sandwich',
              slug: 'sandwich',
              category: 'sandwich',
              requiresFlavours: true,
              minFlavours: 3,
              maxFlavours: 3,
              allowMixedTypes: false,
              canIncludeAddOns: false, // Sandwich doesn't allow modifiers
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const result = validateModifierAvailability(modifier, sandwichFormat)
            
            // Should always fail for sandwich format
            expect(result.valid).toBe(false)
            
            const hasFormatError = result.errors.some(
              err => err.code === 'FORMAT_NO_MODIFIERS'
            )
            expect(hasFormatError).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
