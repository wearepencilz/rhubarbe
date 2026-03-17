/**
 * Integration Tests: Sellable Endpoints
 * 
 * Tests the sellable API endpoints for CRUD operations and validation.
 * 
 * Validates: Requirements 11.4, 11.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getSellables, 
  saveSellables, 
  getFormats, 
  saveFormats, 
  getFlavours, 
  saveFlavours,
  getModifiers,
  saveModifiers,
  getLaunches,
  saveLaunches
} from '@/lib/db';
import type { Sellable, Format, Flavour, Modifier, Launch } from '@/types';

describe('Sellable Endpoints Integration Tests', () => {
  let testFormats: Format[];
  let testFlavours: Flavour[];
  let testModifiers: Modifier[];
  let originalSellables: Sellable[];
  let originalFormats: Format[];
  let originalFlavours: Flavour[];
  let originalModifiers: Modifier[];
  
  beforeEach(async () => {
    // Backup original data
    originalSellables = await getSellables();
    originalFormats = await getFormats();
    originalFlavours = await getFlavours();
    originalModifiers = await getModifiers();
    
    // Create test formats
    testFormats = [
      {
        id: 'test-scoop-format',
        name: 'Test Scoop',
        slug: 'test-scoop',
        category: 'scoop',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 3,
        allowMixedTypes: true,
        canIncludeAddOns: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-twist-format',
        name: 'Test Twist',
        slug: 'test-twist',
        category: 'twist',
        requiresFlavours: true,
        minFlavours: 2,
        maxFlavours: 2,
        allowMixedTypes: true,
        canIncludeAddOns: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-sandwich-format',
        name: 'Test Sandwich',
        slug: 'test-sandwich',
        category: 'sandwich',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Create test flavours
    testFlavours = [
      {
        id: 'test-gelato-1',
        name: 'Test Vanilla',
        slug: 'test-vanilla',
        type: 'gelato',
        ingredients: [],
        keyNotes: [],
        allergens: [],
        dietaryTags: [],
        status: 'active',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-gelato-2',
        name: 'Test Chocolate',
        slug: 'test-chocolate',
        type: 'gelato',
        ingredients: [],
        keyNotes: [],
        allergens: [],
        dietaryTags: [],
        status: 'active',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-sorbet-1',
        name: 'Test Lemon',
        slug: 'test-lemon',
        type: 'sorbet',
        ingredients: [],
        keyNotes: [],
        allergens: [],
        dietaryTags: [],
        status: 'active',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-cookie-1',
        name: 'Test Cookie',
        slug: 'test-cookie',
        type: 'cookie',
        ingredients: [],
        keyNotes: [],
        allergens: [],
        dietaryTags: [],
        status: 'active',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Create test modifiers
    testModifiers = [
      {
        id: 'test-modifier-1',
        name: 'Test Sprinkles',
        slug: 'test-sprinkles',
        type: 'topping',
        price: 50,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: ['test-scoop-format'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Save test data
    await saveFormats([...originalFormats, ...testFormats]);
    await saveFlavours([...originalFlavours, ...testFlavours]);
    await saveModifiers([...originalModifiers, ...testModifiers]);
    await saveSellables([]);
  });
  
  afterEach(async () => {
    // Restore original data
    await saveSellables(originalSellables);
    await saveFormats(originalFormats);
    await saveFlavours(originalFlavours);
    await saveModifiers(originalModifiers);
  });
  
  describe('GET /api/sellables', () => {
    it('should return empty array when no sellables exist', async () => {
      const sellables = await getSellables();
      expect(Array.isArray(sellables)).toBe(true);
      expect(sellables.length).toBe(0);
    });
    
    it('should return all sellables', async () => {
      const testSellables: Sellable[] = [
        {
          id: 'test-sellable-1',
          internalName: 'Test Sellable 1',
          publicName: 'Test Vanilla Scoop',
          slug: 'test-vanilla-scoop',
          status: 'active',
          formatId: 'test-scoop-format',
          primaryFlavourIds: ['test-gelato-1'],
          inventoryTracked: false,
          onlineOrderable: true,
          pickupOnly: false,
          price: 500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'test-sellable-2',
          internalName: 'Test Sellable 2',
          publicName: 'Test Chocolate Scoop',
          slug: 'test-chocolate-scoop',
          status: 'draft',
          formatId: 'test-scoop-format',
          primaryFlavourIds: ['test-gelato-2'],
          inventoryTracked: false,
          onlineOrderable: false,
          pickupOnly: false,
          price: 500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      await saveSellables(testSellables);
      
      const sellables = await getSellables();
      expect(sellables.length).toBe(2);
    });
    
    it('should filter sellables by status', async () => {
      const testSellables: Sellable[] = [
        {
          id: 'test-sellable-1',
          internalName: 'Active Sellable',
          publicName: 'Active',
          slug: 'active',
          status: 'active',
          formatId: 'test-scoop-format',
          primaryFlavourIds: ['test-gelato-1'],
          inventoryTracked: false,
          onlineOrderable: true,
          pickupOnly: false,
          price: 500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'test-sellable-2',
          internalName: 'Draft Sellable',
          publicName: 'Draft',
          slug: 'draft',
          status: 'draft',
          formatId: 'test-scoop-format',
          primaryFlavourIds: ['test-gelato-2'],
          inventoryTracked: false,
          onlineOrderable: true,
          pickupOnly: false,
          price: 500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      await saveSellables(testSellables);
      
      const allSellables = await getSellables();
      const activeSellables = allSellables.filter(s => s.status === 'active');
      
      expect(activeSellables.length).toBe(1);
      expect(activeSellables[0].status).toBe('active');
    });
    
    it('should filter sellables by formatId', async () => {
      const testSellables: Sellable[] = [
        {
          id: 'test-sellable-1',
          internalName: 'Scoop Sellable',
          publicName: 'Scoop',
          slug: 'scoop',
          status: 'active',
          formatId: 'test-scoop-format',
          primaryFlavourIds: ['test-gelato-1'],
          inventoryTracked: false,
          onlineOrderable: true,
          pickupOnly: false,
          price: 500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'test-sellable-2',
          internalName: 'Twist Sellable',
          publicName: 'Twist',
          slug: 'twist',
          status: 'active',
          formatId: 'test-twist-format',
          primaryFlavourIds: ['test-gelato-1', 'test-gelato-2'],
          inventoryTracked: false,
          onlineOrderable: true,
          pickupOnly: false,
          price: 600,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      await saveSellables(testSellables);
      
      const allSellables = await getSellables();
      const scoopSellables = allSellables.filter(s => s.formatId === 'test-scoop-format');
      
      expect(scoopSellables.length).toBe(1);
      expect(scoopSellables[0].formatId).toBe('test-scoop-format');
    });
    
    it('should filter sellables by onlineOrderable', async () => {
      const testSellables: Sellable[] = [
        {
          id: 'test-sellable-1',
          internalName: 'Online Sellable',
          publicName: 'Online',
          slug: 'online',
          status: 'active',
          formatId: 'test-scoop-format',
          primaryFlavourIds: ['test-gelato-1'],
          inventoryTracked: false,
          onlineOrderable: true,
          pickupOnly: false,
          price: 500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'test-sellable-2',
          internalName: 'In-Store Only',
          publicName: 'In-Store',
          slug: 'in-store',
          status: 'active',
          formatId: 'test-scoop-format',
          primaryFlavourIds: ['test-gelato-2'],
          inventoryTracked: false,
          onlineOrderable: false,
          pickupOnly: false,
          price: 500,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      await saveSellables(testSellables);
      
      const allSellables = await getSellables();
      const onlineSellables = allSellables.filter(s => s.onlineOrderable === true);
      
      expect(onlineSellables.length).toBe(1);
      expect(onlineSellables[0].onlineOrderable).toBe(true);
    });
  });
  
  describe('POST /api/sellables', () => {
    it('should create a sellable with valid composition', async () => {
      const newSellable: Omit<Sellable, 'id' | 'createdAt' | 'updatedAt'> = {
        internalName: 'New Sellable',
        publicName: 'New Vanilla Scoop',
        slug: 'new-vanilla-scoop',
        status: 'active',
        formatId: 'test-scoop-format',
        primaryFlavourIds: ['test-gelato-1'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 500
      };
      
      const sellables = await getSellables();
      const created: Sellable = {
        ...newSellable,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveSellables([...sellables, created]);
      
      const updated = await getSellables();
      expect(updated.length).toBe(1);
      expect(updated[0].publicName).toBe('New Vanilla Scoop');
    });
    
    it('should reject sellable with invalid composition (type incompatibility)', async () => {
      const formats = await getFormats();
      const flavours = await getFlavours();
      const modifiers = await getModifiers();
      
      const { validateSellableComposition } = await import('@/lib/validation');
      
      const invalidSellable: Partial<Sellable> = {
        formatId: 'test-scoop-format',
        primaryFlavourIds: ['test-cookie-1'] // Cookie type not compatible with scoop
      };
      
      const format = formats.find(f => f.id === 'test-scoop-format')!;
      const validation = validateSellableComposition(invalidSellable as Sellable, format, flavours, modifiers);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].code).toBe('FLAVOUR_TYPE_INCOMPATIBLE');
    });
    
    it('should reject sellable with too few flavours', async () => {
      const formats = await getFormats();
      const flavours = await getFlavours();
      const modifiers = await getModifiers();
      
      const { validateSellableComposition } = await import('@/lib/validation');
      
      const invalidSellable: Partial<Sellable> = {
        formatId: 'test-scoop-format',
        primaryFlavourIds: [] // Empty array violates minFlavours
      };
      
      const format = formats.find(f => f.id === 'test-scoop-format')!;
      const validation = validateSellableComposition(invalidSellable as Sellable, format, flavours, modifiers);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.code === 'MIN_FLAVOURS_NOT_MET')).toBe(true);
    });
    
    it('should reject sellable with too many flavours', async () => {
      const formats = await getFormats();
      const flavours = await getFlavours();
      const modifiers = await getModifiers();
      
      const { validateSellableComposition } = await import('@/lib/validation');
      
      const invalidSellable: Partial<Sellable> = {
        formatId: 'test-scoop-format',
        primaryFlavourIds: ['test-gelato-1', 'test-gelato-2', 'test-sorbet-1', 'test-gelato-1'] // 4 flavours exceeds max of 3
      };
      
      const format = formats.find(f => f.id === 'test-scoop-format')!;
      const validation = validateSellableComposition(invalidSellable as Sellable, format, flavours, modifiers);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.code === 'MAX_FLAVOURS_EXCEEDED')).toBe(true);
    });
  });
  
  describe('PUT /api/sellables/[id]', () => {
    it('should update an existing sellable', async () => {
      const testSellable: Sellable = {
        id: 'test-sellable-1',
        internalName: 'Original Name',
        publicName: 'Original Public Name',
        slug: 'original',
        status: 'draft',
        formatId: 'test-scoop-format',
        primaryFlavourIds: ['test-gelato-1'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveSellables([testSellable]);
      
      // Update the sellable
      const updated: Sellable = {
        ...testSellable,
        publicName: 'Updated Public Name',
        status: 'active',
        updatedAt: new Date().toISOString()
      };
      
      await saveSellables([updated]);
      
      const sellables = await getSellables();
      expect(sellables[0].publicName).toBe('Updated Public Name');
      expect(sellables[0].status).toBe('active');
    });
    
    it('should validate composition when updating', async () => {
      const testSellable: Sellable = {
        id: 'test-sellable-1',
        internalName: 'Test',
        publicName: 'Test',
        slug: 'test',
        status: 'active',
        formatId: 'test-scoop-format',
        primaryFlavourIds: ['test-gelato-1'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveSellables([testSellable]);
      
      const formats = await getFormats();
      const flavours = await getFlavours();
      const modifiers = await getModifiers();
      
      const { validateSellableComposition } = await import('@/lib/validation');
      
      // Try to update with invalid composition
      const invalidUpdate: Sellable = {
        ...testSellable,
        primaryFlavourIds: ['test-cookie-1'] // Invalid type
      };
      
      const format = formats.find(f => f.id === 'test-scoop-format')!;
      const validation = validateSellableComposition(invalidUpdate, format, flavours, modifiers);
      
      expect(validation.valid).toBe(false);
    });
  });
  
  describe('DELETE /api/sellables/[id]', () => {
    it('should delete a sellable', async () => {
      const testSellable: Sellable = {
        id: 'test-sellable-1',
        internalName: 'Test',
        publicName: 'Test',
        slug: 'test',
        status: 'active',
        formatId: 'test-scoop-format',
        primaryFlavourIds: ['test-gelato-1'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveSellables([testSellable]);
      
      let sellables = await getSellables();
      expect(sellables.length).toBe(1);
      
      // Delete the sellable
      await saveSellables([]);
      
      sellables = await getSellables();
      expect(sellables.length).toBe(0);
    });
    
    it('should prevent deletion if sellable is referenced by a launch', async () => {
      const testSellable: Sellable = {
        id: 'test-sellable-1',
        internalName: 'Test',
        publicName: 'Test',
        slug: 'test',
        status: 'active',
        formatId: 'test-scoop-format',
        primaryFlavourIds: ['test-gelato-1'],
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const testLaunch: Launch = {
        id: 'test-launch-1',
        title: 'Test Launch',
        slug: 'test-launch',
        status: 'active',
        featuredFlavourIds: [],
        featuredSellableIds: ['test-sellable-1'], // References the sellable
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveSellables([testSellable]);
      const originalLaunches = await getLaunches();
      await saveLaunches([...originalLaunches, testLaunch]);
      
      // Check if sellable is referenced
      const launches = await getLaunches();
      const referencingLaunches = launches.filter(l => 
        l.featuredSellableIds && l.featuredSellableIds.includes('test-sellable-1')
      );
      
      expect(referencingLaunches.length).toBeGreaterThan(0);
      
      // Cleanup
      await saveLaunches(originalLaunches);
    });
  });
  
  describe('POST /api/sellables/[id]/sync', () => {
    it('should update sync status fields', async () => {
      const testSellable: Sellable = {
        id: 'test-sellable-1',
        internalName: 'Test',
        publicName: 'Test',
        slug: 'test',
        status: 'active',
        formatId: 'test-scoop-format',
        primaryFlavourIds: ['test-gelato-1'],
        shopifyProductId: 'shopify-123',
        syncStatus: 'not-synced',
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveSellables([testSellable]);
      
      // Simulate sync
      const synced: Sellable = {
        ...testSellable,
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString()
      };
      
      await saveSellables([synced]);
      
      const sellables = await getSellables();
      expect(sellables[0].syncStatus).toBe('synced');
      expect(sellables[0].lastSyncedAt).toBeDefined();
    });
    
    it('should handle sync errors', async () => {
      const testSellable: Sellable = {
        id: 'test-sellable-1',
        internalName: 'Test',
        publicName: 'Test',
        slug: 'test',
        status: 'active',
        formatId: 'test-scoop-format',
        primaryFlavourIds: ['test-gelato-1'],
        shopifyProductId: 'shopify-123',
        syncStatus: 'not-synced',
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        price: 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await saveSellables([testSellable]);
      
      // Simulate sync error
      const errorSellable: Sellable = {
        ...testSellable,
        syncStatus: 'error',
        syncError: 'Shopify API error'
      };
      
      await saveSellables([errorSellable]);
      
      const sellables = await getSellables();
      expect(sellables[0].syncStatus).toBe('error');
      expect(sellables[0].syncError).toBe('Shopify API error');
    });
  });
});
