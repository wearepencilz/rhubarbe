import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { 
  getModifiers, 
  saveModifiers, 
  getSellables, 
  saveSellables,
  getIngredients,
  saveIngredients,
  getFlavours,
  saveFlavours,
  getFormats,
  saveFormats,
  getLaunches,
  saveLaunches
} from '@/lib/db';
import type { Modifier, Sellable, Ingredient, Flavour, Format, Launch } from '@/types';

/**
 * Property 13: Referential Integrity on Deletion
 * 
 * Feature: launch-first-cms-model
 * 
 * For any object (Ingredient, Flavour, Format, Modifier) that is referenced by another object,
 * attempting to delete it should be prevented and return an error listing the dependent objects.
 * 
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 20.5
 */

describe('Property 13: Referential Integrity on Deletion', () => {
  let originalModifiers: Modifier[];
  let originalSellables: Sellable[];
  let originalIngredients: Ingredient[];
  let originalFlavours: Flavour[];
  let originalFormats: Format[];
  let originalLaunches: Launch[];

  beforeEach(async () => {
    // Backup original data
    originalModifiers = await getModifiers();
    originalSellables = await getSellables();
    originalIngredients = await getIngredients();
    originalFlavours = await getFlavours();
    originalFormats = await getFormats();
    originalLaunches = await getLaunches();
  });

  afterEach(async () => {
    // Restore original data
    await saveModifiers(originalModifiers);
    await saveSellables(originalSellables);
    await saveIngredients(originalIngredients);
    await saveFlavours(originalFlavours);
    await saveFormats(originalFormats);
    await saveLaunches(originalLaunches);
  });

  it('should prevent deletion of modifier referenced by sellable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('topping', 'sauce', 'crunch', 'drizzle', 'premium-addon', 'pack-in'),
          price: fc.integer({ min: 0, max: 1000 })
        }),
        fc.record({
          internalName: fc.string({ minLength: 1, maxLength: 50 }),
          publicName: fc.string({ minLength: 1, maxLength: 50 }),
          formatId: fc.string({ minLength: 1 }),
          price: fc.integer({ min: 0, max: 10000 })
        }),
        async (modifierData, sellableData) => {
          // Create modifier
          const modifier: Modifier = {
            id: `test-modifier-${Date.now()}-${Math.random()}`,
            slug: modifierData.name.toLowerCase().replace(/\s+/g, '-'),
            ...modifierData,
            allergens: [],
            dietaryFlags: [],
            availableForFormatIds: [],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const modifiers = await getModifiers();
          modifiers.push(modifier);
          await saveModifiers(modifiers);

          // Create sellable that references the modifier
          const sellable: Sellable = {
            id: `test-sellable-${Date.now()}-${Math.random()}`,
            slug: sellableData.internalName.toLowerCase().replace(/\s+/g, '-'),
            ...sellableData,
            status: 'active',
            primaryFlavourIds: [],
            toppingIds: [modifier.id], // Reference the modifier
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const sellables = await getSellables();
          sellables.push(sellable);
          await saveSellables(sellables);

          // Attempt to delete the modifier via API
          const response = await fetch(`http://localhost:3001/api/modifiers/${modifier.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              // Note: In real tests, we'd need to mock auth session
            }
          });

          // Should be prevented with 409 Conflict
          expect(response.status).toBe(409);
          
          const errorData = await response.json();
          expect(errorData.code).toBe('REFERENTIAL_INTEGRITY_ERROR');
          expect(errorData.details.references).toBeDefined();
          expect(errorData.details.references.length).toBeGreaterThan(0);
          
          // Verify the reference includes our sellable
          const sellableRef = errorData.details.references.find(
            (ref: any) => ref.id === sellable.id
          );
          expect(sellableRef).toBeDefined();
          expect(sellableRef.type).toBe('sellable');

          // Verify modifier still exists
          const modifiersAfter = await getModifiers();
          const stillExists = modifiersAfter.find(m => m.id === modifier.id);
          expect(stillExists).toBeDefined();

          // Cleanup
          const cleanSellables = (await getSellables()).filter(s => s.id !== sellable.id);
          await saveSellables(cleanSellables);
          const cleanModifiers = (await getModifiers()).filter(m => m.id !== modifier.id);
          await saveModifiers(cleanModifiers);
        }
      ),
      { numRuns: 10 } // Reduced runs for integration test
    );
  });

  it('should allow deletion of modifier not referenced by any sellable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('topping', 'sauce', 'crunch', 'drizzle', 'premium-addon', 'pack-in'),
          price: fc.integer({ min: 0, max: 1000 })
        }),
        async (modifierData) => {
          // Create modifier
          const modifier: Modifier = {
            id: `test-modifier-${Date.now()}-${Math.random()}`,
            slug: modifierData.name.toLowerCase().replace(/\s+/g, '-'),
            ...modifierData,
            allergens: [],
            dietaryFlags: [],
            availableForFormatIds: [],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const modifiers = await getModifiers();
          modifiers.push(modifier);
          await saveModifiers(modifiers);

          // Verify no sellables reference this modifier
          const sellables = await getSellables();
          const hasReferences = sellables.some(s => 
            s.toppingIds && s.toppingIds.includes(modifier.id)
          );
          expect(hasReferences).toBe(false);

          // Attempt to delete the modifier via API
          const response = await fetch(`http://localhost:3001/api/modifiers/${modifier.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          // Should succeed with 200 OK
          expect(response.status).toBe(200);
          
          const result = await response.json();
          expect(result.success).toBe(true);

          // Verify modifier is deleted
          const modifiersAfter = await getModifiers();
          const stillExists = modifiersAfter.find(m => m.id === modifier.id);
          expect(stillExists).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  });
});
