/**
 * Unit Tests: Validation Edge Cases
 * 
 * Task 4.8: Write unit tests for validation edge cases
 * Requirements: 3.4, 3.5, 3.6
 * 
 * This test suite verifies edge case handling in validation functions:
 * - Empty flavour arrays
 * - Null/undefined values
 * - Boundary conditions
 * - Error accumulation
 */

import { describe, it, expect } from 'vitest'
import {
  validateSellableComposition,
  validateTwistFormat,
  validateSandwichFormat,
  validateModifierAvailability
} from '../../lib/validation'
import type {
  Sellable,
  Format,
  Flavour,
  Modifier
} from '../../types/index.js'

describe('Validation Edge Cases - validateSellableComposition', () => {
  const mockFormat: Format = {
    id: 'fmt-1',
    name: 'Scoop',
    slug: 'scoop',
    category: 'scoop',
    requiresFlavours: true,
    minFlavours: 1,
    maxFlavours: 3,
    canIncludeAddOns: true,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  const mockFlavours: Flavour[] = [
    {
      id: 'flav-1',
      name: 'Vanilla',
      slug: 'vanilla',
      type: 'gelato',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ]

  describe('Empty flavour arrays', () => {
    it('should fail when primaryFlavourIds is empty and format requires flavours', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Empty Sellable',
        publicName: 'Empty',
        slug: 'empty',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: [],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, mockFormat, mockFlavours, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('MIN_FLAVOURS_NOT_MET')
      expect(result.errors[0].message).toContain('at least 1 flavour')
    })

    it('should pass when primaryFlavourIds is empty and format does not require flavours', () => {
      const formatNoFlavours: Format = {
        ...mockFormat,
        requiresFlavours: false,
        minFlavours: 0
      }

      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Empty Sellable',
        publicName: 'Empty',
        slug: 'empty',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: [],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, formatNoFlavours, mockFlavours, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle empty flavours lookup array', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sellable',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1'],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, mockFormat, [], [])

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('FLAVOUR_NOT_FOUND')
    })
  })

  describe('Null/undefined values', () => {
    it('should handle undefined secondaryFlavourIds', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sellable',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1'],
        // secondaryFlavourIds is undefined
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, mockFormat, mockFlavours, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle undefined componentIds', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sellable',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1'],
        // componentIds is undefined
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, mockFormat, mockFlavours, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Boundary conditions', () => {
    it('should pass when flavour count equals minFlavours', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sellable',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1'], // exactly 1 flavour (min)
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, mockFormat, mockFlavours, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass when flavour count equals maxFlavours', () => {
      const flavours: Flavour[] = [
        { id: 'flav-1', name: 'Vanilla', slug: 'vanilla', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'flav-2', name: 'Chocolate', slug: 'chocolate', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'flav-3', name: 'Strawberry', slug: 'strawberry', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
      ]

      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sellable',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1', 'flav-2', 'flav-3'], // exactly 3 flavours (max)
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, mockFormat, flavours, [])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when flavour count is one below minFlavours', () => {
      const formatMin2: Format = {
        ...mockFormat,
        minFlavours: 2
      }

      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sellable',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1'], // 1 flavour, but min is 2
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, formatMin2, mockFlavours, [])

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'MIN_FLAVOURS_NOT_MET')).toBe(true)
    })

    it('should fail when flavour count is one above maxFlavours', () => {
      const flavours: Flavour[] = [
        { id: 'flav-1', name: 'Vanilla', slug: 'vanilla', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'flav-2', name: 'Chocolate', slug: 'chocolate', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'flav-3', name: 'Strawberry', slug: 'strawberry', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'flav-4', name: 'Mint', slug: 'mint', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
      ]

      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sellable',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1', 'flav-2', 'flav-3', 'flav-4'], // 4 flavours, but max is 3
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, mockFormat, flavours, [])

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'MAX_FLAVOURS_EXCEEDED')).toBe(true)
    })
  })

  describe('Error accumulation', () => {
    it('should accumulate multiple errors', () => {
      const flavours: Flavour[] = [
        { id: 'flav-1', name: 'Cookie', slug: 'cookie', type: 'cookie', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'flav-2', name: 'Sauce', slug: 'sauce', type: 'sauce', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
      ]

      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sellable',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1', 'flav-2', 'flav-missing'], // incompatible types + missing flavour
        price: 500,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSellableComposition(sellable, mockFormat, flavours, [])

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      
      const errorCodes = result.errors.map(e => e.code)
      expect(errorCodes).toContain('FLAVOUR_TYPE_INCOMPATIBLE')
      expect(errorCodes).toContain('FLAVOUR_NOT_FOUND')
    })
  })
})

