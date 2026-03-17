/**
 * Integration Tests: Flavours API Endpoints
 * 
 * Task 9.3: Write integration tests for updated flavour endpoints
 * Requirements: 11.5
 * 
 * This test suite verifies the full API flow including database operations
 * for /api/flavours and /api/formats/[id]/eligible-flavours endpoints.
 * Tests type filtering, format filtering, eligibleFormats field, and eligible flavours endpoint.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET as getFlavours, POST as createFlavour } from '../../app/api/flavours/route'
import { GET as getEligibleFlavours } from '../../app/api/formats/[id]/eligible-flavours/route'
import { NextRequest } from 'next/server'
import { getFlavours as dbGetFlavours, saveFlavours as dbSaveFlavours, getFormats } from '../../lib/db'
import type { Flavour, Format } from '../../types/index.js'

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  auth: vi.fn()
}))

// Mock the db module
vi.mock('../../lib/db.js', () => ({
  getFlavours: vi.fn(),
  saveFlavours: vi.fn(),
  getFormats: vi.fn()
}))

import { auth } from '../../lib/auth.js'

describe('Integration Tests: Flavours API', () => {
  let testFlavours: Flavour[]
  let testFormats: Format[]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup test formats
    testFormats = [
      {
        id: 'format-scoop',
        name: 'Scoop',
        slug: 'scoop',
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
        id: 'format-twist',
        name: 'Twist',
        slug: 'twist',
        category: 'twist',
        requiresFlavours: true,
        minFlavours: 2,
        maxFlavours: 2,
        allowMixedTypes: false,
        canIncludeAddOns: false,
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
      },
      {
        id: 'format-soft-serve',
        name: 'Soft Serve',
        slug: 'soft-serve',
        category: 'soft-serve',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]
    
    // Setup test flavours with different types
    testFlavours = [
      {
        id: 'flav-1',
        name: 'Vanilla Bean',
        slug: 'vanilla-bean',
        type: 'gelato',
        baseStyle: 'dairy',
        ingredients: [],
        keyNotes: ['vanilla', 'cream'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian'],
        status: 'active',
        featured: false,
        colour: '#F5E6D3',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'flav-2',
        name: 'Dark Chocolate',
        slug: 'dark-chocolate',
        type: 'gelato',
        baseStyle: 'dairy',
        ingredients: [],
        keyNotes: ['chocolate', 'cocoa'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian'],
        status: 'active',
        featured: false,
        colour: '#3E2723',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      },
      {
        id: 'flav-3',
        name: 'Strawberry',
        slug: 'strawberry',
        type: 'sorbet',
        baseStyle: 'fruit',
        ingredients: [],
        keyNotes: ['strawberry', 'fruit'],
        allergens: [],
        dietaryTags: ['vegan', 'gluten-free'],
        status: 'active',
        featured: false,
        colour: '#FF6B6B',
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z'
      },
      {
        id: 'flav-4',
        name: 'Vanilla Soft Serve Base',
        slug: 'vanilla-soft-serve',
        type: 'soft-serve-base',
        baseStyle: 'dairy',
        ingredients: [],
        keyNotes: ['vanilla', 'smooth'],
        allergens: ['dairy'],
        dietaryTags: [],
        status: 'active',
        featured: false,
        colour: '#FFFACD',
        createdAt: '2024-01-04T00:00:00.000Z',
        updatedAt: '2024-01-04T00:00:00.000Z'
      },
      {
        id: 'flav-5',
        name: 'Chocolate Chip Cookie',
        slug: 'chocolate-chip-cookie',
        type: 'cookie',
        baseStyle: 'baked',
        ingredients: [],
        keyNotes: ['cookie', 'chocolate'],
        allergens: ['gluten', 'dairy', 'eggs'],
        dietaryTags: [],
        status: 'active',
        featured: false,
        colour: '#D2691E',
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-05T00:00:00.000Z'
      },
      {
        id: 'flav-6',
        name: 'Caramel Sauce',
        slug: 'caramel-sauce',
        type: 'sauce',
        baseStyle: 'sauce',
        ingredients: [],
        keyNotes: ['caramel', 'sweet'],
        allergens: ['dairy'],
        dietaryTags: [],
        status: 'active',
        featured: false,
        colour: '#C19A6B',
        createdAt: '2024-01-06T00:00:00.000Z',
        updatedAt: '2024-01-06T00:00:00.000Z'
      },
      {
        id: 'flav-7',
        name: 'Archived Gelato',
        slug: 'archived-gelato',
        type: 'gelato',
        baseStyle: 'dairy',
        ingredients: [],
        keyNotes: ['old'],
        allergens: [],
        dietaryTags: [],
        status: 'archived',
        featured: false,
        colour: '#CCCCCC',
        createdAt: '2024-01-07T00:00:00.000Z',
        updatedAt: '2024-01-07T00:00:00.000Z'
      }
    ]

    vi.mocked(dbGetFlavours).mockResolvedValue(testFlavours)
    vi.mocked(dbSaveFlavours).mockImplementation(async (flavours) => flavours)
    vi.mocked(getFormats).mockResolvedValue(testFormats)
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })


  describe('GET /api/flavours - Type Filtering', () => {
    it('should retrieve all flavours without type filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(7)
      expect(data.total).toBe(7)
    })

    it('should filter flavours by type=gelato', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=gelato')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(3)
      expect(data.data.every((f: Flavour) => f.type === 'gelato')).toBe(true)
      expect(data.data.map((f: Flavour) => f.id)).toEqual(['flav-1', 'flav-2', 'flav-7'])
    })

    it('should filter flavours by type=sorbet', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=sorbet')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe('flav-3')
      expect(data.data[0].type).toBe('sorbet')
    })

    it('should filter flavours by type=soft-serve-base', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=soft-serve-base')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe('flav-4')
      expect(data.data[0].type).toBe('soft-serve-base')
    })

    it('should filter flavours by type=cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=cookie')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe('flav-5')
      expect(data.data[0].type).toBe('cookie')
    })

    it('should filter flavours by type=topping', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=topping')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(0)
    })

    it('should filter flavours by type=sauce', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=sauce')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe('flav-6')
      expect(data.data[0].type).toBe('sauce')
    })

    it('should combine type and status filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=gelato&status=active')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(2)
      expect(data.data.every((f: Flavour) => f.type === 'gelato' && f.status === 'active')).toBe(true)
    })
  })


  describe('GET /api/flavours - Format Filtering', () => {
    it('should filter flavours by formatId for scoop format', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?formatId=format-scoop')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      // Scoop format (category: scoop) should include gelato and sorbet
      expect(data.data).toHaveLength(4) // flav-1, flav-2, flav-3, flav-7
      expect(data.data.every((f: Flavour) => ['gelato', 'sorbet'].includes(f.type))).toBe(true)
    })

    it('should filter flavours by formatId for take-home format', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?formatId=format-pint')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      // Take-home format should include gelato and sorbet
      expect(data.data).toHaveLength(4) // flav-1, flav-2, flav-3, flav-7
      expect(data.data.every((f: Flavour) => ['gelato', 'sorbet'].includes(f.type))).toBe(true)
    })

    it('should filter flavours by formatId for twist format', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?formatId=format-twist')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      // Twist format should include gelato and sorbet
      expect(data.data).toHaveLength(4) // flav-1, flav-2, flav-3, flav-7
      expect(data.data.every((f: Flavour) => ['gelato', 'sorbet'].includes(f.type))).toBe(true)
    })

    it('should filter flavours by formatId for sandwich format', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?formatId=format-sandwich')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      // Sandwich format should include gelato and cookie
      expect(data.data).toHaveLength(4) // flav-1, flav-2, flav-5, flav-7
      expect(data.data.every((f: Flavour) => ['gelato', 'cookie'].includes(f.type))).toBe(true)
    })

    it('should filter flavours by formatId for soft-serve format', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?formatId=format-soft-serve')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      // Soft-serve format should only include soft-serve-base
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe('flav-4')
      expect(data.data[0].type).toBe('soft-serve-base')
    })

    it('should return 404 when formatId does not exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?formatId=nonexistent')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Format not found')
      expect(data.code).toBe('FORMAT_NOT_FOUND')
    })

    it('should combine formatId and status filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?formatId=format-scoop&status=active')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      // Should only include active gelato and sorbet
      expect(data.data).toHaveLength(3) // flav-1, flav-2, flav-3 (excludes archived flav-7)
      expect(data.data.every((f: Flavour) => f.status === 'active')).toBe(true)
    })
  })


  describe('GET /api/flavours - EligibleFormats Field', () => {
    it('should include eligibleFormats field for gelato flavours', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=gelato&status=active')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(2)
      
      // Gelato should be eligible for scoop, take-home, twist, sandwich
      data.data.forEach((flavour: any) => {
        expect(flavour.eligibleFormats).toBeDefined()
        expect(flavour.eligibleFormats).toEqual(['scoop', 'take-home', 'twist', 'sandwich'])
      })
    })

    it('should include eligibleFormats field for sorbet flavours', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=sorbet')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      
      // Sorbet should be eligible for scoop, take-home, twist
      expect(data.data[0].eligibleFormats).toEqual(['scoop', 'take-home', 'twist'])
    })

    it('should include eligibleFormats field for soft-serve-base flavours', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=soft-serve-base')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      
      // Soft-serve-base should only be eligible for soft-serve
      expect(data.data[0].eligibleFormats).toEqual(['soft-serve'])
    })

    it('should include eligibleFormats field for cookie flavours', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=cookie')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      
      // Cookie should only be eligible for sandwich
      expect(data.data[0].eligibleFormats).toEqual(['sandwich'])
    })

    it('should include eligibleFormats field for sauce flavours', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours?type=sauce')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      
      // Sauce should have empty eligibleFormats (used as modifier)
      expect(data.data[0].eligibleFormats).toEqual([])
    })

    it('should include eligibleFormats for all flavours without filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/flavours')
      
      const response = await getFlavours(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      
      // Verify every flavour has eligibleFormats field
      data.data.forEach((flavour: any) => {
        expect(flavour.eligibleFormats).toBeDefined()
        expect(Array.isArray(flavour.eligibleFormats)).toBe(true)
      })
    })
  })


  describe('POST /api/flavours - Type Validation', () => {
    it('should create a flavour with valid type', async () => {
      const newFlavour = {
        name: 'Pistachio',
        slug: 'pistachio',
        type: 'gelato',
        baseStyle: 'dairy',
        keyNotes: ['pistachio', 'nutty'],
        allergens: ['dairy', 'nuts'],
        dietaryTags: ['vegetarian']
      }
      
      const request = new NextRequest('http://localhost:3000/api/flavours', {
        method: 'POST',
        body: JSON.stringify(newFlavour)
      })
      
      const response = await createFlavour(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.id).toBeDefined()
      expect(data.name).toBe('Pistachio')
      expect(data.type).toBe('gelato')
      expect(data.eligibleFormats).toEqual(['scoop', 'take-home', 'twist', 'sandwich'])
      expect(dbSaveFlavours).toHaveBeenCalled()
    })

    it('should reject creation when type is missing', async () => {
      const newFlavour = {
        name: 'Missing Type',
        slug: 'missing-type',
        baseStyle: 'dairy',
        keyNotes: [],
        allergens: [],
        dietaryTags: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/flavours', {
        method: 'POST',
        body: JSON.stringify(newFlavour)
      })
      
      const response = await createFlavour(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Type field is required')
      expect(data.code).toBe('MISSING_TYPE')
      expect(dbSaveFlavours).not.toHaveBeenCalled()
    })

    it('should reject creation when type is invalid', async () => {
      const newFlavour = {
        name: 'Invalid Type',
        slug: 'invalid-type',
        type: 'invalid-type',
        baseStyle: 'dairy',
        keyNotes: [],
        allergens: [],
        dietaryTags: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/flavours', {
        method: 'POST',
        body: JSON.stringify(newFlavour)
      })
      
      const response = await createFlavour(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid type value')
      expect(data.code).toBe('INVALID_TYPE')
      expect(data.details.provided).toBe('invalid-type')
      expect(data.details.validTypes).toEqual(['gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce'])
      expect(dbSaveFlavours).not.toHaveBeenCalled()
    })

    it('should create flavours with all valid types', async () => {
      const validTypes = ['gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce']
      
      for (const type of validTypes) {
        const newFlavour = {
          name: `Test ${type}`,
          slug: `test-${type}`,
          type: type,
          baseStyle: 'dairy',
          keyNotes: [],
          allergens: [],
          dietaryTags: []
        }
        
        const request = new NextRequest('http://localhost:3000/api/flavours', {
          method: 'POST',
          body: JSON.stringify(newFlavour)
        })
        
        const response = await createFlavour(request)
        const data = await response.json()
        
        expect(response.status).toBe(201)
        expect(data.type).toBe(type)
        expect(data.eligibleFormats).toBeDefined()
      }
    })

    it('should reject creation when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      
      const newFlavour = {
        name: 'Unauthorized',
        slug: 'unauthorized',
        type: 'gelato',
        baseStyle: 'dairy',
        keyNotes: [],
        allergens: [],
        dietaryTags: []
      }
      
      const request = new NextRequest('http://localhost:3000/api/flavours', {
        method: 'POST',
        body: JSON.stringify(newFlavour)
      })
      
      const response = await createFlavour(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(data.code).toBe('AUTH_REQUIRED')
      expect(dbSaveFlavours).not.toHaveBeenCalled()
    })
  })


  describe('GET /api/formats/[id]/eligible-flavours - Eligible Flavours Endpoint', () => {
    it('should return format and eligible flavours for scoop format', async () => {
      const request = new NextRequest('http://localhost:3000/api/formats/format-scoop/eligible-flavours')
      
      const response = await getEligibleFlavours(request, { params: { id: 'format-scoop' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.format).toBeDefined()
      expect(data.format.id).toBe('format-scoop')
      expect(data.format.name).toBe('Scoop')
      expect(data.format.category).toBe('scoop')
      
      expect(data.eligibleFlavours).toBeDefined()
      expect(data.eligibleFlavours).toHaveLength(4) // gelato and sorbet
      expect(data.eligibleFlavours.every((f: Flavour) => ['gelato', 'sorbet'].includes(f.type))).toBe(true)
    })

    it('should return format and eligible flavours for take-home format', async () => {
      const request = new NextRequest('http://localhost:3000/api/formats/format-pint/eligible-flavours')
      
      const response = await getEligibleFlavours(request, { params: { id: 'format-pint' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.format.id).toBe('format-pint')
      expect(data.format.category).toBe('take-home')
      
      expect(data.eligibleFlavours).toHaveLength(4) // gelato and sorbet
      expect(data.eligibleFlavours.every((f: Flavour) => ['gelato', 'sorbet'].includes(f.type))).toBe(true)
    })

    it('should return format and eligible flavours for twist format', async () => {
      const request = new NextRequest('http://localhost:3000/api/formats/format-twist/eligible-flavours')
      
      const response = await getEligibleFlavours(request, { params: { id: 'format-twist' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.format.id).toBe('format-twist')
      expect(data.format.category).toBe('twist')
      
      expect(data.eligibleFlavours).toHaveLength(4) // gelato and sorbet
      expect(data.eligibleFlavours.every((f: Flavour) => ['gelato', 'sorbet'].includes(f.type))).toBe(true)
    })

    it('should return format and eligible flavours for sandwich format', async () => {
      const request = new NextRequest('http://localhost:3000/api/formats/format-sandwich/eligible-flavours')
      
      const response = await getEligibleFlavours(request, { params: { id: 'format-sandwich' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.format.id).toBe('format-sandwich')
      expect(data.format.category).toBe('sandwich')
      
      expect(data.eligibleFlavours).toHaveLength(4) // gelato and cookie
      expect(data.eligibleFlavours.every((f: Flavour) => ['gelato', 'cookie'].includes(f.type))).toBe(true)
    })

    it('should return format and eligible flavours for soft-serve format', async () => {
      const request = new NextRequest('http://localhost:3000/api/formats/format-soft-serve/eligible-flavours')
      
      const response = await getEligibleFlavours(request, { params: { id: 'format-soft-serve' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.format.id).toBe('format-soft-serve')
      expect(data.format.category).toBe('soft-serve')
      
      expect(data.eligibleFlavours).toHaveLength(1) // only soft-serve-base
      expect(data.eligibleFlavours[0].id).toBe('flav-4')
      expect(data.eligibleFlavours[0].type).toBe('soft-serve-base')
    })

    it('should filter eligible flavours by status=active', async () => {
      const request = new NextRequest('http://localhost:3000/api/formats/format-scoop/eligible-flavours?status=active')
      
      const response = await getEligibleFlavours(request, { params: { id: 'format-scoop' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.eligibleFlavours).toHaveLength(3) // excludes archived flav-7
      expect(data.eligibleFlavours.every((f: Flavour) => f.status === 'active')).toBe(true)
    })

    it('should filter eligible flavours by status=archived', async () => {
      const request = new NextRequest('http://localhost:3000/api/formats/format-scoop/eligible-flavours?status=archived')
      
      const response = await getEligibleFlavours(request, { params: { id: 'format-scoop' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.eligibleFlavours).toHaveLength(1) // only flav-7
      expect(data.eligibleFlavours[0].id).toBe('flav-7')
      expect(data.eligibleFlavours[0].status).toBe('archived')
    })

    it('should return 404 when format does not exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/formats/nonexistent/eligible-flavours')
      
      const response = await getEligibleFlavours(request, { params: { id: 'nonexistent' } })
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Format not found')
      expect(data.code).toBe('NOT_FOUND')
    })

    it('should return empty array when no flavours are eligible', async () => {
      // Create a format with a category that has no eligible flavours
      const customFormats = [
        ...testFormats,
        {
          id: 'format-custom',
          name: 'Custom Format',
          slug: 'custom',
          category: 'custom' as any,
          requiresFlavours: false,
          minFlavours: 0,
          maxFlavours: 0,
          allowMixedTypes: false,
          canIncludeAddOns: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]
      
      vi.mocked(getFormats).mockResolvedValue(customFormats)
      
      const request = new NextRequest('http://localhost:3000/api/formats/format-custom/eligible-flavours')
      
      const response = await getEligibleFlavours(request, { params: { id: 'format-custom' } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.format.id).toBe('format-custom')
      expect(data.eligibleFlavours).toHaveLength(0)
    })
  })
})
