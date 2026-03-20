/**
 * Integration Test: Slot Capacity Management
 *
 * Tests concurrent reservation logic, optimistic locking simulation,
 * and capacity tracking — all in-memory.
 *
 * Requirements: 31.4, 31.8
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { validateAddToCart, validateCart, type PreorderCartItem, type AvailabilityInfo } from '@/lib/preorder/cart-validation';
import { withRetry, withFallback, clearErrorLogs, getErrorLogs } from '@/lib/preorder/error-handling';

describe('Slot Capacity Management', () => {
  const baseAvail: AvailabilityInfo = {
    orderable: true,
    cutoffDatetime: '2099-12-31T23:59:59Z',
    quantityRules: { min: 1, max: 20, step: 1 },
    allowedLocations: ['loc-1'],
    availableSlots: [{ key: '09:00-09:30', remaining: 5 }],
  };

  it('rejects reservation when slot is full', () => {
    const fullAvail: AvailabilityInfo = { ...baseAvail, availableSlots: [{ key: '09:00-09:30', remaining: 0 }] };
    const item: PreorderCartItem = {
      productId: 'p1', productName: 'Croissant', quantity: 1,
      pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350,
    };
    expect(validateAddToCart(item, fullAvail).allowed).toBe(false);
  });

  it('rejects when quantity exceeds remaining capacity', () => {
    const item: PreorderCartItem = {
      productId: 'p1', productName: 'Croissant', quantity: 10,
      pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350,
    };
    // remaining is 5, requesting 10
    expect(validateAddToCart(item, baseAvail).allowed).toBe(false);
  });

  it('allows reservation within capacity', () => {
    const item: PreorderCartItem = {
      productId: 'p1', productName: 'Croissant', quantity: 3,
      pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350,
    };
    expect(validateAddToCart(item, baseAvail).allowed).toBe(true);
  });

  it('simulates concurrent reservations — last one fails when capacity exhausted', () => {
    // Simulate: 3 concurrent requests each wanting 2 spots, only 5 available
    const items: PreorderCartItem[] = [
      { productId: 'p1', productName: 'Croissant', quantity: 2, pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350 },
      { productId: 'p1', productName: 'Croissant', quantity: 2, pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350 },
      { productId: 'p1', productName: 'Croissant', quantity: 2, pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350 },
    ];

    let remaining = 5;
    const results = items.map(item => {
      if (remaining >= item.quantity) {
        remaining -= item.quantity;
        return { success: true };
      }
      return { success: false, reason: 'insufficient capacity' };
    });

    expect(results[0].success).toBe(true);  // 5 → 3
    expect(results[1].success).toBe(true);  // 3 → 1
    expect(results[2].success).toBe(false); // 1 < 2 → rejected
    expect(remaining).toBe(1);
  });

  it('withRetry succeeds after transient failures', async () => {
    clearErrorLogs();
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error('Conflict');
      return 'ok';
    }, 3, 1); // baseDelay=1ms for fast test

    expect(result).toBe('ok');
    expect(attempts).toBe(3);
    const logs = getErrorLogs({ type: 'slot_capacity' });
    expect(logs.length).toBeGreaterThanOrEqual(2); // 2 retry warnings
    clearErrorLogs();
  });

  it('withRetry throws after all retries exhausted', async () => {
    clearErrorLogs();
    await expect(
      withRetry(async () => { throw new Error('Permanent failure'); }, 2, 1)
    ).rejects.toThrow('Permanent failure');
    clearErrorLogs();
  });

  it('withFallback returns fallback on error', async () => {
    const result = await withFallback(
      async () => { throw new Error('boom'); },
      'default-value',
      'availability'
    );
    expect(result).toBe('default-value');
  });
});