describe('Validation Edge Cases - validateTwistFormat', () => {
  const mockFlavours: Flavour[] = [
    { id: 'flav-1', name: 'Vanilla', slug: 'vanilla', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    { id: 'flav-2', name: 'Strawberry', slug: 'strawberry', type: 'sorbet', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    { id: 'flav-3', name: 'Cookie', slug: 'cookie', type: 'cookie', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
  ]

  describe('Empty flavour arrays', () => {
    it('should fail when primaryFlavourIds is empty', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Empty Twist',
        publicName: 'Empty',
        slug: 'empty',
        status: 'draft',
        formatId: 'fmt-twist',
        primaryFlavourIds: [],
        price: 600,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateTwistFormat(sellable, mockFlavours)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('TWIST_EXACT_COUNT')
      expect(result.errors[0].message).toContain('exactly 2 flavours')
    })

    it('should handle empty flavours lookup array', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Twist',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-twist',
        primaryFlavourIds: ['flav-1', 'flav-2'],
        price: 600,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateTwistFormat(sellable, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].code).toBe('FLAVOUR_NOT_FOUND')
    })
  })

  describe('Null/undefined values', () => {
    it('should handle undefined secondaryFlavourIds', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Twist',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-twist',
        primaryFlavourIds: ['flav-1', 'flav-2'],
        // secondaryFlavourIds is undefined
        price: 600,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateTwistFormat(sellable, mockFlavours)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Boundary conditions', () => {
    it('should pass with exactly 2 flavours', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Valid Twist',
        publicName: 'Valid',
        slug: 'valid',
        status: 'draft',
        formatId: 'fmt-twist',
        primaryFlavourIds: ['flav-1', 'flav-2'],
        price: 600,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateTwistFormat(sellable, mockFlavours)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail with 1 flavour (one below required)', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Single Twist',
        publicName: 'Single',
        slug: 'single',
        status: 'draft',
        formatId: 'fmt-twist',
        primaryFlavourIds: ['flav-1'],
        price: 600,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateTwistFormat(sellable, mockFlavours)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('TWIST_EXACT_COUNT')
      expect(result.errors[0].message).toContain('1 selected')
    })

    it('should fail with 3 flavours (one above required)', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Triple Twist',
        publicName: 'Triple',
        slug: 'triple',
        status: 'draft',
        formatId: 'fmt-twist',
        primaryFlavourIds: ['flav-1', 'flav-2'],
        secondaryFlavourIds: ['flav-3'],
        price: 600,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateTwistFormat(sellable, mockFlavours)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].code).toBe('TWIST_EXACT_COUNT')
      expect(result.errors[0].message).toContain('3 selected')
    })
  })

  describe('Error accumulation', () => {
    it('should accumulate count error and type errors', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Invalid Twist',
        publicName: 'Invalid',
        slug: 'invalid',
        status: 'draft',
        formatId: 'fmt-twist',
        primaryFlavourIds: ['flav-3'], // only 1 flavour, and it's a cookie (wrong type)
        price: 600,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateTwistFormat(sellable, mockFlavours)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      
      const errorCodes = result.errors.map(e => e.code)
      expect(errorCodes).toContain('TWIST_EXACT_COUNT')
      expect(errorCodes).toContain('TWIST_TYPE_INCOMPATIBLE')
    })

    it('should accumulate multiple type errors', () => {
      const flavours: Flavour[] = [
        { id: 'flav-1', name: 'Cookie', slug: 'cookie', type: 'cookie', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'flav-2', name: 'Sauce', slug: 'sauce', type: 'sauce', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
      ]

      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Invalid Twist',
        publicName: 'Invalid',
        slug: 'invalid',
        status: 'draft',
        formatId: 'fmt-twist',
        primaryFlavourIds: ['flav-1', 'flav-2'], // both wrong types
        price: 600,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateTwistFormat(sellable, flavours)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors.every(e => e.code === 'TWIST_TYPE_INCOMPATIBLE')).toBe(true)
    })
  })
})

