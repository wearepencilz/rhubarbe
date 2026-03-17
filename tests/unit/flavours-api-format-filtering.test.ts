/**
 * Unit tests for Flavours API format filtering logic (Task 9.1)
 * Tests the format eligibility filtering and type validation
 */

import { describe, it, expect } from 'vitest'
import { getEligibleFormats, filterEligibleFlavours, isEligibleForFormat } from '@/lib/format-eligibility'
import type { Flavour, Format, FlavourType } from '@/types'

describe('Flavours API Format Filtering (Task 9.1)', () => {
  const mockFlavours: Flavour[] = [
    {
      id: '1',
      name: 'Vanilla Gelato',
      slug: 'vanilla-gelato',
      type: 'gelato',
      ingredients: [],
      allergens: [],
      dietaryTags: [],
      keyNotes: [],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Lemon Sorbet',
      slug: 'lemon-sorbet',
      type: 'sorbet',
      ingredients: [],
      allergens: [],
      dietaryTags: [],
      keyNotes: [],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'Chocolate Cookie',
      slug: 'chocolate-cookie',
      type: 'cookie',
      ingredients: [],
      allergens: [],
      dietaryTags: [],
      keyNotes: [],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'Soft Serve Base',
      slug: 'soft-serve-base',
      type: 'soft-serve-base',
      ingredients: [],
      allergens: [],
      dietaryTags: [],
      keyNotes: [],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '5',
      name: 'Hot Fudge',
      slug: 'hot-fudge',
      type: 'sauce',
      ingredients: [],
      allergens: [],
      dietaryTags: [],
      keyNotes: [],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]

  describe('getEligibleFormats', () => {
    it('should return correct eligible formats for gelato', () => {
      const formats = getEligibleFormats('gelato')
      expect(formats).toEqual(['scoop', 'take-home', 'twist', 'sandwich'])
    })

    it('should return correct eligible formats for sorbet', () => {
      const formats = getEligibleFormats('sorbet')
      expect(formats).toEqual(['scoop', 'take-home', 'twist'])
    })

    it('should return correct eligible formats for soft-serve-base', () => {
      const formats = getEligibleFormats('soft-serve-base')
      expect(formats).toEqual(['soft-serve'])
    })

    it('should return correct eligible formats for cookie', () => {
      const formats = getEligibleFormats('cookie')
      expect(formats).toEqual(['sandwich'])
    })

    it('should return empty array for topping', () => {
      const formats = getEligibleFormats('topping')
      expect(formats).toEqual([])
    })

    it('should return empty array for sauce', () => {
      const formats = getEligibleFormats('sauce')
      expect(formats).toEqual([])
    })
  })

  describe('filterEligibleFlavours', () => {
    it('should filter flavours for scoop format (gelato and sorbet only)', () => {
      const scoopFormat: Format = {
        id: 'f1',
        name: 'Single Scoop',
        slug: 'single-scoop',
        category: 'scoop',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const filtered = filterEligibleFlavours(mockFlavours, scoopFormat)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.map(f => f.type)).toEqual(['gelato', 'sorbet'])
    })

    it('should filter flavours for sandwich format (gelato and cookie)', () => {
      const sandwichFormat: Format = {
        id: 'f2',
        name: 'Ice Cream Sandwich',
        slug: 'ice-cream-sandwich',
        category: 'sandwich',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const filtered = filterEligibleFlavours(mockFlavours, sandwichFormat)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.map(f => f.type).sort()).toEqual(['cookie', 'gelato'])
    })

    it('should filter flavours for soft-serve format (soft-serve-base only)', () => {
      const softServeFormat: Format = {
        id: 'f3',
        name: 'Soft Serve Cone',
        slug: 'soft-serve-cone',
        category: 'soft-serve',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const filtered = filterEligibleFlavours(mockFlavours, softServeFormat)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('soft-serve-base')
    })

    it('should filter flavours for twist format (gelato and sorbet only)', () => {
      const twistFormat: Format = {
        id: 'f4',
        name: 'Twist',
        slug: 'twist',
        category: 'twist',
        requiresFlavours: true,
        minFlavours: 2,
        maxFlavours: 2,
        allowMixedTypes: true,
        canIncludeAddOns: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const filtered = filterEligibleFlavours(mockFlavours, twistFormat)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.map(f => f.type)).toEqual(['gelato', 'sorbet'])
    })

    it('should filter flavours for take-home format (gelato and sorbet only)', () => {
      const takeHomeFormat: Format = {
        id: 'f5',
        name: 'Pint',
        slug: 'pint',
        category: 'take-home',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      const filtered = filterEligibleFlavours(mockFlavours, takeHomeFormat)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.map(f => f.type)).toEqual(['gelato', 'sorbet'])
    })
  })

  describe('Type validation', () => {
    it('should validate all FlavourType values', () => {
      const validTypes: FlavourType[] = ['gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce']
      
      validTypes.forEach(type => {
        const formats = getEligibleFormats(type)
        expect(Array.isArray(formats)).toBe(true)
      })
    })

    it('should correctly identify eligible format categories', () => {
      expect(isEligibleForFormat('gelato', 'scoop')).toBe(true)
      expect(isEligibleForFormat('gelato', 'sandwich')).toBe(true)
      expect(isEligibleForFormat('sorbet', 'scoop')).toBe(true)
      expect(isEligibleForFormat('sorbet', 'sandwich')).toBe(false)
      expect(isEligibleForFormat('cookie', 'sandwich')).toBe(true)
      expect(isEligibleForFormat('cookie', 'scoop')).toBe(false)
      expect(isEligibleForFormat('soft-serve-base', 'soft-serve')).toBe(true)
      expect(isEligibleForFormat('soft-serve-base', 'scoop')).toBe(false)
      expect(isEligibleForFormat('topping', 'scoop')).toBe(false)
      expect(isEligibleForFormat('sauce', 'scoop')).toBe(false)
    })
  })

  describe('API integration scenarios', () => {
    it('should support filtering by type parameter', () => {
      const gelatoFlavours = mockFlavours.filter(f => f.type === 'gelato')
      expect(gelatoFlavours).toHaveLength(1)
      expect(gelatoFlavours[0].name).toBe('Vanilla Gelato')
    })

    it('should support adding eligibleFormats to response', () => {
      const flavoursWithEligibility = mockFlavours.map(flavour => ({
        ...flavour,
        eligibleFormats: getEligibleFormats(flavour.type)
      }))

      expect(flavoursWithEligibility[0].eligibleFormats).toEqual(['scoop', 'take-home', 'twist', 'sandwich'])
      expect(flavoursWithEligibility[1].eligibleFormats).toEqual(['scoop', 'take-home', 'twist'])
      expect(flavoursWithEligibility[2].eligibleFormats).toEqual(['sandwich'])
      expect(flavoursWithEligibility[3].eligibleFormats).toEqual(['soft-serve'])
      expect(flavoursWithEligibility[4].eligibleFormats).toEqual([])
    })
  })
})
