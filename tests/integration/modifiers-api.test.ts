/**
 * Integration Tests: Modifiers API Endpoints
 * 
 * Task 7.4: Write integration tests for modifier endpoints
 * Requirements: 11.3
 * 
 * This test suite verifies the full API flow including database operations
 * for both /api/modifiers and /api/modifiers/[id] endpoints.
 * Tests filtering, validation, and referential integrity.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET as getModifiers, POST as createModifier } from '../../app/api/modifiers/route'
import { GET as getModifier, PUT as updateModifier, DELETE as deleteModifier } from '../../app/api/modifiers/[id]/route'
import { NextRequest } from 'next/server'
import { getModifiers as dbGetModifiers, saveModifiers as dbSaveModifiers, getSellables } from '../../lib/db'
import type { Modifier, Sellable } from '../../types/index.js'

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  auth: vi.fn()
}))

// Mock the db module
vi.mock('../../lib/db.js', () => ({
  getModifiers: vi.fn(),
  saveModifiers: vi.fn(),
  getSellables: vi.fn()
}))

import { auth } from '../../lib/auth.js'

describe('Integration Tests: Modifiers API', () => {
  let testModifiers: Modifier[]
  let testSellables: Sellable[]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup test data
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
      },
      {
        id: 'mod-3',
        name: 'Waffle Cone Pieces',
        slug: 'waffle-cone-pieces',
        type: 'topping',
        description: 'Crunchy waffle cone bits',
        price: 100,
        allergens: ['gluten', 'dairy', 'eggs'],
        dietaryFlags: [],
        availableForFormatIds: ['format-cup', 'format-sandwich'],
        status: 'active',
        sortOrder: 3,
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z'
      },
      {
        id: 'mod-4',
        name: 'Archived Topping',
        slug: 'archived-topping',
        type: 'topping',
        price: 50,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: ['format-pint'],
        status: 'archived',
        sortOrder: 99,
        createdAt: '2024-01-04T00:00:00.000Z',
        updatedAt: '2024-01-04T00:00:00.000Z'
      }
    ]

    testSellables = [
      {
        id: 'sell-1',
        internalName: 'Vanilla Pint',
        publicName: 'Vanilla Pint',
        slug: 'vanilla-pint',
        status: 'active',
        formatId: 'format-pint',
        primaryFlavourIds: ['flav-1'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 1200,
        toppingIds: ['mod-1'], // References mod-1
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'sell-2',
        internalName: 'Strawberry Cup',
        publicName: 'Strawberry Cup',
        slug: 'strawberry-cup',
        status: 'active',
        formatId: 'format-cup',
        primaryFlavourIds: ['flav-2'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 600,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    vi.mocked(dbGetModifiers).mockResolvedValue(testModifiers)
    vi.mocked(dbSaveModifiers).mockImplementation(async (modifiers) => modifiers)
    vi.mocked(getSellables).mockResolvedValue(testSellables)
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/modifiers - Filtering', () => {
    it('should retrieve all modifiers without filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(4)
      expect(data[0].id).toBe('mod-1')
      expect(data[1].id).toBe('mod-2')
      expect(data[2].id).toBe('mod-3')
      expect(data[3].id).toBe('mod-4')
    })

    it('should filter modifiers by type=topping', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers?type=topping')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(3)
      expect(data.every((m: Modifier) => m.type === 'topping')).toBe(true)
    })

    it('should filter modifiers by type=drizzle', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers?type=drizzle')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('mod-2')
      expect(data[0].type).toBe('drizzle')
    })

    it('should filter modifiers by status=active', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers?status=active')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(3)
      expect(data.every((m: Modifier) => m.status === 'active')).toBe(true)
    })

    it('should filter modifiers by status=archived', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers?status=archived')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('mod-4')
      expect(data[0].status).toBe('archived')
    })

    it('should filter modifiers by formatId', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers?formatId=format-pint')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(3)
      expect(data.every((m: Modifier) => m.availableForFormatIds.includes('format-pint'))).toBe(true)
    })

    it('should filter modifiers by formatId=format-cup', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers?formatId=format-cup')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].id).toBe('mod-1')
      expect(data[1].id).toBe('mod-3')
    })

    it('should combine type and status filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers?type=topping&status=active')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data.every((m: Modifier) => m.type === 'topping' && m.status === 'active')).toBe(true)
    })

    it('should combine all three filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers?type=topping&status=active&formatId=format-pint')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('mod-1')
    })

    it('should return empty array when no modifiers match filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers?type=swirl&status=discontinued')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(0)
    })
  })

  describe('POST /api/modifiers - Create Modifier', () => {
    it('should create a new modifier with required fields only', async () => {
      const newModifier = {
        name: 'Sprinkles',
        slug: 'sprinkles',
        type: 'topping',
        price: 75,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: ['format-cup']
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.id).toBeDefined()
      expect(data.name).toBe('Sprinkles')
      expect(data.slug).toBe('sprinkles')
      expect(data.type).toBe('topping')
      expect(data.price).toBe(75)
      expect(data.allergens).toEqual([])
      expect(data.dietaryFlags).toEqual([])
      expect(data.availableForFormatIds).toEqual(['format-cup'])
      expect(data.status).toBe('active')
      expect(data.sortOrder).toBe(0)
      expect(data.createdAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
      
      // Verify database was called
      expect(dbSaveModifiers).toHaveBeenCalled()
      const savedData = vi.mocked(dbSaveModifiers).mock.calls[0][0]
      expect(savedData).toHaveLength(5) // 4 existing + 1 new
    })

    it('should create a modifier with all optional fields', async () => {
      const newModifier = {
        name: 'Peanut Butter Swirl',
        slug: 'peanut-butter-swirl',
        type: 'drizzle',
        description: 'Creamy peanut butter ribbons',
        image: '/images/pb-swirl.jpg',
        price: 250,
        allergens: ['peanuts', 'dairy'],
        dietaryFlags: ['gluten-free'],
        availableForFormatIds: ['format-pint', 'format-quart'],
        status: 'active',
        sortOrder: 5
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.description).toBe('Creamy peanut butter ribbons')
      expect(data.image).toBe('/images/pb-swirl.jpg')
      expect(data.allergens).toEqual(['peanuts', 'dairy'])
      expect(data.dietaryFlags).toEqual(['gluten-free'])
      expect(data.status).toBe('active')
      expect(data.sortOrder).toBe(5)
    })

    it('should reject creation when name is missing', async () => {
      const newModifier = {
        slug: 'missing-name',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('MISSING_REQUIRED_FIELD')
      expect(data.details.field).toBe('name')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject creation when slug is missing', async () => {
      const newModifier = {
        name: 'Missing Slug',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('MISSING_REQUIRED_FIELD')
      expect(data.details.field).toBe('slug')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject creation when type is missing', async () => {
      const newModifier = {
        name: 'Missing Type',
        slug: 'missing-type',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('MISSING_REQUIRED_FIELD')
      expect(data.details.field).toBe('type')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject creation when price is missing', async () => {
      const newModifier = {
        name: 'Missing Price',
        slug: 'missing-price',
        type: 'topping',
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD_VALUE')
      expect(data.details.field).toBe('price')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject creation when price is negative', async () => {
      const newModifier = {
        name: 'Negative Price',
        slug: 'negative-price',
        type: 'topping',
        price: -100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD_VALUE')
      expect(data.details.field).toBe('price')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject creation when allergens is not an array', async () => {
      const newModifier = {
        name: 'Invalid Allergens',
        slug: 'invalid-allergens',
        type: 'topping',
        price: 100,
        allergens: 'dairy',
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD_VALUE')
      expect(data.details.field).toBe('allergens')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject creation when dietaryFlags is not an array', async () => {
      const newModifier = {
        name: 'Invalid Dietary',
        slug: 'invalid-dietary',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: 'vegan',
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD_VALUE')
      expect(data.details.field).toBe('dietaryFlags')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject creation when availableForFormatIds is not an array', async () => {
      const newModifier = {
        name: 'Invalid Formats',
        slug: 'invalid-formats',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: 'format-pint'
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD_VALUE')
      expect(data.details.field).toBe('availableForFormatIds')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject creation when slug already exists', async () => {
      const newModifier = {
        name: 'Duplicate Modifier',
        slug: 'chocolate-chips', // Already exists
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('A modifier with this slug already exists')
      expect(data.code).toBe('DUPLICATE_SLUG')
      expect(data.details.existingId).toBe('mod-1')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject creation when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      
      const newModifier = {
        name: 'Unauthorized Modifier',
        slug: 'unauthorized-modifier',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/modifiers/[id] - Get Single Modifier', () => {
    it('should retrieve a modifier by id', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1')
      
      const response = await getModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('mod-1')
      expect(data.name).toBe('Chocolate Chips')
      expect(data.slug).toBe('chocolate-chips')
    })

    it('should return 404 when modifier does not exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers/nonexistent')
      
      const response = await getModifier(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Modifier not found')
      expect(data.code).toBe('NOT_FOUND')
    })
  })

  describe('PUT /api/modifiers/[id] - Update Modifier', () => {
    it('should update a modifier with valid data', async () => {
      const updates = {
        name: 'Updated Chocolate Chips',
        description: 'New description',
        price: 175
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('mod-1')
      expect(data.name).toBe('Updated Chocolate Chips')
      expect(data.description).toBe('New description')
      expect(data.price).toBe(175)
      expect(data.slug).toBe('chocolate-chips') // Unchanged
      expect(data.updatedAt).toBeDefined()
      
      // Verify database was called
      expect(dbSaveModifiers).toHaveBeenCalled()
    })

    it('should update only specified fields', async () => {
      const updates = {
        status: 'discontinued'
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-2', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-2' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('mod-2')
      expect(data.status).toBe('discontinued')
      expect(data.name).toBe('Caramel Swirl') // Unchanged
      expect(data.slug).toBe('caramel-swirl') // Unchanged
      expect(data.price).toBe(200) // Unchanged
    })

    it('should update slug without conflict', async () => {
      const updates = {
        slug: 'new-chocolate-chips'
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.slug).toBe('new-chocolate-chips')
    })

    it('should reject update when slug conflicts with another modifier', async () => {
      const updates = {
        slug: 'caramel-swirl' // Already used by mod-2
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('A modifier with this slug already exists')
      expect(data.code).toBe('DUPLICATE_SLUG')
      expect(data.details.existingId).toBe('mod-2')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject update when name is empty', async () => {
      const updates = {
        name: '   '
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD')
      expect(data.details.field).toBe('name')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject update when slug is empty', async () => {
      const updates = {
        slug: ''
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD')
      expect(data.details.field).toBe('slug')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject update when price is negative', async () => {
      const updates = {
        price: -50
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD')
      expect(data.details.field).toBe('price')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should return 404 when updating non-existent modifier', async () => {
      const updates = {
        name: 'Updated Name'
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/nonexistent', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Modifier not found')
      expect(data.code).toBe('NOT_FOUND')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject update when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      
      const updates = {
        name: 'Unauthorized Update'
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should not allow ID to be changed', async () => {
      const updates = {
        id: 'new-id',
        name: 'Updated Name'
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('mod-1') // ID should remain unchanged
      expect(data.name).toBe('Updated Name')
    })
  })

  describe('DELETE /api/modifiers/[id] - Delete Modifier', () => {
    it('should delete a modifier when no references exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-4', {
        method: 'DELETE'
      })
      
      const response = await deleteModifier(request, { params: { id: 'mod-4' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Modifier deleted successfully')
      
      // Verify database was called
      expect(dbSaveModifiers).toHaveBeenCalled()
      const savedData = vi.mocked(dbSaveModifiers).mock.calls[0][0]
      expect(savedData).toHaveLength(3) // 4 - 1 deleted
      expect(savedData.find((m: Modifier) => m.id === 'mod-4')).toBeUndefined()
    })

    it('should prevent deletion when modifier is referenced by sellables', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'DELETE'
      })
      
      const response = await deleteModifier(request, { params: { id: 'mod-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot delete modifier: it is referenced by sellables')
      expect(data.code).toBe('REFERENTIAL_INTEGRITY_VIOLATION')
      expect(data.details.referencingSellableIds).toEqual(['sell-1'])
      expect(data.details.count).toBe(1)
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should return 404 when deleting non-existent modifier', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers/nonexistent', {
        method: 'DELETE'
      })
      
      const response = await deleteModifier(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Modifier not found')
      expect(data.code).toBe('NOT_FOUND')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })

    it('should reject deletion when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-4', {
        method: 'DELETE'
      })
      
      const response = await deleteModifier(request, { params: { id: 'mod-4' } })
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveModifiers).not.toHaveBeenCalled()
    })
  })

  describe('Database Integration', () => {
    it('should handle database read errors gracefully', async () => {
      vi.mocked(dbGetModifiers).mockRejectedValue(new Error('Database connection failed'))
      
      const request = new NextRequest('http://localhost:3000/api/modifiers')
      
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch modifiers')
      expect(data.timestamp).toBeDefined()
    })

    it('should handle database write errors gracefully', async () => {
      vi.mocked(dbSaveModifiers).mockRejectedValue(new Error('Write failed'))
      
      const newModifier = {
        name: 'Test Modifier',
        slug: 'test-modifier',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create modifier')
      expect(data.timestamp).toBeDefined()
    })

    it('should persist data correctly across operations', async () => {
      let persistedData = [...testModifiers]
      
      // Mock save to actually update the persisted data
      vi.mocked(dbSaveModifiers).mockImplementation(async (modifiers) => {
        persistedData = modifiers
        return modifiers
      })
      
      // Mock get to return the persisted data
      vi.mocked(dbGetModifiers).mockImplementation(async () => persistedData)
      
      // Create a new modifier
      const createRequest = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'New Modifier', 
          slug: 'new-modifier',
          type: 'topping',
          price: 100,
          allergens: [],
          dietaryFlags: [],
          availableForFormatIds: []
        })
      })
      
      const createResponse = await createModifier(createRequest)
      expect(createResponse.status).toBe(201)
      
      // Verify it was persisted
      expect(persistedData).toHaveLength(5)
      
      // Retrieve all modifiers
      const getRequest = new NextRequest('http://localhost:3000/api/modifiers')
      const getResponse = await getModifiers(getRequest)
      const modifiers = await getResponse.json()
      
      expect(modifiers).toHaveLength(5)
      expect(modifiers.find((m: Modifier) => m.slug === 'new-modifier')).toBeDefined()
    })
  })

  describe('Edge Cases and Error Conditions', () => {
    it('should handle empty database gracefully', async () => {
      vi.mocked(dbGetModifiers).mockResolvedValue([])
      
      const request = new NextRequest('http://localhost:3000/api/modifiers')
      const response = await getModifiers(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should handle malformed JSON in POST request', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: 'invalid json'
      })
      
      const response = await createModifier(request)
      
      // API should return 500 error for malformed JSON
      expect(response.status).toBe(500)
    })

    it('should handle malformed JSON in PUT request', async () => {
      const request = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: 'invalid json'
      })
      
      const response = await updateModifier(request, { params: { id: 'mod-1' } })
      
      // API should return 500 error for malformed JSON
      expect(response.status).toBe(500)
    })

    it('should handle very long name strings', async () => {
      const longName = 'A'.repeat(1000)
      
      const newModifier = {
        name: longName,
        slug: 'long-name-modifier',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.name).toBe(longName)
    })

    it('should handle special characters in slug', async () => {
      const newModifier = {
        name: 'Special Modifier',
        slug: 'special-modifier-2024-™',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.slug).toBe('special-modifier-2024-™')
    })

    it('should handle empty arrays for allergens and dietary flags', async () => {
      const newModifier = {
        name: 'Empty Arrays Modifier',
        slug: 'empty-arrays',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.allergens).toEqual([])
      expect(data.dietaryFlags).toEqual([])
      expect(data.availableForFormatIds).toEqual([])
    })

    it('should handle null values for optional fields', async () => {
      const newModifier = {
        name: 'Null Fields Modifier',
        slug: 'null-fields',
        type: 'topping',
        description: null,
        image: null,
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.description).toBeNull()
      expect(data.image).toBeNull()
    })

    it('should handle price of zero', async () => {
      const newModifier = {
        name: 'Free Modifier',
        slug: 'free-modifier',
        type: 'topping',
        price: 0,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.price).toBe(0)
    })

    it('should handle concurrent updates correctly', async () => {
      // Simulate two concurrent update requests
      const updates1 = { name: 'Update 1' }
      const updates2 = { description: 'Update 2' }
      
      const request1 = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates1)
      })
      
      const request2 = new NextRequest('http://localhost:3000/api/modifiers/mod-1', {
        method: 'PUT',
        body: JSON.stringify(updates2)
      })
      
      // Execute both updates
      const [response1, response2] = await Promise.all([
        updateModifier(request1, { params: { id: 'mod-1' } }),
        updateModifier(request2, { params: { id: 'mod-1' } })
      ])
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })

    it('should handle multiple format IDs', async () => {
      const newModifier = {
        name: 'Multi-Format Modifier',
        slug: 'multi-format',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: ['format-pint', 'format-cup', 'format-quart', 'format-sandwich']
      }
      
      const request = new NextRequest('http://localhost:3000/api/modifiers', {
        method: 'POST',
        body: JSON.stringify(newModifier)
      })
      
      const response = await createModifier(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.availableForFormatIds).toHaveLength(4)
      expect(data.availableForFormatIds).toEqual(['format-pint', 'format-cup', 'format-quart', 'format-sandwich'])
    })
  })
})