describe('Validation Edge Cases - validateSandwichFormat', () => {
  const mockFlavours: Flavour[] = [
    { id: 'flav-1', name: 'Vanilla', slug: 'vanilla', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    { id: 'flav-2', name: 'Strawberry', slug: 'strawberry', type: 'sorbet', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    { id: 'flav-3', name: 'Cookie', slug: 'cookie', type: 'cookie', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
  ]

  const mockComponents: Flavour[] = [
    { id: 'comp-1', name: 'Chocolate Chip Cookie', slug: 'choc-chip', type: 'cookie', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    { id: 'comp-2', name: 'Oatmeal Cookie', slug: 'oatmeal', type: 'cookie', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    { id: 'comp-3', name: 'Gelato', slug: 'gelato', type: 'gelato', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
  ]

  describe('Empty flavour arrays', () => {
    it('should fail when primaryFlavourIds is empty', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Empty Sandwich',
        publicName: 'Empty',
        slug: 'empty',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: [],
        componentIds: ['comp-1', 'comp-2'],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'SANDWICH_FILLING_COUNT')).toBe(true)
    })

    it('should fail when componentIds is empty', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'No Components',
        publicName: 'No Components',
        slug: 'no-components',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-1'],
        componentIds: [],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'SANDWICH_COMPONENT_COUNT')).toBe(true)
    })

    it('should handle empty flavours lookup array', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sandwich',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-1'],
        componentIds: ['comp-1', 'comp-2'],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, [], mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'FLAVOUR_NOT_FOUND')).toBe(true)
    })

    it('should handle empty components lookup array', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sandwich',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-1'],
        componentIds: ['comp-1', 'comp-2'],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, [])

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'COMPONENT_NOT_FOUND')).toBe(true)
    })
  })

  describe('Null/undefined values', () => {
    it('should handle undefined componentIds', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Test Sandwich',
        publicName: 'Test',
        slug: 'test',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-1'],
        // componentIds is undefined
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'SANDWICH_COMPONENT_COUNT')).toBe(true)
    })
  })

  describe('Boundary conditions', () => {
    it('should pass with exactly 1 filling and 2 components', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Valid Sandwich',
        publicName: 'Valid',
        slug: 'valid',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-1'],
        componentIds: ['comp-1', 'comp-2'],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail with 0 fillings (one below required)', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'No Filling',
        publicName: 'No Filling',
        slug: 'no-filling',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: [],
        componentIds: ['comp-1', 'comp-2'],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'SANDWICH_FILLING_COUNT')).toBe(true)
      expect(result.errors.find(e => e.code === 'SANDWICH_FILLING_COUNT')?.message).toContain('0 selected')
    })

    it('should fail with 2 fillings (one above required)', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Double Filling',
        publicName: 'Double Filling',
        slug: 'double-filling',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-1', 'flav-2'],
        componentIds: ['comp-1', 'comp-2'],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'SANDWICH_FILLING_COUNT')).toBe(true)
      expect(result.errors.find(e => e.code === 'SANDWICH_FILLING_COUNT')?.message).toContain('2 selected')
    })

    it('should fail with 1 component (one below required)', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Single Component',
        publicName: 'Single Component',
        slug: 'single-component',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-1'],
        componentIds: ['comp-1'],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'SANDWICH_COMPONENT_COUNT')).toBe(true)
      expect(result.errors.find(e => e.code === 'SANDWICH_COMPONENT_COUNT')?.message).toContain('1 selected')
    })

    it('should fail with 3 components (one above required)', () => {
      const components: Flavour[] = [
        ...mockComponents,
        { id: 'comp-4', name: 'Sugar Cookie', slug: 'sugar', type: 'cookie', status: 'active', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
      ]

      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Triple Component',
        publicName: 'Triple Component',
        slug: 'triple-component',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-1'],
        componentIds: ['comp-1', 'comp-2', 'comp-4'],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, components)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'SANDWICH_COMPONENT_COUNT')).toBe(true)
      expect(result.errors.find(e => e.code === 'SANDWICH_COMPONENT_COUNT')?.message).toContain('3 selected')
    })
  })

  describe('Error accumulation', () => {
    it('should accumulate filling count and component count errors', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Invalid Sandwich',
        publicName: 'Invalid',
        slug: 'invalid',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: [],
        componentIds: [],
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
      
      const errorCodes = result.errors.map(e => e.code)
      expect(errorCodes).toContain('SANDWICH_FILLING_COUNT')
      expect(errorCodes).toContain('SANDWICH_COMPONENT_COUNT')
    })

    it('should accumulate type errors for filling and components', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'Wrong Types',
        publicName: 'Wrong Types',
        slug: 'wrong-types',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-3'], // cookie type (wrong)
        componentIds: ['comp-1', 'comp-3'], // one cookie, one gelato (wrong)
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      
      const errorCodes = result.errors.map(e => e.code)
      expect(errorCodes).toContain('SANDWICH_FILLING_TYPE')
      expect(errorCodes).toContain('SANDWICH_COMPONENT_TYPE')
    })

    it('should accumulate all error types together', () => {
      const sellable: Sellable = {
        id: 'sell-1',
        internalName: 'All Errors',
        publicName: 'All Errors',
        slug: 'all-errors',
        status: 'draft',
        formatId: 'fmt-sandwich',
        primaryFlavourIds: ['flav-3', 'flav-missing'], // wrong count, wrong type, missing
        componentIds: ['comp-3'], // wrong count, wrong type
        price: 800,
        inventoryTracked: false,
        onlineOrderable: false,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      const result = validateSandwichFormat(sellable, mockFlavours, mockComponents)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(2)
      
      const errorCodes = result.errors.map(e => e.code)
      expect(errorCodes).toContain('SANDWICH_FILLING_COUNT')
      expect(errorCodes).toContain('SANDWICH_COMPONENT_COUNT')
    })
  })
})

