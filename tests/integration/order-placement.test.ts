/**
 * Integration Test: Order Placement Flow
 *
 * Tests the complete flow from product filtering through cart validation
 * to checkout and order confirmation — all in-memory, no DB required.
 *
 * Requirements: 31.3
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { filterProducts, type FilterableProduct } from '@/lib/preorder/product-filters';
import { validateAddToCart, validateCart, type PreorderCartItem, type AvailabilityInfo } from '@/lib/preorder/cart-validation';
import { validateCheckout } from '@/lib/preorder/checkout-validation';
import { buildConfirmation, generateOrderNumber } from '@/lib/preorder/order-confirmation';

const products: FilterableProduct[] = [
  { id: 'p-croissant', availabilityMode: 'pattern_based', pickupDates: ['2025-04-12'], allowedLocations: ['loc-1'], menuWeekId: 'mw-1', orderType: 'weekly_menu' },
  { id: 'p-tarte', availabilityMode: 'always_available', pickupDates: [], allowedLocations: [], menuWeekId: null, orderType: null },
  { id: 'p-catering', availabilityMode: 'pattern_based', pickupDates: ['2025-04-15'], allowedLocations: ['loc-2'], menuWeekId: null, orderType: 'b2b_catering' },
  { id: 'p-hidden', availabilityMode: 'hidden', pickupDates: [], allowedLocations: [], menuWeekId: null, orderType: null },
];

const availMap = new Map<string, AvailabilityInfo>([
  ['p-croissant', { orderable: true, cutoffDatetime: '2099-12-31T23:59:59Z', quantityRules: { min: 1, max: 12, step: 1 }, allowedLocations: ['loc-1'], availableSlots: [{ key: '09:00-09:30', remaining: 10 }] }],
  ['p-tarte', { orderable: true, cutoffDatetime: null, quantityRules: { min: 1, max: null, step: 1 }, allowedLocations: [], availableSlots: [] }],
  ['p-catering', { orderable: true, cutoffDatetime: '2099-12-31T23:59:59Z', quantityRules: { min: 6, max: 100, step: 6 }, allowedLocations: ['loc-2'], availableSlots: [] }],
]);

const customer = { name: 'Alice Tremblay', email: 'alice@example.com', phone: '514-555-0101' };

describe('Order Placement Flow', () => {
  it('B2C weekly menu: filter → add to cart → checkout → confirm', () => {
    // 1. Filter for weekly menu products
    const menuProducts = filterProducts(products, { menuWeekId: 'mw-1' });
    expect(menuProducts).toHaveLength(1);
    expect(menuProducts[0].id).toBe('p-croissant');

    // 2. Add to cart
    const item: PreorderCartItem = {
      productId: 'p-croissant', productName: 'Croissant', quantity: 3,
      pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350,
    };
    const addResult = validateAddToCart(item, availMap.get('p-croissant')!);
    expect(addResult.allowed).toBe(true);

    // 3. Validate cart
    const cartResult = validateCart([item], availMap);
    expect(cartResult.valid).toBe(true);
    expect(cartResult.pickupGroups).toHaveLength(1);

    // 4. Checkout
    const checkoutResult = validateCheckout([item], availMap, customer);
    expect(checkoutResult.valid).toBe(true);

    // 5. Confirm
    const orderNumber = generateOrderNumber();
    const confirmation = buildConfirmation(
      { orderNumber, items: [{ ...item, pickupLocationLabel: 'Downtown' }], customer, totalAmount: 1050, createdAt: new Date().toISOString() },
      new Map([['Downtown', { label: 'Downtown', instructions: 'Ring bell at side door' }]])
    );
    expect(confirmation.orderNumber).toMatch(/^RHU-/);
    expect(confirmation.pickupGroups).toHaveLength(1);
    expect(confirmation.pickupGroups[0].pickupInstructions).toBe('Ring bell at side door');
  });

  it('B2B catering: filter → validate quantity step → checkout', () => {
    const b2bProducts = filterProducts(products, { orderType: 'b2b_catering' });
    expect(b2bProducts).toHaveLength(1);

    // Valid: quantity 12 (step of 6, min 6)
    const validItem: PreorderCartItem = {
      productId: 'p-catering', productName: 'Catering Box', quantity: 12,
      pickupDate: '2025-04-15', pickupLocationId: 'loc-2', pickupSlot: null, unitPrice: 5000,
    };
    expect(validateAddToCart(validItem, availMap.get('p-catering')!).allowed).toBe(true);

    // Invalid: quantity 7 (not a step of 6 from min 6)
    const invalidItem = { ...validItem, quantity: 7 };
    const result = validateAddToCart(invalidItem, availMap.get('p-catering')!);
    expect(result.allowed).toBe(false);
    expect(result.errors.some(e => e.includes('steps of 6'))).toBe(true);
  });

  it('always-available product: no date/location/slot required', () => {
    const item: PreorderCartItem = {
      productId: 'p-tarte', productName: 'Tarte', quantity: 1,
      pickupDate: null, pickupLocationId: null, pickupSlot: null, unitPrice: 2500,
    };
    const result = validateAddToCart(item, availMap.get('p-tarte')!);
    expect(result.allowed).toBe(true);
  });

  it('error: cutoff passed', () => {
    const expiredAvail: AvailabilityInfo = {
      ...availMap.get('p-croissant')!,
      cutoffDatetime: '2020-01-01T00:00:00Z',
    };
    const item: PreorderCartItem = {
      productId: 'p-croissant', productName: 'Croissant', quantity: 1,
      pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350,
    };
    expect(validateAddToCart(item, expiredAvail).allowed).toBe(false);
  });

  it('error: slot full', () => {
    const fullSlotAvail: AvailabilityInfo = {
      ...availMap.get('p-croissant')!,
      availableSlots: [{ key: '09:00-09:30', remaining: 0 }],
    };
    const item: PreorderCartItem = {
      productId: 'p-croissant', productName: 'Croissant', quantity: 1,
      pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350,
    };
    expect(validateAddToCart(item, fullSlotAvail).allowed).toBe(false);
  });

  it('error: invalid quantity', () => {
    const item: PreorderCartItem = {
      productId: 'p-croissant', productName: 'Croissant', quantity: 20,
      pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350,
    };
    expect(validateAddToCart(item, availMap.get('p-croissant')!).allowed).toBe(false);
  });
});
