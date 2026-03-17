/**
 * Unit Tests for Sellables Dynamic API Route
 * 
 * Tests GET, PUT, and DELETE operations for individual sellables
 * at /api/sellables/[id]
 * 
 * Validates: Requirements 11.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from '@/app/api/sellables/[id]/route'
import { NextRequest } from 'next/server'
import * as authModule from '@/lib/auth'
import * as dbModule from '@/lib/db'
import type { Sellable, Format, Flavour, Modifier, Launch } from '@/types'

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

// Mock db
vi.mock('@/lib/db', () => ({
  getSellables: vi.fn(),
  saveSellables: vi.fn(),
  getLaunches: vi.fn(),
  getFormats: vi.fn(),
  getFlavours: vi.fn(),
  getModifiers: vi.fn()
}))

describe('GET /api/sellables/[id]', () => {
  const mockSellables: Sellable[] = [
    {
      id: 'sell-1',
      internalName: 'Single Scoop Vanilla',
      publicName: 'Vanilla Scoop',
      slug: 'vanilla-scoop',
      status: 'active',
      formatId: 'fmt-1',
      primaryFlavourIds: ['flav-1'],
      price: 500,
      inventoryTracked: true,
      onlineOrderable: true,
      pickupOnly: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'sell-2',
      internalName: 'Pint Chocolate',
      publicName: 'Chocolate Pint',
      slug: 'chocolate-pint',
      status: 'active',
      formatId: 'fmt-2',
      primaryFlavourIds: ['flav-2'],
      price: 1200,
      inventoryTracked: true,
      onlineOrderable: true,
      pickupOnly: false,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbModule.getSellables).mockResolvedValue(mockSellables)
  })

  it('should return sellable by ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1')
    const params = { id: 'sell-1' }

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('sell-1')
    expect(data.internalName).toBe('Single Scoop Vanilla')
    expect(data.publicName).toBe('Vanilla Scoop')
  })

  it('should return 404 for non-existent sellable', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/non-existent')
    const params = { id: 'non-existent' }

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Sellable not found')
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should expand format when requested', async () => {
    const mockFormats: Format[] = [
      {
        id: 'fmt-1',
        name: 'Single Scoop',
        slug: 'single-scoop',
        category: 'scoop',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    vi.mocked(dbModule.getFormats).mockResolvedValue(mockFormats)

    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1?expand=format')
    const params = { id: 'sell-1' }

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.format).toBeDefined()
    expect(data.format.id).toBe('fmt-1')
    expect(data.format.name).toBe('Single Scoop')
  })

  it('should expand flavours when requested', async () => {
    const mockFlavours: Flavour[] = [
      {
        id: 'flav-1',
        name: 'Vanilla',
        slug: 'vanilla',
        type: 'gelato',
        ingredients: [],
        keyNotes: ['vanilla', 'cream'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian'],
        status: 'active',
        featured: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    vi.mocked(dbModule.getFlavours).mockResolvedValue(mockFlavours)

    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1?expand=flavours')
    const params = { id: 'sell-1' }

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.primaryFlavours).toBeDefined()
    expect(data.primaryFlavours).toHaveLength(1)
    expect(data.primaryFlavours[0].id).toBe('flav-1')
    expect(data.primaryFlavours[0].name).toBe('Vanilla')
  })

  it('should expand modifiers when requested', async () => {
    const sellableWithToppings: Sellable = {
      ...mockSellables[0],
      toppingIds: ['mod-1']
    }

    vi.mocked(dbModule.getSellables).mockResolvedValue([sellableWithToppings])

    const mockModifiers: Modifier[] = [
      {
        id: 'mod-1',
        name: 'Hot Fudge',
        slug: 'hot-fudge',
        type: 'sauce',
        price: 150,
        allergens: ['dairy'],
        dietaryFlags: [],
        availableForFormatIds: ['fmt-1'],
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    vi.mocked(dbModule.getModifiers).mockResolvedValue(mockModifiers)

    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1?expand=modifiers')
    const params = { id: 'sell-1' }

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.toppings).toBeDefined()
    expect(data.toppings).toHaveLength(1)
    expect(data.toppings[0].id).toBe('mod-1')
    expect(data.toppings[0].name).toBe('Hot Fudge')
  })

  it('should expand all relationships when expand=all', async () => {
    const mockFormats: Format[] = [
      {
        id: 'fmt-1',
        name: 'Single Scoop',
        slug: 'single-scoop',
        category: 'scoop',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    const mockFlavours: Flavour[] = [
      {
        id: 'flav-1',
        name: 'Vanilla',
        slug: 'vanilla',
        type: 'gelato',
        ingredients: [],
        keyNotes: ['vanilla', 'cream'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian'],
        status: 'active',
        featured: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    vi.mocked(dbModule.getFormats).mockResolvedValue(mockFormats)
    vi.mocked(dbModule.getFlavours).mockResolvedValue(mockFlavours)
    vi.mocked(dbModule.getModifiers).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1?expand=all')
    const params = { id: 'sell-1' }

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.format).toBeDefined()
    expect(data.primaryFlavours).toBeDefined()
  })
})

describe('PUT /api/sellables/[id]', () => {
  const mockSellables: Sellable[] = [
    {
      id: 'sell-1',
      internalName: 'Single Scoop Vanilla',
      publicName: 'Vanilla Scoop',
      slug: 'vanilla-scoop',
      status: 'active',
      formatId: 'fmt-1',
      primaryFlavourIds: ['flav-1'],
      price: 500,
      inventoryTracked: true,
      onlineOrderable: true,
      pickupOnly: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ]

  const mockFormats: Format[] = [
    {
      id: 'fmt-1',
      name: 'Single Scoop',
      slug: 'single-scoop',
      category: 'scoop',
      requiresFlavours: true,
      minFlavours: 1,
      maxFlavours: 1,
      allowMixedTypes: false,
      canIncludeAddOns: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ]

  const mockFlavours: Flavour[] = [
    {
      id: 'flav-1',
      name: 'Vanilla',
      slug: 'vanilla',
      type: 'gelato',
      ingredients: [],
      keyNotes: ['vanilla', 'cream'],
      allergens: ['dairy'],
      dietaryTags: ['vegetarian'],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.auth).mockResolvedValue({ user: { id: '1', name: 'Admin' } } as any)
    vi.mocked(dbModule.getSellables).mockResolvedValue(mockSellables)
    vi.mocked(dbModule.saveSellables).mockResolvedValue(mockSellables)
    vi.mocked(dbModule.getFormats).mockResolvedValue(mockFormats)
    vi.mocked(dbModule.getFlavours).mockResolvedValue(mockFlavours)
    vi.mocked(dbModule.getModifiers).mockResolvedValue([])
  })

  it('should require authentication', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as any)

    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'PUT',
      body: JSON.stringify({ publicName: 'Updated Name' })
    })
    const params = { id: 'sell-1' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(data.code).toBe('AUTH_REQUIRED')
  })

  it('should return 404 for non-existent sellable', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/non-existent', {
      method: 'PUT',
      body: JSON.stringify({ publicName: 'Updated Name' })
    })
    const params = { id: 'non-existent' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Sellable not found')
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should update sellable fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'PUT',
      body: JSON.stringify({
        publicName: 'Updated Vanilla Scoop',
        price: 600
      })
    })
    const params = { id: 'sell-1' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.publicName).toBe('Updated Vanilla Scoop')
    expect(data.price).toBe(600)
    expect(data.id).toBe('sell-1') // ID should not change
    expect(data.updatedAt).toBeDefined()
  })

  it('should validate internalName is non-empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'PUT',
      body: JSON.stringify({ internalName: '' })
    })
    const params = { id: 'sell-1' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('INVALID_FIELD')
    expect(data.details.field).toBe('internalName')
  })

  it('should validate publicName is non-empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'PUT',
      body: JSON.stringify({ publicName: '' })
    })
    const params = { id: 'sell-1' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('INVALID_FIELD')
    expect(data.details.field).toBe('publicName')
  })

  it('should validate slug is non-empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'PUT',
      body: JSON.stringify({ slug: '' })
    })
    const params = { id: 'sell-1' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('INVALID_FIELD')
    expect(data.details.field).toBe('slug')
  })

  it('should validate price is non-negative number', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'PUT',
      body: JSON.stringify({ price: -100 })
    })
    const params = { id: 'sell-1' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('INVALID_FIELD')
    expect(data.details.field).toBe('price')
  })

  it('should check for duplicate slug (excluding current sellable)', async () => {
    const sellablesWithDuplicate = [
      ...mockSellables,
      {
        id: 'sell-2',
        internalName: 'Another Sellable',
        publicName: 'Another',
        slug: 'another-slug',
        status: 'active' as const,
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1'],
        price: 500,
        inventoryTracked: true,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      }
    ]

    vi.mocked(dbModule.getSellables).mockResolvedValue(sellablesWithDuplicate)

    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'PUT',
      body: JSON.stringify({ slug: 'another-slug' })
    })
    const params = { id: 'sell-1' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('DUPLICATE_SLUG')
    expect(data.details.existingId).toBe('sell-2')
  })

  it('should validate composition when format or flavours change', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'PUT',
      body: JSON.stringify({
        primaryFlavourIds: ['flav-1', 'flav-2'] // Exceeds maxFlavours (1)
      })
    })
    const params = { id: 'sell-1' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('COMPOSITION_VALIDATION_FAILED')
  })

  it('should return error if format not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'PUT',
      body: JSON.stringify({ formatId: 'non-existent-format' })
    })
    const params = { id: 'sell-1' }

    const response = await PUT(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('INVALID_FORMAT')
  })
})

describe('DELETE /api/sellables/[id]', () => {
  let mockSellables: Sellable[]

  beforeEach(() => {
    // Reset mockSellables for each test
    mockSellables = [
      {
        id: 'sell-1',
        internalName: 'Single Scoop Vanilla',
        publicName: 'Vanilla Scoop',
        slug: 'vanilla-scoop',
        status: 'active',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1'],
        price: 500,
        inventoryTracked: true,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    vi.clearAllMocks()
    vi.mocked(authModule.auth).mockResolvedValue({ user: { id: '1', name: 'Admin' } } as any)
    vi.mocked(dbModule.getSellables).mockResolvedValue(mockSellables)
    vi.mocked(dbModule.saveSellables).mockResolvedValue([])
    vi.mocked(dbModule.getLaunches).mockResolvedValue([])
  })

  it('should require authentication', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null as any)

    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'DELETE'
    })
    const params = { id: 'sell-1' }

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(data.code).toBe('AUTH_REQUIRED')
  })

  it('should return 404 for non-existent sellable', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/non-existent', {
      method: 'DELETE'
    })
    const params = { id: 'non-existent' }

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Sellable not found')
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should delete sellable successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'DELETE'
    })
    const params = { id: 'sell-1' }

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Sellable deleted successfully')
    expect(dbModule.saveSellables).toHaveBeenCalled()
  })

  it('should prevent deletion if referenced by launches', async () => {
    // Ensure the sellable exists in the mock
    vi.mocked(dbModule.getSellables).mockResolvedValue(mockSellables)
    
    const mockLaunches: Launch[] = [
      {
        id: 'launch-1',
        title: 'Summer Launch',
        slug: 'summer-launch',
        status: 'active',
        featuredFlavourIds: [],
        featuredSellableIds: ['sell-1'], // References the sellable
        featured: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    vi.mocked(dbModule.getLaunches).mockResolvedValue(mockLaunches)

    const request = new NextRequest('http://localhost:3000/api/sellables/sell-1', {
      method: 'DELETE'
    })
    const params = { id: 'sell-1' }

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Cannot delete sellable: it is referenced by launches')
    expect(data.code).toBe('REFERENTIAL_INTEGRITY_VIOLATION')
    expect(data.details.referencingLaunchIds).toEqual(['launch-1'])
    expect(data.details.count).toBe(1)
    expect(dbModule.saveSellables).not.toHaveBeenCalled()
  })
})
