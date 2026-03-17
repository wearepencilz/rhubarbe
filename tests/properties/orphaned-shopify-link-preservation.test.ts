/**
 * Property Test: Orphaned Shopify Link Preservation
 * 
 * Property 12: Orphaned Shopify Link Preservation
 * Validates: Requirements 13.4
 * 
 * Feature: launch-first-cms-model, Property 12: For any flavour with Shopify fields but no
 * corresponding offering/sellable, running the migration should create a default sellable to
 * preserve the Shopify relationship.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { migrateShopifyFields } from '@/lib/migration/migrate-shopify-fields'
import type { Flavour, Sellable, Format } from '@/types'

describe('Property 12: Orphaned Shopify Link Preservation', () => {
  // Helper to generate valid ISO date strings
  const validDateArb = fc.integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31
    .map(timestamp => new Date(timestamp).toISOString())

  // Generator for Shopify fields
  const shopifyFieldsArb = fc.record({
    shopifyProductId: fc.option(fc.uuid(), { nil: undefined }),
    shopifyProductHandle: fc.option(
      fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/\s/g, '-')),
      { nil: undefined }
    ),
    shopifySKU: fc.option(
      fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase()),
      { nil: undefined }
    ),
    syncStatus: fc.option(
      fc.constantFrom('pending', 'synced', 'error', 'not-synced'),
      { nil: undefined }
    ),
    lastSyncedAt: fc.option(validDateArb, { nil: undefined }),
    syncError: fc.option(fc.string({ maxLength: 100 }), { nil: undefined })
  })

  // Generator for flavours
  const flavourArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    slug: fc.string({ minLength: 3, maxLength: 30 })
      .map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
      .filter(s => s.length > 0),
    type: fc.constantFrom('gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce'),
    description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    shortDescription: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    image: fc.option(fc.webUrl(), { nil: undefined }),
    ingredients: fc.constant([]),
    keyNotes: fc.constant([]),
    allergens: fc.constant([]),
    dietaryTags: fc.constant([]),
    status: fc.constantFrom('active', 'archived', 'in-development', 'seasonal'),
    featured: fc.boolean(),
    createdAt: validDateArb,
    updatedAt: validDateArb
  })

  // Generator for flavours with Shopify fields (orphaned)
  const orphanedFlavourArb = fc.tuple(flavourArb, shopifyFieldsArb)
    .filter(([_, shopify]) => 
      // Ensure at least one Shopify field is present
      !!(shopify.shopifyProductId || shopify.shopifyProductHandle || shopify.shopifySKU)
    )
    .map(([flavour, shopify]) => ({
      ...flavour,
      ...shopify
    }))

  // Generator for formats
  const formatArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/\s/g, '-')),
    category: fc.constantFrom('scoop', 'take-home', 'sandwich', 'twist', 'soft-serve', 'special'),
    requiresFlavours: fc.boolean(),
    minFlavours: fc.integer({ min: 0, max: 3 }),
    maxFlavours: fc.integer({ min: 1, max: 5 }),
    allowMixedTypes: fc.boolean(),
    canIncludeAddOns: fc.boolean(),
    createdAt: validDateArb,
    updatedAt: validDateArb
  })

  // Generator for default scoop format
  const defaultScoopFormatArb = formatArb.map(format => ({
    ...format,
    category: 'scoop' as const,
    minFlavours: 1,
    maxFlavours: 3
  }))

  it('**Validates: Requirements 13.4** - should create default sellable for orphaned Shopify links', () => {
    // Property: When a flavour has Shopify fields but no matching sellable exists,
    // a default sellable should be created to preserve the Shopify relationship
    fc.assert(
      fc.property(
        fc.array(orphanedFlavourArb, { minLength: 1, maxLength: 5 }),
        defaultScoopFormatArb,
        (orphanedFlavours, defaultFormat) => {
          // Start with no sellables (orphaned scenario)
          const sellables: Sellable[] = []
          const formats = [defaultFormat]

          const result = migrateShopifyFields(
            orphanedFlavours as any,
            sellables,
            formats as any
          )

          // Should create one sellable per orphaned flavour
          expect(result.updatedSellables.length).toBe(orphanedFlavours.length)

          // Verify each orphaned flavour got a default sellable
          orphanedFlavours.forEach(flavour => {
            const createdSellable = result.updatedSellables.find(s =>
              s.primaryFlavourIds.includes(flavour.id)
            )

            // Sellable should exist
            expect(createdSellable).toBeDefined()

            // Shopify fields should be preserved
            expect(createdSellable!.shopifyProductId).toBe(flavour.shopifyProductId)
            expect(createdSellable!.shopifyProductHandle).toBe(flavour.shopifyProductHandle)
            expect(createdSellable!.shopifySKU).toBe(flavour.shopifySKU)

            // Sync status should be preserved
            if (flavour.syncStatus) {
              expect(createdSellable!.syncStatus).toBe(flavour.syncStatus)
            }
            if (flavour.lastSyncedAt) {
              expect(createdSellable!.lastSyncedAt).toBe(flavour.lastSyncedAt)
            }
            if (flavour.syncError) {
              expect(createdSellable!.syncError).toBe(flavour.syncError)
            }
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should create default sellable with correct structure', () => {
    // Property: Default sellables created for orphaned links should have valid structure
    fc.assert(
      fc.property(
        orphanedFlavourArb,
        defaultScoopFormatArb,
        (orphanedFlavour, defaultFormat) => {
          const sellables: Sellable[] = []
          const formats = [defaultFormat]

          const result = migrateShopifyFields(
            [orphanedFlavour] as any,
            sellables,
            formats as any
          )

          expect(result.updatedSellables.length).toBe(1)
          const createdSellable = result.updatedSellables[0]

          // Verify structure
          expect(createdSellable.id).toBeDefined()
          expect(createdSellable.id).toMatch(/^sell-/)
          
          // Names should be derived from flavour
          expect(createdSellable.internalName).toContain(orphanedFlavour.name)
          expect(createdSellable.publicName).toBe(orphanedFlavour.name)
          
          // Slug should be derived from flavour slug
          expect(createdSellable.slug).toContain(orphanedFlavour.slug)
          
          // Should use default format
          expect(createdSellable.formatId).toBe(defaultFormat.id)
          
          // Should reference the flavour
          expect(createdSellable.primaryFlavourIds).toEqual([orphanedFlavour.id])
          
          // Should have default values
          expect(createdSellable.status).toBe('active')
          expect(createdSellable.inventoryTracked).toBe(false)
          expect(createdSellable.onlineOrderable).toBe(true)
          expect(createdSellable.pickupOnly).toBe(false)
          
          // Should have timestamps
          expect(createdSellable.createdAt).toBeDefined()
          expect(createdSellable.updatedAt).toBeDefined()
          
          // Content should be copied from flavour
          if (orphanedFlavour.description) {
            expect(createdSellable.description).toBe(orphanedFlavour.description)
          }
          if (orphanedFlavour.shortDescription) {
            expect(createdSellable.shortCardCopy).toBe(orphanedFlavour.shortDescription)
          }
          if (orphanedFlavour.image) {
            expect(createdSellable.image).toBe(orphanedFlavour.image)
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should track orphaned link creation in migration map', () => {
    // Property: Migration map should track created sellables for orphaned links
    fc.assert(
      fc.property(
        fc.array(orphanedFlavourArb, { minLength: 1, maxLength: 5 }),
        defaultScoopFormatArb,
        (orphanedFlavours, defaultFormat) => {
          const sellables: Sellable[] = []
          const formats = [defaultFormat]

          const result = migrateShopifyFields(
            orphanedFlavours as any,
            sellables,
            formats as any
          )

          // Migration map should have entries for all orphaned flavours
          expect(result.migrationMap.length).toBe(orphanedFlavours.length)

          orphanedFlavours.forEach(flavour => {
            const mapEntry = result.migrationMap.find(m => m.flavourId === flavour.id)
            
            expect(mapEntry).toBeDefined()
            expect(mapEntry!.hadShopifyFields).toBe(true)
            expect(mapEntry!.shopifyProductId).toBe(flavour.shopifyProductId)
            expect(mapEntry!.createdSellableId).toBeDefined()
            expect(mapEntry!.migrationDate).toBeDefined()
            
            // Verify the created sellable ID matches
            const createdSellable = result.updatedSellables.find(s =>
              s.primaryFlavourIds.includes(flavour.id)
            )
            expect(mapEntry!.createdSellableId).toBe(createdSellable!.id)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should not create default sellable when matching sellable exists', () => {
    // Property: When a flavour has Shopify fields AND a matching sellable exists,
    // no new sellable should be created (not orphaned)
    fc.assert(
      fc.property(
        orphanedFlavourArb,
        defaultScoopFormatArb,
        (flavour, defaultFormat) => {
          // Create an existing sellable that references this flavour
          const existingSellable: Sellable = {
            id: `existing-sell-${flavour.id}`,
            internalName: `Existing ${flavour.name}`,
            publicName: flavour.name,
            slug: `${flavour.slug}-existing`,
            status: 'active',
            formatId: defaultFormat.id,
            primaryFlavourIds: [flavour.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          const sellables = [existingSellable]
          const formats = [defaultFormat]

          const result = migrateShopifyFields(
            [flavour] as any,
            sellables,
            formats as any
          )

          // Should not create a new sellable, only update the existing one
          expect(result.updatedSellables.length).toBe(1)
          expect(result.updatedSellables[0].id).toBe(existingSellable.id)
          
          // Migration map should indicate moved to existing sellable
          expect(result.migrationMap.length).toBe(1)
          expect(result.migrationMap[0].movedToSellableId).toBe(existingSellable.id)
          expect(result.migrationMap[0].createdSellableId).toBeUndefined()
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should handle orphaned flavours without default format gracefully', () => {
    // Property: When no default format exists, orphaned flavours should be tracked
    // but no sellable should be created
    fc.assert(
      fc.property(
        fc.array(orphanedFlavourArb, { minLength: 1, maxLength: 3 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (orphanedFlavours, formats) => {
          // Ensure no format is a default scoop format
          const nonDefaultFormats = formats.map(f => ({
            ...f,
            category: 'take-home' as const,
            minFlavours: 2
          }))

          const sellables: Sellable[] = []

          const result = migrateShopifyFields(
            orphanedFlavours as any,
            sellables,
            nonDefaultFormats as any
          )

          // No sellables should be created
          expect(result.updatedSellables.length).toBe(0)

          // Migration map should still track the orphaned flavours
          expect(result.migrationMap.length).toBe(orphanedFlavours.length)

          // But no sellables should be created
          result.migrationMap.forEach(entry => {
            expect(entry.hadShopifyFields).toBe(true)
            expect(entry.createdSellableId).toBeUndefined()
            expect(entry.movedToSellableId).toBeUndefined()
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should preserve all Shopify fields including optional ones', () => {
    // Property: All Shopify fields (required and optional) should be preserved
    fc.assert(
      fc.property(
        orphanedFlavourArb,
        defaultScoopFormatArb,
        (orphanedFlavour, defaultFormat) => {
          const sellables: Sellable[] = []
          const formats = [defaultFormat]

          const result = migrateShopifyFields(
            [orphanedFlavour] as any,
            sellables,
            formats as any
          )

          const createdSellable = result.updatedSellables[0]

          // All Shopify fields should be preserved
          if (orphanedFlavour.shopifyProductId) {
            expect(createdSellable.shopifyProductId).toBe(orphanedFlavour.shopifyProductId)
          }
          if (orphanedFlavour.shopifyProductHandle) {
            expect(createdSellable.shopifyProductHandle).toBe(orphanedFlavour.shopifyProductHandle)
          }
          if (orphanedFlavour.shopifySKU) {
            expect(createdSellable.shopifySKU).toBe(orphanedFlavour.shopifySKU)
          }
          if (orphanedFlavour.syncStatus) {
            expect(createdSellable.syncStatus).toBe(orphanedFlavour.syncStatus)
          }
          if (orphanedFlavour.lastSyncedAt) {
            expect(createdSellable.lastSyncedAt).toBe(orphanedFlavour.lastSyncedAt)
          }
          if (orphanedFlavour.syncError) {
            expect(createdSellable.syncError).toBe(orphanedFlavour.syncError)
          }
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should generate unique IDs for multiple orphaned flavours', () => {
    // Property: Each created sellable should have a unique ID
    fc.assert(
      fc.property(
        fc.array(orphanedFlavourArb, { minLength: 2, maxLength: 10 }),
        defaultScoopFormatArb,
        (orphanedFlavours, defaultFormat) => {
          const sellables: Sellable[] = []
          const formats = [defaultFormat]

          const result = migrateShopifyFields(
            orphanedFlavours as any,
            sellables,
            formats as any
          )

          // Extract all sellable IDs
          const sellableIds = result.updatedSellables.map(s => s.id)
          
          // All IDs should be unique
          const uniqueIds = new Set(sellableIds)
          expect(uniqueIds.size).toBe(sellableIds.length)
          
          // All IDs should follow the pattern
          sellableIds.forEach(id => {
            expect(id).toMatch(/^sell-\d+-[a-z0-9]+$/)
          })
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should generate valid slugs for created sellables', () => {
    // Property: Created sellables should have valid URL-friendly slugs
    fc.assert(
      fc.property(
        orphanedFlavourArb,
        defaultScoopFormatArb,
        (orphanedFlavour, defaultFormat) => {
          const sellables: Sellable[] = []
          const formats = [defaultFormat]

          const result = migrateShopifyFields(
            [orphanedFlavour] as any,
            sellables,
            formats as any
          )

          const createdSellable = result.updatedSellables[0]
          
          // Slug should be URL-friendly (lowercase, hyphens, no special chars)
          expect(createdSellable.slug).toMatch(/^[a-z0-9-]+$/)
          expect(createdSellable.slug).not.toContain(' ')
          expect(createdSellable.slug).not.toContain('_')
          
          // Slug should start with flavour slug
          expect(createdSellable.slug).toContain(orphanedFlavour.slug)
        }
      ),
      { numRuns: 10 }
    )
  })

  it('should handle mixed orphaned and non-orphaned flavours', () => {
    // Property: When some flavours are orphaned and some have sellables,
    // only orphaned ones should get new sellables created
    fc.assert(
      fc.property(
        fc.array(orphanedFlavourArb, { minLength: 2, maxLength: 5 }),
        defaultScoopFormatArb,
        fc.integer({ min: 1, max: 3 }),
        (flavours, defaultFormat, nonOrphanedCount) => {
          // Take some flavours and create existing sellables for them
          const nonOrphanedFlavours = flavours.slice(0, Math.min(nonOrphanedCount, flavours.length - 1))
          const orphanedFlavours = flavours.slice(nonOrphanedFlavours.length)

          const existingSellables: Sellable[] = nonOrphanedFlavours.map(flavour => ({
            id: `existing-${flavour.id}`,
            internalName: `Existing ${flavour.name}`,
            publicName: flavour.name,
            slug: `${flavour.slug}-existing`,
            status: 'active',
            formatId: defaultFormat.id,
            primaryFlavourIds: [flavour.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))

          const formats = [defaultFormat]

          const result = migrateShopifyFields(
            flavours as any,
            existingSellables,
            formats as any
          )

          // Total sellables = existing + newly created for orphaned
          expect(result.updatedSellables.length).toBe(
            existingSellables.length + orphanedFlavours.length
          )

          // Verify orphaned flavours got new sellables
          orphanedFlavours.forEach(flavour => {
            const sellable = result.updatedSellables.find(s =>
              s.primaryFlavourIds.includes(flavour.id)
            )
            expect(sellable).toBeDefined()
            expect(sellable!.shopifyProductId).toBe(flavour.shopifyProductId)
          })

          // Verify non-orphaned flavours kept their existing sellables
          nonOrphanedFlavours.forEach(flavour => {
            const sellable = result.updatedSellables.find(s =>
              s.primaryFlavourIds.includes(flavour.id)
            )
            expect(sellable).toBeDefined()
            expect(sellable!.id).toMatch(/^existing-/)
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})
