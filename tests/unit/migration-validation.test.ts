/**
 * Unit tests for migration validation utility
 * 
 * Task 12.6: Write unit tests for migration validation
 * Requirements: 0.6, 9.9
 * 
 * This test suite verifies the validateMigration function:
 * - Detection of offerings without corresponding sellables
 * - Detection of flavours with unmigrated Shopify fields
 * - Detection of broken references (invalid formatId, flavourIds, modifierIds)
 * - Validation report structure and summary statistics
 */

import { describe, it, expect } from 'vitest'
import { validateMigration } from '@/lib/migration/validate'
import type {
  Sellable,
  Flavour,
  Format,
  Modifier,
  OfferingMigrationMap,
  FlavourShopifyMigration
} from '@/types'

// Helper to create test offerings
const createOffering = (id: string, formatId: string, primaryFlavourIds: string[]) => ({
  id,
  formatId,
  primaryFlavourIds
})

// Helper to create test sellables
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

// Helper to create test flavours
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

// Helper to create test formats
const createFormat = (id: string, name: string): Format => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  category: 'scoop',
  requiresFlavours: true,
  minFlavours: 1,
  maxFlavours: 3,
  allowMixedTypes: true,
  canIncludeAddOns: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
})

// Helper to create test modifiers
const createModifier = (id: string, name: string): Modifier => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  type: 'topping',
  price: 50,
  allergens: [],
  dietaryFlags: [],
  availableForFormatIds: [],
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
})

describe('validateMigration - Detection of missing sellables', () => {
  it('should pass when all offerings have corresponding sellables', () => {
    const offerings = [
      createOffering('off-1', 'fmt-1', ['flav-1']),
      createOffering('off-2', 'fmt-1', ['flav-2'])
    ]
    
    const sellables = [
      createSellable('sell-1', 'fmt-1', ['flav-1']),
      createSellable('sell-2', 'fmt-1', ['flav-2'])
    ]
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla'),
      createFlavour('flav-2', 'Chocolate')
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      },
      {
        legacyOfferingId: 'off-2',
        newSellableId: 'sell-2',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(true)
    expect(report.errors).toHaveLength(0)
    expect(report.summary.offeringsWithoutSellables).toBe(0)
  })

  it('should detect offerings without corresponding sellables', () => {
    const offerings = [
      createOffering('off-1', 'fmt-1', ['flav-1']),
      createOffering('off-2', 'fmt-1', ['flav-2']),
      createOffering('off-3', 'fmt-1', ['flav-3'])
    ]
    
    const sellables = [
      createSellable('sell-1', 'fmt-1', ['flav-1'])
    ]
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla'),
      createFlavour('flav-2', 'Chocolate'),
      createFlavour('flav-3', 'Strawberry')
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    expect(report.errors.length).toBeGreaterThan(0)
    expect(report.summary.offeringsWithoutSellables).toBe(2)
    
    const missingErrors = report.errors.filter(e => e.category === 'offering-mapping')
    expect(missingErrors).toHaveLength(2)
    expect(missingErrors[0].message).toContain('off-2')
    expect(missingErrors[1].message).toContain('off-3')
  })

  it('should handle empty offerings array', () => {
    const offerings: any[] = []
    const sellables: Sellable[] = []
    const flavours: Flavour[] = []
    const formats: Format[] = []
    const modifiers: Modifier[] = []
    const offeringMap: OfferingMigrationMap[] = []
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(true)
    expect(report.errors).toHaveLength(0)
    expect(report.summary.totalOfferings).toBe(0)
    expect(report.summary.totalSellables).toBe(0)
  })
})

