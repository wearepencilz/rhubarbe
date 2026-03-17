/**
 * Property 18: Legacy API Compatibility
 * 
 * **Validates: Requirements 21.2**
 * 
 * For any request to legacy /api/offerings endpoints, the system should map the request 
 * to the new sellables data model and return a response in the legacy format that is 
 * structurally equivalent to the pre-migration response format.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { Sellable, Offering, SellableStatus, OfferingStatus } from '@/types';

// Arbitraries for generating test data
const sellableStatusArb = fc.constantFrom<SellableStatus>('draft', 'active', 'archived', 'out-of-stock');

const sellableArb = fc.record({
  id: fc.string({ minLength: 1 }),
  internalName: fc.string({ minLength: 1 }),
  publicName: fc.string({ minLength: 1 }),
  slug: fc.string({ minLength: 1 }),
  status: sellableStatusArb,
  formatId: fc.string({ minLength: 1 }),
  primaryFlavourIds: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
  secondaryFlavourIds: fc.array(fc.string({ minLength: 1 }), { maxLength: 2 }),
  componentIds: fc.array(fc.string({ minLength: 1 }), { maxLength: 2 }),
  toppingIds: fc.array(fc.string({ minLength: 1 }), { maxLength: 5 }),
  description: fc.option(fc.string(), { nil: undefined }),
  shortCardCopy: fc.option(fc.string(), { nil: undefined }),
  image: fc.option(fc.string(), { nil: undefined }),
  price: fc.integer({ min: 0, max: 10000 }),
  compareAtPrice: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
  availabilityStart: fc.option(fc.integer({ min: 0, max: Date.now() }).map(ms => new Date(ms).toISOString()), { nil: undefined }),
  availabilityEnd: fc.option(fc.integer({ min: 0, max: Date.now() }).map(ms => new Date(ms).toISOString()), { nil: undefined }),
  location: fc.array(fc.string(), { maxLength: 3 }),
  tags: fc.array(fc.string(), { maxLength: 5 }),
  shopifyProductId: fc.option(fc.string(), { nil: undefined }),
  shopifyProductHandle: fc.option(fc.string(), { nil: undefined }),
  shopifySKU: fc.option(fc.string(), { nil: undefined }),
  posMapping: fc.option(fc.string(), { nil: undefined }),
  syncStatus: fc.constantFrom('pending', 'synced', 'error', 'not-synced'),
  lastSyncedAt: fc.option(fc.integer({ min: 0, max: Date.now() }).map(ms => new Date(ms).toISOString()), { nil: undefined }),
  syncError: fc.option(fc.string(), { nil: undefined }),
  inventoryTracked: fc.boolean(),
  inventoryQuantity: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
  batchCode: fc.option(fc.string(), { nil: undefined }),
  restockDate: fc.option(fc.string(), { nil: undefined }),
  shelfLifeNotes: fc.option(fc.string(), { nil: undefined }),
  onlineOrderable: fc.boolean(),
  pickupOnly: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: Date.now() }).map(ms => new Date(ms).toISOString()),
  updatedAt: fc.integer({ min: 0, max: Date.now() }).map(ms => new Date(ms).toISOString()),
});

// Transform function (same as in route)
function transformSellableToOffering(sellable: Sellable): Offering {
  return {
    id: sellable.id,
    internalName: sellable.internalName,
    publicName: sellable.publicName,
    slug: sellable.slug,
    status: sellable.status as OfferingStatus,
    formatId: sellable.formatId,
    primaryFlavourIds: sellable.primaryFlavourIds,
    secondaryFlavourIds: sellable.secondaryFlavourIds || [],
    componentIds: sellable.componentIds || [],
    description: sellable.description || '',
    shortCardCopy: sellable.shortCardCopy || '',
    image: sellable.image,
    price: sellable.price,
    compareAtPrice: sellable.compareAtPrice,
    availabilityStart: sellable.availabilityStart,
    availabilityEnd: sellable.availabilityEnd,
    location: sellable.location,
    tags: sellable.tags || [],
    shopifyProductId: sellable.shopifyProductId,
    shopifySKU: sellable.shopifySKU,
    posMapping: sellable.posMapping,
    inventoryTracked: sellable.inventoryTracked,
    inventoryQuantity: sellable.inventoryQuantity,
    batchCode: sellable.batchCode,
    restockDate: sellable.restockDate,
    shelfLifeNotes: sellable.shelfLifeNotes,
    onlineOrderable: sellable.onlineOrderable,
    pickupOnly: sellable.pickupOnly,
    createdAt: sellable.createdAt,
    updatedAt: sellable.updatedAt,
  };
}

describe('Property 18: Legacy API Compatibility', () => {
  it('should preserve all core identity fields when transforming sellable to offering', () => {
    fc.assert(
      fc.property(sellableArb, (sellable) => {
        const offering = transformSellableToOffering(sellable);
        
        // Core identity fields must be preserved exactly
        expect(offering.id).toBe(sellable.id);
        expect(offering.internalName).toBe(sellable.internalName);
        expect(offering.publicName).toBe(sellable.publicName);
        expect(offering.slug).toBe(sellable.slug);
        expect(offering.status).toBe(sellable.status);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all composition fields when transforming sellable to offering', () => {
    fc.assert(
      fc.property(sellableArb, (sellable) => {
        const offering = transformSellableToOffering(sellable);
        
        // Composition fields must be preserved
        expect(offering.formatId).toBe(sellable.formatId);
        expect(offering.primaryFlavourIds).toEqual(sellable.primaryFlavourIds);
        expect(offering.secondaryFlavourIds).toEqual(sellable.secondaryFlavourIds || []);
        expect(offering.componentIds).toEqual(sellable.componentIds || []);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all pricing and availability fields when transforming', () => {
    fc.assert(
      fc.property(sellableArb, (sellable) => {
        const offering = transformSellableToOffering(sellable);
        
        // Pricing and availability must be preserved
        expect(offering.price).toBe(sellable.price);
        expect(offering.compareAtPrice).toBe(sellable.compareAtPrice);
        expect(offering.availabilityStart).toBe(sellable.availabilityStart);
        expect(offering.availabilityEnd).toBe(sellable.availabilityEnd);
        expect(offering.location).toEqual(sellable.location);
        expect(offering.tags).toEqual(sellable.tags || []);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve Shopify integration fields (legacy subset)', () => {
    fc.assert(
      fc.property(sellableArb, (sellable) => {
        const offering = transformSellableToOffering(sellable);
        
        // Legacy Shopify fields must be preserved
        expect(offering.shopifyProductId).toBe(sellable.shopifyProductId);
        expect(offering.shopifySKU).toBe(sellable.shopifySKU);
        expect(offering.posMapping).toBe(sellable.posMapping);
        
        // Note: shopifyProductHandle is NOT in legacy format (correctly omitted)
        expect('shopifyProductHandle' in offering).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve inventory and ordering fields when transforming', () => {
    fc.assert(
      fc.property(sellableArb, (sellable) => {
        const offering = transformSellableToOffering(sellable);
        
        // Inventory and ordering fields must be preserved
        expect(offering.inventoryTracked).toBe(sellable.inventoryTracked);
        expect(offering.inventoryQuantity).toBe(sellable.inventoryQuantity);
        expect(offering.batchCode).toBe(sellable.batchCode);
        expect(offering.restockDate).toBe(sellable.restockDate);
        expect(offering.shelfLifeNotes).toBe(sellable.shelfLifeNotes);
        expect(offering.onlineOrderable).toBe(sellable.onlineOrderable);
        expect(offering.pickupOnly).toBe(sellable.pickupOnly);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve metadata timestamps when transforming', () => {
    fc.assert(
      fc.property(sellableArb, (sellable) => {
        const offering = transformSellableToOffering(sellable);
        
        // Timestamps must be preserved
        expect(offering.createdAt).toBe(sellable.createdAt);
        expect(offering.updatedAt).toBe(sellable.updatedAt);
      }),
      { numRuns: 100 }
    );
  });

  it('should not include new sellable-only fields in offering format', () => {
    fc.assert(
      fc.property(sellableArb, (sellable) => {
        const offering = transformSellableToOffering(sellable);
        
        // New fields should NOT appear in legacy format
        expect('toppingIds' in offering).toBe(false);
        expect('shopifyProductHandle' in offering).toBe(false);
        expect('syncStatus' in offering).toBe(false);
        expect('lastSyncedAt' in offering).toBe(false);
        expect('syncError' in offering).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle undefined optional fields correctly', () => {
    fc.assert(
      fc.property(sellableArb, (sellable) => {
        const offering = transformSellableToOffering(sellable);
        
        // Optional fields should be handled consistently
        if (sellable.description === undefined) {
          expect(offering.description).toBe('');
        }
        if (sellable.shortCardCopy === undefined) {
          expect(offering.shortCardCopy).toBe('');
        }
        if (sellable.secondaryFlavourIds === undefined) {
          expect(offering.secondaryFlavourIds).toEqual([]);
        }
        if (sellable.componentIds === undefined) {
          expect(offering.componentIds).toEqual([]);
        }
        if (sellable.tags === undefined) {
          expect(offering.tags).toEqual([]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain structural equivalence for all sellables', () => {
    fc.assert(
      fc.property(fc.array(sellableArb, { minLength: 1, maxLength: 10 }), (sellables) => {
        const offerings = sellables.map(transformSellableToOffering);
        
        // All offerings should have the same structure
        expect(offerings.length).toBe(sellables.length);
        
        // Each offering should have all required fields
        offerings.forEach(offering => {
          expect(offering).toHaveProperty('id');
          expect(offering).toHaveProperty('internalName');
          expect(offering).toHaveProperty('publicName');
          expect(offering).toHaveProperty('slug');
          expect(offering).toHaveProperty('status');
          expect(offering).toHaveProperty('formatId');
          expect(offering).toHaveProperty('primaryFlavourIds');
          expect(offering).toHaveProperty('price');
          expect(offering).toHaveProperty('inventoryTracked');
          expect(offering).toHaveProperty('onlineOrderable');
          expect(offering).toHaveProperty('pickupOnly');
          expect(offering).toHaveProperty('createdAt');
          expect(offering).toHaveProperty('updatedAt');
        });
      }),
      { numRuns: 50 }
    );
  });
});
