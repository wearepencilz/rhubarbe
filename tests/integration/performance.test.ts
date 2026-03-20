/**
 * Performance Test: Availability Calculation & Slot Capacity
 *
 * Benchmarks core operations to ensure they meet performance targets.
 *
 * Requirements: 25.1-25.10
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { filterProducts, type FilterableProduct } from '@/lib/preorder/product-filters';
import { validateCart, type PreorderCartItem, type AvailabilityInfo } from '@/lib/preorder/cart-validation';
import { generatePrepSheet, type Order } from '@/lib/preorder/order-operations';

function generateProducts(count: number): FilterableProduct[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p-${i}`,
    availabilityMode: i % 4 === 0 ? 'hidden' : i % 3 === 0 ? 'always_available' : 'pattern_based',
    pickupDates: [`2025-04-${12 + (i % 7)}`],
    allowedLocations: [`loc-${i % 5}`],
    menuWeekId: i % 2 === 0 ? 'mw-1' : null,
    orderType: i % 5 === 0 ? 'b2b_catering' : 'weekly_menu',
  }));
}

function generateOrders(count: number): Order[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `o-${i}`, orderNumber: `RHU-${i}`, customerName: `Customer ${i}`,
    customerEmail: `c${i}@test.com`, customerPhone: `555-${i}`,
    specialInstructions: i % 3 === 0 ? 'Special note' : null,
    status: 'confirmed' as const, totalAmount: 1000 + i * 100,
    items: [{ id: `item-${i}`, productId: `p-${i % 50}`, productName: `Product ${i % 50}`, quantity: 1 + (i % 5), unitPrice: 350, pickupDate: `2025-04-${12 + (i % 7)}`, pickupLocationId: `loc-${i % 3}`, pickupLocationLabel: `Location ${i % 3}`, pickupSlot: `${9 + (i % 4)}:00-${9 + (i % 4)}:30`, category: 'Pâtisserie' }],
    createdAt: '2025-04-10T10:00:00Z', updatedAt: '2025-04-10T10:00:00Z',
  }));
}

describe('Performance', () => {
  it('filters 1000 products in under 50ms', () => {
    const products = generateProducts(1000);
    const start = performance.now();
    const result = filterProducts(products, { menuWeekId: 'mw-1', orderType: 'weekly_menu' });
    const elapsed = performance.now() - start;

    expect(result.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(50);
  });

  it('validates cart with 50 items in under 20ms', () => {
    const availMap = new Map<string, AvailabilityInfo>();
    const items: PreorderCartItem[] = Array.from({ length: 50 }, (_, i) => {
      const id = `p-${i}`;
      availMap.set(id, {
        orderable: true, cutoffDatetime: '2099-12-31T23:59:59Z',
        quantityRules: { min: 1, max: 100, step: 1 },
        allowedLocations: [`loc-${i % 3}`],
        availableSlots: [{ key: '09:00-09:30', remaining: 100 }],
      });
      return { productId: id, productName: `Product ${i}`, quantity: 2, pickupDate: '2025-04-12', pickupLocationId: `loc-${i % 3}`, pickupSlot: '09:00-09:30', unitPrice: 350 };
    });

    const start = performance.now();
    const result = validateCart(items, availMap);
    const elapsed = performance.now() - start;

    expect(result.valid).toBe(true);
    expect(elapsed).toBeLessThan(20);
  });

  it('generates prep sheet from 500 orders in under 100ms', () => {
    const orders = generateOrders(500);
    const start = performance.now();
    const sheet = generatePrepSheet(orders);
    const elapsed = performance.now() - start;

    expect(sheet.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100);
  });

  it('generates prep sheet from 2000 orders in under 500ms', () => {
    const orders = generateOrders(2000);
    const start = performance.now();
    const sheet = generatePrepSheet(orders);
    const elapsed = performance.now() - start;

    expect(sheet.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(500);
  });
});