describe('validateMigration - Detection of unmigrated Shopify fields', () => {
  it('should pass when flavours without Shopify fields exist', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(true)
    expect(report.summary.flavoursWithShopifyFields).toBe(0)
  })

  it('should detect flavours with Shopify fields but no migration entry', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla', {
        shopifyProductId: 'shopify-123',
        shopifyProductHandle: 'vanilla-scoop'
      })
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    expect(report.summary.flavoursWithShopifyFields).toBe(1)
    
    const shopifyErrors = report.errors.filter(e => e.category === 'shopify-migration')
    expect(shopifyErrors).toHaveLength(1)
    expect(shopifyErrors[0].message).toContain('flav-1')
    expect(shopifyErrors[0].message).toContain('no migration entry')
  })

  it('should detect Shopify fields not migrated to any sellable', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = [
      {
        flavourId: 'flav-1',
        hadShopifyFields: true,
        shopifyProductId: 'shopify-123',
        migrationDate: '2024-01-01T00:00:00Z'
      }
    ]
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    // Warnings don't make the report invalid, only errors do
    expect(report.valid).toBe(true)
    
    const shopifyWarnings = report.warnings.filter(e => e.category === 'shopify-migration')
    expect(shopifyWarnings).toHaveLength(1)
    expect(shopifyWarnings[0].message).toContain('not migrated to any sellable')
  })

  it('should detect migration map referencing non-existent sellable', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = [
      {
        flavourId: 'flav-1',
        hadShopifyFields: true,
        shopifyProductId: 'shopify-123',
        createdSellableId: 'sell-999', // Non-existent sellable
        migrationDate: '2024-01-01T00:00:00Z'
      }
    ]
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const shopifyErrors = report.errors.filter(e => e.category === 'shopify-migration')
    expect(shopifyErrors).toHaveLength(1)
    expect(shopifyErrors[0].message).toContain('non-existent sellable')
    expect(shopifyErrors[0].message).toContain('sell-999')
  })

  it('should verify Shopify fields were copied to target sellable', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    // Sellable has Shopify fields
    sellables[0].shopifyProductId = 'shopify-123'
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = [
      {
        flavourId: 'flav-1',
        hadShopifyFields: true,
        shopifyProductId: 'shopify-123',
        movedToSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z'
      }
    ]
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(true)
    expect(report.summary.flavoursWithMigratedShopify).toBe(1)
  })

  it('should detect when Shopify fields were not copied to target sellable', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    // Sellable does NOT have Shopify fields
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = [
      {
        flavourId: 'flav-1',
        hadShopifyFields: true,
        shopifyProductId: 'shopify-123',
        movedToSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z'
      }
    ]
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const shopifyErrors = report.errors.filter(e => e.category === 'shopify-migration')
    expect(shopifyErrors).toHaveLength(1)
    expect(shopifyErrors[0].message).toContain('Shopify fields not found')
  })
})

describe('validateMigration - Detection of broken references', () => {
  it('should pass when all references are valid', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].toppingIds = ['mod-1']
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers = [createModifier('mod-1', 'Sprinkles')]
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(true)
    expect(report.summary.brokenReferences).toBe(0)
  })

  it('should detect invalid formatId reference', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-999', ['flav-1'])]
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    expect(report.summary.brokenReferences).toBe(1)
    
    const refErrors = report.errors.filter(e => e.category === 'referential-integrity')
    expect(refErrors).toHaveLength(1)
    expect(refErrors[0].message).toContain('non-existent format')
    expect(refErrors[0].message).toContain('fmt-999')
  })

  it('should detect invalid primary flavour reference', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-999'])]
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    expect(report.summary.brokenReferences).toBe(1)
    
    const refErrors = report.errors.filter(e => e.category === 'referential-integrity')
    expect(refErrors).toHaveLength(1)
    expect(refErrors[0].message).toContain('non-existent primary flavour')
    expect(refErrors[0].message).toContain('flav-999')
  })

  it('should detect invalid secondary flavour reference', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].secondaryFlavourIds = ['flav-999']
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const refErrors = report.errors.filter(e => e.category === 'referential-integrity')
    expect(refErrors).toHaveLength(1)
    expect(refErrors[0].message).toContain('non-existent secondary flavour')
  })

  it('should detect invalid component reference', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].componentIds = ['comp-999']
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const refErrors = report.errors.filter(e => e.category === 'referential-integrity')
    expect(refErrors).toHaveLength(1)
    expect(refErrors[0].message).toContain('non-existent component')
  })

  it('should detect invalid modifier reference', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].toppingIds = ['mod-999']
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const refErrors = report.errors.filter(e => e.category === 'referential-integrity')
    expect(refErrors).toHaveLength(1)
    expect(refErrors[0].message).toContain('non-existent modifier')
  })

  it('should detect multiple broken references in one sellable', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-999', ['flav-999'])]
    sellables[0].toppingIds = ['mod-999']
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    expect(report.summary.brokenReferences).toBe(3)
    
    const refErrors = report.errors.filter(e => e.category === 'referential-integrity')
    expect(refErrors).toHaveLength(3)
  })
})

