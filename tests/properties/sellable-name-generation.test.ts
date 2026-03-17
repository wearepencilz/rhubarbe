/**
 * Property Test: Sellable Name Generation
 * 
 * Feature: launch-first-cms-model
 * Property 9: For any sellable with valid composition, the system should generate 
 * a descriptive public name that includes the format and primary flavour names 
 * in a consistent pattern.
 * 
 * Validates: Requirements 5.7
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { Sellable, Format, Flavour } from '@/types';

/**
 * Generate a descriptive sellable name based on composition
 * 
 * Naming patterns:
 * - Single scoop: "{Flavour} {Format}"
 * - Multiple scoops: "{Flavour1} + {Flavour2} {Format}"
 * - Twist: "{Flavour1} + {Flavour2} Twist"
 * - Sandwich: "{Filling} Ice Cream Sandwich with {Cookie}"
 * - Pint: "{Flavour} Pint"
 */
export function generateSellableName(
  sellable: Sellable,
  format: Format,
  flavours: Flavour[],
  components?: Flavour[]
): string {
  const primaryFlavours = flavours.filter(f => 
    sellable.primaryFlavourIds.includes(f.id)
  );
  
  // Handle sandwich format specially
  if (format.category === 'sandwich' && components && components.length > 0) {
    const filling = primaryFlavours[0]?.name || 'Unknown';
    const cookie = components[0]?.name || 'Unknown Cookie';
    return `${filling} Ice Cream Sandwich with ${cookie}`;
  }
  
  // Handle twist format specially
  if (format.category === 'twist') {
    const flavourNames = primaryFlavours.map(f => f.name).join(' + ');
    return `${flavourNames} Twist`;
  }
  
  // Handle standard formats
  if (primaryFlavours.length === 1) {
    return `${primaryFlavours[0].name} ${format.name}`;
  } else if (primaryFlavours.length > 1) {
    const flavourNames = primaryFlavours.map(f => f.name).join(' + ');
    return `${flavourNames} ${format.name}`;
  }
  
  return `${format.name}`;
}

// Arbitraries for property testing
const flavourArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length > 0),
  type: fc.constantFrom('gelato', 'sorbet', 'cookie'),
  slug: fc.string({ minLength: 3, maxLength: 30 }),
  ingredients: fc.constant([]),
  keyNotes: fc.constant([]),
  allergens: fc.constant([]),
  dietaryTags: fc.constant([]),
  status: fc.constant('active' as const),
  featured: fc.constant(false),
  createdAt: fc.constant(new Date().toISOString()),
  updatedAt: fc.constant(new Date().toISOString())
});

const formatArb = fc.record({
  id: fc.uuid(),
  name: fc.constantFrom('Cup', 'Cone', 'Pint', 'Twist', 'Ice Cream Sandwich'),
  slug: fc.string({ minLength: 3, maxLength: 30 }),
  category: fc.constantFrom('scoop', 'take-home', 'twist', 'sandwich'),
  requiresFlavours: fc.constant(true),
  minFlavours: fc.constant(1),
  maxFlavours: fc.constant(3),
  allowMixedTypes: fc.constant(true),
  canIncludeAddOns: fc.constant(true),
  createdAt: fc.constant(new Date().toISOString()),
  updatedAt: fc.constant(new Date().toISOString())
});

