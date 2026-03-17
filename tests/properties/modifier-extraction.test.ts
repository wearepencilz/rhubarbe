/**
 * Property Test: Modifier Extraction During Migration
 * 
 * Property 10: Modifier Extraction During Migration
 * Validates: Requirements 9.6
 * 
 * Feature: launch-first-cms-model, Property 10: For any offering record that contains
 * topping references, running the migration should create corresponding modifier records
 * and link them to the new sellable.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { extractModifiers } from '@/lib/migration/extract-modifiers'

describe('Property 10: Modifier Extraction During Migration', () => {
  // Arbitrary generators for test data
  const toppingArb = fc.record({
    name: fc.oneof(
      fc.constantFrom('Sprinkles', 'Hot Fudge', 'Chocolate Chips', 'Caramel', 'Nuts', 'Whipped Cream'),
      fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length > 0)
    ),
    price: fc.option(fc.integer({ min: 0, max: 500 }), { nil: undefined }),
    allergens: fc.option(
      fc.array(fc.constantFrom('dairy', 'nuts', 'gluten', 'soy'), { maxLength: 3 }),
      { nil: undefined }
    )
  })

  const offeringArb = fc.record({
    id: fc.uuid(),
    formatId: fc.option(fc.uuid(), { nil: undefined }),
    toppings: fc.option(
      fc.array(toppingArb, { maxLength: 5 }),
      { nil: undefined }
    )
  })

  it('should create exactly one modifier per unique topping name', () => {
    // Property: Each unique topping name should result in exactly one modifier
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          // Helper to check if a name would produce a valid slug
          const slugify = (name: string): string => {
            return name
              .toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '')
              .replace(/[\s_-]+/g, '-')
              .replace(/^-+|-+$/g, '')
          }

          // Collect all unique topping names that would produce valid slugs
          const uniqueToppingNames = new Set<string>()
          for (const offering of offerings) {
            if (offering.toppings && Array.isArray(offering.toppings)) {
              for (const topping of offering.toppings) {
                if (topping.name && typeof topping.name === 'string' && topping.name.trim().length > 0) {
                  const trimmedName = topping.name.trim()
                  const slug = slugify(trimmedName)
                  // Only count toppings that produce valid slugs
                  if (slug.length > 0) {
                    uniqueToppingNames.add(trimmedName)
                  }
                }
              }
            }
          }

          // Number of modifiers should equal number of unique topping names with valid slugs
          expect(result.modifiers.length).toBe(uniqueToppingNames.size)
          expect(result.modifierMap.size).toBe(uniqueToppingNames.size)

          // Each unique topping name should have exactly one modifier
          uniqueToppingNames.forEach(name => {
            const matchingModifiers = result.modifiers.filter(m => m.name === name)
            expect(matchingModifiers.length).toBe(1)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should create modifierMap entries for all extracted modifiers', () => {
    // Property: Every modifier should have a corresponding entry in modifierMap
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          // Every modifier should be in the map
          result.modifiers.forEach(modifier => {
            expect(result.modifierMap.has(modifier.name)).toBe(true)
            expect(result.modifierMap.get(modifier.name)).toBe(modifier.id)
          })

          // Map size should equal modifiers array length
          expect(result.modifierMap.size).toBe(result.modifiers.length)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should generate unique IDs for all modifiers', () => {
    // Property: All modifier IDs should be unique
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          if (result.modifiers.length === 0) {
            return true // Skip empty results
          }

          const ids = result.modifiers.map(m => m.id)
          const uniqueIds = new Set(ids)

          // All IDs should be unique
          expect(uniqueIds.size).toBe(ids.length)

          // All IDs should start with 'mod-'
          ids.forEach(id => {
            expect(id).toMatch(/^mod-/)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should set all modifiers to active status and topping type', () => {
    // Property: All extracted modifiers should be active and type topping
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          result.modifiers.forEach(modifier => {
            expect(modifier.status).toBe('active')
            expect(modifier.type).toBe('topping')
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve topping price or default to 0', () => {
    // Property: Modifier price should match topping price or be 0 if not specified
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          // Build a map of topping names to their prices
          const toppingPrices = new Map<string, number | undefined>()
          for (const offering of offerings) {
            if (offering.toppings && Array.isArray(offering.toppings)) {
              for (const topping of offering.toppings) {
                if (topping.name && typeof topping.name === 'string' && topping.name.trim().length > 0) {
                  const name = topping.name.trim()
                  if (!toppingPrices.has(name)) {
                    toppingPrices.set(name, topping.price)
                  }
                }
              }
            }
          }

          // Check each modifier has correct price
          result.modifiers.forEach(modifier => {
            const expectedPrice = toppingPrices.get(modifier.name) ?? 0
            expect(modifier.price).toBe(expectedPrice)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve allergen information', () => {
    // Property: Modifier allergens should match topping allergens or be empty array
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          // Build a map of topping names to their allergens
          const toppingAllergens = new Map<string, string[] | undefined>()
          for (const offering of offerings) {
            if (offering.toppings && Array.isArray(offering.toppings)) {
              for (const topping of offering.toppings) {
                if (topping.name && typeof topping.name === 'string' && topping.name.trim().length > 0) {
                  const name = topping.name.trim()
                  if (!toppingAllergens.has(name)) {
                    toppingAllergens.set(name, topping.allergens)
                  }
                }
              }
            }
          }

          // Check each modifier has correct allergens
          result.modifiers.forEach(modifier => {
            const expectedAllergens = toppingAllergens.get(modifier.name) ?? []
            expect(modifier.allergens).toEqual(expectedAllergens)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should generate valid slugs from topping names', () => {
    // Property: All modifier slugs should be URL-friendly
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          result.modifiers.forEach(modifier => {
            // Slug should not be empty (if a topping produces empty slug, it should be filtered)
            expect(modifier.slug.length).toBeGreaterThan(0)

            // Slug should be lowercase
            expect(modifier.slug).toBe(modifier.slug.toLowerCase())

            // Slug should not contain spaces
            expect(modifier.slug).not.toMatch(/\s/)

            // Slug should only contain lowercase letters, numbers, and hyphens
            expect(modifier.slug).toMatch(/^[a-z0-9-]+$/)

            // Slug should not start or end with hyphen
            expect(modifier.slug).not.toMatch(/^-|-$/)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should aggregate format IDs for duplicate toppings', () => {
    // Property: When a topping appears in multiple offerings, its modifier should
    // list all unique format IDs
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          // Build a map of topping names to format IDs
          const toppingFormats = new Map<string, Set<string>>()
          for (const offering of offerings) {
            if (offering.toppings && Array.isArray(offering.toppings)) {
              for (const topping of offering.toppings) {
                if (topping.name && typeof topping.name === 'string' && topping.name.trim().length > 0) {
                  const name = topping.name.trim()
                  if (!toppingFormats.has(name)) {
                    toppingFormats.set(name, new Set())
                  }
                  if (offering.formatId) {
                    toppingFormats.get(name)!.add(offering.formatId)
                  }
                }
              }
            }
          }

          // Check each modifier has correct format IDs
          result.modifiers.forEach(modifier => {
            const expectedFormats = toppingFormats.get(modifier.name) || new Set()
            const actualFormats = new Set(modifier.availableForFormatIds)

            expect(actualFormats.size).toBe(expectedFormats.size)
            expectedFormats.forEach(formatId => {
              expect(actualFormats.has(formatId)).toBe(true)
            })
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should set sortOrder sequentially', () => {
    // Property: Modifiers should have sequential sortOrder starting from 0
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          if (result.modifiers.length === 0) {
            return true // Skip empty results
          }

          // Sort orders should be sequential from 0 to length-1
          const sortOrders = result.modifiers.map(m => m.sortOrder).sort((a, b) => a - b)
          
          for (let i = 0; i < sortOrders.length; i++) {
            expect(sortOrders[i]).toBe(i)
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should set valid timestamps for all modifiers', () => {
    // Property: All modifiers should have valid ISO 8601 timestamps
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          result.modifiers.forEach(modifier => {
            // Should have timestamps
            expect(modifier.createdAt).toBeDefined()
            expect(modifier.updatedAt).toBeDefined()

            // Should be valid dates
            const createdDate = new Date(modifier.createdAt)
            const updatedDate = new Date(modifier.updatedAt)
            
            expect(createdDate.toString()).not.toBe('Invalid Date')
            expect(updatedDate.toString()).not.toBe('Invalid Date')

            // Should be ISO 8601 format
            expect(modifier.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
            expect(modifier.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should handle empty offerings gracefully', () => {
    // Property: Empty offerings should produce empty results
    const result = extractModifiers([])

    expect(result.modifiers).toEqual([])
    expect(result.modifierMap.size).toBe(0)
  })

  it('should ignore toppings with invalid names', () => {
    // Property: Toppings with empty, whitespace-only, or missing names should be ignored
    // Also toppings that would produce empty slugs should be ignored
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          // Helper to check if a name would produce a valid slug
          const slugify = (name: string): string => {
            return name
              .toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '')
              .replace(/[\s_-]+/g, '-')
              .replace(/^-+|-+$/g, '')
          }

          // Count valid topping names (non-empty after trimming AND produce valid slugs)
          const validNames = new Set<string>()
          
          for (const offering of offerings) {
            if (offering.toppings && Array.isArray(offering.toppings)) {
              for (const topping of offering.toppings) {
                if (topping.name && typeof topping.name === 'string' && topping.name.trim().length > 0) {
                  const trimmedName = topping.name.trim()
                  const slug = slugify(trimmedName)
                  // Only count if it produces a valid slug
                  if (slug.length > 0) {
                    validNames.add(trimmedName)
                  }
                }
              }
            }
          }

          // All modifier names should be valid (non-empty after trimming and produce valid slugs)
          result.modifiers.forEach(modifier => {
            expect(modifier.name).toBeTruthy()
            expect(modifier.name.trim().length).toBeGreaterThan(0)
            expect(modifier.slug.length).toBeGreaterThan(0)
          })

          // Number of modifiers should match unique valid names
          expect(result.modifiers.length).toBe(validNames.size)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should trim whitespace from topping names', () => {
    // Property: Topping names with leading/trailing whitespace should be trimmed
    // and treated as the same topping
    fc.assert(
      fc.property(
        fc.constantFrom('Sprinkles', 'Hot Fudge', 'Chocolate Chips'),
        fc.array(fc.constantFrom('', '  ', '   '), { minLength: 0, maxLength: 3 }),
        fc.array(fc.constantFrom('', '  ', '   '), { minLength: 0, maxLength: 3 }),
        (baseName, leadingSpace, trailingSpace) => {
          const offerings = [
            {
              id: 'off-1',
              formatId: 'fmt-1',
              toppings: [{ name: leadingSpace.join('') + baseName + trailingSpace.join(''), price: 50 }]
            },
            {
              id: 'off-2',
              formatId: 'fmt-2',
              toppings: [{ name: baseName, price: 50 }]
            }
          ]

          const result = extractModifiers(offerings as any)

          // Should create only one modifier (deduplicated by trimmed name)
          expect(result.modifiers.length).toBe(1)
          expect(result.modifiers[0].name).toBe(baseName)
          expect(result.modifierMap.size).toBe(1)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should maintain referential integrity between modifiers and modifierMap', () => {
    // Property: Every modifier ID in modifierMap should correspond to an actual modifier
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          const result = extractModifiers(offerings as any)

          const modifierIds = new Set(result.modifiers.map(m => m.id))

          // Every ID in the map should exist in the modifiers array
          result.modifierMap.forEach((id, name) => {
            expect(modifierIds.has(id)).toBe(true)

            // The modifier with this ID should have the correct name
            const modifier = result.modifiers.find(m => m.id === id)
            expect(modifier).toBeDefined()
            expect(modifier!.name).toBe(name)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should handle offerings with no formatId', () => {
    // Property: Offerings without formatId should still extract modifiers,
    // but with empty availableForFormatIds
    fc.assert(
      fc.property(
        fc.array(toppingArb, { minLength: 1, maxLength: 5 }),
        (toppings) => {
          const offerings = [
            {
              id: 'off-1',
              // No formatId
              toppings: toppings
            }
          ]

          const result = extractModifiers(offerings as any)

          // Helper to check if a name would produce a valid slug
          const slugify = (name: string): string => {
            return name
              .toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '')
              .replace(/[\s_-]+/g, '-')
              .replace(/^-+|-+$/g, '')
          }

          // Should still extract modifiers (only those with valid names and slugs)
          const validToppings = toppings.filter(t => 
            t.name && typeof t.name === 'string' && t.name.trim().length > 0 && slugify(t.name.trim()).length > 0
          )
          const uniqueNames = new Set(validToppings.map(t => t.name.trim()))

          expect(result.modifiers.length).toBe(uniqueNames.size)

          // All modifiers should have empty availableForFormatIds
          result.modifiers.forEach(modifier => {
            expect(modifier.availableForFormatIds).toEqual([])
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})