describe('validateMigration - Validation report structure', () => {
  it('should return correct report structure', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report).toHaveProperty('valid')
    expect(report).toHaveProperty('errors')
    expect(report).toHaveProperty('warnings')
    expect(report).toHaveProperty('summary')
    
    expect(Array.isArray(report.errors)).toBe(true)
    expect(Array.isArray(report.warnings)).toBe(true)
    
    expect(report.summary).toHaveProperty('totalOfferings')
    expect(report.summary).toHaveProperty('totalSellables')
    expect(report.summary).toHaveProperty('offeringsWithoutSellables')
    expect(report.summary).toHaveProperty('flavoursWithShopifyFields')
    expect(report.summary).toHaveProperty('flavoursWithMigratedShopify')
    expect(report.summary).toHaveProperty('brokenReferences')
    expect(report.summary).toHaveProperty('checksPerformed')
    expect(report.summary).toHaveProperty('checksPassed')
  })

  it('should correctly count total offerings and sellables', () => {
    const offerings = [
      createOffering('off-1', 'fmt-1', ['flav-1']),
      createOffering('off-2', 'fmt-1', ['flav-2']),
      createOffering('off-3', 'fmt-1', ['flav-3'])
    ]
    
    const sellables = [
      createSellable('sell-1', 'fmt-1', ['flav-1']),
      createSellable('sell-2', 'fmt-1', ['flav-2'])
    ]
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla'),
      createFlavour('flav-2', 'Chocolate'),
      createFlavour('flav-3', 'Strawberry')
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      },
      {
        legacyOfferingId: 'off-2',
        newSellableId: 'sell-2',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.summary.totalOfferings).toBe(3)
    expect(report.summary.totalSellables).toBe(2)
  })

  it('should correctly count checks performed and passed', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.summary.checksPerformed).toBe(4)
    expect(report.summary.checksPassed).toBe(4)
  })

  it('should correctly count failed checks', () => {
    const offerings = [
      createOffering('off-1', 'fmt-1', ['flav-1']),
      createOffering('off-2', 'fmt-1', ['flav-2'])
    ]
    
    const sellables = [createSellable('sell-1', 'fmt-999', ['flav-999'])]
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla'),
      createFlavour('flav-2', 'Chocolate')
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.summary.checksPerformed).toBe(4)
    expect(report.summary.checksPassed).toBeLessThan(4)
  })

  it('should separate errors and warnings', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    // Migration entry exists but no target sellable (warning case)
    const shopifyMap: FlavourShopifyMigration[] = [
      {
        flavourId: 'flav-1',
        hadShopifyFields: true,
        shopifyProductId: 'shopify-123',
        migrationDate: '2024-01-01T00:00:00Z'
      }
    ]
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.warnings.length).toBeGreaterThan(0)
    expect(report.warnings.every(w => w.type === 'warning')).toBe(true)
  })
})

describe('validateMigration - Data integrity checks', () => {
  it('should detect invalid sellable status', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].status = 'invalid-status' as any
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const dataErrors = report.errors.filter(e => e.category === 'data-integrity')
    expect(dataErrors.some(e => e.message.includes('invalid status'))).toBe(true)
  })

  it('should detect sellable with no primary flavours', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', [])]
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const dataErrors = report.errors.filter(e => e.category === 'data-integrity')
    expect(dataErrors.some(e => e.message.includes('no primary flavours'))).toBe(true)
  })

  it('should detect invalid createdAt timestamp', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].createdAt = 'invalid-date'
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const dataErrors = report.errors.filter(e => e.category === 'data-integrity')
    expect(dataErrors.some(e => e.message.includes('invalid createdAt timestamp'))).toBe(true)
  })

  it('should detect invalid updatedAt timestamp', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].updatedAt = 'not-a-date'
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const dataErrors = report.errors.filter(e => e.category === 'data-integrity')
    expect(dataErrors.some(e => e.message.includes('invalid updatedAt timestamp'))).toBe(true)
  })

  it('should detect negative price', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].price = -100
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    
    const dataErrors = report.errors.filter(e => e.category === 'data-integrity')
    expect(dataErrors.some(e => e.message.includes('negative price'))).toBe(true)
  })

  it('should pass with valid data integrity', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].status = 'active'
    sellables[0].price = 500
    sellables[0].createdAt = '2024-01-01T00:00:00Z'
    sellables[0].updatedAt = '2024-01-01T00:00:00Z'
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(true)
    
    const dataErrors = report.errors.filter(e => e.category === 'data-integrity')
    expect(dataErrors).toHaveLength(0)
  })
})