describe('Validation Edge Cases - validateModifierAvailability', () => {
  const mockFormat: Format = {
    id: 'fmt-1',
    name: 'Cup',
    slug: 'cup',
    category: 'cup',
    requiresFlavours: true,
    minFlavours: 1,
    maxFlavours: 3,
    canIncludeAddOns: true,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  const mockModifier: Modifier = {
    id: 'mod-1',
    name: 'Hot Fudge',
    slug: 'hot-fudge',
    type: 'sauce',
    price: 150,
    allergens: ['dairy'],
    dietaryFlags: ['vegetarian'],
    availableForFormatIds: ['fmt-1'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  describe('Empty arrays', () => {
    it('should fail when modifier has empty availableForFormatIds', () => {
      const modifier: Modifier = {
        ...mockModifier,
        availableForFormatIds: []
      }

      const result = validateModifierAvailability(modifier, mockFormat)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'MODIFIER_NOT_AVAILABLE')).toBe(true)
    })
  })

  describe('Format restrictions', () => {
    it('should pass when format allows modifiers and modifier is available', () => {
      const result = validateModifierAvailability(mockModifier, mockFormat)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when format does not allow modifiers', () => {
      const formatNoAddOns: Format = {
        ...mockFormat,
        canIncludeAddOns: false
      }

      const result = validateModifierAvailability(mockModifier, formatNoAddOns)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'FORMAT_NO_MODIFIERS')).toBe(true)
    })

    it('should fail when modifier is not available for format', () => {
      const modifier: Modifier = {
        ...mockModifier,
        availableForFormatIds: ['fmt-2', 'fmt-3'] // doesn't include fmt-1
      }

      const result = validateModifierAvailability(modifier, mockFormat)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'MODIFIER_NOT_AVAILABLE')).toBe(true)
    })
  })

  describe('Error accumulation', () => {
    it('should accumulate both format and availability errors', () => {
      const formatNoAddOns: Format = {
        ...mockFormat,
        canIncludeAddOns: false
      }

      const modifier: Modifier = {
        ...mockModifier,
        availableForFormatIds: ['fmt-2'] // doesn't include fmt-1
      }

      const result = validateModifierAvailability(modifier, formatNoAddOns)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      
      const errorCodes = result.errors.map(e => e.code)
      expect(errorCodes).toContain('FORMAT_NO_MODIFIERS')
      expect(errorCodes).toContain('MODIFIER_NOT_AVAILABLE')
    })
  })

  describe('Boundary conditions', () => {
    it('should pass when modifier is available for multiple formats including target', () => {
      const modifier: Modifier = {
        ...mockModifier,
        availableForFormatIds: ['fmt-0', 'fmt-1', 'fmt-2', 'fmt-3']
      }

      const result = validateModifierAvailability(modifier, mockFormat)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass when modifier is available for only the target format', () => {
      const modifier: Modifier = {
        ...mockModifier,
        availableForFormatIds: ['fmt-1'] // only this format
      }

      const result = validateModifierAvailability(modifier, mockFormat)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
