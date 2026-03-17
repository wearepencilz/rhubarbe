/**
 * Property Test: Format Eligibility
 * 
 * Property 3: Flavour Type Determines Format Eligibility
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6
 * 
 * Feature: launch-first-cms-model, Property 3: For any flavour with a given type,
 * the set of eligible formats should match the type-based eligibility rules:
 * - gelato → [scoop, take-home, twist, sandwich]
 * - sorbet → [scoop, take-home, twist]
 * - soft-serve-base → [soft-serve]
 * - cookie → [sandwich]
 * - topping → []
 * - sauce → []
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { getEligibleFormats } from '../../lib/format-eligibility.js'
import type { FlavourType, FormatCategory } from '../../types/index.js'

describe('Property 3: Flavour Type Determines Format Eligibility', () => {
  it('should return correct eligible formats for all flavour types', () => {
    // Feature: launch-first-cms-model, Property 3: For any flavour with a given type,
    // the set of eligible formats should match the type-based eligibility rules
    
    fc.assert(
      fc.property(
        fc.constantFrom<FlavourType>(
          'gelato',
          'sorbet',
          'soft-serve-base',
          'cookie',
          'topping',
          'sauce'
        ),
        (flavourType) => {
          const eligibleFormats = getEligibleFormats(flavourType)
          
          // Define expected formats for each type
          const expectedFormats: Record<FlavourType, FormatCategory[]> = {
            'gelato': ['scoop', 'take-home', 'twist', 'sandwich'],
            'sorbet': ['scoop', 'take-home', 'twist'],
            'soft-serve-base': ['soft-serve'],
            'cookie': ['sandwich'],
            'topping': [],
            'sauce': []
          }
          
          // Sort both arrays for comparison (order doesn't matter)
          const sortedEligible = [...eligibleFormats].sort()
          const sortedExpected = [...expectedFormats[flavourType]].sort()
          
          expect(sortedEligible).toEqual(sortedExpected)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify gelato is eligible for scoop, take-home, twist, and sandwich', () => {
    fc.assert(
      fc.property(
        fc.constant('gelato' as FlavourType),
        (flavourType) => {
          const eligibleFormats = getEligibleFormats(flavourType)
          
          expect(eligibleFormats).toContain('scoop')
          expect(eligibleFormats).toContain('take-home')
          expect(eligibleFormats).toContain('twist')
          expect(eligibleFormats).toContain('sandwich')
          expect(eligibleFormats).toHaveLength(4)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify sorbet is eligible for scoop, take-home, and twist only', () => {
    fc.assert(
      fc.property(
        fc.constant('sorbet' as FlavourType),
        (flavourType) => {
          const eligibleFormats = getEligibleFormats(flavourType)
          
          expect(eligibleFormats).toContain('scoop')
          expect(eligibleFormats).toContain('take-home')
          expect(eligibleFormats).toContain('twist')
          expect(eligibleFormats).not.toContain('sandwich')
          expect(eligibleFormats).toHaveLength(3)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify soft-serve-base is eligible for soft-serve only', () => {
    fc.assert(
      fc.property(
        fc.constant('soft-serve-base' as FlavourType),
        (flavourType) => {
          const eligibleFormats = getEligibleFormats(flavourType)
          
          expect(eligibleFormats).toContain('soft-serve')
          expect(eligibleFormats).toHaveLength(1)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify cookie is eligible for sandwich only', () => {
    fc.assert(
      fc.property(
        fc.constant('cookie' as FlavourType),
        (flavourType) => {
          const eligibleFormats = getEligibleFormats(flavourType)
          
          expect(eligibleFormats).toContain('sandwich')
          expect(eligibleFormats).toHaveLength(1)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify topping has no eligible formats (used as modifier)', () => {
    fc.assert(
      fc.property(
        fc.constant('topping' as FlavourType),
        (flavourType) => {
          const eligibleFormats = getEligibleFormats(flavourType)
          
          expect(eligibleFormats).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify sauce has no eligible formats (used as modifier)', () => {
    fc.assert(
      fc.property(
        fc.constant('sauce' as FlavourType),
        (flavourType) => {
          const eligibleFormats = getEligibleFormats(flavourType)
          
          expect(eligibleFormats).toHaveLength(0)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify eligibility rules are consistent across multiple calls', () => {
    // Property: The same flavour type should always return the same eligible formats
    fc.assert(
      fc.property(
        fc.constantFrom<FlavourType>(
          'gelato',
          'sorbet',
          'soft-serve-base',
          'cookie',
          'topping',
          'sauce'
        ),
        (flavourType) => {
          const result1 = getEligibleFormats(flavourType)
          const result2 = getEligibleFormats(flavourType)
          const result3 = getEligibleFormats(flavourType)
          
          // Results should be identical
          expect(result1).toEqual(result2)
          expect(result2).toEqual(result3)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify no flavour type returns invalid format categories', () => {
    // Property: All returned format categories must be valid
    const validFormatCategories: FormatCategory[] = [
      'scoop',
      'take-home',
      'sandwich',
      'twist',
      'soft-serve',
      'special'
    ]
    
    fc.assert(
      fc.property(
        fc.constantFrom<FlavourType>(
          'gelato',
          'sorbet',
          'soft-serve-base',
          'cookie',
          'topping',
          'sauce'
        ),
        (flavourType) => {
          const eligibleFormats = getEligibleFormats(flavourType)
          
          // Every returned format must be a valid format category
          eligibleFormats.forEach(format => {
            expect(validFormatCategories).toContain(format)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify eligibility rules are mutually exclusive where appropriate', () => {
    // Property: Certain combinations should never occur
    fc.assert(
      fc.property(
        fc.constantFrom<FlavourType>(
          'gelato',
          'sorbet',
          'soft-serve-base',
          'cookie',
          'topping',
          'sauce'
        ),
        (flavourType) => {
          const eligibleFormats = getEligibleFormats(flavourType)
          
          // Modifiers (topping, sauce) should never have format eligibility
          if (flavourType === 'topping' || flavourType === 'sauce') {
            expect(eligibleFormats).toHaveLength(0)
          }
          
          // Soft-serve-base should only be eligible for soft-serve
          if (flavourType === 'soft-serve-base') {
            expect(eligibleFormats).toEqual(['soft-serve'])
          }
          
          // Cookie should only be eligible for sandwich
          if (flavourType === 'cookie') {
            expect(eligibleFormats).toEqual(['sandwich'])
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should verify gelato and sorbet share common formats but gelato has more', () => {
    // Property: Gelato should be a superset of sorbet eligibility
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          const gelatoFormats = getEligibleFormats('gelato')
          const sorbetFormats = getEligibleFormats('sorbet')
          
          // All sorbet formats should be in gelato formats
          sorbetFormats.forEach(format => {
            expect(gelatoFormats).toContain(format)
          })
          
          // Gelato should have at least as many formats as sorbet
          expect(gelatoFormats.length).toBeGreaterThanOrEqual(sorbetFormats.length)
          
          // Specifically, gelato should have sandwich but sorbet should not
          expect(gelatoFormats).toContain('sandwich')
          expect(sorbetFormats).not.toContain('sandwich')
        }
      ),
      { numRuns: 10 }
    )
  })
})
