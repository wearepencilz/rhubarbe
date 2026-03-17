import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getModifiers, saveModifiers, getSellables, saveSellables } from '@/lib/db';
import type { Modifier, Sellable } from '@/types';

describe('Modifier API Endpoints', () => {
  let originalModifiers: Modifier[];
  let originalSellables: Sellable[];
  const baseUrl = 'http://localhost:3001';

  beforeEach(async () => {
    originalModifiers = await getModifiers();
    originalSellables = await getSellables();
  });

  afterEach(async () => {
    await saveModifiers(originalModifiers);
    await saveSellables(originalSellables);
  });

  describe('GET /api/modifiers', () => {
    it('should return all modifiers with pagination', async () => {
      const response = await fetch(`${baseUrl}/api/modifiers`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('pageSize');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter modifiers by type', async () => {
      // Create test modifiers
      const testModifiers: Modifier[] = [
        {
          id: 'test-mod-1',
          name: 'Test Topping',
          slug: 'test-topping',
          type: 'topping',
          price: 100,
          allergens: [],
          dietaryFlags: [],
          availableForFormatIds: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'test-mod-2',
          name: 'Test Sauce',
          slug: 'test-sauce',
          type: 'sauce',
          price: 150,
          allergens: [],
          dietaryFlags: [],
          availableForFormatIds: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      await saveModifiers([...originalModifiers, ...testModifiers]);

      const response = await fetch(`${baseUrl}/api/modifiers?type=topping`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const toppingModifiers = data.data.filter((m: Modifier) => m.type === 'topping');
      expect(toppingModifiers.length).toBeGreaterThan(0);
      
      // All returned modifiers should be toppings
      data.data.forEach((m: Modifier) => {
        if (m.id.startsWith('test-mod-')) {
          expect(m.type).toBe('topping');
        }
      });
    });

    it('should filter modifiers by status', async () => {
      const testModifier: Modifier = {
        id: 'test-mod-archived',
        name: 'Archived Modifier',
        slug: 'archived-modifier',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: [],
        status: 'archived',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveModifiers([...originalModifiers, testModifier]);

      const response = await fetch(`${baseUrl}/api/modifiers?status=archived`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const archivedModifiers = data.data.filter((m: Modifier) => m.id === 'test-mod-archived');
      expect(archivedModifiers.length).toBe(1);
      expect(archivedModifiers[0].status).toBe('archived');
    });

    it('should filter modifiers by formatId', async () => {
      const testModifier: Modifier = {
        id: 'test-mod-format',
        name: 'Format Specific Modifier',
        slug: 'format-specific',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: ['format-123'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveModifiers([...originalModifiers, testModifier]);

      const response = await fetch(`${baseUrl}/api/modifiers?formatId=format-123`);
      expect(response.status).toBe(200);

      const data = await response.json();
      const formatModifiers = data.data.filter((m: Modifier) => m.id === 'test-mod-format');
      expect(formatModifiers.length).toBe(1);
      expect(formatModifiers[0].availableForFormatIds).toContain('format-123');
    });
  });

  describe('POST /api/modifiers', () => {
    it('should create a new modifier with valid data', async () => {
      const newModifier = {
        name: 'New Test Modifier',
        type: 'topping',
        price: 200,
        description: 'A test modifier',
        allergens: ['dairy'],
        dietaryFlags: [],
        availableForFormatIds: ['format-1'],
        status: 'active'
      };

      const response = await fetch(`${baseUrl}/api/modifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModifier)
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.name).toBe(newModifier.name);
      expect(data.type).toBe(newModifier.type);
      expect(data.price).toBe(newModifier.price);
      expect(data.slug).toBe('new-test-modifier');
    });

    it('should reject modifier without name', async () => {
      const invalidModifier = {
        type: 'topping',
        price: 200
      };

      const response = await fetch(`${baseUrl}/api/modifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidModifier)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('MISSING_NAME');
    });

    it('should reject modifier without type', async () => {
      const invalidModifier = {
        name: 'Test Modifier',
        price: 200
      };

      const response = await fetch(`${baseUrl}/api/modifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidModifier)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('MISSING_TYPE');
    });

    it('should reject modifier with invalid type', async () => {
      const invalidModifier = {
        name: 'Test Modifier',
        type: 'invalid-type',
        price: 200
      };

      const response = await fetch(`${baseUrl}/api/modifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidModifier)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_TYPE');
    });

    it('should reject modifier with negative price', async () => {
      const invalidModifier = {
        name: 'Test Modifier',
        type: 'topping',
        price: -100
      };

      const response = await fetch(`${baseUrl}/api/modifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidModifier)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('INVALID_PRICE');
    });

    it('should reject duplicate slug', async () => {
      const modifier1 = {
        name: 'Duplicate Test',
        type: 'topping',
        price: 100
      };

      // Create first modifier
      await fetch(`${baseUrl}/api/modifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifier1)
      });

      // Try to create duplicate
      const response = await fetch(`${baseUrl}/api/modifiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifier1)
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.code).toBe('DUPLICATE_SLUG');
    });
  });

  describe('GET /api/modifiers/[id]', () => {
    it('should return a specific modifier', async () => {
      const testModifier: Modifier = {
        id: 'test-get-modifier',
        name: 'Get Test Modifier',
        slug: 'get-test-modifier',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveModifiers([...originalModifiers, testModifier]);

      const response = await fetch(`${baseUrl}/api/modifiers/${testModifier.id}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(testModifier.id);
      expect(data.name).toBe(testModifier.name);
    });

    it('should return 404 for non-existent modifier', async () => {
      const response = await fetch(`${baseUrl}/api/modifiers/non-existent-id`);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.code).toBe('MODIFIER_NOT_FOUND');
    });
  });

  describe('PUT /api/modifiers/[id]', () => {
    it('should update an existing modifier', async () => {
      const testModifier: Modifier = {
        id: 'test-update-modifier',
        name: 'Original Name',
        slug: 'original-name',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveModifiers([...originalModifiers, testModifier]);

      const updates = {
        name: 'Updated Name',
        price: 200
      };

      const response = await fetch(`${baseUrl}/api/modifiers/${testModifier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe('Updated Name');
      expect(data.price).toBe(200);
      expect(data.id).toBe(testModifier.id);
    });

    it('should return 404 for non-existent modifier', async () => {
      const response = await fetch(`${baseUrl}/api/modifiers/non-existent-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' })
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/modifiers/[id]', () => {
    it('should delete modifier not referenced by sellables', async () => {
      const testModifier: Modifier = {
        id: 'test-delete-modifier',
        name: 'Delete Test',
        slug: 'delete-test',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveModifiers([...originalModifiers, testModifier]);

      const response = await fetch(`${baseUrl}/api/modifiers/${testModifier.id}`, {
        method: 'DELETE'
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify deletion
      const modifiers = await getModifiers();
      const exists = modifiers.find(m => m.id === testModifier.id);
      expect(exists).toBeUndefined();
    });

    it('should prevent deletion of modifier referenced by sellable', async () => {
      const testModifier: Modifier = {
        id: 'test-ref-modifier',
        name: 'Referenced Modifier',
        slug: 'referenced-modifier',
        type: 'topping',
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const testSellable: Sellable = {
        id: 'test-ref-sellable',
        internalName: 'Test Sellable',
        publicName: 'Test Sellable',
        slug: 'test-sellable',
        status: 'active',
        formatId: 'format-1',
        primaryFlavourIds: [],
        toppingIds: [testModifier.id],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveModifiers([...originalModifiers, testModifier]);
      await saveSellables([...originalSellables, testSellable]);

      const response = await fetch(`${baseUrl}/api/modifiers/${testModifier.id}`, {
        method: 'DELETE'
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.code).toBe('REFERENTIAL_INTEGRITY_ERROR');
      expect(data.details.references).toBeDefined();
      expect(data.details.references.length).toBeGreaterThan(0);

      // Verify modifier still exists
      const modifiers = await getModifiers();
      const exists = modifiers.find(m => m.id === testModifier.id);
      expect(exists).toBeDefined();
    });

    it('should return 404 for non-existent modifier', async () => {
      const response = await fetch(`${baseUrl}/api/modifiers/non-existent-id`, {
        method: 'DELETE'
      });

      expect(response.status).toBe(404);
    });
  });
});
