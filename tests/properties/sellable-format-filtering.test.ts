/**
 * Property Test: Sellable Format Filtering
 * 
 * Property 4: Sellable Format Filtering
 * Validates: Requirements 2.7
 * 
 * Feature: launch-first-cms-model, Property 4: For any format selection in the
 * sellable creation interface, only flavours whose type makes them eligible for
 * that format should be displayed in the flavour selection list.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { filterEligibleFlavours, isEligibleForFormat } from '../../lib/format-eligibility.js'
import type { Flavour, Format, FlavourType, FormatCategory } from '../../types/index.js'

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

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 4: Sellable Format Filtering', () => {
  it('should only return flavours eligible for the format category', () => {
    // Feature: launch-first-cms-model, Property 4: For any format selection,
    // only flavours whose type makes them eligible should be displayed
    
    fc.assert(
      fc.property(
        fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
        formatGenerator(),
        (flavours, format) => {
          const filtered = filterEligibleFlavours(flavours, format)
          
          // Every filtered flavour must be eligible for the format
          filtered.forEach(flavour => {
            expect(isEligibleForFormat(flavour.type, format.category)).toBe(true)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should exclude all ineligible flavours from results', () => {
    // Property: No ineligible flavours should appear in filtered results
    
    fc.assert(
      fc.property(
        fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
        formatGenerator(),
        (flavours, format) => {
          const filtered = filterEligibleFlavours(flavours, format)
          const filteredIds = new Set(filtered.map(f => f.id))
          
          // Check that all excluded flavours are indeed ineligible
          flavours.forEach(flavour => {
            if (!filteredIds.has(flavour.id)) {
              expect(isEligibleForFormat(flavour.type, format.category)).toBe(false)
            }
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should return empty array when no flavours are eligible', () => {
    // Property: If no flavours match the format, return empty array
    
    fc.assert(
      fc.property(
        formatGenerator(),
        (format) => {
          // Create flavours that are definitely not eligible
          const ineligibleTypes: FlavourType[] = []
          
          // Determine which types are ineligible for this format
          const allTypes: FlavourType[] = ['gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce']
          allTypes.forEach(type => {
            if (!isEligibleForFormat(type, format.category)) {
              ineligibleTypes.push(type)
            }
          })
          
          // If there are ineligible types, test with them
          if (ineligibleTypes.length > 0) {
            const flavours = ineligibleTypes.map((type, i) => ({
              id: `flav-${i}`,
              name: `Flavour ${i}`,
              slug: `flavour-${i}`,
              type,
              ingredients: [],
              keyNotes: [],
              allergens: [],
              dietaryTags: [],
              status: 'active' as const,
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))
            
            const filtered = filterEligibleFlavours(flavours, format)
            expect(filtered).toHaveLength(0)
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should return all flavours when all are eligible', () => {
    // Property: If all flavours match the format, return all of them
    
    fc.assert(
      fc.property(
        formatGenerator(),
        (format) => {
          // Determine which types are eligible for this format
          const eligibleTypes: FlavourType[] = []
          const allTypes: FlavourType[] = ['gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce']
          
          allTypes.forEach(type => {
            if (isEligibleForFormat(type, format.category)) {
              eligibleTypes.push(type)
            }
          })
          
          // If there are eligible types, test with them
          if (eligibleTypes.length > 0) {
            const flavours = eligibleTypes.map((type, i) => ({
              id: `flav-${i}`,
              name: `Flavour ${i}`,
              slug: `flavour-${i}`,
              type,
              ingredients: [],
              keyNotes: [],
              allergens: [],
              dietaryTags: [],
              status: 'active' as const,
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))
            
            const filtered = filterEligibleFlavours(flavours, format)
            expect(filtered).toHaveLength(flavours.length)
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve flavour order in filtered results', () => {
    // Property: Filtering should maintain the original order of flavours
    
    fc.assert(
      fc.property(
        fc.array(flavourGenerator(), { minLength: 2, maxLength: 20 }),
        formatGenerator(),
        (flavours, format) => {
          const filtered = filterEligibleFlavours(flavours, format)
          
          // Check that filtered flavours appear in the same order as original
          let lastIndex = -1
          filtered.forEach(filteredFlavour => {
            const originalIndex = flavours.findIndex(f => f.id === filteredFlavour.id)
            expect(originalIndex).toBeGreaterThan(lastIndex)
            lastIndex = originalIndex
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should handle empty flavour array', () => {
    // Property: Filtering an empty array should return an empty array
    
    fc.assert(
      fc.property(
        formatGenerator(),
        (format) => {
          const filtered = filterEligibleFlavours([], format)
          expect(filtered).toEqual([])
        }
      ),
      { numRuns: 10 }
    )
  })

  describe('Format-Specific Filtering', () => {
    it('should filter correctly for scoop format', () => {
      // Scoop format should allow gelato and sorbet only
      
      fc.assert(
        fc.property(
          fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
          (flavours) => {
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
            
            const filtered = filterEligibleFlavours(flavours, scoopFormat)
            
            // All filtered flavours must be gelato or sorbet
            filtered.forEach(flavour => {
              expect(['gelato', 'sorbet']).toContain(flavour.type)
            })
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should filter correctly for sandwich format', () => {
      // Sandwich format should allow gelato, sorbet, and cookie
      
      fc.assert(
        fc.property(
          fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
          (flavours) => {
            const sandwichFormat: Format = {
              id: 'fmt-sandwich',
              name: 'Sandwich',
              slug: 'sandwich',
              category: 'sandwich',
              requiresFlavours: true,
              minFlavours: 3,
              maxFlavours: 3,
              allowMixedTypes: false,
              canIncludeAddOns: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const filtered = filterEligibleFlavours(flavours, sandwichFormat)
            
            // All filtered flavours must be gelato, sorbet, or cookie
            filtered.forEach(flavour => {
              expect(['gelato', 'sorbet', 'cookie']).toContain(flavour.type)
            })
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should filter correctly for soft-serve format', () => {
      // Soft-serve format should only allow soft-serve-base
      
      fc.assert(
        fc.property(
          fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
          (flavours) => {
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
            
            const filtered = filterEligibleFlavours(flavours, softServeFormat)
            
            // All filtered flavours must be soft-serve-base
            filtered.forEach(flavour => {
              expect(flavour.type).toBe('soft-serve-base')
            })
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should filter correctly for twist format', () => {
      // Twist format should allow gelato and sorbet
      
      fc.assert(
        fc.property(
          fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
          (flavours) => {
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
            
            const filtered = filterEligibleFlavours(flavours, twistFormat)
            
            // All filtered flavours must be gelato or sorbet
            filtered.forEach(flavour => {
              expect(['gelato', 'sorbet']).toContain(flavour.type)
            })
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should filter correctly for take-home format', () => {
      // Take-home format should allow gelato and sorbet
      
      fc.assert(
        fc.property(
          fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
          (flavours) => {
            const takeHomeFormat: Format = {
              id: 'fmt-take-home',
              name: 'Pint',
              slug: 'pint',
              category: 'take-home',
              requiresFlavours: true,
              minFlavours: 1,
              maxFlavours: 1,
              allowMixedTypes: false,
              canIncludeAddOns: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            const filtered = filterEligibleFlavours(flavours, takeHomeFormat)
            
            // All filtered flavours must be gelato or sorbet
            filtered.forEach(flavour => {
              expect(['gelato', 'sorbet']).toContain(flavour.type)
            })
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle flavours with modifier types (topping, sauce)', () => {
      // Modifier-type flavours should not be eligible for any format
      
      fc.assert(
        fc.property(
          formatGenerator(),
          (format) => {
            const modifierFlavours: Flavour[] = [
              {
                id: 'flav-topping',
                name: 'Sprinkles',
                slug: 'sprinkles',
                type: 'topping',
                ingredients: [],
                keyNotes: [],
                allergens: [],
                dietaryTags: [],
                status: 'active',
                featured: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                id: 'flav-sauce',
                name: 'Hot Fudge',
                slug: 'hot-fudge',
                type: 'sauce',
                ingredients: [],
                keyNotes: [],
                allergens: [],
                dietaryTags: [],
                status: 'active',
                featured: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
            
            const filtered = filterEligibleFlavours(modifierFlavours, format)
            
            // Modifier types should never be eligible for formats
            expect(filtered).toHaveLength(0)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should handle mixed eligible and ineligible flavours', () => {
      // Property: Filtering should correctly separate eligible from ineligible
      
      fc.assert(
        fc.property(
          formatGenerator(),
          (format) => {
            // Create a mix of all flavour types
            const mixedFlavours: Flavour[] = [
              { id: '1', name: 'Vanilla', slug: 'vanilla', type: 'gelato', ingredients: [], keyNotes: [], allergens: [], dietaryTags: [], status: 'active', featured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '2', name: 'Lemon', slug: 'lemon', type: 'sorbet', ingredients: [], keyNotes: [], allergens: [], dietaryTags: [], status: 'active', featured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '3', name: 'Soft Serve', slug: 'soft-serve', type: 'soft-serve-base', ingredients: [], keyNotes: [], allergens: [], dietaryTags: [], status: 'active', featured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '4', name: 'Cookie', slug: 'cookie', type: 'cookie', ingredients: [], keyNotes: [], allergens: [], dietaryTags: [], status: 'active', featured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '5', name: 'Sprinkles', slug: 'sprinkles', type: 'topping', ingredients: [], keyNotes: [], allergens: [], dietaryTags: [], status: 'active', featured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '6', name: 'Fudge', slug: 'fudge', type: 'sauce', ingredients: [], keyNotes: [], allergens: [], dietaryTags: [], status: 'active', featured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            ]
            
            const filtered = filterEligibleFlavours(mixedFlavours, format)
            
            // Count how many should be eligible
            const expectedCount = mixedFlavours.filter(f => 
              isEligibleForFormat(f.type, format.category)
            ).length
            
            expect(filtered).toHaveLength(expectedCount)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should not modify the original flavours array', () => {
      // Property: Filtering should not mutate the input array
      
      fc.assert(
        fc.property(
          fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
          formatGenerator(),
          (flavours, format) => {
            const originalLength = flavours.length
            const originalIds = flavours.map(f => f.id)
            
            filterEligibleFlavours(flavours, format)
            
            // Original array should be unchanged
            expect(flavours).toHaveLength(originalLength)
            expect(flavours.map(f => f.id)).toEqual(originalIds)
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
          fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
          formatGenerator(),
          (flavours, format) => {
            const result1 = filterEligibleFlavours(flavours, format)
            const result2 = filterEligibleFlavours(flavours, format)
            const result3 = filterEligibleFlavours(flavours, format)
            
            expect(result1.map(f => f.id)).toEqual(result2.map(f => f.id))
            expect(result2.map(f => f.id)).toEqual(result3.map(f => f.id))
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should be idempotent - filtering twice gives same result', () => {
      // Property: Filtering the filtered results should give the same result
      
      fc.assert(
        fc.property(
          fc.array(flavourGenerator(), { minLength: 1, maxLength: 20 }),
          formatGenerator(),
          (flavours, format) => {
            const filtered1 = filterEligibleFlavours(flavours, format)
            const filtered2 = filterEligibleFlavours(filtered1, format)
            
            expect(filtered1.map(f => f.id)).toEqual(filtered2.map(f => f.id))
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})
