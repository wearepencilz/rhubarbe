/**
 * Unit Tests: Launches API Route
 * 
 * Task 6.1: Create app/api/launches/route.ts
 * Requirements: 11.1
 * 
 * This test suite verifies that the launches API route correctly handles
 * GET requests with filtering and POST requests with validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '../../app/api/launches/route'
import { NextRequest } from 'next/server'
import type { Launch } from '../../types/index.js'

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  auth: vi.fn()
}))

// Mock the db module
vi.mock('../../lib/db.js', () => ({
  getLaunches: vi.fn(),
  saveLaunches: vi.fn()
}))

import { auth } from '../../lib/auth.js'
import { getLaunches, saveLaunches } from '../../lib/db.js'

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
  },
  {
    id: 'launch-3',
    title: 'Summer Collection',
    slug: 'summer-collection',
    status: 'active',
    featuredFlavourIds: ['flav-4'],
    featuredSellableIds: ['sell-4'],
    featured: true,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z'
  }
]

describe('Launches API - GET', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLaunches).mockResolvedValue(sampleLaunches)
  })

  it('should return all launches when no filters are provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/launches')
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(3)
    expect(data[0].id).toBe('launch-1')
    expect(data[1].id).toBe('launch-2')
    expect(data[2].id).toBe('launch-3')
  })

  it('should filter launches by status', async () => {
    const request = new NextRequest('http://localhost:3000/api/launches?status=active')
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].status).toBe('active')
    expect(data[1].status).toBe('active')
  })

  it('should filter launches by status=upcoming', async () => {
    const request = new NextRequest('http://localhost:3000/api/launches?status=upcoming')
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('launch-2')
    expect(data[0].status).toBe('upcoming')
  })

  it('should filter launches by featured=true', async () => {
    const request = new NextRequest('http://localhost:3000/api/launches?featured=true')
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].featured).toBe(true)
    expect(data[1].featured).toBe(true)
  })

  it('should filter launches by featured=false', async () => {
    const request = new NextRequest('http://localhost:3000/api/launches?featured=false')
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('launch-2')
    expect(data[0].featured).toBe(false)
  })

  it('should combine status and featured filters', async () => {
    const request = new NextRequest('http://localhost:3000/api/launches?status=active&featured=true')
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].status).toBe('active')
    expect(data[0].featured).toBe(true)
    expect(data[1].status).toBe('active')
    expect(data[1].featured).toBe(true)
  })

  it('should return empty array when no launches match filters', async () => {
    const request = new NextRequest('http://localhost:3000/api/launches?status=ended')
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveLength(0)
  })

  it('should return 500 error when database fails', async () => {
    vi.mocked(getLaunches).mockRejectedValue(new Error('Database error'))
    
    const request = new NextRequest('http://localhost:3000/api/launches')
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch launches')
    expect(data.timestamp).toBeDefined()
  })
})

describe('Launches API - POST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLaunches).mockResolvedValue(sampleLaunches)
    vi.mocked(saveLaunches).mockImplementation(async (launches) => launches)
  })

  it('should create a new launch with required fields', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const newLaunch = {
      title: 'New Launch',
      slug: 'new-launch'
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.id).toBeDefined()
    expect(data.title).toBe('New Launch')
    expect(data.slug).toBe('new-launch')
    expect(data.status).toBe('upcoming')
    expect(data.featuredFlavourIds).toEqual([])
    expect(data.featuredSellableIds).toEqual([])
    expect(data.featured).toBe(false)
    expect(data.createdAt).toBeDefined()
    expect(data.updatedAt).toBeDefined()
  })

  it('should create a launch with all optional fields', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const newLaunch = {
      title: 'Full Launch',
      slug: 'full-launch',
      status: 'active',
      heroImage: '/images/hero.jpg',
      story: 'This is a story',
      description: 'This is a description',
      activeStart: '2024-01-01T00:00:00.000Z',
      activeEnd: '2024-12-31T23:59:59.999Z',
      featuredFlavourIds: ['flav-1'],
      featuredSellableIds: ['sell-1'],
      contentBlocks: [{ id: 'block-1', type: 'text', order: 1, content: {} }],
      relatedEventIds: ['event-1'],
      relatedMembershipDropIds: ['drop-1'],
      sortOrder: 5,
      featured: true
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.status).toBe('active')
    expect(data.heroImage).toBe('/images/hero.jpg')
    expect(data.story).toBe('This is a story')
    expect(data.description).toBe('This is a description')
    expect(data.activeStart).toBe('2024-01-01T00:00:00.000Z')
    expect(data.activeEnd).toBe('2024-12-31T23:59:59.999Z')
    expect(data.featuredFlavourIds).toEqual(['flav-1'])
    expect(data.featuredSellableIds).toEqual(['sell-1'])
    expect(data.contentBlocks).toHaveLength(1)
    expect(data.relatedEventIds).toEqual(['event-1'])
    expect(data.relatedMembershipDropIds).toEqual(['drop-1'])
    expect(data.sortOrder).toBe(5)
    expect(data.featured).toBe(true)
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    
    const newLaunch = {
      title: 'New Launch',
      slug: 'new-launch'
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(data.code).toBe('AUTH_REQUIRED')
  })

  it('should return 400 when title is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const newLaunch = {
      slug: 'new-launch'
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.code).toBe('MISSING_REQUIRED_FIELD')
    expect(data.details.field).toBe('title')
  })

  it('should return 400 when title is empty string', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const newLaunch = {
      title: '   ',
      slug: 'new-launch'
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.code).toBe('MISSING_REQUIRED_FIELD')
    expect(data.details.field).toBe('title')
  })

  it('should return 400 when slug is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const newLaunch = {
      title: 'New Launch'
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.code).toBe('MISSING_REQUIRED_FIELD')
    expect(data.details.field).toBe('slug')
  })

  it('should return 400 when slug is empty string', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const newLaunch = {
      title: 'New Launch',
      slug: '   '
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.code).toBe('MISSING_REQUIRED_FIELD')
    expect(data.details.field).toBe('slug')
  })

  it('should return 400 when slug already exists', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const newLaunch = {
      title: 'Duplicate Launch',
      slug: 'corn-tomato-launch' // Already exists in sampleLaunches
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('A launch with this slug already exists')
    expect(data.code).toBe('DUPLICATE_SLUG')
    expect(data.details.existingId).toBe('launch-1')
  })

  it('should return 400 when slug already exists (case insensitive)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    
    const newLaunch = {
      title: 'Duplicate Launch',
      slug: 'CORN-TOMATO-LAUNCH' // Case variation
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.error).toBe('A launch with this slug already exists')
    expect(data.code).toBe('DUPLICATE_SLUG')
  })

  it('should return 500 when database save fails', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    vi.mocked(getLaunches).mockResolvedValue([]) // Empty array to avoid duplicate slug
    vi.mocked(saveLaunches).mockRejectedValue(new Error('Database error'))
    
    const newLaunch = {
      title: 'New Launch',
      slug: 'new-launch'
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create launch')
    expect(data.timestamp).toBeDefined()
  })

  it('should save launch to database with correct structure', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
    vi.mocked(getLaunches).mockResolvedValue(sampleLaunches) // Reset to sample launches
    
    const newLaunch = {
      title: 'Test Launch',
      slug: 'test-launch'
    }
    
    const request = new NextRequest('http://localhost:3000/api/launches', {
      method: 'POST',
      body: JSON.stringify(newLaunch)
    })
    
    await POST(request)
    
    expect(saveLaunches).toHaveBeenCalled()
    const savedLaunches = vi.mocked(saveLaunches).mock.calls[vi.mocked(saveLaunches).mock.calls.length - 1][0]
    
    // Find the newly added launch
    const savedLaunch = savedLaunches.find((l: any) => l.slug === 'test-launch')
    expect(savedLaunch).toBeDefined()
    expect(savedLaunch.title).toBe('Test Launch')
    expect(savedLaunch.slug).toBe('test-launch')
    expect(savedLaunch.id).toBeDefined()
    expect(savedLaunch.createdAt).toBeDefined()
    expect(savedLaunch.updatedAt).toBeDefined()
  })
})
