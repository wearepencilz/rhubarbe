/**
 * Unit tests for Shopify field migration utility
 * 
 * Tests the migration of Shopify integration fields from Flavour objects
 * to Sellable objects, including creation of default sellables for orphaned
 * Shopify links.
 */

import { describe, it, expect } from 'vitest'
import { migrateShopifyFields } from '@/lib/migration/migrate-shopify-fields'
import type { Flavour, Sellable, Format } from '@/types'

describe('migrateShopifyFields', () => {
  // Helper to create a test flavour
  const createFlavour = (
    id: string,
    name: string,
    shopifyFields?: {
      shopifyProductId?: string
      shopifyProductHandle?: string
      shopifySKU?: string
    }
  ): Flavour => ({
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    type: 'gelato',
    ingredients: [],
    keyNotes: [],
    allergens: [],
    dietaryTags: [],
    status: 'active',
    featured: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...(shopifyFields as any)
  })

  // Helper to create a test sellable
  const createSellable = (
    id: string,
    formatId: string,
    primaryFlavourIds: string[]
  ): Sellable => ({
    id,
    internalName: 'Test Sellable',
    publicName: 'Test Sellable',
    slug: 'test-sellable',
    status: 'active',
    formatId,
    primaryFlavourIds,
    price: 500,
    inventoryTracked: false,
    onlineOrderable: true,
    pickupOnly: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  })

  // Helper to create a test format
  const createFormat = (
    id: string,
    category: 'scoop' | 'take-home',
    minFlavours: number
  ): Format => ({
    id,
    name: 'Test Format',
    slug: 'test-format',
    category,
    requiresFlavours: true,
    minFlavours,
    maxFlavours: 3,
    allowMixedTypes: true,
    canIncludeAddOns: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  })

  it('should return empty results for empty flavours array', () => {
    const result = migrateShopifyFields([], [], [])
    
    expect(result.updatedSellables).toEqual([])
    expect(result.migrationMap).toEqual([])
  })

  it('should skip flavours without Shopify fields', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla'),
      createFlavour('f2', 'Chocolate')
    ]
    const sellables: Sellable[] = []
    const formats: Format[] = []
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    expect(result.updatedSellables).toEqual([])
    expect(result.migrationMap).toEqual([])
  })

  it('should move Shopify fields to existing sellable using the flavour', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla', {
        shopifyProductId: 'shopify-123',
        shopifyProductHandle: 'vanilla-scoop',
        shopifySKU: 'VAN-001'
      })
    ]
    const sellables = [
      createSellable('s1', 'fmt-1', ['f1'])
    ]
    const formats: Format[] = []
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    expect(result.updatedSellables).toHaveLength(1)
    expect(result.updatedSellables[0].shopifyProductId).toBe('shopify-123')
    expect(result.updatedSellables[0].shopifyProductHandle).toBe('vanilla-scoop')
    expect(result.updatedSellables[0].shopifySKU).toBe('VAN-001')
    
    expect(result.migrationMap).toHaveLength(1)
    expect(result.migrationMap[0].flavourId).toBe('f1')
    expect(result.migrationMap[0].hadShopifyFields).toBe(true)
    expect(result.migrationMap[0].movedToSellableId).toBe('s1')
  })

  it('should move Shopify fields to sellable using flavour in secondaryFlavourIds', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    const sellables = [
      createSellable('s1', 'fmt-1', ['f2'])
    ]
    sellables[0].secondaryFlavourIds = ['f1']
    const formats: Format[] = []
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    expect(result.updatedSellables[0].shopifyProductId).toBe('shopify-123')
    expect(result.migrationMap[0].movedToSellableId).toBe('s1')
  })

  it('should not overwrite existing Shopify fields on sellable', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla', {
        shopifyProductId: 'shopify-old'
      })
    ]
    const sellables = [
      createSellable('s1', 'fmt-1', ['f1'])
    ]
    sellables[0].shopifyProductId = 'shopify-existing'
    const formats: Format[] = []
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    // Should not overwrite existing Shopify ID
    expect(result.updatedSellables[0].shopifyProductId).toBe('shopify-existing')
  })

  it('should create default sellable for flavour with Shopify fields but no matching sellable', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla', {
        shopifyProductId: 'shopify-123',
        shopifyProductHandle: 'vanilla-scoop',
        shopifySKU: 'VAN-001'
      })
    ]
    const sellables: Sellable[] = []
    const formats = [
      createFormat('fmt-scoop', 'scoop', 1)
    ]
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    expect(result.updatedSellables).toHaveLength(1)
    
    const newSellable = result.updatedSellables[0]
    expect(newSellable.primaryFlavourIds).toEqual(['f1'])
    expect(newSellable.formatId).toBe('fmt-scoop')
    expect(newSellable.shopifyProductId).toBe('shopify-123')
    expect(newSellable.shopifyProductHandle).toBe('vanilla-scoop')
    expect(newSellable.shopifySKU).toBe('VAN-001')
    expect(newSellable.publicName).toBe('Vanilla')
    expect(newSellable.internalName).toBe('Vanilla (Single Scoop)')
    
    expect(result.migrationMap).toHaveLength(1)
    expect(result.migrationMap[0].createdSellableId).toBe(newSellable.id)
    expect(result.migrationMap[0].movedToSellableId).toBeUndefined()
  })

  it('should handle flavour with Shopify fields but no default format available', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    const sellables: Sellable[] = []
    const formats = [
      createFormat('fmt-pint', 'take-home', 1) // Not a scoop format
    ]
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    // Should not create a sellable without proper format
    expect(result.updatedSellables).toHaveLength(0)
    
    // Should still track the migration attempt
    expect(result.migrationMap).toHaveLength(1)
    expect(result.migrationMap[0].flavourId).toBe('f1')
    expect(result.migrationMap[0].createdSellableId).toBeUndefined()
    expect(result.migrationMap[0].movedToSellableId).toBeUndefined()
  })

  it('should handle multiple flavours with Shopify fields', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      }),
      createFlavour('f2', 'Chocolate', {
        shopifyProductId: 'shopify-456'
      })
    ]
    const sellables = [
      createSellable('s1', 'fmt-1', ['f1']),
      createSellable('s2', 'fmt-1', ['f2'])
    ]
    const formats: Format[] = []
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    expect(result.updatedSellables).toHaveLength(2)
    expect(result.updatedSellables[0].shopifyProductId).toBe('shopify-123')
    expect(result.updatedSellables[1].shopifyProductId).toBe('shopify-456')
    
    expect(result.migrationMap).toHaveLength(2)
  })

  it('should handle flavour used in multiple sellables', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    const sellables = [
      createSellable('s1', 'fmt-1', ['f1']),
      createSellable('s2', 'fmt-2', ['f1', 'f2'])
    ]
    const formats: Format[] = []
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    // Should move to both sellables
    expect(result.updatedSellables[0].shopifyProductId).toBe('shopify-123')
    expect(result.updatedSellables[1].shopifyProductId).toBe('shopify-123')
    
    // Should track the first sellable as primary
    expect(result.migrationMap[0].movedToSellableId).toBe('s1')
  })

  it('should preserve sync status and error fields', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    // Add sync fields to flavour
    ;(flavours[0] as any).syncStatus = 'error'
    ;(flavours[0] as any).lastSyncedAt = '2024-01-15T10:00:00Z'
    ;(flavours[0] as any).syncError = 'Connection timeout'
    
    const sellables = [
      createSellable('s1', 'fmt-1', ['f1'])
    ]
    const formats: Format[] = []
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    expect(result.updatedSellables[0].syncStatus).toBe('error')
    expect(result.updatedSellables[0].lastSyncedAt).toBe('2024-01-15T10:00:00Z')
    expect(result.updatedSellables[0].syncError).toBe('Connection timeout')
  })

  it('should copy flavour content to default sellable', () => {
    const flavours = [
      createFlavour('f1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    flavours[0].description = 'Classic vanilla gelato'
    flavours[0].shortDescription = 'Vanilla gelato'
    flavours[0].image = '/images/vanilla.jpg'
    
    const sellables: Sellable[] = []
    const formats = [
      createFormat('fmt-scoop', 'scoop', 1)
    ]
    
    const result = migrateShopifyFields(flavours, sellables, formats)
    
    const newSellable = result.updatedSellables[0]
    expect(newSellable.description).toBe('Classic vanilla gelato')
    expect(newSellable.shortCardCopy).toBe('Vanilla gelato')
    expect(newSellable.image).toBe('/images/vanilla.jpg')
  })
})
