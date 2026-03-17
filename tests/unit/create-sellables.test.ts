/**
 * Unit tests for create-sellables migration utility
 */

import { describe, it, expect } from 'vitest'
import { createSellablesFromOfferings } from '@/lib/migration/create-sellables'

describe('createSellablesFromOfferings', () => {
  it('should return empty arrays for empty offerings', () => {
    const modifierMap = new Map<string, string>()
    const result = createSellablesFromOfferings([], modifierMap)
    
    expect(result.sellables).toEqual([])
    expect(result.migrationMap).toEqual([])
  })
  
  it('should skip offerings without id', () => {
    const offerings = [
      { formatId: 'format-1', internalName: 'Test' } as any,
      { id: 'off-2', formatId: 'format-2', internalName: 'Valid' } as any
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings, modifierMap)
    
    expect(result.sellables).toHaveLength(1)
    expect(result.sellables[0].internalName).toBe('Valid')
  })
  
  it('should skip offerings without formatId', () => {
    const offerings = [
      { id: 'off-1', internalName: 'Test' } as any,
      { id: 'off-2', formatId: 'format-2', internalName: 'Valid' } as any
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings, modifierMap)
    
    expect(result.sellables).toHaveLength(1)
    expect(result.sellables[0].internalName).toBe('Valid')
  })
  
  it('should convert a simple offering to sellable', () => {
    const offerings = [
      {
        id: 'off-1',
        internalName: 'Vanilla Cup',
        publicName: 'Classic Vanilla Cup',
        slug: 'vanilla-cup',
        status: 'active',
        formatId: 'format-cup',
        primaryFlavourIds: ['flavour-vanilla'],
        description: 'Classic vanilla ice cream',
        shortCardCopy: 'Smooth vanilla',
        price: 500,
        tags: ['classic'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables).toHaveLength(1)
    expect(result.migrationMap).toHaveLength(1)
    
    const sellable = result.sellables[0]
    expect(sellable.internalName).toBe('Vanilla Cup')
    expect(sellable.publicName).toBe('Classic Vanilla Cup')
    expect(sellable.slug).toBe('vanilla-cup')
    expect(sellable.status).toBe('active')
    expect(sellable.formatId).toBe('format-cup')
    expect(sellable.primaryFlavourIds).toEqual(['flavour-vanilla'])
    expect(sellable.description).toBe('Classic vanilla ice cream')
    expect(sellable.shortCardCopy).toBe('Smooth vanilla')
    expect(sellable.price).toBe(500)
    expect(sellable.tags).toEqual(['classic'])
    expect(sellable.inventoryTracked).toBe(false)
    expect(sellable.onlineOrderable).toBe(true)
    expect(sellable.pickupOnly).toBe(false)
  })

  it('should map offering status to sellable status', () => {
    const offerings = [
      { id: 'off-1', formatId: 'fmt-1', status: 'draft', internalName: 'Test 1', price: 100, inventoryTracked: false, onlineOrderable: true, pickupOnly: false, description: '', shortCardCopy: '', tags: [], createdAt: '', updatedAt: '' },
      { id: 'off-2', formatId: 'fmt-1', status: 'scheduled', internalName: 'Test 2', price: 100, inventoryTracked: false, onlineOrderable: true, pickupOnly: false, description: '', shortCardCopy: '', tags: [], createdAt: '', updatedAt: '' },
      { id: 'off-3', formatId: 'fmt-1', status: 'active', internalName: 'Test 3', price: 100, inventoryTracked: false, onlineOrderable: true, pickupOnly: false, description: '', shortCardCopy: '', tags: [], createdAt: '', updatedAt: '' },
      { id: 'off-4', formatId: 'fmt-1', status: 'sold-out', internalName: 'Test 4', price: 100, inventoryTracked: false, onlineOrderable: true, pickupOnly: false, description: '', shortCardCopy: '', tags: [], createdAt: '', updatedAt: '' },
      { id: 'off-5', formatId: 'fmt-1', status: 'archived', internalName: 'Test 5', price: 100, inventoryTracked: false, onlineOrderable: true, pickupOnly: false, description: '', shortCardCopy: '', tags: [], createdAt: '', updatedAt: '' }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables).toHaveLength(5)
    expect(result.sellables[0].status).toBe('draft')
    expect(result.sellables[1].status).toBe('draft') // scheduled -> draft
    expect(result.sellables[2].status).toBe('active')
    expect(result.sellables[3].status).toBe('out-of-stock') // sold-out -> out-of-stock
    expect(result.sellables[4].status).toBe('archived')
  })

  it('should link toppings to modifiers using modifierMap', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Vanilla with Sprinkles',
        primaryFlavourIds: ['flavour-vanilla'],
        toppings: [
          { name: 'Sprinkles', price: 50 },
          { name: 'Hot Fudge', price: 100 }
        ],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>([
      ['Sprinkles', 'mod-123'],
      ['Hot Fudge', 'mod-456']
    ])
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables).toHaveLength(1)
    expect(result.sellables[0].toppingIds).toEqual(['mod-123', 'mod-456'])
    expect(result.migrationMap[0].changes).toContain('Linked 2 topping(s) to modifiers')
  })

  it('should handle toppings not found in modifierMap', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Test',
        toppings: [
          { name: 'Sprinkles', price: 50 },
          { name: 'Unknown Topping', price: 100 }
        ],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>([
      ['Sprinkles', 'mod-123']
    ])
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables[0].toppingIds).toEqual(['mod-123'])
    expect(result.migrationMap[0].warnings).toContain('Topping "Unknown Topping" not found in modifier map')
  })

  it('should handle offerings without toppings', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Plain Vanilla',
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables[0].toppingIds).toBeUndefined()
  })
  
  it('should handle offerings with empty toppings array', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Plain Vanilla',
        toppings: [],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables[0].toppingIds).toBeUndefined()
  })

  it('should convert location string to array', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Test',
        location: 'Downtown Store',
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables[0].location).toEqual(['Downtown Store'])
    expect(result.migrationMap[0].changes).toContain('Location converted from string to array')
  })
  
  it('should preserve all optional fields', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Test',
        secondaryFlavourIds: ['flavour-2'],
        componentIds: ['component-1'],
        compareAtPrice: 600,
        availabilityStart: '2024-01-01T00:00:00Z',
        availabilityEnd: '2024-12-31T23:59:59Z',
        image: '/images/test.jpg',
        shopifyProductId: 'gid://shopify/Product/123',
        shopifySKU: 'SKU-123',
        posMapping: 'POS-123',
        inventoryQuantity: 50,
        batchCode: 'BATCH-001',
        restockDate: '2024-06-01',
        shelfLifeNotes: '30 days',
        price: 500,
        inventoryTracked: true,
        onlineOrderable: true,
        pickupOnly: true,
        description: 'Test description',
        shortCardCopy: 'Test copy',
        tags: ['test'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    const sellable = result.sellables[0]
    expect(sellable.secondaryFlavourIds).toEqual(['flavour-2'])
    expect(sellable.componentIds).toEqual(['component-1'])
    expect(sellable.compareAtPrice).toBe(600)
    expect(sellable.availabilityStart).toBe('2024-01-01T00:00:00Z')
    expect(sellable.availabilityEnd).toBe('2024-12-31T23:59:59Z')
    expect(sellable.image).toBe('/images/test.jpg')
    expect(sellable.shopifyProductId).toBe('gid://shopify/Product/123')
    expect(sellable.shopifySKU).toBe('SKU-123')
    expect(sellable.posMapping).toBe('POS-123')
    expect(sellable.inventoryQuantity).toBe(50)
    expect(sellable.batchCode).toBe('BATCH-001')
    expect(sellable.restockDate).toBe('2024-06-01')
    expect(sellable.shelfLifeNotes).toBe('30 days')
  })

  it('should set syncStatus to synced if shopifyProductId exists', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Test',
        shopifyProductId: 'gid://shopify/Product/123',
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables[0].syncStatus).toBe('synced')
  })
  
  it('should not set syncStatus if shopifyProductId is missing', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Test',
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables[0].syncStatus).toBeUndefined()
  })

  it('should default missing fields appropriately', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        // Missing many optional fields
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    const sellable = result.sellables[0]
    expect(sellable.primaryFlavourIds).toEqual([])
    expect(sellable.tags).toEqual([])
    expect(sellable.inventoryTracked).toBe(false)
    expect(sellable.onlineOrderable).toBe(true)
    expect(sellable.pickupOnly).toBe(false)
  })
  
  it('should generate fallback names if missing', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        // Missing internalName and publicName
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables[0].internalName).toBe('Offering off-1')
    expect(result.sellables[0].publicName).toBe('Offering off-1')
  })
  
  it('should generate fallback slug if missing', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Test',
        // Missing slug
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.sellables[0].slug).toBe('offering-off-1')
  })

  it('should create migration map entries for each offering', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Test 1',
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 'off-2',
        formatId: 'format-cone',
        internalName: 'Test 2',
        price: 600,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.migrationMap).toHaveLength(2)
    expect(result.migrationMap[0].legacyOfferingId).toBe('off-1')
    expect(result.migrationMap[0].newSellableId).toBe(result.sellables[0].id)
    expect(result.migrationMap[1].legacyOfferingId).toBe('off-2')
    expect(result.migrationMap[1].newSellableId).toBe(result.sellables[1].id)
  })
  
  it('should track changes in migration map', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Test',
        status: 'scheduled', // Will be mapped to draft
        location: 'Store A', // Will be converted to array
        toppings: [{ name: 'Sprinkles', price: 50 }],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map([['Sprinkles', 'mod-123']])
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    expect(result.migrationMap[0].changes).toContain('Linked 1 topping(s) to modifiers')
    expect(result.migrationMap[0].changes).toContain('Status mapped from "scheduled" to "draft"')
    expect(result.migrationMap[0].changes).toContain('Location converted from string to array')
  })

  it('should generate unique IDs for each sellable', () => {
    const offerings = [
      {
        id: 'off-1',
        formatId: 'format-cup',
        internalName: 'Test 1',
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 'off-2',
        formatId: 'format-cone',
        internalName: 'Test 2',
        price: 600,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      },
      {
        id: 'off-3',
        formatId: 'format-pint',
        internalName: 'Test 3',
        price: 700,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        description: '',
        shortCardCopy: '',
        tags: [],
        createdAt: '',
        updatedAt: ''
      }
    ]
    const modifierMap = new Map<string, string>()
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    const ids = result.sellables.map(s => s.id)
    const uniqueIds = new Set(ids)
    
    expect(uniqueIds.size).toBe(3) // All IDs should be unique
    
    // All IDs should start with 'sell-'
    ids.forEach(id => {
      expect(id).toMatch(/^sell-/)
    })
  })

  it('should handle complex real-world scenario', () => {
    const offerings = [
      {
        id: 'off-1',
        internalName: 'Vanilla Cup Small',
        publicName: 'Classic Vanilla Cup',
        slug: 'vanilla-cup-small',
        status: 'active',
        formatId: 'format-cup',
        primaryFlavourIds: ['flavour-vanilla'],
        description: 'Classic vanilla ice cream',
        shortCardCopy: 'Smooth vanilla',
        price: 500,
        tags: ['classic', 'popular'],
        toppings: [
          { name: 'Sprinkles', price: 50 },
          { name: 'Hot Fudge', price: 100 }
        ],
        shopifyProductId: 'gid://shopify/Product/123',
        shopifySKU: 'VAN-CUP-SM',
        inventoryTracked: true,
        inventoryQuantity: 100,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'off-2',
        internalName: 'Chocolate Strawberry Twist',
        publicName: 'Choco-Berry Twist',
        slug: 'choco-berry-twist',
        status: 'active',
        formatId: 'format-twist',
        primaryFlavourIds: ['flavour-chocolate'],
        secondaryFlavourIds: ['flavour-strawberry'],
        description: 'Chocolate and strawberry soft serve twist',
        shortCardCopy: 'Classic twist',
        price: 600,
        tags: ['twist', 'popular'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'off-3',
        internalName: 'Cookie Sandwich',
        publicName: 'Ice Cream Sandwich',
        slug: 'ice-cream-sandwich',
        status: 'sold-out',
        formatId: 'format-sandwich',
        primaryFlavourIds: ['flavour-vanilla'],
        componentIds: ['cookie-chocolate', 'cookie-chocolate'],
        description: 'Vanilla ice cream between chocolate cookies',
        shortCardCopy: 'Classic sandwich',
        price: 700,
        location: 'Downtown Store',
        tags: ['sandwich', 'handheld'],
        inventoryTracked: true,
        inventoryQuantity: 0,
        onlineOrderable: false,
        pickupOnly: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z'
      }
    ]
    
    const modifierMap = new Map([
      ['Sprinkles', 'mod-sprinkles-123'],
      ['Hot Fudge', 'mod-hotfudge-456']
    ])
    
    const result = createSellablesFromOfferings(offerings as any, modifierMap)
    
    // Should create 3 sellables
    expect(result.sellables).toHaveLength(3)
    expect(result.migrationMap).toHaveLength(3)
    
    // Check first sellable (vanilla cup with toppings)
    const vanilla = result.sellables[0]
    expect(vanilla.internalName).toBe('Vanilla Cup Small')
    expect(vanilla.status).toBe('active')
    expect(vanilla.toppingIds).toEqual(['mod-sprinkles-123', 'mod-hotfudge-456'])
    expect(vanilla.syncStatus).toBe('synced')
    expect(vanilla.inventoryTracked).toBe(true)
    
    // Check second sellable (twist)
    const twist = result.sellables[1]
    expect(twist.primaryFlavourIds).toEqual(['flavour-chocolate'])
    expect(twist.secondaryFlavourIds).toEqual(['flavour-strawberry'])
    expect(twist.toppingIds).toBeUndefined()
    
    // Check third sellable (sandwich with location conversion)
    const sandwich = result.sellables[2]
    expect(sandwich.status).toBe('out-of-stock') // sold-out -> out-of-stock
    expect(sandwich.componentIds).toEqual(['cookie-chocolate', 'cookie-chocolate'])
    expect(sandwich.location).toEqual(['Downtown Store'])
    expect(sandwich.pickupOnly).toBe(true)
    
    // Check migration map
    expect(result.migrationMap[0].legacyOfferingId).toBe('off-1')
    expect(result.migrationMap[0].changes).toContain('Linked 2 topping(s) to modifiers')
    expect(result.migrationMap[2].changes).toContain('Status mapped from "sold-out" to "out-of-stock"')
    expect(result.migrationMap[2].changes).toContain('Location converted from string to array')
  })
})
