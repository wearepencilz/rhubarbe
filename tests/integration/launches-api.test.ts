/**
 * Integration Tests: Launches API Endpoints
 * 
 * Task 6.3: Write integration tests for launch endpoints
 * Requirements: 11.1
 * 
 * This test suite verifies the full API flow including database operations
 * for both /api/launches and /api/launches/[id] endpoints.
 * Tests filtering, validation, and referential integrity.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET as getLaunches, POST as createLaunch } from '../../app/api/launches/route'
import { GET as getLaunch, PUT as updateLaunch, DELETE as deleteLaunch } from '../../app/api/launches/[id]/route'
import { NextRequest } from 'next/server'
import { getLaunches as dbGetLaunches, saveLaunches as dbSaveLaunches, getSellables } from '../../lib/db'
import type { Launch, Sellable } from '../../types/index.js'

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  auth: vi.fn()
}))

// Mock the db module
vi.mock('../../lib/db.js', () => ({
  getLaunches: vi.fn(),
  saveLaunches: vi.fn(),
  getSellables: vi.fn()
}))

import { auth } from '../../lib/auth.js'

describe('Integration Tests: Launches API', () => {
  let testLaunches: Launch[]
  let testSellables: Sellable[]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup test data
    testLaunches = [
      {
        id: 'launch-1',
        title: 'Summer Collection',
        slug: 'summer-collection',
        status: 'active',
        featuredFlavourIds: ['flav-1', 'flav-2'],
        featuredSellableIds: ['sell-1', 'sell-2'],
        featured: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'launch-2',
        title: 'Peach Week',
        slug: 'peach-week',
        status: 'upcoming',
        featuredFlavourIds: ['flav-3'],
        featuredSellableIds: ['sell-3'],
        featured: false,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      },
      {
        id: 'launch-3',
        title: 'Winter Warmers',
        slug: 'winter-warmers',
        status: 'ended',
        featuredFlavourIds: ['flav-4'],
        featuredSellableIds: ['sell-4'],
        featured: true,
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z'
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
        tags: ['launch:launch-1'], // Referenced by launch-1
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    vi.mocked(dbGetLaunches).mockResolvedValue(testLaunches)
    vi.mocked(dbSaveLaunches).mockImplementation(async (launches) => launches)
    vi.mocked(getSellables).mockResolvedValue(testSellables)
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/launches - Filtering', () => {
    it('should retrieve all launches without filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches')
      
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(3)
      expect(data[0].id).toBe('launch-1')
      expect(data[1].id).toBe('launch-2')
      expect(data[2].id).toBe('launch-3')
    })

    it('should filter launches by status=active', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches?status=active')
      
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('launch-1')
      expect(data[0].status).toBe('active')
    })

    it('should filter launches by status=upcoming', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches?status=upcoming')
      
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('launch-2')
      expect(data[0].status).toBe('upcoming')
    })

    it('should filter launches by status=ended', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches?status=ended')
      
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('launch-3')
      expect(data[0].status).toBe('ended')
    })

    it('should filter launches by featured=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches?featured=true')
      
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data.every((l: Launch) => l.featured === true)).toBe(true)
    })

    it('should filter launches by featured=false', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches?featured=false')
      
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('launch-2')
      expect(data[0].featured).toBe(false)
    })

    it('should combine status and featured filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches?status=active&featured=true')
      
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('launch-1')
      expect(data[0].status).toBe('active')
      expect(data[0].featured).toBe(true)
    })

    it('should return empty array when no launches match filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches?status=archived')
      
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(0)
    })
  })

  describe('POST /api/launches - Create Launch', () => {
    it('should create a new launch with required fields only', async () => {
      const newLaunch = {
        title: 'Autumn Harvest',
        slug: 'autumn-harvest'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.id).toBeDefined()
      expect(data.title).toBe('Autumn Harvest')
      expect(data.slug).toBe('autumn-harvest')
      expect(data.status).toBe('upcoming')
      expect(data.featuredFlavourIds).toEqual([])
      expect(data.featuredSellableIds).toEqual([])
      expect(data.featured).toBe(false)
      expect(data.createdAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
      
      // Verify database was called
      expect(dbSaveLaunches).toHaveBeenCalled()
      const savedData = vi.mocked(dbSaveLaunches).mock.calls[0][0]
      expect(savedData).toHaveLength(4) // 3 existing + 1 new
    })

    it('should create a launch with all optional fields', async () => {
      const newLaunch = {
        title: 'Spring Blossoms',
        slug: 'spring-blossoms',
        status: 'active',
        heroImage: '/images/spring.jpg',
        story: 'A celebration of spring flavours',
        description: 'Fresh and floral',
        activeStart: '2024-03-01T00:00:00.000Z',
        activeEnd: '2024-05-31T23:59:59.999Z',
        featuredFlavourIds: ['flav-5', 'flav-6'],
        featuredSellableIds: ['sell-5'],
        contentBlocks: [
          { id: 'block-1', type: 'text', order: 1, content: { text: 'Welcome to spring' } }
        ],
        relatedEventIds: ['event-1'],
        relatedMembershipDropIds: ['drop-1'],
        sortOrder: 10,
        featured: true
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.status).toBe('active')
      expect(data.heroImage).toBe('/images/spring.jpg')
      expect(data.story).toBe('A celebration of spring flavours')
      expect(data.description).toBe('Fresh and floral')
      expect(data.activeStart).toBe('2024-03-01T00:00:00.000Z')
      expect(data.activeEnd).toBe('2024-05-31T23:59:59.999Z')
      expect(data.featuredFlavourIds).toEqual(['flav-5', 'flav-6'])
      expect(data.featuredSellableIds).toEqual(['sell-5'])
      expect(data.contentBlocks).toHaveLength(1)
      expect(data.relatedEventIds).toEqual(['event-1'])
      expect(data.relatedMembershipDropIds).toEqual(['drop-1'])
      expect(data.sortOrder).toBe(10)
      expect(data.featured).toBe(true)
    })

    it('should reject creation when title is missing', async () => {
      const newLaunch = {
        slug: 'missing-title'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('MISSING_REQUIRED_FIELD')
      expect(data.details.field).toBe('title')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should reject creation when slug is missing', async () => {
      const newLaunch = {
        title: 'Missing Slug'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('MISSING_REQUIRED_FIELD')
      expect(data.details.field).toBe('slug')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should reject creation when slug already exists', async () => {
      const newLaunch = {
        title: 'Duplicate Launch',
        slug: 'summer-collection' // Already exists
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('A launch with this slug already exists')
      expect(data.code).toBe('DUPLICATE_SLUG')
      expect(data.details.existingId).toBe('launch-1')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should reject creation when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)
      
      const newLaunch = {
        title: 'Unauthorized Launch',
        slug: 'unauthorized-launch'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/launches/[id] - Get Single Launch', () => {
    it('should retrieve a launch by id', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1')
      
      const response = await getLaunch(request, { params: { id: 'launch-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('launch-1')
      expect(data.title).toBe('Summer Collection')
      expect(data.slug).toBe('summer-collection')
    })

    it('should return 404 when launch does not exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches/nonexistent')
      
      const response = await getLaunch(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Launch not found')
      expect(data.code).toBe('NOT_FOUND')
    })
  })

  describe('PUT /api/launches/[id] - Update Launch', () => {
    it('should update a launch with valid data', async () => {
      const updates = {
        title: 'Updated Summer Collection',
        description: 'New description',
        featured: false
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateLaunch(request, { params: { id: 'launch-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('launch-1')
      expect(data.title).toBe('Updated Summer Collection')
      expect(data.description).toBe('New description')
      expect(data.featured).toBe(false)
      expect(data.slug).toBe('summer-collection') // Unchanged
      expect(data.updatedAt).toBeDefined()
      
      // Verify database was called
      expect(dbSaveLaunches).toHaveBeenCalled()
    })

    it('should update only specified fields', async () => {
      const updates = {
        status: 'ended'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches/launch-2', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateLaunch(request, { params: { id: 'launch-2' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('launch-2')
      expect(data.status).toBe('ended')
      expect(data.title).toBe('Peach Week') // Unchanged
      expect(data.slug).toBe('peach-week') // Unchanged
      expect(data.featured).toBe(false) // Unchanged
    })

    it('should update slug without conflict', async () => {
      const updates = {
        slug: 'new-summer-collection'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateLaunch(request, { params: { id: 'launch-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.slug).toBe('new-summer-collection')
    })

    it('should reject update when slug conflicts with another launch', async () => {
      const updates = {
        slug: 'peach-week' // Already used by launch-2
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateLaunch(request, { params: { id: 'launch-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('A launch with this slug already exists')
      expect(data.code).toBe('DUPLICATE_SLUG')
      expect(data.details.existingId).toBe('launch-2')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should reject update when title is empty', async () => {
      const updates = {
        title: '   '
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateLaunch(request, { params: { id: 'launch-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD')
      expect(data.details.field).toBe('title')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should reject update when slug is empty', async () => {
      const updates = {
        slug: ''
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateLaunch(request, { params: { id: 'launch-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.code).toBe('INVALID_FIELD')
      expect(data.details.field).toBe('slug')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should return 404 when updating non-existent launch', async () => {
      const updates = {
        title: 'Updated Title'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches/nonexistent', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateLaunch(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Launch not found')
      expect(data.code).toBe('NOT_FOUND')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should reject update when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)
      
      const updates = {
        title: 'Unauthorized Update'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateLaunch(request, { params: { id: 'launch-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should not allow ID to be changed', async () => {
      const updates = {
        id: 'new-id',
        title: 'Updated Title'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      const response = await updateLaunch(request, { params: { id: 'launch-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.id).toBe('launch-1') // ID should remain unchanged
      expect(data.title).toBe('Updated Title')
    })
  })

  describe('DELETE /api/launches/[id] - Delete Launch', () => {
    it('should delete a launch when no references exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches/launch-3', {
        method: 'DELETE'
      })
      
      const response = await deleteLaunch(request, { params: { id: 'launch-3' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Launch deleted successfully')
      
      // Verify database was called
      expect(dbSaveLaunches).toHaveBeenCalled()
      const savedData = vi.mocked(dbSaveLaunches).mock.calls[0][0]
      expect(savedData).toHaveLength(2) // 3 - 1 deleted
      expect(savedData.find((l: Launch) => l.id === 'launch-3')).toBeUndefined()
    })

    it('should prevent deletion when launch is referenced by sellables', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'DELETE'
      })
      
      const response = await deleteLaunch(request, { params: { id: 'launch-1' } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot delete launch: it is referenced by sellables')
      expect(data.code).toBe('REFERENTIAL_INTEGRITY_VIOLATION')
      expect(data.details.referencingSellableIds).toEqual(['sell-2'])
      expect(data.details.count).toBe(1)
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should return 404 when deleting non-existent launch', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches/nonexistent', {
        method: 'DELETE'
      })
      
      const response = await deleteLaunch(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Launch not found')
      expect(data.code).toBe('NOT_FOUND')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })

    it('should reject deletion when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/launches/launch-3', {
        method: 'DELETE'
      })
      
      const response = await deleteLaunch(request, { params: { id: 'launch-3' } })
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveLaunches).not.toHaveBeenCalled()
    })
  })

  describe('Database Integration', () => {
    it('should handle database read errors gracefully', async () => {
      vi.mocked(dbGetLaunches).mockRejectedValue(new Error('Database connection failed'))
      
      const request = new NextRequest('http://localhost:3000/api/launches')
      
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch launches')
      expect(data.timestamp).toBeDefined()
    })

    it('should handle database write errors gracefully', async () => {
      vi.mocked(dbSaveLaunches).mockRejectedValue(new Error('Write failed'))
      
      const newLaunch = {
        title: 'Test Launch',
        slug: 'test-launch'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create launch')
      expect(data.timestamp).toBeDefined()
    })

    it('should persist data correctly across operations', async () => {
      let persistedData = [...testLaunches]
      
      // Mock save to actually update the persisted data
      vi.mocked(dbSaveLaunches).mockImplementation(async (launches) => {
        persistedData = launches
        return launches
      })
      
      // Mock get to return the persisted data
      vi.mocked(dbGetLaunches).mockImplementation(async () => persistedData)
      
      // Create a new launch
      const createRequest = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Launch', slug: 'new-launch' })
      })
      
      const createResponse = await createLaunch(createRequest)
      expect(createResponse.status).toBe(201)
      
      // Verify it was persisted
      expect(persistedData).toHaveLength(4)
      
      // Retrieve all launches
      const getRequest = new NextRequest('http://localhost:3000/api/launches')
      const getResponse = await getLaunches(getRequest)
      const launches = await getResponse.json()
      
      expect(launches).toHaveLength(4)
      expect(launches.find((l: Launch) => l.slug === 'new-launch')).toBeDefined()
    })
  })

  describe('Edge Cases and Error Conditions', () => {
    it('should handle empty database gracefully', async () => {
      vi.mocked(dbGetLaunches).mockResolvedValue([])
      
      const request = new NextRequest('http://localhost:3000/api/launches')
      const response = await getLaunches(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should handle malformed JSON in POST request', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: 'invalid json'
      })
      
      const response = await createLaunch(request)
      
      // API should return 500 error for malformed JSON
      expect(response.status).toBe(500)
    })

    it('should handle malformed JSON in PUT request', async () => {
      const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: 'invalid json'
      })
      
      const response = await updateLaunch(request, { params: { id: 'launch-1' } })
      
      // API should return 500 error for malformed JSON
      expect(response.status).toBe(500)
    })

    it('should handle very long title strings', async () => {
      const longTitle = 'A'.repeat(1000)
      
      const newLaunch = {
        title: longTitle,
        slug: 'long-title-launch'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.title).toBe(longTitle)
    })

    it('should handle special characters in slug', async () => {
      const newLaunch = {
        title: 'Special Launch',
        slug: 'special-launch-2024-™'
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.slug).toBe('special-launch-2024-™')
    })

    it('should handle empty arrays for featured IDs', async () => {
      const newLaunch = {
        title: 'Empty Arrays Launch',
        slug: 'empty-arrays',
        featuredFlavourIds: [],
        featuredSellableIds: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.featuredFlavourIds).toEqual([])
      expect(data.featuredSellableIds).toEqual([])
    })

    it('should handle null values for optional fields', async () => {
      const newLaunch = {
        title: 'Null Fields Launch',
        slug: 'null-fields',
        heroImage: null,
        story: null,
        description: null
      }
      
      const request = new NextRequest('http://localhost:3000/api/launches', {
        method: 'POST',
        body: JSON.stringify(newLaunch)
      })
      
      const response = await createLaunch(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.heroImage).toBeNull()
      expect(data.story).toBeNull()
      expect(data.description).toBeNull()
    })

    it('should handle concurrent updates correctly', async () => {
      // Simulate two concurrent update requests
      const updates1 = { title: 'Update 1' }
      const updates2 = { description: 'Update 2' }
      
      const request1 = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: JSON.stringify(updates1)
      })
      
      const request2 = new NextRequest('http://localhost:3000/api/launches/launch-1', {
        method: 'PUT',
        body: JSON.stringify(updates2)
      })
      
      // Execute both updates
      const [response1, response2] = await Promise.all([
        updateLaunch(request1, { params: { id: 'launch-1' } }),
        updateLaunch(request2, { params: { id: 'launch-1' } })
      ])
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })
  })
})
