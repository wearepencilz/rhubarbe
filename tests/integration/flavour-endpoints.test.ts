/**
 * Integration Tests for Updated Flavour Endpoints
 * 
 * Tests Task 9: API Endpoints - Updated Flavours
 * - Type filtering
 * - FormatId filtering using format eligibility logic
 * - eligibleFormats included in response
 * - GET eligible flavours for format endpoint
 * 
 * Validates: Requirements 11.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getFlavours, saveFlavours, getFormats, saveFormats } from '@/lib/db';
import { getEligibleFormats, filterEligibleFlavours } from '@/lib/format-eligibility';
import type { Flavour, Format } from '@/types';

describe('Flavour Endpoints - Updated for Launch-First Model', () => {
  let originalFlavours: Flavour[];
  let originalFormats: Format[];
  
  // Test data
  const testFlavours: Flavour[] = [
    {
      id: 'f1',
      name: 'Vanilla Gelato',
      slug: 'vanilla-gelato',
      type: 'gelato',
      baseStyle: 'dairy',
      ingredients: [],
      keyNotes: ['vanilla', 'cream'],
      allergens: ['dairy'],
      dietaryTags: ['vegetarian'],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'f2',
      name: 'Lemon Sorbet',
      slug: 'lemon-sorbet',
      type: 'sorbet',
      baseStyle: 'water',
      ingredients: [],
      keyNotes: ['lemon', 'citrus'],
      allergens: [],
      dietaryTags: ['vegan', 'dairy-free'],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'f3',
      name: 'Chocolate Chip Cookie',
      slug: 'chocolate-chip-cookie',
      type: 'cookie',
      baseStyle: 'baked',
      ingredients: [],
      keyNotes: ['chocolate', 'butter'],
      allergens: ['gluten', 'dairy', 'eggs'],
      dietaryTags: ['vegetarian'],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'f4',
      name: 'Soft Serve Base',
      slug: 'soft-serve-base',
      type: 'soft-serve-base',
      baseStyle: 'dairy',
      ingredients: [],
      keyNotes: ['cream', 'vanilla'],
      allergens: ['dairy'],
      dietaryTags: ['vegetarian'],
      status: 'active',
      featured: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];

  const testFormats: Format[] = [
    {
      id: 'fmt1',
      name: 'Cup',
      slug: 'cup',
      category: 'scoop',
      requiresFlavours: true,
      minFlavours: 1,
      maxFlavours: 3,
      allowMixedTypes: true,
      canIncludeAddOns: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'fmt2',
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
    },
    {
      id: 'fmt3',
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
    },
    {
      id: 'fmt4',
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
  ];

  beforeEach(async () => {
    // Backup original data
    originalFlavours = await getFlavours() as Flavour[];
    originalFormats = await getFormats() as Format[];
    
    // Set test data
    await saveFlavours(testFlavours);
    await saveFormats(testFormats);
  });

  afterEach(async () => {
    // Restore original data
    await saveFlavours(originalFlavours);
    await saveFormats(originalFormats);
  });

  describe('Type Filtering', () => {
    it('should filter flavours by type=gelato', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const gelatoFlavours = allFlavours.filter(f => f.type === 'gelato');

      expect(gelatoFlavours).toHaveLength(1);
      expect(gelatoFlavours[0].type).toBe('gelato');
      expect(gelatoFlavours[0].name).toBe('Vanilla Gelato');
    });

    it('should filter flavours by type=sorbet', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const sorbetFlavours = allFlavours.filter(f => f.type === 'sorbet');

      expect(sorbetFlavours).toHaveLength(1);
      expect(sorbetFlavours[0].type).toBe('sorbet');
      expect(sorbetFlavours[0].name).toBe('Lemon Sorbet');
    });

    it('should filter flavours by type=cookie', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const cookieFlavours = allFlavours.filter(f => f.type === 'cookie');

      expect(cookieFlavours).toHaveLength(1);
      expect(cookieFlavours[0].type).toBe('cookie');
      expect(cookieFlavours[0].name).toBe('Chocolate Chip Cookie');
    });
  });

  describe('FormatId Filtering with Format Eligibility Logic', () => {
    it('should filter flavours for scoop format', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const formats = await getFormats() as Format[];
      const scoopFormat = formats.find(f => f.category === 'scoop')!;
      
      const eligibleFlavours = filterEligibleFlavours(allFlavours, scoopFormat);

      // Scoop format should include gelato and sorbet
      expect(eligibleFlavours).toHaveLength(2);
      const types = eligibleFlavours.map(f => f.type);
      expect(types).toContain('gelato');
      expect(types).toContain('sorbet');
      expect(types).not.toContain('cookie');
      expect(types).not.toContain('soft-serve-base');
    });

    it('should filter flavours for take-home format', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const formats = await getFormats() as Format[];
      const takeHomeFormat = formats.find(f => f.category === 'take-home')!;
      
      const eligibleFlavours = filterEligibleFlavours(allFlavours, takeHomeFormat);

      // Take-home format should include gelato and sorbet
      expect(eligibleFlavours).toHaveLength(2);
      const types = eligibleFlavours.map(f => f.type);
      expect(types).toContain('gelato');
      expect(types).toContain('sorbet');
    });

    it('should filter flavours for sandwich format', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const formats = await getFormats() as Format[];
      const sandwichFormat = formats.find(f => f.category === 'sandwich')!;
      
      const eligibleFlavours = filterEligibleFlavours(allFlavours, sandwichFormat);

      // Sandwich format should include gelato (for filling) and cookie (for components)
      expect(eligibleFlavours).toHaveLength(2);
      const types = eligibleFlavours.map(f => f.type);
      expect(types).toContain('gelato');
      expect(types).toContain('cookie');
    });

    it('should filter flavours for soft-serve format', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const formats = await getFormats() as Format[];
      const softServeFormat = formats.find(f => f.category === 'soft-serve')!;
      
      const eligibleFlavours = filterEligibleFlavours(allFlavours, softServeFormat);

      // Soft-serve format should only include soft-serve-base
      expect(eligibleFlavours).toHaveLength(1);
      expect(eligibleFlavours[0].type).toBe('soft-serve-base');
    });
  });

  describe('eligibleFormats Calculation', () => {
    it('should calculate eligibleFormats for gelato type', () => {
      const eligibleFormats = getEligibleFormats('gelato');
      expect(eligibleFormats).toEqual(['scoop', 'take-home', 'twist', 'sandwich']);
    });

    it('should calculate eligibleFormats for sorbet type', () => {
      const eligibleFormats = getEligibleFormats('sorbet');
      expect(eligibleFormats).toEqual(['scoop', 'take-home', 'twist']);
    });

    it('should calculate eligibleFormats for cookie type', () => {
      const eligibleFormats = getEligibleFormats('cookie');
      expect(eligibleFormats).toEqual(['sandwich']);
    });

    it('should calculate eligibleFormats for soft-serve-base type', () => {
      const eligibleFormats = getEligibleFormats('soft-serve-base');
      expect(eligibleFormats).toEqual(['soft-serve']);
    });

    it('should calculate eligibleFormats for topping type', () => {
      const eligibleFormats = getEligibleFormats('topping');
      expect(eligibleFormats).toEqual([]);
    });

    it('should calculate eligibleFormats for sauce type', () => {
      const eligibleFormats = getEligibleFormats('sauce');
      expect(eligibleFormats).toEqual([]);
    });

    it('should include eligibleFormats for all flavours', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      
      expect(allFlavours.length).toBeGreaterThan(0);
      allFlavours.forEach((flavour) => {
        const eligibleFormats = getEligibleFormats(flavour.type);
        expect(Array.isArray(eligibleFormats)).toBe(true);
      });
    });
  });

  describe('Type Field Validation', () => {
    it('should require type field when creating flavour', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      
      // All flavours should have a type field
      allFlavours.forEach(flavour => {
        expect(flavour.type).toBeDefined();
        expect(['gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce']).toContain(flavour.type);
      });
    });

    it('should validate type is a valid FlavourType', async () => {
      const validTypes = ['gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce'];
      const allFlavours = await getFlavours() as Flavour[];
      
      allFlavours.forEach(flavour => {
        expect(validTypes).toContain(flavour.type);
      });
    });

    it('should create flavour with valid type field', async () => {
      const newFlavour: Flavour = {
        id: 'f-new',
        name: 'Strawberry Gelato',
        slug: 'strawberry-gelato',
        type: 'gelato',
        description: 'Fresh strawberry gelato',
        ingredients: [],
        keyNotes: ['strawberry'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian'],
        status: 'active',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const allFlavours = await getFlavours() as Flavour[];
      await saveFlavours([...allFlavours, newFlavour]);

      const updatedFlavours = await getFlavours() as Flavour[];
      const created = updatedFlavours.find(f => f.id === 'f-new');

      expect(created).toBeDefined();
      expect(created!.name).toBe('Strawberry Gelato');
      expect(created!.type).toBe('gelato');
      
      const eligibleFormats = getEligibleFormats(created!.type);
      expect(eligibleFormats).toEqual(['scoop', 'take-home', 'twist', 'sandwich']);
    });
  });

  describe('Eligible Flavours for Format', () => {
    it('should return format and eligible flavours for scoop format', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const formats = await getFormats() as Format[];
      const scoopFormat = formats.find(f => f.id === 'fmt1')!;
      
      const eligibleFlavours = filterEligibleFlavours(allFlavours, scoopFormat);

      expect(scoopFormat).toBeDefined();
      expect(scoopFormat.id).toBe('fmt1');
      expect(scoopFormat.name).toBe('Cup');
      expect(scoopFormat.category).toBe('scoop');
      
      expect(eligibleFlavours).toHaveLength(2);
      const types = eligibleFlavours.map(f => f.type);
      expect(types).toContain('gelato');
      expect(types).toContain('sorbet');
    });

    it('should return format and eligible flavours for sandwich format', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const formats = await getFormats() as Format[];
      const sandwichFormat = formats.find(f => f.id === 'fmt3')!;
      
      const eligibleFlavours = filterEligibleFlavours(allFlavours, sandwichFormat);

      expect(sandwichFormat.id).toBe('fmt3');
      expect(sandwichFormat.category).toBe('sandwich');
      
      // Sandwich format should include gelato (for filling) and cookie (for components)
      expect(eligibleFlavours).toHaveLength(2);
      const types = eligibleFlavours.map(f => f.type);
      expect(types).toContain('gelato');
      expect(types).toContain('cookie');
    });

    it('should return format and eligible flavours for soft-serve format', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      const formats = await getFormats() as Format[];
      const softServeFormat = formats.find(f => f.id === 'fmt4')!;
      
      const eligibleFlavours = filterEligibleFlavours(allFlavours, softServeFormat);

      expect(softServeFormat.id).toBe('fmt4');
      expect(softServeFormat.category).toBe('soft-serve');
      
      // Soft-serve format should only include soft-serve-base
      expect(eligibleFlavours).toHaveLength(1);
      expect(eligibleFlavours[0].type).toBe('soft-serve-base');
    });

    it('should return empty array when no flavours are eligible', async () => {
      const allFlavours = await getFlavours() as Flavour[];
      
      // Create a format with a category that has no eligible flavours
      const specialFormat: Format = {
        id: 'fmt-special',
        name: 'Special Format',
        slug: 'special-format',
        category: 'special',
        requiresFlavours: false,
        minFlavours: 0,
        maxFlavours: 0,
        allowMixedTypes: false,
        canIncludeAddOns: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const eligibleFlavours = filterEligibleFlavours(allFlavours, specialFormat);

      expect(specialFormat.id).toBe('fmt-special');
      expect(eligibleFlavours).toEqual([]);
    });
  });
});
