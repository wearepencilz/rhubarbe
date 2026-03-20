import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { db } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, PATCH } from './route';
import { NextRequest } from 'next/server';

/**
 * Property 5: Shopify Integration Preservation
 * 
 * **Validates: Requirements 1.2**
 * 
 * For any product after migration, it should retain its shopifyProductId, 
 * shopifyProductHandle, and ingredient relationships.
 */

describe('Property 5: Shopify Integration Preservation', () => {
  // Test data IDs (valid UUIDs)
  const testProductId = '00000000-0000-0000-0000-000000000010';

  beforeEach(async () => {
    // Clean up any existing test data - use DELETE to ensure cascade
    try {
      await db.delete(products).where(eq(products.id, testProductId));
    } catch (e) {
      // Ignore if doesn't exist
    }
    
    // Wait a bit to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await db.delete(products).where(eq(products.id, testProductId));
    } catch (e) {
      // Ignore
    }
  });

  it('should preserve Shopify integration fields when updating availability fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Shopify fields (should be preserved)
          shopifyProductId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          shopifyProductHandle: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          
          // Availability fields to update
          availabilityMode: fc.constantFrom('always_available', 'scheduled', 'pattern_based', 'hidden'),
          defaultMinQuantity: fc.integer({ min: 1, max: 10 }),
          defaultQuantityStep: fc.integer({ min: 1, max: 5 }),
          defaultMaxQuantity: fc.option(fc.integer({ min: 10, max: 100 }), { nil: null }),
          defaultPickupRequired: fc.boolean(),
          onlineOrderable: fc.boolean(),
          pickupOnly: fc.boolean(),
        }),
        async (config) => {
          // Delete any existing product first
          try {
            await db.delete(products).where(eq(products.id, testProductId));
          } catch (e) {
            // Ignore
          }

          // Create test product with Shopify fields
          await db.insert(products).values({
            id: testProductId,
            name: 'Test Product',
            slug: `test-product-shopify-${Date.now()}-${Math.random()}`,
            shopifyProductId: config.shopifyProductId,
            shopifyProductHandle: config.shopifyProductHandle,
            availabilityMode: 'always_available',
            defaultMinQuantity: 1,
            defaultQuantityStep: 1,
            defaultPickupRequired: false,
            onlineOrderable: true,
            pickupOnly: false,
          });

          // Update availability fields via PATCH
          const updateBody = {
            availabilityMode: config.availabilityMode,
            defaultMinQuantity: config.defaultMinQuantity,
            defaultQuantityStep: config.defaultQuantityStep,
            defaultMaxQuantity: config.defaultMaxQuantity,
            defaultPickupRequired: config.defaultPickupRequired,
            onlineOrderable: config.onlineOrderable,
            pickupOnly: config.pickupOnly,
          };

          const url = `http://localhost:3000/api/products/${testProductId}`;
          const request = new NextRequest(url, {
            method: 'PATCH',
            body: JSON.stringify(updateBody),
          });
          
          const response = await PATCH(request, { params: { id: testProductId } });
          expect(response.status).toBe(200);
          
          const updatedProduct = await response.json();

          // Property: Shopify fields must be preserved after availability updates
          // Requirement 1.2: Product SHALL remain linked to Shopify
          expect(updatedProduct.shopifyProductId).toBe(config.shopifyProductId);
          expect(updatedProduct.shopifyProductHandle).toBe(config.shopifyProductHandle);

          // Verify availability fields were updated
          expect(updatedProduct.availabilityMode).toBe(config.availabilityMode);
          expect(updatedProduct.defaultMinQuantity).toBe(config.defaultMinQuantity);
          expect(updatedProduct.defaultQuantityStep).toBe(config.defaultQuantityStep);
          expect(updatedProduct.defaultMaxQuantity).toBe(config.defaultMaxQuantity);
          expect(updatedProduct.defaultPickupRequired).toBe(config.defaultPickupRequired);
          expect(updatedProduct.onlineOrderable).toBe(config.onlineOrderable);
          expect(updatedProduct.pickupOnly).toBe(config.pickupOnly);

          // Verify via GET endpoint as well
          const getRequest = new NextRequest(url);
          const getResponse = await GET(getRequest, { params: { id: testProductId } });
          const fetchedProduct = await getResponse.json();

          // Shopify fields must still be preserved
          expect(fetchedProduct.shopifyProductId).toBe(config.shopifyProductId);
          expect(fetchedProduct.shopifyProductHandle).toBe(config.shopifyProductHandle);
          
          // Clean up after this test case
          try {
            await db.delete(products).where(eq(products.id, testProductId));
          } catch (e) {
            // Ignore
          }
        }
      ),
      { numRuns: 50 } // Run 50 test cases
    );
  });

  it('should allow explicit Shopify field updates without affecting availability fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Initial Shopify fields
          initialShopifyId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          initialShopifyHandle: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          
          // Updated Shopify fields
          updatedShopifyId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          updatedShopifyHandle: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          
          // Availability fields (should be preserved)
          availabilityMode: fc.constantFrom('always_available', 'scheduled', 'pattern_based', 'hidden'),
          defaultMinQuantity: fc.integer({ min: 1, max: 10 }),
          defaultQuantityStep: fc.integer({ min: 1, max: 5 }),
        }),
        async (config) => {
          // Delete any existing product first
          try {
            await db.delete(products).where(eq(products.id, testProductId));
          } catch (e) {
            // Ignore
          }

          // Create test product
          await db.insert(products).values({
            id: testProductId,
            name: 'Test Product',
            slug: `test-product-shopify-reverse-${Date.now()}-${Math.random()}`,
            shopifyProductId: config.initialShopifyId,
            shopifyProductHandle: config.initialShopifyHandle,
            availabilityMode: config.availabilityMode,
            defaultMinQuantity: config.defaultMinQuantity,
            defaultQuantityStep: config.defaultQuantityStep,
            defaultPickupRequired: false,
            onlineOrderable: true,
            pickupOnly: false,
          });

          // Update Shopify fields only
          const updateBody = {
            shopifyProductId: config.updatedShopifyId,
            shopifyProductHandle: config.updatedShopifyHandle,
          };

          const url = `http://localhost:3000/api/products/${testProductId}`;
          const request = new NextRequest(url, {
            method: 'PATCH',
            body: JSON.stringify(updateBody),
          });
          
          const response = await PATCH(request, { params: { id: testProductId } });
          expect(response.status).toBe(200);
          
          const updatedProduct = await response.json();

          // Shopify fields should be updated
          expect(updatedProduct.shopifyProductId).toBe(config.updatedShopifyId);
          expect(updatedProduct.shopifyProductHandle).toBe(config.updatedShopifyHandle);

          // Availability fields should be preserved
          expect(updatedProduct.availabilityMode).toBe(config.availabilityMode);
          expect(updatedProduct.defaultMinQuantity).toBe(config.defaultMinQuantity);
          expect(updatedProduct.defaultQuantityStep).toBe(config.defaultQuantityStep);
          
          // Clean up after this test case
          try {
            await db.delete(products).where(eq(products.id, testProductId));
          } catch (e) {
            // Ignore
          }
        }
      ),
      { numRuns: 50 } // Run 50 test cases
    );
  });
});
