/**
 * Property 20: API Endpoint Continuity
 * 
 * **Validates: Requirements 0.4**
 * 
 * For any API endpoint that existed before migration, that endpoint should continue 
 * to function and return valid responses during the transition period.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { getSellables, saveSellables, getFormats, saveFormats } from '@/lib/db';
import { Sellable, Format } from '@/types';

describe('Property 20: API Endpoint Continuity', () => {
  // Store original data to restore after tests
  let originalSellables: Sellable[];
  let originalFormats: Format[];

  beforeEach(async () => {
    // Backup current data
    originalSellables = await getSellables() as Sellable[];
    originalFormats = await getFormats();
  });

  afterEach(async () => {
    // Restore original data
    await saveSellables(originalSellables);
    await saveFormats(originalFormats);
  });

  it('should maintain GET /api/offerings endpoint functionality', async () => {
    // Create test sellables
    const testSellables: Sellable[] = [
      {
        id: 'test-1',
        internalName: 'Test Offering 1',
        publicName: 'Test Offering 1',
        slug: 'test-offering-1',
        status: 'active',
        formatId: 'format-1',
        primaryFlavourIds: ['flavour-1'],
        secondaryFlavourIds: [],
        componentIds: [],
        toppingIds: [],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'test-2',
        internalName: 'Test Offering 2',
        publicName: 'Test Offering 2',
        slug: 'test-offering-2',
        status: 'draft',
        formatId: 'format-2',
        primaryFlavourIds: ['flavour-2'],
        secondaryFlavourIds: [],
        componentIds: [],
        toppingIds: [],
        price: 600,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await saveSellables(testSellables);

    // Test GET endpoint
    const response = await fetch('http://localhost:3001/api/offerings');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
    
    // Verify deprecation headers
    expect(response.headers.get('X-Deprecated')).toBe('true');
    expect(response.headers.get('X-Deprecation-Message')).toContain('deprecated');
  });

  it('should maintain GET /api/offerings with status filter', async () => {
    const testSellables: Sellable[] = [
      {
        id: 'active-1',
        internalName: 'Active Offering',
        publicName: 'Active Offering',
        slug: 'active-offering',
        status: 'active',
        formatId: 'format-1',
        primaryFlavourIds: ['flavour-1'],
        secondaryFlavourIds: [],
        componentIds: [],
        toppingIds: [],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'draft-1',
        internalName: 'Draft Offering',
        publicName: 'Draft Offering',
        slug: 'draft-offering',
        status: 'draft',
        formatId: 'format-1',
        primaryFlavourIds: ['flavour-1'],
        secondaryFlavourIds: [],
        componentIds: [],
        toppingIds: [],
        price: 600,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await saveSellables(testSellables);

    // Test status filter
    const response = await fetch('http://localhost:3001/api/offerings?status=active');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    
    // All returned items should have status 'active'
    data.forEach((item: any) => {
      expect(item.status).toBe('active');
    });
  });

  it('should maintain GET /api/offerings with formatId filter', async () => {
    const testSellables: Sellable[] = [
      {
        id: 'format1-item',
        internalName: 'Format 1 Item',
        publicName: 'Format 1 Item',
        slug: 'format1-item',
        status: 'active',
        formatId: 'test-format-1',
        primaryFlavourIds: ['flavour-1'],
        secondaryFlavourIds: [],
        componentIds: [],
        toppingIds: [],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'format2-item',
        internalName: 'Format 2 Item',
        publicName: 'Format 2 Item',
        slug: 'format2-item',
        status: 'active',
        formatId: 'test-format-2',
        primaryFlavourIds: ['flavour-1'],
        secondaryFlavourIds: [],
        componentIds: [],
        toppingIds: [],
        price: 600,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await saveSellables(testSellables);

    // Test formatId filter
    const response = await fetch('http://localhost:3001/api/offerings?formatId=test-format-1');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    
    // All returned items should have formatId 'test-format-1'
    data.forEach((item: any) => {
      expect(item.formatId).toBe('test-format-1');
    });
  });

  it('should maintain POST /api/offerings endpoint functionality', async () => {
    // Create a test format first
    const testFormat: Format = {
      id: 'test-format-post',
      name: 'Test Format',
      slug: 'test-format',
      category: 'scoop',
      requiresFlavours: true,
      minFlavours: 1,
      maxFlavours: 3,
      allowMixedTypes: true,
      canIncludeAddOns: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveFormats([...originalFormats, testFormat]);

    // Test POST endpoint
    const newOffering = {
      internalName: 'New Test Offering',
      publicName: 'New Test Offering',
      formatId: 'test-format-post',
      primaryFlavourIds: ['flavour-1'],
      price: 750,
    };

    const response = await fetch('http://localhost:3001/api/offerings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOffering),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.internalName).toBe(newOffering.internalName);
    expect(data.publicName).toBe(newOffering.publicName);
    expect(data.formatId).toBe(newOffering.formatId);
    expect(data.price).toBe(newOffering.price);
    
    // Verify deprecation headers
    expect(response.headers.get('X-Deprecated')).toBe('true');
    expect(response.headers.get('X-Deprecation-Message')).toContain('deprecated');
  });

  it('should maintain POST /api/offerings validation behavior', async () => {
    // Test missing required fields
    const invalidOffering = {
      internalName: 'Invalid Offering',
      // Missing publicName and formatId
    };

    const response = await fetch('http://localhost:3001/api/offerings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidOffering),
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('required');
  });

  it('should return legacy format without new sellable fields', async () => {
    const testSellable: Sellable = {
      id: 'legacy-test',
      internalName: 'Legacy Test',
      publicName: 'Legacy Test',
      slug: 'legacy-test',
      status: 'active',
      formatId: 'format-1',
      primaryFlavourIds: ['flavour-1'],
      secondaryFlavourIds: [],
      componentIds: [],
      toppingIds: ['topping-1', 'topping-2'], // New field
      shopifyProductHandle: 'test-handle', // New field
      syncStatus: 'synced', // New field
      lastSyncedAt: new Date().toISOString(), // New field
      syncError: undefined, // New field
      price: 500,
      inventoryTracked: false,
      onlineOrderable: true,
      pickupOnly: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveSellables([testSellable]);

    const response = await fetch('http://localhost:3001/api/offerings');
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    const offering = data.find((o: any) => o.id === 'legacy-test');
    
    expect(offering).toBeDefined();
    
    // Verify new fields are NOT present in legacy format
    expect(offering).not.toHaveProperty('toppingIds');
    expect(offering).not.toHaveProperty('shopifyProductHandle');
    expect(offering).not.toHaveProperty('syncStatus');
    expect(offering).not.toHaveProperty('lastSyncedAt');
    expect(offering).not.toHaveProperty('syncError');
    
    // Verify legacy fields ARE present
    expect(offering).toHaveProperty('id');
    expect(offering).toHaveProperty('internalName');
    expect(offering).toHaveProperty('publicName');
    expect(offering).toHaveProperty('formatId');
    expect(offering).toHaveProperty('primaryFlavourIds');
  });
});
