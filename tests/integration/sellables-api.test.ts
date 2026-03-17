/**
 * Integration Tests: Sellables API Endpoints
 * 
 * Task 8.6: Write integration tests for sellable endpoints
 * Requirements: 11.4, 11.6
 * 
 * This test suite verifies the full API flow including database operations
 * for /api/sellables, /api/sellables/[id], and /api/sellables/[id]/sync endpoints.
 * Tests filtering, validation, composition validation, referential integrity, and Shopify sync.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET as getSellables, POST as createSellable } from '../../app/api/sellables/route'
import { GET as getSellable, PUT as updateSellable, DELETE as deleteSellable } from '../../app/api/sellables/[id]/route'
import { POST as syncSellable } from '../../app/api/sellables/[id]/sync/route'
import { NextRequest } from 'next/server'
import { 
  getSellables as dbGetSellables, 
  saveSellables as dbSaveSellables,
  getLaunches,
  getFormats,
  getFlavours,
  getModifiers
} from '../../lib/db'
import type { Sellable, Launch, Format, Flavour, Modifier } from '../../types/index.js'

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  auth: vi.fn()
}))

// Mock the db module
vi.mock('../../lib/db.js', () => ({
  getSellables: vi.fn(),
  saveSellables: vi.fn(),
  getLaunches: vi.fn(),
  getFormats: vi.fn(),
  getFlavours: vi.fn(),
  getModifiers: vi.fn()
}))

import { auth } from '../../lib/auth.js'

describe('Integration Tests: Sellables API', () => {
  let testSellables: Sellable[]
  let testLaunches: Launch[]
  let testFormats: Format[]
  let testFlavours: Flavour[]
  let testModifiers: Modifier[]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup test formats
    testFormats = [
      {
        id: 'format-pint',
        name: 'Pint',
        slug: 'pint',
        category: 'take-home',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 2,
        allowMixedTypes: true,
        canIncludeAddOns: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'format-cup',
        name: 'Cup',
        slug: 'cup',
        category: 'scoop',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 3,
        allowMixedTypes: true,
        canIncludeAddOns: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'format-sandwich',
        name: 'Ice Cream Sandwich',
        slug: 'sandwich',
        category: 'sandwich',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]
    
    // Setup test flavours
    testFlavours = [
      {
        id: 'flav-1',
        name: 'Vanilla Bean',
        slug: 'vanilla-bean',
        type: 'gelato',
        ingredients: [],
        keyNotes: ['vanilla', 'cream'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian'],
        status: 'active',
        featured: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'flav-2',
        name: 'Dark Chocolate',
        slug: 'dark-chocolate',
        type: 'gelato',
        ingredients: [],
        keyNotes: ['chocolate', 'cocoa'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian'],
        status: 'active',
        featured: false,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      },
      {
        id: 'flav-3',
        name: 'Strawberry',
        slug: 'strawberry',
        type: 'sorbet',
        ingredients: [],
        keyNotes: ['strawberry', 'fruit'],
        allergens: [],
        dietaryTags: ['vegan', 'gluten-free'],
        status: 'active',
        featured: false,
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z'
      }
    ]
    
    // Setup test modifiers
    testModifiers = [
      {
        id: 'mod-1',
        name: 'Chocolate Chips',
        slug: 'chocolate-chips',
        type: 'topping',
        description: 'Premium dark chocolate chips',
        price: 150,
        allergens: ['dairy', 'soy'],
        dietaryFlags: [],
        availableForFormatIds: ['format-pint', 'format-cup'],
        status: 'active',
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'mod-2',
        name: 'Caramel Swirl',
        slug: 'caramel-swirl',
        type: 'drizzle',
        description: 'House-made salted caramel',
        price: 200,
        allergens: ['dairy'],
        dietaryFlags: ['gluten-free'],
        availableForFormatIds: ['format-pint'],
        status: 'active',
        sortOrder: 2,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      }
    ]
    
    // Setup test sellables
    testSellables = [
      {
        id: 'sell-1',
        internalName: 'Vanilla Pint',
        publicName: 'Vanilla Bean Pint',
        slug: 'vanilla-pint',
        status: 'active',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 1200,
        toppingIds: ['mod-1'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'sell-2',
        internalName: 'Chocolate Cup',
        publicName: 'Dark Chocolate Cup',
        slug: 'chocolate-cup',
        status: 'active',
        formatId: 'format-cup',
        primaryFlavourIds: ['flav-2'],
        inventoryTracked: true,
        onlineOrderable: true,
        pickupOnly: false,
        price: 600,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      },
      {
        id: 'sell-3',
        internalName: 'Mixed Pint',
        publicName: 'Vanilla & Chocolate Pint',
        slug: 'mixed-pint',
        status: 'active',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1', 'flav-2'],
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: true,
        price: 1200,
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z'
      },
      {
        id: 'sell-4',
        internalName: 'Archived Sandwich',
        publicName: 'Vanilla Sandwich',
        slug: 'vanilla-sandwich',
        status: 'archived',
        formatId: 'format-sandwich',
        primaryFlavourIds: ['flav-1'],
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        price: 800,
        createdAt: '2024-01-04T00:00:00.000Z',
        updatedAt: '2024-01-04T00:00:00.000Z'
      }
    ]
    
    // Setup test launches
    testLaunches = [
      {
        id: 'launch-1',
        name: 'Summer Launch 2024',
        slug: 'summer-2024',
        status: 'active',
        launchDate: '2024-06-01T00:00:00.000Z',
        featuredSellableIds: ['sell-1'], // References sell-1
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    vi.mocked(dbGetSellables).mockResolvedValue(testSellables)
    vi.mocked(dbSaveSellables).mockImplementation(async (sellables) => sellables)
    vi.mocked(getLaunches).mockResolvedValue(testLaunches)
    vi.mocked(getFormats).mockResolvedValue(testFormats)
    vi.mocked(getFlavours).mockResolvedValue(testFlavours)
    vi.mocked(getModifiers).mockResolvedValue(testModifiers)
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/sellables - Filtering', () => {
    it('should retrieve all sellables without filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables')
      
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(4)
      expect(data[0].id).toBe('sell-1')
      expect(data[1].id).toBe('sell-2')
      expect(data[2].id).toBe('sell-3')
      expect(data[3].id).toBe('sell-4')
    })

    it('should filter sellables by status=active', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables?status=active')
      
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(3)
      expect(data.every((s: Sellable) => s.status === 'active')).toBe(true)
    })

    it('should filter sellables by status=archived', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables?status=archived')
      
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('sell-4')
      expect(data[0].status).toBe('archived')
    })

    it('should filter sellables by formatId', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables?formatId=format-pint')
      
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data.every((s: Sellable) => s.formatId === 'format-pint')).toBe(true)
    })

    it('should filter sellables by onlineOrderable=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables?onlineOrderable=true')
      
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data.every((s: Sellable) => s.onlineOrderable === true)).toBe(true)
    })

    it('should filter sellables by onlineOrderable=false', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables?onlineOrderable=false')
      
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data.every((s: Sellable) => s.onlineOrderable === false)).toBe(true)
    })

    it('should combine multiple filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables?status=active&formatId=format-pint&onlineOrderable=true')
      
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('sell-1')
    })

    it('should return empty array when no sellables match filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables?status=discontinued')
      
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(0)
    })
  })


  describe('POST /api/sellables - Create Sellable with Valid Composition', () => {
    it('should create a sellable with valid single flavour composition', async () => {
      const newSellable = {
        internalName: 'Strawberry Pint',
        publicName: 'Fresh Strawberry Pint',
        slug: 'strawberry-pint',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-3'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.id).toBeDefined()
      expect(data.internalName).toBe('Strawberry Pint')
      expect(data.publicName).toBe('Fresh Strawberry Pint')
      expect(data.slug).toBe('strawberry-pint')
      expect(data.formatId).toBe('format-pint')
      expect(data.primaryFlavourIds).toEqual(['flav-3'])
      expect(data.price).toBe(1200)
      expect(data.status).toBe('draft')
      expect(data.createdAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
      
      expect(dbSaveSellables).toHaveBeenCalled()
      const savedData = vi.mocked(dbSaveSellables).mock.calls[0][0]
      expect(savedData).toHaveLength(5) // 4 existing + 1 new
    })

    it('should create a sellable with two flavours (within max)', async () => {
      const newSellable = {
        internalName: 'Duo Pint',
        publicName: 'Vanilla & Strawberry Pint',
        slug: 'duo-pint',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1', 'flav-3'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.primaryFlavourIds).toHaveLength(2)
    })

    it('should create a sellable with toppings', async () => {
      const newSellable = {
        internalName: 'Loaded Pint',
        publicName: 'Vanilla with Toppings',
        slug: 'loaded-pint',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        toppingIds: ['mod-1', 'mod-2'],
        price: 1500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.toppingIds).toEqual(['mod-1', 'mod-2'])
    })

    it('should create a sellable with all optional fields', async () => {
      const newSellable = {
        internalName: 'Premium Pint',
        publicName: 'Premium Vanilla Pint',
        slug: 'premium-pint',
        status: 'active',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        description: 'Our finest vanilla',
        shortCardCopy: 'Premium vanilla',
        image: '/images/premium.jpg',
        price: 1500,
        compareAtPrice: 1800,
        availabilityStart: '2024-06-01T00:00:00.000Z',
        availabilityEnd: '2024-08-31T23:59:59.000Z',
        location: 'shop-only',
        tags: ['premium', 'seasonal'],
        inventoryTracked: true,
        inventoryQuantity: 50,
        batchCode: 'BATCH-001',
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.description).toBe('Our finest vanilla')
      expect(data.compareAtPrice).toBe(1800)
      expect(data.tags).toEqual(['premium', 'seasonal'])
      expect(data.inventoryQuantity).toBe(50)
    })
  })


  describe('POST /api/sellables - Create Sellable with Invalid Composition', () => {
    it('should reject creation when format does not exist', async () => {
      const newSellable = {
        internalName: 'Invalid Format',
        publicName: 'Invalid Format Sellable',
        slug: 'invalid-format',
        formatId: 'nonexistent-format',
        primaryFlavourIds: ['flav-1'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FORMAT')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject creation when too few flavours', async () => {
      const newSellable = {
        internalName: 'No Flavours',
        publicName: 'Empty Sellable',
        slug: 'no-flavours',
        formatId: 'format-pint',
        primaryFlavourIds: [],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('COMPOSITION_VALIDATION_FAILED')
      expect(data.details.errors).toBeDefined()
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject creation when too many flavours', async () => {
      const newSellable = {
        internalName: 'Too Many Flavours',
        publicName: 'Overloaded Pint',
        slug: 'too-many',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1', 'flav-2', 'flav-3'], // Max is 2 for pint
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('COMPOSITION_VALIDATION_FAILED')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject creation when flavour does not exist', async () => {
      const newSellable = {
        internalName: 'Invalid Flavour',
        publicName: 'Nonexistent Flavour',
        slug: 'invalid-flavour',
        formatId: 'format-pint',
        primaryFlavourIds: ['nonexistent-flavour'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('COMPOSITION_VALIDATION_FAILED')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should allow creation with toppings even if not validated', async () => {
      // Note: Current API implementation does not validate modifier availability
      // This test documents the actual behavior
      const newSellable = {
        internalName: 'Sandwich with Topping',
        publicName: 'Sandwich with Topping',
        slug: 'sandwich-topping',
        formatId: 'format-sandwich',
        primaryFlavourIds: ['flav-1'],
        toppingIds: ['mod-1'], // mod-1 not available for sandwich, but not validated
        price: 800,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      // API currently allows this (modifier validation not implemented)
      expect(response.status).toBe(201)
      expect(data.toppingIds).toEqual(['mod-1'])
      expect(dbSaveSellables).toHaveBeenCalled()
    })

    it('should reject creation when required fields are missing', async () => {
      const newSellable = {
        publicName: 'Missing Fields',
        slug: 'missing-fields',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1']
        // Missing: internalName, price, inventoryTracked, onlineOrderable, pickupOnly
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toMatch(/MISSING_REQUIRED_FIELD|INVALID_FIELD_VALUE/)
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject creation when slug already exists', async () => {
      const newSellable = {
        internalName: 'Duplicate Slug',
        publicName: 'Duplicate Slug Sellable',
        slug: 'vanilla-pint', // Already exists
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('A sellable with this slug already exists')
      expect(data.code).toBe('DUPLICATE_SLUG')
      expect(data.details.existingId).toBe('sell-1')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject creation when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      
      const newSellable = {
        internalName: 'Unauthorized',
        publicName: 'Unauthorized Sellable',
        slug: 'unauthorized',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })
  })


  describe('GET /api/sellables/[id] - Get Single Sellable', () => {
    it('should retrieve a sellable by id', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1')
      
      const response = await getSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('sell-1')
      expect(data.internalName).toBe('Vanilla Pint')
      expect(data.publicName).toBe('Vanilla Bean Pint')
      expect(data.slug).toBe('vanilla-pint')
    })

    it('should return 404 when sellable does not exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/nonexistent')
      
      const response = await getSellable(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Sellable not found')
      expect(data.code).toBe('NOT_FOUND')
    })

    it('should expand format when requested', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1?expand=format')
      
      const response = await getSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.format).toBeDefined()
      expect(data.format.id).toBe('format-pint')
      expect(data.format.name).toBe('Pint')
    })

    it('should expand flavours when requested', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1?expand=flavours')
      
      const response = await getSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.primaryFlavours).toBeDefined()
      expect(data.primaryFlavours).toHaveLength(1)
      expect(data.primaryFlavours[0].id).toBe('flav-1')
      expect(data.primaryFlavours[0].name).toBe('Vanilla Bean')
    })

    it('should expand modifiers when requested', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1?expand=modifiers')
      
      const response = await getSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.toppings).toBeDefined()
      expect(data.toppings).toHaveLength(1)
      expect(data.toppings[0].id).toBe('mod-1')
      expect(data.toppings[0].name).toBe('Chocolate Chips')
    })

    it('should expand all relationships when expand=all', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1?expand=all')
      
      const response = await getSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.format).toBeDefined()
      expect(data.primaryFlavours).toBeDefined()
      expect(data.toppings).toBeDefined()
    })

    it('should expand multiple specific relationships', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1?expand=format,flavours')
      
      const response = await getSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.format).toBeDefined()
      expect(data.primaryFlavours).toBeDefined()
      expect(data.toppings).toBeUndefined() // Not requested
    })
  })


  describe('PUT /api/sellables/[id] - Update Sellable', () => {
    it('should update a sellable with valid data', async () => {
      const updates = {
        publicName: 'Updated Vanilla Pint',
        description: 'New description',
        price: 1300
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('sell-1')
      expect(data.publicName).toBe('Updated Vanilla Pint')
      expect(data.description).toBe('New description')
      expect(data.price).toBe(1300)
      expect(data.internalName).toBe('Vanilla Pint') // Unchanged
      expect(data.updatedAt).toBeDefined()
      
      expect(dbSaveSellables).toHaveBeenCalled()
    })

    it('should update only specified fields', async () => {
      const updates = {
        status: 'discontinued'
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-2', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-2' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('sell-2')
      expect(data.status).toBe('discontinued')
      expect(data.publicName).toBe('Dark Chocolate Cup') // Unchanged
      expect(data.price).toBe(600) // Unchanged
    })

    it('should update composition and validate', async () => {
      const updates = {
        primaryFlavourIds: ['flav-2', 'flav-3']
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.primaryFlavourIds).toEqual(['flav-2', 'flav-3'])
    })

    it('should reject update when composition becomes invalid', async () => {
      const updates = {
        primaryFlavourIds: ['flav-1', 'flav-2', 'flav-3'] // Too many for pint
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('COMPOSITION_VALIDATION_FAILED')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject update when slug conflicts with another sellable', async () => {
      const updates = {
        slug: 'chocolate-cup' // Already used by sell-2
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('A sellable with this slug already exists')
      expect(data.code).toBe('DUPLICATE_SLUG')
      expect(data.details.existingId).toBe('sell-2')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject update when format does not exist', async () => {
      const updates = {
        formatId: 'nonexistent-format'
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FORMAT')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject update when price is negative', async () => {
      const updates = {
        price: -100
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should return 404 when updating non-existent sellable', async () => {
      const updates = {
        publicName: 'Updated Name'
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/nonexistent', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Sellable not found')
      expect(data.code).toBe('NOT_FOUND')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject update when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      
      const updates = {
        publicName: 'Unauthorized Update'
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should not allow ID to be changed', async () => {
      const updates = {
        id: 'new-id',
        publicName: 'Updated Name'
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('sell-1') // ID should remain unchanged
      expect(data.publicName).toBe('Updated Name')
    })
  })


  describe('DELETE /api/sellables/[id] - Delete Sellable', () => {
    it('should delete a sellable when no references exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-4', {
        method: 'DELETE'
      })
      
      const response = await deleteSellable(request, { params: { id: 'sell-4' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Sellable deleted successfully')
      
      expect(dbSaveSellables).toHaveBeenCalled()
      const savedData = vi.mocked(dbSaveSellables).mock.calls[0][0]
      expect(savedData).toHaveLength(3) // 4 - 1 deleted
      expect(savedData.find((s: Sellable) => s.id === 'sell-4')).toBeUndefined()
    })

    it('should prevent deletion when sellable is referenced by launches', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'DELETE'
      })
      
      const response = await deleteSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot delete sellable: it is referenced by launches')
      expect(data.code).toBe('REFERENTIAL_INTEGRITY_VIOLATION')
      expect(data.details.referencingLaunchIds).toEqual(['launch-1'])
      expect(data.details.count).toBe(1)
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should return 404 when deleting non-existent sellable', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/nonexistent', {
        method: 'DELETE'
      })
      
      const response = await deleteSellable(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Sellable not found')
      expect(data.code).toBe('NOT_FOUND')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject deletion when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-4', {
        method: 'DELETE'
      })
      
      const response = await deleteSellable(request, { params: { id: 'sell-4' } })
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })
  })


  describe('POST /api/sellables/[id]/sync - Sync to Shopify', () => {
    it('should successfully sync sellable to Shopify', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1/sync', {
        method: 'POST'
      })
      
      const response = await syncSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('sell-1')
      expect(data.syncStatus).toBe('synced')
      expect(data.lastSyncedAt).toBeDefined()
      expect(data.syncError).toBeUndefined()
      
      expect(dbSaveSellables).toHaveBeenCalled()
      const savedData = vi.mocked(dbSaveSellables).mock.calls[0][0]
      const syncedSellable = savedData.find((s: Sellable) => s.id === 'sell-1')
      expect(syncedSellable?.syncStatus).toBe('synced')
    })

    it('should return 404 when syncing non-existent sellable', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/nonexistent/sync', {
        method: 'POST'
      })
      
      const response = await syncSellable(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Sellable not found')
      expect(data.code).toBe('NOT_FOUND')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should reject sync when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1/sync', {
        method: 'POST'
      })
      
      const response = await syncSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveSellables).not.toHaveBeenCalled()
    })

    it('should clear previous sync errors on successful sync', async () => {
      // Setup sellable with previous error
      const sellableWithError: Sellable = {
        ...testSellables[0],
        syncStatus: 'error',
        syncError: 'Previous error'
      }
      vi.mocked(dbGetSellables).mockResolvedValue([sellableWithError, ...testSellables.slice(1)])
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1/sync', {
        method: 'POST'
      })
      
      const response = await syncSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.syncStatus).toBe('synced')
      expect(data.syncError).toBeUndefined()
    })

    it('should update lastSyncedAt timestamp on sync', async () => {
      const beforeSync = new Date().toISOString()
      
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1/sync', {
        method: 'POST'
      })
      
      const response = await syncSellable(request, { params: { id: 'sell-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.lastSyncedAt).toBeDefined()
      expect(new Date(data.lastSyncedAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeSync).getTime())
    })
  })


  describe('Database Integration', () => {
    it('should handle database read errors gracefully', async () => {
      vi.mocked(dbGetSellables).mockRejectedValue(new Error('Database connection failed'))
      
      const request = new NextRequest('http://localhost:3000/api/sellables')
      
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch sellables')
      expect(data.timestamp).toBeDefined()
    })

    it('should handle database write errors gracefully', async () => {
      vi.mocked(dbSaveSellables).mockRejectedValue(new Error('Write failed'))
      
      const newSellable = {
        internalName: 'Test Sellable',
        publicName: 'Test Sellable',
        slug: 'test-sellable',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create sellable')
      expect(data.timestamp).toBeDefined()
    })

    it('should persist data correctly across operations', async () => {
      let persistedData = [...testSellables]
      
      vi.mocked(dbSaveSellables).mockImplementation(async (sellables) => {
        persistedData = sellables
        return sellables
      })
      
      vi.mocked(dbGetSellables).mockImplementation(async () => persistedData)
      
      // Create a new sellable
      const createRequest = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify({
          internalName: 'New Sellable',
          publicName: 'New Sellable',
          slug: 'new-sellable',
          formatId: 'format-pint',
          primaryFlavourIds: ['flav-1'],
          price: 1200,
          inventoryTracked: false,
          onlineOrderable: true,
          pickupOnly: false
        })
      })
      
      const createResponse = await createSellable(createRequest)
      expect(createResponse.status).toBe(201)
      
      expect(persistedData).toHaveLength(5)
      
      // Retrieve all sellables
      const getRequest = new NextRequest('http://localhost:3000/api/sellables')
      const getResponse = await getSellables(getRequest)
      const sellables = await getResponse.json()
      
      expect(sellables).toHaveLength(5)
      expect(sellables.find((s: Sellable) => s.slug === 'new-sellable')).toBeDefined()
    })
  })


  describe('Edge Cases and Error Conditions', () => {
    it('should handle empty database gracefully', async () => {
      vi.mocked(dbGetSellables).mockResolvedValue([])
      
      const request = new NextRequest('http://localhost:3000/api/sellables')
      const response = await getSellables(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should handle malformed JSON in POST request', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: 'invalid json'
      })
      
      const response = await createSellable(request)
      
      expect(response.status).toBe(500)
    })

    it('should handle malformed JSON in PUT request', async () => {
      const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: 'invalid json'
      })
      
      const response = await updateSellable(request, { params: { id: 'sell-1' } })
      
      expect(response.status).toBe(500)
    })

    it('should handle very long name strings', async () => {
      const longName = 'A'.repeat(1000)
      
      const newSellable = {
        internalName: longName,
        publicName: longName,
        slug: 'long-name-sellable',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.internalName).toBe(longName)
    })

    it('should handle special characters in slug', async () => {
      const newSellable = {
        internalName: 'Special Sellable',
        publicName: 'Special Sellable',
        slug: 'special-sellable-2024-™',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.slug).toBe('special-sellable-2024-™')
    })

    it('should handle price of zero', async () => {
      const newSellable = {
        internalName: 'Free Sellable',
        publicName: 'Free Sellable',
        slug: 'free-sellable',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        price: 0,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.price).toBe(0)
    })

    it('should handle null values for optional fields', async () => {
      const newSellable = {
        internalName: 'Null Fields Sellable',
        publicName: 'Null Fields Sellable',
        slug: 'null-fields',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        description: null,
        image: null,
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.description).toBeNull()
      expect(data.image).toBeNull()
    })

    it('should handle concurrent updates correctly', async () => {
      const updates1 = { publicName: 'Update 1' }
      const updates2 = { description: 'Update 2' }
      
      const request1 = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates1)
      })
      
      const request2 = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
        method: 'PUT',
        body: JSON.stringify(updates2)
      })
      
      const [response1, response2] = await Promise.all([
        updateSellable(request1, { params: { id: 'sell-1' } }),
        updateSellable(request2, { params: { id: 'sell-1' } })
      ])
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })

    it('should handle empty arrays for optional array fields', async () => {
      const newSellable = {
        internalName: 'Empty Arrays Sellable',
        publicName: 'Empty Arrays Sellable',
        slug: 'empty-arrays',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        secondaryFlavourIds: [],
        componentIds: [],
        toppingIds: [],
        tags: [],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.secondaryFlavourIds).toEqual([])
      expect(data.componentIds).toEqual([])
      expect(data.toppingIds).toEqual([])
      expect(data.tags).toEqual([])
    })

    it('should handle case-insensitive slug comparison', async () => {
      const newSellable = {
        internalName: 'Case Test',
        publicName: 'Case Test',
        slug: 'VANILLA-PINT', // Same as sell-1 but uppercase
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/sellables', {
        method: 'POST',
        body: JSON.stringify(newSellable)
      })
      
      const response = await createSellable(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.code).toBe('DUPLICATE_SLUG')
    })
  })
})
