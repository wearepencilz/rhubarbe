/**
 * Unit Tests: Launches API Dynamic Route
 * 
 * Task 6.2: Create app/api/launches/[id]/route.ts
 * Requirements: 11.1
 * 
 * This test suite verifies that the launches dynamic API route correctly handles
 * GET, PUT, and DELETE requests for individual launches with proper validation
 * and referential integrity checks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from '../../app/api/launches/[id]/route'
import { NextRequest } from 'next/server'
import type { Launch } from '../../types/index.js'

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
import { getLaunches, saveLaunches, getSellables } from '../../lib/db.js'

const sampleLaunches: Launch[] = [
  {
    id: 'launch-1',
    title: 'Corn + Tomato Launch',
    slug: 'corn-tomato-launch',
    status: 'active',
    featuredFlavourIds: ['flav-1', 'flav-2'],
    featuredSellableIds: ['sell-1'],
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
    featuredSellableIds: ['sell-2', 'sell-3'],
    featured: false,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  }
]

describe('Launches API - GET by ID', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLaunches).mockResolvedValue(sampleLaunches)
  })

  it('should return a single launch by ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1')
    
    const response = await GET(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.id).toBe('launch-1')
    expect(data.title).toBe('Corn + Tomato Launch')
    expect(data.slug).toBe('corn-tomato-launch')
  })

  it('should return 404 when launch is not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/launches/nonexistent')
    
    const response = await GET(request, { params: { id: 'nonexistent' } })
    const data = await response.json()
    
    expect(response.status).toBe(404)
    expect(data.error).toBe('Launch not found')
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should return 500 when database fails', async () => {
    vi.mocked(getLaunches).mockRejectedValue(new Error('Database error'))
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1')
    
    const response = await GET(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch launch')
  })
})

describe('Launches API - PUT by ID', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLaunches).mockResolvedValue([...sampleLaunches])
    vi.mocked(saveLaunches).mockImplementation(async (launches) => launches)
  })

  it('should update a launch with valid data', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const updates = {
      title: 'Updated Title',
      description: 'Updated description'
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.id).toBe('launch-1')
    expect(data.title).toBe('Updated Title')
    expect(data.description).toBe('Updated description')
    expect(data.slug).toBe('corn-tomato-launch') // Unchanged
    expect(data.updatedAt).toBeDefined()
  })

  it('should update slug when provided', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const updates = {
      slug: 'new-slug'
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.slug).toBe('new-slug')
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    
    const updates = { title: 'Updated Title' }
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(data.code).toBe('AUTH_REQUIRED')
  })

  it('should return 404 when launch is not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const updates = { title: 'Updated Title' }
    
    const request = new NextRequest('http://localhost:3000/api/launches/nonexistent', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'nonexistent' } })
    const data = await response.json()
    
    expect(response.status).toBe(404)
    expect(data.error).toBe('Launch not found')
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should return 400 when title is empty string', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const updates = { title: '   ' }
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.code).toBe('INVALID_FIELD')
    expect(data.details.field).toBe('title')
  })

  it('should return 400 when slug is empty string', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const updates = { slug: '   ' }
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.code).toBe('INVALID_FIELD')
    expect(data.details.field).toBe('slug')
  })

  it('should return 400 when slug already exists on another launch', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const updates = { slug: 'peach-week' } // Exists on launch-2
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('A launch with this slug already exists')
    expect(data.code).toBe('DUPLICATE_SLUG')
    expect(data.details.existingId).toBe('launch-2')
  })

  it('should allow updating with same slug (case insensitive)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const updates = { slug: 'CORN-TOMATO-LAUNCH' } // Same slug, different case
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.slug).toBe('CORN-TOMATO-LAUNCH')
  })

  it('should not allow changing the ID', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const updates = { id: 'different-id', title: 'Updated Title' }
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.id).toBe('launch-1') // ID should remain unchanged
    expect(data.title).toBe('Updated Title')
  })

  it('should return 500 when database save fails', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    vi.mocked(saveLaunches).mockRejectedValue(new Error('Database error'))
    
    const updates = { title: 'Updated Title' }
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    
    const response = await PUT(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update launch')
  })
})

describe('Launches API - DELETE by ID', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLaunches).mockResolvedValue([...sampleLaunches])
    vi.mocked(saveLaunches).mockImplementation(async (launches) => launches)
    vi.mocked(getSellables).mockResolvedValue([])
  })

  it('should delete a launch when no references exist', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'DELETE'
    })
    
    const response = await DELETE(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Launch deleted successfully')
    
    // Verify launch was removed from array
    expect(saveLaunches).toHaveBeenCalled()
    const savedLaunches = vi.mocked(saveLaunches).mock.calls[0][0]
    expect(savedLaunches.find((l: any) => l.id === 'launch-1')).toBeUndefined()
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'DELETE'
    })
    
    const response = await DELETE(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(data.code).toBe('AUTH_REQUIRED')
  })

  it('should return 404 when launch is not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const request = new NextRequest('http://localhost:3000/api/launches/nonexistent', {
      method: 'DELETE'
    })
    
    const response = await DELETE(request, { params: { id: 'nonexistent' } })
    const data = await response.json()
    
    expect(response.status).toBe(404)
    expect(data.error).toBe('Launch not found')
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should return 400 when launch is referenced by sellables', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    vi.mocked(getSellables).mockResolvedValue([
      {
        id: 'sell-1',
        internalName: 'Test Sellable',
        publicName: 'Test Sellable',
        slug: 'test-sellable',
        status: 'active',
        formatId: 'format-1',
        primaryFlavourIds: ['flav-1'],
        tags: ['launch:launch-1'], // References the launch
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 500,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ] as any)
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'DELETE'
    })
    
    const response = await DELETE(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Cannot delete launch: it is referenced by sellables')
    expect(data.code).toBe('REFERENTIAL_INTEGRITY_VIOLATION')
    expect(data.details.referencingSellableIds).toEqual(['sell-1'])
    expect(data.details.count).toBe(1)
  })

  it('should return 500 when database save fails', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    vi.mocked(saveLaunches).mockRejectedValue(new Error('Database error'))
    
    const request = new NextRequest('http://localhost:3000/api/launches/launch-1', {
      method: 'DELETE'
    })
    
    const response = await DELETE(request, { params: { id: 'launch-1' } })
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete launch')
  })
})
