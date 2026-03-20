import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, PATCH, DELETE } from './route';
import { NextRequest } from 'next/server';

/**
 * Unit tests for Product API extensions
 * 
 * Tests availability field updates and validation rules
 */

describe('Product API - Availability Field Updates', () => {
  const testProductId = '00000000-0000-0000-0000-000000000020';

  beforeEach(async () => {
    // Clean up any existing test data
    try {
      await db.delete(products).where(eq(products.id, testProductId));
    } catch (e) {
      // Ignore if doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await db.delete(products).where(eq(products.id, testProductId));
    } catch (e) {
      // Ignore
    }
  });

  describe('GET /api/products/[id]', () => {
    it('should return product with all availability fields', async () => {
      // Create test product
      await db.insert(products).values({
        id: testProductId,
        name: 'Test Product',
        slug: 'test-product-get',
        availabilityMode: 'pattern_based',
        defaultMinQuantity: 2,
        defaultQuantityStep: 2,
        defaultMaxQuantity: 20,
        defaultPickupRequired: true,
        onlineOrderable: true,
        pickupOnly: false,
      });

      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url);
      const response = await GET(request, { params: { id: testProductId } });
      
      expect(response.status).toBe(200);
      const product = await response.json();

      // Verify all availability fields are returned
      expect(product.availabilityMode).toBe('pattern_based');
      expect(product.defaultMinQuantity).toBe(2);
      expect(product.defaultQuantityStep).toBe(2);
      expect(product.defaultMaxQuantity).toBe(20);
      expect(product.defaultPickupRequired).toBe(true);
      expect(product.onlineOrderable).toBe(true);
      expect(product.pickupOnly).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = '99999999-9999-9999-9999-999999999999';
      const url = `http://localhost:3000/api/products/${nonExistentId}`;
      const request = new NextRequest(url);
      const response = await GET(request, { params: { id: nonExistentId } });
      
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toBe('Product not found');
    });
  });

  describe('PATCH /api/products/[id] - Availability Mode Validation', () => {
    it('should accept valid availability_mode values', async () => {
      await db.insert(products).values({
        id: testProductId,
        name: 'Test Product',
        slug: 'test-product-mode',
        availabilityMode: 'always_available',
        defaultMinQuantity: 1,
        defaultQuantityStep: 1,
        defaultPickupRequired: false,
        onlineOrderable: true,
        pickupOnly: false,
      });

      const validModes = ['always_available', 'scheduled', 'pattern_based', 'hidden'];
      
      for (const mode of validModes) {
        const url = `http://localhost:3000/api/products/${testProductId}`;
        const request = new NextRequest(url, {
          method: 'PATCH',
          body: JSON.stringify({ availabilityMode: mode }),
        });
        
        const response = await PATCH(request, { params: { id: testProductId } });
        expect(response.status).toBe(200);
        
        const product = await response.json();
        expect(product.availabilityMode).toBe(mode);
      }
    });

    it('should reject invalid availability_mode values', async () => {
      await db.insert(products).values({
        id: testProductId,
        name: 'Test Product',
        slug: 'test-product-invalid-mode',
        availabilityMode: 'always_available',
        defaultMinQuantity: 1,
        defaultQuantityStep: 1,
        defaultPickupRequired: false,
        onlineOrderable: true,
        pickupOnly: false,
      });

      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ availabilityMode: 'invalid_mode' }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result.error).toContain('Invalid availability_mode');
    });
  });

  describe('PATCH /api/products/[id] - Quantity Validation', () => {
    beforeEach(async () => {
      await db.insert(products).values({
        id: testProductId,
        name: 'Test Product',
        slug: 'test-product-quantity',
        availabilityMode: 'always_available',
        defaultMinQuantity: 1,
        defaultQuantityStep: 1,
        defaultPickupRequired: false,
        onlineOrderable: true,
        pickupOnly: false,
      });
    });

    it('should reject default_min_quantity < 1', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ defaultMinQuantity: 0 }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result.error).toBe('default_min_quantity must be at least 1');
    });

    it('should reject default_quantity_step < 1', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ defaultQuantityStep: 0 }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result.error).toBe('default_quantity_step must be at least 1');
    });

    it('should reject default_max_quantity < default_min_quantity', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ 
          defaultMinQuantity: 10,
          defaultMaxQuantity: 5 
        }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result.error).toBe('default_max_quantity must be greater than or equal to default_min_quantity');
    });

    it('should accept valid quantity rules', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ 
          defaultMinQuantity: 2,
          defaultQuantityStep: 2,
          defaultMaxQuantity: 20
        }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(200);
      
      const product = await response.json();
      expect(product.defaultMinQuantity).toBe(2);
      expect(product.defaultQuantityStep).toBe(2);
      expect(product.defaultMaxQuantity).toBe(20);
    });

    it('should accept null default_max_quantity', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ 
          defaultMinQuantity: 1,
          defaultMaxQuantity: null
        }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(200);
      
      const product = await response.json();
      expect(product.defaultMinQuantity).toBe(1);
      expect(product.defaultMaxQuantity).toBeNull();
    });
  });

  describe('PATCH /api/products/[id] - Availability Field Updates', () => {
    beforeEach(async () => {
      await db.insert(products).values({
        id: testProductId,
        name: 'Test Product',
        slug: 'test-product-fields',
        availabilityMode: 'always_available',
        defaultMinQuantity: 1,
        defaultQuantityStep: 1,
        defaultPickupRequired: false,
        onlineOrderable: true,
        pickupOnly: false,
      });
    });

    it('should update pickup rules', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ 
          defaultPickupRequired: true,
          defaultLocationRestriction: ['location-1', 'location-2'],
          dateSelectionType: 'single_date',
          slotSelectionType: 'required'
        }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(200);
      
      const product = await response.json();
      expect(product.defaultPickupRequired).toBe(true);
      expect(product.defaultLocationRestriction).toEqual(['location-1', 'location-2']);
      expect(product.dateSelectionType).toBe('single_date');
      expect(product.slotSelectionType).toBe('required');
    });

    it('should update order type and lead time', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ 
          orderType: 'b2b_catering',
          defaultLeadTimeHours: 48
        }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(200);
      
      const product = await response.json();
      expect(product.orderType).toBe('b2b_catering');
      expect(product.defaultLeadTimeHours).toBe(48);
    });

    it('should update online ordering flags', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ 
          onlineOrderable: false,
          pickupOnly: true
        }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(200);
      
      const product = await response.json();
      expect(product.onlineOrderable).toBe(false);
      expect(product.pickupOnly).toBe(true);
    });

    it('should update inventory and cap modes', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ 
          inventoryMode: 'capped',
          capMode: 'per_slot'
        }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(200);
      
      const product = await response.json();
      expect(product.inventoryMode).toBe('capped');
      expect(product.capMode).toBe('per_slot');
    });

    it('should update assigned availability pattern', async () => {
      const patternId = '00000000-0000-0000-0000-000000000099';
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ 
          availabilityMode: 'pattern_based',
          assignedAvailabilityPattern: patternId
        }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(200);
      
      const product = await response.json();
      expect(product.availabilityMode).toBe('pattern_based');
      expect(product.assignedAvailabilityPattern).toBe(patternId);
    });
  });

  describe('PATCH /api/products/[id] - Partial Updates', () => {
    beforeEach(async () => {
      await db.insert(products).values({
        id: testProductId,
        name: 'Test Product',
        slug: 'test-product-partial',
        availabilityMode: 'pattern_based',
        defaultMinQuantity: 2,
        defaultQuantityStep: 2,
        defaultMaxQuantity: 20,
        defaultPickupRequired: true,
        onlineOrderable: true,
        pickupOnly: false,
      });
    });

    it('should update only specified fields', async () => {
      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: JSON.stringify({ 
          defaultMinQuantity: 5
        }),
      });
      
      const response = await PATCH(request, { params: { id: testProductId } });
      expect(response.status).toBe(200);
      
      const product = await response.json();
      
      // Updated field
      expect(product.defaultMinQuantity).toBe(5);
      
      // Unchanged fields
      expect(product.availabilityMode).toBe('pattern_based');
      expect(product.defaultQuantityStep).toBe(2);
      expect(product.defaultMaxQuantity).toBe(20);
      expect(product.defaultPickupRequired).toBe(true);
    });
  });

  describe('DELETE /api/products/[id]', () => {
    it('should delete product successfully', async () => {
      await db.insert(products).values({
        id: testProductId,
        name: 'Test Product',
        slug: 'test-product-delete',
        availabilityMode: 'always_available',
        defaultMinQuantity: 1,
        defaultQuantityStep: 1,
        defaultPickupRequired: false,
        onlineOrderable: true,
        pickupOnly: false,
      });

      const url = `http://localhost:3000/api/products/${testProductId}`;
      const request = new NextRequest(url, { method: 'DELETE' });
      const response = await DELETE(request, { params: { id: testProductId } });
      
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);

      // Verify product is deleted
      const [deletedProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, testProductId));
      
      expect(deletedProduct).toBeUndefined();
    });

    it('should return 404 when deleting non-existent product', async () => {
      const nonExistentId = '99999999-9999-9999-9999-999999999999';
      const url = `http://localhost:3000/api/products/${nonExistentId}`;
      const request = new NextRequest(url, { method: 'DELETE' });
      const response = await DELETE(request, { params: { id: nonExistentId } });
      
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toBe('Product not found');
    });
  });
});