describe('Property 9: Sellable Name Generation', () => {
  it('should generate names that include the format name for non-twist, non-sandwich formats', () => {
    fc.assert(
      fc.property(
        formatArb.filter(f => f.category !== 'twist' && f.category !== 'sandwich'),
        fc.array(flavourArb, { minLength: 1, maxLength: 3 }),
        (format, flavours) => {
          const sellable: Sellable = {
            id: 'test-sellable',
            internalName: 'Test',
            publicName: 'Test',
            slug: 'test',
            status: 'active',
            formatId: format.id,
            primaryFlavourIds: flavours.map(f => f.id),
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const name = generateSellableName(sellable, format, flavours);
          
          // Name should include the format name
          expect(name).toContain(format.name);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should generate names that include all primary flavour names', () => {
    fc.assert(
      fc.property(
        formatArb,
        fc.array(flavourArb, { minLength: 1, maxLength: 3 }),
        (format, flavours) => {
          const sellable: Sellable = {
            id: 'test-sellable',
            internalName: 'Test',
            publicName: 'Test',
            slug: 'test',
            status: 'active',
            formatId: format.id,
            primaryFlavourIds: flavours.map(f => f.id),
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const name = generateSellableName(sellable, format, flavours);
          
          // Name should include all flavour names
          for (const flavour of flavours) {
            expect(name).toContain(flavour.name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should generate twist names with " + " separator and "Twist" suffix', () => {
    fc.assert(
      fc.property(
        fc.array(flavourArb, { minLength: 2, maxLength: 2 }),
        (flavours) => {
          const format: Format = {
            id: 'twist-format',
            name: 'Twist',
            slug: 'twist',
            category: 'twist',
            requiresFlavours: true,
            minFlavours: 2,
            maxFlavours: 2,
            allowMixedTypes: true,
            canIncludeAddOns: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const sellable: Sellable = {
            id: 'test-sellable',
            internalName: 'Test',
            publicName: 'Test',
            slug: 'test',
            status: 'active',
            formatId: format.id,
            primaryFlavourIds: flavours.map(f => f.id),
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const name = generateSellableName(sellable, format, flavours);
          
          // Name should contain " + " separator
          expect(name).toContain(' + ');
          
          // Name should end with "Twist"
          expect(name).toMatch(/Twist$/);
          
          // Name should include both flavour names
          expect(name).toContain(flavours[0].name);
          expect(name).toContain(flavours[1].name);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should generate sandwich names with "Ice Cream Sandwich with" pattern', () => {
    fc.assert(
      fc.property(
        flavourArb.filter(f => f.type === 'gelato' || f.type === 'sorbet'),
        flavourArb.filter(f => f.type === 'cookie'),
        (filling, cookie) => {
          const format: Format = {
            id: 'sandwich-format',
            name: 'Ice Cream Sandwich',
            slug: 'sandwich',
            category: 'sandwich',
            requiresFlavours: true,
            minFlavours: 1,
            maxFlavours: 1,
            allowMixedTypes: false,
            canIncludeAddOns: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const sellable: Sellable = {
            id: 'test-sellable',
            internalName: 'Test',
            publicName: 'Test',
            slug: 'test',
            status: 'active',
            formatId: format.id,
            primaryFlavourIds: [filling.id],
            componentIds: [cookie.id, cookie.id],
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const name = generateSellableName(sellable, format, [filling], [cookie]);
          
          // Name should contain "Ice Cream Sandwich with"
          expect(name).toContain('Ice Cream Sandwich with');
          
          // Name should include filling name
          expect(name).toContain(filling.name);
          
          // Name should include cookie name
          expect(name).toContain(cookie.name);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should generate consistent names for the same composition', () => {
    fc.assert(
      fc.property(
        formatArb,
        fc.array(flavourArb, { minLength: 1, maxLength: 3 }),
        (format, flavours) => {
          const sellable: Sellable = {
            id: 'test-sellable',
            internalName: 'Test',
            publicName: 'Test',
            slug: 'test',
            status: 'active',
            formatId: format.id,
            primaryFlavourIds: flavours.map(f => f.id),
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Generate name twice
          const name1 = generateSellableName(sellable, format, flavours);
          const name2 = generateSellableName(sellable, format, flavours);
          
          // Names should be identical
          expect(name1).toBe(name2);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should generate non-empty names for all valid compositions', () => {
    fc.assert(
      fc.property(
        formatArb,
        fc.array(flavourArb, { minLength: 1, maxLength: 3 }),
        (format, flavours) => {
          const sellable: Sellable = {
            id: 'test-sellable',
            internalName: 'Test',
            publicName: 'Test',
            slug: 'test',
            status: 'active',
            formatId: format.id,
            primaryFlavourIds: flavours.map(f => f.id),
            inventoryTracked: false,
            onlineOrderable: true,
            pickupOnly: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          const name = generateSellableName(sellable, format, flavours);
          
          // Name should not be empty
          expect(name.trim().length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
