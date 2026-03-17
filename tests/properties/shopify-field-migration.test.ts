/**
 * Property Test: Shopify Field Migration
 * 
 * Property 11: Shopify Field Migration
 * Validates: Requirements 9.7, 13.3
 * 
 * Feature: launch-first-cms-model, Property 11: For any offering record with Shopify fields
 * (shopifyProductId, shopifyProductHandle, shopifySKU), running the migration should move
 * these fields to the corresponding sellable.
 */

import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { migrateShopifyFields } from '@/lib/migration/migrate-shopify-fields'
import type { Flavour, Sellable, Format } from '@/types'

describe('Property 11: Shopify Field Migration', () => {
  // Arbitrary generators for test data
  // Helper to generate valid ISO date strings
  const validDateArb = fc.integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31
    .map(timestamp => new Date(timestamp).toISOString())

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

  const flavourArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/\s/g, '-')),
    type: fc.constantFrom('gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce'),
    ingredients: fc.constant([]),
    keyNotes: fc.constant([]),
    allergens: fc.constant([]),
    dietaryTags: fc.constant([]),
    status: fc.constantFrom('active', 'archived', 'in-development', 'seasonal'),
    featured: fc.boolean(),
    createdAt: validDateArb,
    updatedAt: validDateArb
  })

  const flavourWithShopifyArb = fc.tuple(flavourArb, shopifyFieldsArb).map(([flavour, shopify]) => ({
    ...flavour,
    ...shopify
  }))

  const sellableArb = fc.record({
    id: fc.uuid(),
    internalName: fc.string({ minLength: 3, maxLength: 50 }),
    publicName: fc.string({ minLength: 3, maxLength: 50 }),
    slug: fc.string({ minLength: 3, maxLength: 50 }).map(s => s.toLowerCase().replace(/\s/g, '-')),
    status: fc.constantFrom('draft', 'active', 'archived', 'out-of-stock'),
    formatId: fc.uuid(),
    primaryFlavourIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
    price: fc.integer({ min: 0, max: 10000 }),
    inventoryTracked: fc.boolean(),
    onlineOrderable: fc.boolean(),
    pickupOnly: fc.boolean(),
    createdAt: validDateArb,
    updatedAt: validDateArb
  })

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

  it('should move Shopify fields from flavours to matching sellables', () => {
    // Property: When a flavour has Shopify fields and a matching sellable exists,
    // the Shopify fields should be moved to the sellable
    fc.assert(
      fc.property(
        fc.array(flavourWithShopifyArb, { minLength: 1, maxLength: 5 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, formats) => {
          // Create sellables that reference these flavours
          const sellables: Sellable[] = flavours.map(flavour => ({
            id: `sell-${flavour.id}`,
            internalName: `${flavour.name} Sellable`,
            publicName: flavour.name,
            slug: `${flavour.slug}-sellable`,
            status: 'active',
            formatId: formats[0].id,
            primaryFlavourIds: [flavour.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))

          const result = migrateShopifyFields(flavours as any, sellables, formats as any)

          // Check each flavour with Shopify fields
          flavours.forEach((flavour, index) => {
            const hasShopifyFields = !!(
              flavour.shopifyProductId ||
              flavour.shopifyProductHandle ||
              flavour.shopifySKU
            )

            if (hasShopifyFields) {
              const matchingSellable = result.updatedSellables.find(s => 
                s.primaryFlavourIds.includes(flavour.id)
              )

              expect(matchingSellable).toBeDefined()
              
              // Shopify fields should be moved to the sellable
              if (flavour.shopifyProductId) {
                expect(matchingSellable!.shopifyProductId).toBe(flavour.shopifyProductId)
              }
              if (flavour.shopifyProductHandle) {
                expect(matchingSellable!.shopifyProductHandle).toBe(flavour.shopifyProductHandle)
              }
              if (flavour.shopifySKU) {
                expect(matchingSellable!.shopifySKU).toBe(flavour.shopifySKU)
              }
            }
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should create migration map entries for all flavours with Shopify fields', () => {
    // Property: Every flavour with Shopify fields should have a migration map entry
    fc.assert(
      fc.property(
        fc.array(flavourWithShopifyArb, { minLength: 1, maxLength: 5 }),
        fc.array(sellableArb, { minLength: 0, maxLength: 3 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, sellables, formats) => {
          const result = migrateShopifyFields(flavours as any, sellables as any, formats as any)

          // Count flavours with Shopify fields
          const flavoursWithShopify = flavours.filter(f =>
            f.shopifyProductId || f.shopifyProductHandle || f.shopifySKU
          )

          // Migration map should have entries for all flavours with Shopify fields
          expect(result.migrationMap.length).toBe(flavoursWithShopify.length)

          flavoursWithShopify.forEach(flavour => {
            const mapEntry = result.migrationMap.find(m => m.flavourId === flavour.id)
            expect(mapEntry).toBeDefined()
            expect(mapEntry!.hadShopifyFields).toBe(true)
            expect(mapEntry!.shopifyProductId).toBe(flavour.shopifyProductId)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should create default sellables for orphaned Shopify links', () => {
    // Property: When a flavour has Shopify fields but no matching sellable,
    // a default sellable should be created
    fc.assert(
      fc.property(
        fc.array(flavourWithShopifyArb, { minLength: 1, maxLength: 5 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, formats) => {
          // Ensure at least one format is a scoop format (for default sellable creation)
          const scoopFormat = {
            ...formats[0],
            category: 'scoop' as const,
            minFlavours: 1,
            maxFlavours: 3
          }
          const formatsWithScoop = [scoopFormat, ...formats.slice(1)]

          // Start with no sellables
          const sellables: Sellable[] = []

          const result = migrateShopifyFields(flavours as any, sellables, formatsWithScoop as any)

          // Count flavours with Shopify fields
          const flavoursWithShopify = flavours.filter(f =>
            f.shopifyProductId || f.shopifyProductHandle || f.shopifySKU
          )

          // Should create one sellable per flavour with Shopify fields
          expect(result.updatedSellables.length).toBe(flavoursWithShopify.length)

          flavoursWithShopify.forEach(flavour => {
            const createdSellable = result.updatedSellables.find(s =>
              s.primaryFlavourIds.includes(flavour.id)
            )

            expect(createdSellable).toBeDefined()
            expect(createdSellable!.shopifyProductId).toBe(flavour.shopifyProductId)
            expect(createdSellable!.shopifyProductHandle).toBe(flavour.shopifyProductHandle)
            expect(createdSellable!.shopifySKU).toBe(flavour.shopifySKU)
            expect(createdSellable!.formatId).toBe(scoopFormat.id)

            // Check migration map
            const mapEntry = result.migrationMap.find(m => m.flavourId === flavour.id)
            expect(mapEntry).toBeDefined()
            expect(mapEntry!.createdSellableId).toBe(createdSellable!.id)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should not modify sellables that already have Shopify fields', () => {
    // Property: Sellables with existing Shopify fields should not be overwritten
    fc.assert(
      fc.property(
        fc.array(flavourWithShopifyArb, { minLength: 1, maxLength: 3 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, formats) => {
          // Create sellables with existing Shopify fields
          const sellables: Sellable[] = flavours.map(flavour => ({
            id: `sell-${flavour.id}`,
            internalName: `${flavour.name} Sellable`,
            publicName: flavour.name,
            slug: `${flavour.slug}-sellable`,
            status: 'active',
            formatId: formats[0].id,
            primaryFlavourIds: [flavour.id],
            price: 500,
            shopifyProductId: 'existing-id',
            shopifyProductHandle: 'existing-handle',
            shopifySKU: 'EXISTING-SKU',
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))

          const result = migrateShopifyFields(flavours as any, sellables, formats as any)

          // Existing Shopify fields should not be overwritten
          result.updatedSellables.forEach(sellable => {
            expect(sellable.shopifyProductId).toBe('existing-id')
            expect(sellable.shopifyProductHandle).toBe('existing-handle')
            expect(sellable.shopifySKU).toBe('EXISTING-SKU')
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle flavours without Shopify fields gracefully', () => {
    // Property: Flavours without Shopify fields should not create migration entries
    fc.assert(
      fc.property(
        fc.array(flavourArb, { minLength: 1, maxLength: 5 }),
        fc.array(sellableArb, { minLength: 0, maxLength: 3 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, sellables, formats) => {
          const result = migrateShopifyFields(flavours as any, sellables as any, formats as any)

          // No migration map entries should be created
          expect(result.migrationMap.length).toBe(0)

          // Sellables should remain unchanged
          expect(result.updatedSellables.length).toBe(sellables.length)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle empty flavours array gracefully', () => {
    // Property: Empty flavours array should produce empty results
    fc.assert(
      fc.property(
        fc.array(sellableArb, { minLength: 0, maxLength: 3 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (sellables, formats) => {
          const result = migrateShopifyFields([], sellables as any, formats as any)

          expect(result.migrationMap.length).toBe(0)
          expect(result.updatedSellables.length).toBe(sellables.length)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should preserve sync status and error information', () => {
    // Property: Sync status, lastSyncedAt, and syncError should be migrated
    fc.assert(
      fc.property(
        fc.array(flavourWithShopifyArb, { minLength: 1, maxLength: 3 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, formats) => {
          // Create sellables that reference these flavours
          const sellables: Sellable[] = flavours.map(flavour => ({
            id: `sell-${flavour.id}`,
            internalName: `${flavour.name} Sellable`,
            publicName: flavour.name,
            slug: `${flavour.slug}-sellable`,
            status: 'active',
            formatId: formats[0].id,
            primaryFlavourIds: [flavour.id],
            price: 500,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))

          const result = migrateShopifyFields(flavours as any, sellables, formats as any)

          flavours.forEach(flavour => {
            const hasShopifyFields = !!(
              flavour.shopifyProductId ||
              flavour.shopifyProductHandle ||
              flavour.shopifySKU
            )

            if (hasShopifyFields) {
              const matchingSellable = result.updatedSellables.find(s =>
                s.primaryFlavourIds.includes(flavour.id)
              )

              expect(matchingSellable).toBeDefined()

              // Sync information should be preserved
              if (flavour.syncStatus) {
                expect(matchingSellable!.syncStatus).toBe(flavour.syncStatus)
              }
              if (flavour.lastSyncedAt) {
                expect(matchingSellable!.lastSyncedAt).toBe(flavour.lastSyncedAt)
              }
              if (flavour.syncError) {
                expect(matchingSellable!.syncError).toBe(flavour.syncError)
              }
            }
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle flavours with secondary flavour references', () => {
    // Property: Shopify fields should be moved to sellables that reference the flavour
    // in either primaryFlavourIds or secondaryFlavourIds
    fc.assert(
      fc.property(
        fc.array(flavourWithShopifyArb, { minLength: 1, maxLength: 3 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, formats) => {
          // Create sellables with secondary flavour references
          const sellables: Sellable[] = flavours.map(flavour => ({
            id: `sell-${flavour.id}`,
            internalName: `${flavour.name} Twist`,
            publicName: `${flavour.name} Twist`,
            slug: `${flavour.slug}-twist`,
            status: 'active',
            formatId: formats[0].id,
            primaryFlavourIds: ['other-flavour-id'],
            secondaryFlavourIds: [flavour.id],
            price: 600,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))

          const result = migrateShopifyFields(flavours as any, sellables, formats as any)

          flavours.forEach(flavour => {
            const hasShopifyFields = !!(
              flavour.shopifyProductId ||
              flavour.shopifyProductHandle ||
              flavour.shopifySKU
            )

            if (hasShopifyFields) {
              const matchingSellable = result.updatedSellables.find(s =>
                s.secondaryFlavourIds?.includes(flavour.id)
              )

              expect(matchingSellable).toBeDefined()
              expect(matchingSellable!.shopifyProductId).toBe(flavour.shopifyProductId)
            }
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should generate valid timestamps for migration map entries', () => {
    // Property: All migration map entries should have valid ISO 8601 timestamps
    fc.assert(
      fc.property(
        fc.array(flavourWithShopifyArb, { minLength: 1, maxLength: 5 }),
        fc.array(sellableArb, { minLength: 0, maxLength: 3 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, sellables, formats) => {
          const result = migrateShopifyFields(flavours as any, sellables as any, formats as any)

          result.migrationMap.forEach(entry => {
            expect(entry.migrationDate).toBeDefined()

            const migrationDate = new Date(entry.migrationDate)
            expect(migrationDate.toString()).not.toBe('Invalid Date')
            expect(entry.migrationDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should handle multiple sellables referencing the same flavour', () => {
    // Property: When multiple sellables reference the same flavour with Shopify fields,
    // all should receive the Shopify fields (if they don't already have them)
    fc.assert(
      fc.property(
        flavourWithShopifyArb,
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        fc.integer({ min: 2, max: 4 }),
        (flavour, formats, sellableCount) => {
          // Skip if no Shopify fields
          const hasShopifyFields = !!(
            flavour.shopifyProductId ||
            flavour.shopifyProductHandle ||
            flavour.shopifySKU
          )

          if (!hasShopifyFields) {
            return true
          }

          // Create multiple sellables referencing the same flavour
          const sellables: Sellable[] = Array.from({ length: sellableCount }, (_, i) => ({
            id: `sell-${i}`,
            internalName: `${flavour.name} Sellable ${i}`,
            publicName: `${flavour.name} ${i}`,
            slug: `${flavour.slug}-${i}`,
            status: 'active',
            formatId: formats[0].id,
            primaryFlavourIds: [flavour.id],
            price: 500 + i * 100,
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))

          const result = migrateShopifyFields([flavour] as any, sellables, formats as any)

          // All sellables should have the Shopify fields
          const matchingSellables = result.updatedSellables.filter(s =>
            s.primaryFlavourIds.includes(flavour.id)
          )

          expect(matchingSellables.length).toBe(sellableCount)

          matchingSellables.forEach(sellable => {
            expect(sellable.shopifyProductId).toBe(flavour.shopifyProductId)
            expect(sellable.shopifyProductHandle).toBe(flavour.shopifyProductHandle)
            expect(sellable.shopifySKU).toBe(flavour.shopifySKU)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('should not create default sellables when no default format exists', () => {
    // Property: When a flavour has Shopify fields but no matching sellable and no
    // default format exists, no sellable should be created
    fc.assert(
      fc.property(
        fc.array(flavourWithShopifyArb, { minLength: 1, maxLength: 3 }),
        fc.array(formatArb, { minLength: 1, maxLength: 3 }),
        (flavours, formats) => {
          // Ensure no format is a default scoop format
          const nonDefaultFormats = formats.map(f => ({
            ...f,
            category: 'take-home' as const,
            minFlavours: 2
          }))

          const sellables: Sellable[] = []

          const result = migrateShopifyFields(flavours as any, sellables, nonDefaultFormats as any)

          // No sellables should be created
          expect(result.updatedSellables.length).toBe(0)

          // Migration map should still track the flavours
          const flavoursWithShopify = flavours.filter(f =>
            f.shopifyProductId || f.shopifyProductHandle || f.shopifySKU
          )
          expect(result.migrationMap.length).toBe(flavoursWithShopify.length)

          // But no sellables should be created or moved to
          result.migrationMap.forEach(entry => {
            expect(entry.createdSellableId).toBeUndefined()
            expect(entry.movedToSellableId).toBeUndefined()
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})