describe('validateMigration - Edge cases', () => {
  it('should handle empty arrays for all inputs', () => {
    const report = validateMigration([], [], [], [], [], [], [])
    
    expect(report.valid).toBe(true)
    expect(report.errors).toHaveLength(0)
    expect(report.warnings).toHaveLength(0)
    expect(report.summary.totalOfferings).toBe(0)
    expect(report.summary.totalSellables).toBe(0)
  })

  it('should handle sellables with all optional fields populated', () => {
    const offerings = [createOffering('off-1', 'fmt-1', ['flav-1'])]
    
    const sellables = [createSellable('sell-1', 'fmt-1', ['flav-1'])]
    sellables[0].secondaryFlavourIds = ['flav-2']
    sellables[0].componentIds = ['flav-3']
    sellables[0].toppingIds = ['mod-1']
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla'),
      createFlavour('flav-2', 'Chocolate'),
      createFlavour('flav-3', 'Cookie')
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers = [createModifier('mod-1', 'Sprinkles')]
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(true)
  })

  it('should handle multiple sellables referencing the same flavour', () => {
    const offerings = [
      createOffering('off-1', 'fmt-1', ['flav-1']),
      createOffering('off-2', 'fmt-1', ['flav-1'])
    ]
    
    const sellables = [
      createSellable('sell-1', 'fmt-1', ['flav-1']),
      createSellable('sell-2', 'fmt-1', ['flav-1'])
    ]
    
    const flavours = [createFlavour('flav-1', 'Vanilla')]
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      },
      {
        legacyOfferingId: 'off-2',
        newSellableId: 'sell-2',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(true)
  })

  it('should accumulate errors from all validation checks', () => {
    const offerings = [
      createOffering('off-1', 'fmt-1', ['flav-1']),
      createOffering('off-2', 'fmt-1', ['flav-2'])
    ]
    
    const sellables = [createSellable('sell-1', 'fmt-999', ['flav-999'])]
    sellables[0].status = 'invalid' as any
    sellables[0].price = -100
    
    const flavours = [
      createFlavour('flav-1', 'Vanilla', {
        shopifyProductId: 'shopify-123'
      })
    ]
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = [
      {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: '2024-01-01T00:00:00Z',
        changes: [],
        warnings: []
      }
    ]
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    
    expect(report.valid).toBe(false)
    expect(report.errors.length).toBeGreaterThan(3)
    
    // Should have errors from multiple categories
    const categories = new Set(report.errors.map(e => e.category))
    expect(categories.size).toBeGreaterThan(1)
  })

  it('should handle large datasets efficiently', () => {
    const offerings = Array.from({ length: 100 }, (_, i) => 
      createOffering(`off-${i}`, 'fmt-1', [`flav-${i}`])
    )
    
    const sellables = Array.from({ length: 100 }, (_, i) => 
      createSellable(`sell-${i}`, 'fmt-1', [`flav-${i}`])
    )
    
    const flavours = Array.from({ length: 100 }, (_, i) => 
      createFlavour(`flav-${i}`, `Flavour ${i}`)
    )
    
    const formats = [createFormat('fmt-1', 'Cup')]
    const modifiers: Modifier[] = []
    
    const offeringMap: OfferingMigrationMap[] = Array.from({ length: 100 }, (_, i) => ({
      legacyOfferingId: `off-${i}`,
      newSellableId: `sell-${i}`,
      migrationDate: '2024-01-01T00:00:00Z',
      changes: [],
      warnings: []
    }))
    
    const shopifyMap: FlavourShopifyMigration[] = []
    
    const startTime = Date.now()
    const report = validateMigration(
      offerings,
      sellables,
      flavours,
      formats,
      modifiers,
      offeringMap,
      shopifyMap
    )
    const endTime = Date.now()
    
    expect(report.valid).toBe(true)
    expect(report.summary.totalOfferings).toBe(100)
    expect(report.summary.totalSellables).toBe(100)
    
    // Should complete in reasonable time (less than 1 second)
    expect(endTime - startTime).toBeLessThan(1000)
  })
})
