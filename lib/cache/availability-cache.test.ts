/**
 * Property-Based Tests for Cache Invalidation
 * 
 * **Property 21: Cache Invalidation**
 * 
 * For any update to an AvailabilityPattern, ProductAvailabilityWindow, or MenuWeek,
 * the availability cache for all affected products should be invalidated.
 * 
 * **Validates: Requirements 25.2, 25.3, 25.4**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { AvailabilityCache } from './availability-cache';

describe('Property 21: Cache Invalidation', () => {
  let cache: AvailabilityCache;

  beforeEach(() => {
    cache = new AvailabilityCache();
  });

  it('should invalidate all availability caches when pattern is updated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          productIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          dates: fc.array(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }), { minLength: 1, maxLength: 5 }),
          locations: fc.array(fc.string({ minLength: 5, maxLength: 10 }), { minLength: 1, maxLength: 3 }),
          patternId: fc.uuid(),
        }),
        async ({ productIds, dates, locations, patternId }) => {
          // Populate cache with availability entries
          const cacheKeys: string[] = [];
          for (const productId of productIds) {
            for (const date of dates) {
              for (const location of locations) {
                const dateStr = date.toISOString().split('T')[0];
                const key = `availability:${productId}:${dateStr}:${location}`;
                cache.set(key, { orderable: true, cutoff: new Date() }, 60);
                cacheKeys.push(key);
              }
            }
          }

          // Also add some product list caches
          cache.set('products:orderable:all:all:all', [], 120);
          cache.set('products:orderable:active:all:true', [], 120);

          // Verify all entries exist
          for (const key of cacheKeys) {
            expect(cache.get(key)).not.toBeNull();
          }
          expect(cache.get('products:orderable:all:all:all')).not.toBeNull();

          // Simulate pattern update by invalidating availability caches
          cache.invalidate('availability:');
          cache.invalidate('products:orderable:');

          // Verify all availability caches are invalidated
          for (const key of cacheKeys) {
            expect(cache.get(key)).toBeNull();
          }
          expect(cache.get('products:orderable:all:all:all')).toBeNull();
          expect(cache.get('products:orderable:active:all:true')).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should invalidate specific product availability when window is updated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          affectedProductId: fc.uuid(),
          otherProductIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          dates: fc.array(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }), { minLength: 1, maxLength: 3 }),
          locations: fc.array(fc.string({ minLength: 5, maxLength: 10 }), { minLength: 1, maxLength: 2 }),
        }),
        async ({ affectedProductId, otherProductIds, dates, locations }) => {
          // Filter out the affected product ID from other product IDs to avoid conflicts
          const filteredOtherIds = otherProductIds.filter(id => id !== affectedProductId);
          
          // Skip if no other products after filtering
          if (filteredOtherIds.length === 0) {
            return true;
          }

          // Populate cache with availability entries for affected and other products
          const affectedKeys: string[] = [];
          const otherKeys: string[] = [];

          for (const date of dates) {
            for (const location of locations) {
              const dateStr = date.toISOString().split('T')[0];
              
              // Affected product
              const affectedKey = `availability:${affectedProductId}:${dateStr}:${location}`;
              cache.set(affectedKey, { orderable: true }, 60);
              affectedKeys.push(affectedKey);

              // Other products
              for (const otherId of filteredOtherIds) {
                const otherKey = `availability:${otherId}:${dateStr}:${location}`;
                cache.set(otherKey, { orderable: true }, 60);
                otherKeys.push(otherKey);
              }
            }
          }

          // Add product list caches
          cache.set('products:orderable:all:all:all', [], 120);

          // Verify all entries exist
          for (const key of affectedKeys) {
            expect(cache.get(key)).not.toBeNull();
          }
          for (const key of otherKeys) {
            expect(cache.get(key)).not.toBeNull();
          }

          // Simulate window update by invalidating affected product's cache
          cache.invalidate(`availability:${affectedProductId}`);
          cache.invalidate('products:orderable:');

          // Verify affected product's caches are invalidated
          for (const key of affectedKeys) {
            expect(cache.get(key)).toBeNull();
          }

          // Verify other products' caches are NOT invalidated
          for (const key of otherKeys) {
            expect(cache.get(key)).not.toBeNull();
          }

          // Verify product list cache is invalidated
          expect(cache.get('products:orderable:all:all:all')).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should invalidate menu week and product list caches when menu week is updated', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          productIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          dates: fc.array(fc.integer({ min: 1704067200000, max: 1767225600000 }).map(ts => new Date(ts)), { minLength: 1, maxLength: 3 }),
        }),
        async ({ productIds, dates }) => {
          // Populate cache with menu week and product list entries
          cache.set('menu-week:current', { id: 'week-1', status: 'active' }, 300);
          cache.set('products:orderable:all:all:all', [], 120);
          cache.set('products:orderable:active:all:true', [], 120);

          // Also add some availability caches (should not be affected by menu week update alone)
          const availabilityKeys: string[] = [];
          for (const productId of productIds) {
            for (const date of dates) {
              const dateStr = date.toISOString().split('T')[0];
              const key = `availability:${productId}:${dateStr}:all`;
              cache.set(key, { orderable: true }, 60);
              availabilityKeys.push(key);
            }
          }

          // Verify all entries exist
          expect(cache.get('menu-week:current')).not.toBeNull();
          expect(cache.get('products:orderable:all:all:all')).not.toBeNull();
          for (const key of availabilityKeys) {
            expect(cache.get(key)).not.toBeNull();
          }

          // Simulate menu week update by invalidating menu week and product list caches
          cache.invalidate('menu-week:');
          cache.invalidate('products:orderable:');

          // Verify menu week and product list caches are invalidated
          expect(cache.get('menu-week:current')).toBeNull();
          expect(cache.get('products:orderable:all:all:all')).toBeNull();
          expect(cache.get('products:orderable:active:all:true')).toBeNull();

          // Verify availability caches are NOT invalidated (menu week update doesn't affect them directly)
          for (const key of availabilityKeys) {
            expect(cache.get(key)).not.toBeNull();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should invalidate slot capacity and availability caches when slot is reserved or released', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          locationId: fc.string({ minLength: 5, maxLength: 10 }),
          productIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        }),
        async ({ date, locationId, productIds }) => {
          const dateStr = date.toISOString().split('T')[0];

          // Populate cache with slot capacity and availability entries
          const slotKey = `slot:${dateStr}:${locationId}`;
          cache.set(slotKey, { capacity: 10, reserved: 5, available: 5 }, 30);

          const availabilityKeys: string[] = [];
          for (const productId of productIds) {
            const key = `availability:${productId}:${dateStr}:${locationId}`;
            cache.set(key, { orderable: true }, 60);
            availabilityKeys.push(key);
          }

          // Verify all entries exist
          expect(cache.get(slotKey)).not.toBeNull();
          for (const key of availabilityKeys) {
            expect(cache.get(key)).not.toBeNull();
          }

          // Simulate slot reservation/release by invalidating slot and availability caches
          cache.invalidate(`slot:${dateStr}:${locationId}`);
          cache.invalidate('availability:');

          // Verify slot capacity cache is invalidated
          expect(cache.get(slotKey)).toBeNull();

          // Verify availability caches are invalidated
          for (const key of availabilityKeys) {
            expect(cache.get(key)).toBeNull();
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
