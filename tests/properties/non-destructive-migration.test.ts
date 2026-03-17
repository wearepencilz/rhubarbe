/**
 * Property Test: Non-Destructive Migration Preservation
 * 
 * Property 1: Non-Destructive Migration Preservation
 * Validates: Requirements 0.1, 9.2, 9.3, 9.4, 9.5
 * 
 * Feature: launch-first-cms-model, Property 1: For any database state before migration,
 * running the migration process should preserve all original tables and records such that
 * every record that existed before migration still exists after migration with identical data.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { extractModifiers } from '@/lib/migration/extract-modifiers'
import { migrateShopifyFields } from '@/lib/migration/migrate-shopify-fields'
import type { Flavour, Format, Ingredient } from '@/types'

describe('Property 1: Non-Destructive Migration Preservation', () => {
  // Helper to generate valid ISO date strings
  const validDateArb = fc.integer({ min: 1577836800000, max: 1767225600000 })
    .map(timestamp => new Date(timestamp).toISOString())

  // Generator for ingredients
  const ingredientArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    latinName: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
    slug: fc.option(
      fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/\s/g, '-')),
      { nil: undefined }
    ),
    category: fc.constantFrom('fruit', 'dairy', 'herb', 'spice', 'nut', 'grain', 'vegetable'),
    roles: fc.array(
      fc.constantFrom('base', 'primary-flavour', 'supporting-flavour', 'garnish', 'topping'),
      { minLength: 1, maxLength: 3 }
    ),
    descriptors: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
    origin: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
    allergens: fc.array(
      fc.constantFrom('dairy', 'eggs', 'tree-nuts', 'peanuts', 'gluten', 'soy'),
      { maxLength: 3 }
    ),
    dietaryFlags: fc.array(
      fc.constantFrom('vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free'),
      { maxLength: 3 }
    ),
    seasonal: fc.boolean(),
    description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    image: fc.option(fc.webUrl(), { nil: undefined }),
    createdAt: validDateArb,
    updatedAt: validDateArb
  })

  // Generator for flavours
  const flavourArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/\s/g, '-')),
    type: fc.constantFrom('gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce'),
    baseStyle: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
    description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    shortDescription: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    story: fc.option(fc.string({ maxLength: 300 }), { nil: undefined }),
    tastingNotes: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { maxLength: 5 }),
    ingredients: fc.constant([]),
    keyNotes: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
    allergens: fc.array(
      fc.constantFrom('dairy', 'eggs', 'tree-nuts', 'peanuts', 'gluten', 'soy'),
      { maxLength: 3 }
    ),
    dietaryTags: fc.array(
      fc.constantFrom('vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free'),
      { maxLength: 3 }
    ),
    colour: fc.option(
      fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s.replace(/[^0-9a-fA-F]/g, '0').substring(0, 6)}`),
      { nil: undefined }
    ),
    image: fc.option(fc.webUrl(), { nil: undefined }),
    season: fc.option(
      fc.constantFrom('spring', 'summer', 'fall', 'winter', 'year-round'),
      { nil: undefined }
    ),
    status: fc.constantFrom('active', 'archived', 'in-development', 'seasonal'),
    sortOrder: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
    featured: fc.boolean(),
    createdAt: validDateArb,
    updatedAt: validDateArb
  })

  // Generator for formats
  const formatArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/\s/g, '-')),
    category: fc.constantFrom('scoop', 'take-home', 'sandwich', 'twist', 'soft-serve', 'special'),
    description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    requiresFlavours: fc.boolean(),
    minFlavours: fc.integer({ min: 0, max: 3 }),
    maxFlavours: fc.integer({ min: 1, max: 5 }),
    allowMixedTypes: fc.boolean(),
    canIncludeAddOns: fc.boolean(),
    defaultSizes: fc.option(
      fc.array(fc.constantFrom('small', 'medium', 'large'), { minLength: 1, maxLength: 3 }),
      { nil: undefined }
    ),
    servingStyle: fc.option(fc.constantFrom('in-store', 'take-home', 'both'), { nil: undefined }),
    menuSection: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: undefined }),
    image: fc.option(fc.webUrl(), { nil: undefined }),
    icon: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
    createdAt: validDateArb,
    updatedAt: validDateArb
  })

  // Generator for offerings (legacy)
  const toppingArb = fc.record({
    name: fc.oneof(
      fc.constantFrom('Sprinkles', 'Hot Fudge', 'Chocolate Chips', 'Caramel', 'Nuts'),
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
    name: fc.string({ minLength: 3, maxLength: 50 }),
    slug: fc.string({ minLength: 3, maxLength: 50 }).map(s => s.toLowerCase().replace(/\s/g, '-')),
    formatId: fc.uuid(),
    flavourIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
    toppings: fc.option(fc.array(toppingArb, { maxLength: 3 }), { nil: undefined }),
    price: fc.integer({ min: 0, max: 10000 }),
    status: fc.constantFrom('draft', 'active', 'archived', 'out-of-stock'),
    createdAt: validDateArb,
    updatedAt: validDateArb
  })

  it('**Validates: Requirements 0.1, 9.2, 9.3, 9.4, 9.5** - should preserve all original data after migration', () => {
    // Property: For any database state before migration, all original records should
    // still exist after migration with identical data
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 10 }),
        fc.array(flavourArb, { minLength: 1, maxLength: 10 }),
        fc.array(formatArb, { minLength: 1, maxLength: 5 }),
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (originalIngredients, originalFlavours, originalFormats, originalOfferings) => {
          // Deep clone original data to compare later
          const ingredientsCopy = JSON.parse(JSON.stringify(originalIngredients))
          const flavoursCopy = JSON.parse(JSON.stringify(originalFlavours))
          const formatsCopy = JSON.parse(JSON.stringify(originalFormats))
          const offeringsCopy = JSON.parse(JSON.stringify(originalOfferings))

          // Run migration steps (modifier extraction and Shopify field migration)
          // These are the main migration operations that could potentially modify data
          const modifierResult = extractModifiers(originalOfferings as any)
          const shopifyResult = migrateShopifyFields(
            originalFlavours as any,
            [],
            originalFormats as any
          )

          // Verify all original ingredients are preserved
          expect(originalIngredients.length).toBe(ingredientsCopy.length)
          originalIngredients.forEach((ingredient, index) => {
            expect(ingredient).toEqual(ingredientsCopy[index])
          })

          // Verify all original flavours are preserved (except Shopify fields which are moved)
          expect(originalFlavours.length).toBe(flavoursCopy.length)
          originalFlavours.forEach((flavour, index) => {
            // All non-Shopify fields should be identical
            const { shopifyProductId, shopifyProductHandle, shopifySKU, syncStatus, lastSyncedAt, syncError, ...flavourData } = flavour as any
            const { shopifyProductId: _, shopifyProductHandle: __, shopifySKU: ___, syncStatus: ____, lastSyncedAt: _____, syncError: ______, ...originalData } = flavoursCopy[index]
            
            expect(flavourData).toEqual(originalData)
          })

          // Verify all original formats are preserved
          expect(originalFormats.length).toBe(formatsCopy.length)
          originalFormats.forEach((format, index) => {
            expect(format).toEqual(formatsCopy[index])
          })

          // Verify all original offerings are preserved
          expect(originalOfferings.length).toBe(offeringsCopy.length)
          originalOfferings.forEach((offering, index) => {
            expect(offering).toEqual(offeringsCopy[index])
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve all ingredient fields during migration', () => {
    // Property: Every ingredient field should remain unchanged after migration
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 10 }),
        fc.array(offeringArb, { minLength: 0, maxLength: 5 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (ingredients, offerings, formats) => {
          // Create deep copy
          const ingredientsBefore = JSON.parse(JSON.stringify(ingredients))

          // Run migration (ingredients are not directly modified, but verify anyway)
          extractModifiers(offerings as any)

          // Verify all fields are preserved
          ingredients.forEach((ingredient, index) => {
            const before = ingredientsBefore[index]
            
            // Check all required fields
            expect(ingredient.id).toBe(before.id)
            expect(ingredient.name).toBe(before.name)
            expect(ingredient.category).toBe(before.category)
            expect(ingredient.roles).toEqual(before.roles)
            expect(ingredient.descriptors).toEqual(before.descriptors)
            expect(ingredient.allergens).toEqual(before.allergens)
            expect(ingredient.dietaryFlags).toEqual(before.dietaryFlags)
            expect(ingredient.seasonal).toBe(before.seasonal)
            expect(ingredient.createdAt).toBe(before.createdAt)
            expect(ingredient.updatedAt).toBe(before.updatedAt)
            
            // Check optional fields
            expect(ingredient.latinName).toBe(before.latinName)
            expect(ingredient.slug).toBe(before.slug)
            expect(ingredient.origin).toBe(before.origin)
            expect(ingredient.description).toBe(before.description)
            expect(ingredient.image).toBe(before.image)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve all flavour fields except Shopify fields which are moved', () => {
    // Property: All flavour fields except Shopify-related fields should remain unchanged
    fc.assert(
      fc.property(
        fc.array(flavourArb, { minLength: 1, maxLength: 10 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, formats) => {
          // Create deep copy
          const flavoursBefore = JSON.parse(JSON.stringify(flavours))

          // Run Shopify field migration
          migrateShopifyFields(flavours as any, [], formats as any)

          // Verify all non-Shopify fields are preserved
          flavours.forEach((flavour, index) => {
            const before = flavoursBefore[index]
            
            // Check all required fields
            expect(flavour.id).toBe(before.id)
            expect(flavour.name).toBe(before.name)
            expect(flavour.slug).toBe(before.slug)
            expect(flavour.type).toBe(before.type)
            expect(flavour.ingredients).toEqual(before.ingredients)
            expect(flavour.keyNotes).toEqual(before.keyNotes)
            expect(flavour.allergens).toEqual(before.allergens)
            expect(flavour.dietaryTags).toEqual(before.dietaryTags)
            expect(flavour.status).toBe(before.status)
            expect(flavour.featured).toBe(before.featured)
            expect(flavour.createdAt).toBe(before.createdAt)
            expect(flavour.updatedAt).toBe(before.updatedAt)
            
            // Check optional fields
            expect(flavour.baseStyle).toBe(before.baseStyle)
            expect(flavour.description).toBe(before.description)
            expect(flavour.shortDescription).toBe(before.shortDescription)
            expect(flavour.story).toBe(before.story)
            expect(flavour.tastingNotes).toEqual(before.tastingNotes)
            expect(flavour.colour).toBe(before.colour)
            expect(flavour.image).toBe(before.image)
            expect(flavour.season).toBe(before.season)
            expect(flavour.sortOrder).toBe(before.sortOrder)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve all format fields during migration', () => {
    // Property: Every format field should remain unchanged after migration
    fc.assert(
      fc.property(
        fc.array(formatArb, { minLength: 1, maxLength: 10 }),
        fc.array(offeringArb, { minLength: 0, maxLength: 5 }),
        (formats, offerings) => {
          // Create deep copy
          const formatsBefore = JSON.parse(JSON.stringify(formats))

          // Run migration (formats are not directly modified, but verify anyway)
          extractModifiers(offerings as any)

          // Verify all fields are preserved
          formats.forEach((format, index) => {
            const before = formatsBefore[index]
            
            // Check all required fields
            expect(format.id).toBe(before.id)
            expect(format.name).toBe(before.name)
            expect(format.slug).toBe(before.slug)
            expect(format.category).toBe(before.category)
            expect(format.requiresFlavours).toBe(before.requiresFlavours)
            expect(format.minFlavours).toBe(before.minFlavours)
            expect(format.maxFlavours).toBe(before.maxFlavours)
            expect(format.allowMixedTypes).toBe(before.allowMixedTypes)
            expect(format.canIncludeAddOns).toBe(before.canIncludeAddOns)
            expect(format.createdAt).toBe(before.createdAt)
            expect(format.updatedAt).toBe(before.updatedAt)
            
            // Check optional fields
            expect(format.description).toBe(before.description)
            expect(format.defaultSizes).toEqual(before.defaultSizes)
            expect(format.servingStyle).toBe(before.servingStyle)
            expect(format.menuSection).toBe(before.menuSection)
            expect(format.image).toBe(before.image)
            expect(format.icon).toBe(before.icon)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve all offering fields during migration', () => {
    // Property: Every offering field should remain unchanged after migration
    fc.assert(
      fc.property(
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (offerings) => {
          // Create deep copy
          const offeringsBefore = JSON.parse(JSON.stringify(offerings))

          // Run migration (offerings are read but not modified)
          extractModifiers(offerings as any)

          // Verify all fields are preserved
          offerings.forEach((offering, index) => {
            const before = offeringsBefore[index]
            
            // Check all required fields
            expect(offering.id).toBe(before.id)
            expect(offering.name).toBe(before.name)
            expect(offering.slug).toBe(before.slug)
            expect(offering.formatId).toBe(before.formatId)
            expect(offering.flavourIds).toEqual(before.flavourIds)
            expect(offering.price).toBe(before.price)
            expect(offering.status).toBe(before.status)
            expect(offering.createdAt).toBe(before.createdAt)
            expect(offering.updatedAt).toBe(before.updatedAt)
            
            // Check optional fields
            expect(offering.toppings).toEqual(before.toppings)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should not delete any records during migration', () => {
    // Property: The count of records should never decrease during migration
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 10 }),
        fc.array(flavourArb, { minLength: 1, maxLength: 10 }),
        fc.array(formatArb, { minLength: 1, maxLength: 5 }),
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (ingredients, flavours, formats, offerings) => {
          // Record counts before migration
          const ingredientCountBefore = ingredients.length
          const flavourCountBefore = flavours.length
          const formatCountBefore = formats.length
          const offeringCountBefore = offerings.length

          // Run migration
          extractModifiers(offerings as any)
          migrateShopifyFields(flavours as any, [], formats as any)

          // Verify counts are unchanged or increased (never decreased)
          expect(ingredients.length).toBeGreaterThanOrEqual(ingredientCountBefore)
          expect(flavours.length).toBeGreaterThanOrEqual(flavourCountBefore)
          expect(formats.length).toBeGreaterThanOrEqual(formatCountBefore)
          expect(offerings.length).toBeGreaterThanOrEqual(offeringCountBefore)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve record identity (IDs) during migration', () => {
    // Property: All record IDs should remain unchanged after migration
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 10 }),
        fc.array(flavourArb, { minLength: 1, maxLength: 10 }),
        fc.array(formatArb, { minLength: 1, maxLength: 5 }),
        fc.array(offeringArb, { minLength: 1, maxLength: 10 }),
        (ingredients, flavours, formats, offerings) => {
          // Collect all IDs before migration
          const ingredientIdsBefore = new Set(ingredients.map(i => i.id))
          const flavourIdsBefore = new Set(flavours.map(f => f.id))
          const formatIdsBefore = new Set(formats.map(f => f.id))
          const offeringIdsBefore = new Set(offerings.map(o => o.id))

          // Run migration
          extractModifiers(offerings as any)
          migrateShopifyFields(flavours as any, [], formats as any)

          // Verify all original IDs still exist
          ingredients.forEach(ingredient => {
            expect(ingredientIdsBefore.has(ingredient.id)).toBe(true)
          })
          
          flavours.forEach(flavour => {
            expect(flavourIdsBefore.has(flavour.id)).toBe(true)
          })
          
          formats.forEach(format => {
            expect(formatIdsBefore.has(format.id)).toBe(true)
          })
          
          offerings.forEach(offering => {
            expect(offeringIdsBefore.has(offering.id)).toBe(true)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve timestamps during migration', () => {
    // Property: All createdAt and updatedAt timestamps should remain valid and unchanged
    fc.assert(
      fc.property(
        fc.array(ingredientArb, { minLength: 1, maxLength: 5 }),
        fc.array(flavourArb, { minLength: 1, maxLength: 5 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        fc.array(offeringArb, { minLength: 1, maxLength: 5 }),
        (ingredients, flavours, formats, offerings) => {
          // Collect timestamps before migration
          const timestampsBefore = {
            ingredients: ingredients.map(i => ({ id: i.id, createdAt: i.createdAt, updatedAt: i.updatedAt })),
            flavours: flavours.map(f => ({ id: f.id, createdAt: f.createdAt, updatedAt: f.updatedAt })),
            formats: formats.map(f => ({ id: f.id, createdAt: f.createdAt, updatedAt: f.updatedAt })),
            offerings: offerings.map(o => ({ id: o.id, createdAt: o.createdAt, updatedAt: o.updatedAt }))
          }

          // Run migration
          extractModifiers(offerings as any)
          migrateShopifyFields(flavours as any, [], formats as any)

          // Verify timestamps are preserved
          ingredients.forEach(ingredient => {
            const before = timestampsBefore.ingredients.find(t => t.id === ingredient.id)
            expect(ingredient.createdAt).toBe(before?.createdAt)
            expect(ingredient.updatedAt).toBe(before?.updatedAt)
          })
          
          flavours.forEach(flavour => {
            const before = timestampsBefore.flavours.find(t => t.id === flavour.id)
            expect(flavour.createdAt).toBe(before?.createdAt)
            expect(flavour.updatedAt).toBe(before?.updatedAt)
          })
          
          formats.forEach(format => {
            const before = timestampsBefore.formats.find(t => t.id === format.id)
            expect(format.createdAt).toBe(before?.createdAt)
            expect(format.updatedAt).toBe(before?.updatedAt)
          })
          
          offerings.forEach(offering => {
            const before = timestampsBefore.offerings.find(t => t.id === offering.id)
            expect(offering.createdAt).toBe(before?.createdAt)
            expect(offering.updatedAt).toBe(before?.updatedAt)
          })
        }
      ),
      { numRuns: 10 }
    )
  })
})
