/**
 * E2E-style Test: Customer Journey
 *
 * Tests the complete customer flow end-to-end using pure functions.
 * No Playwright/Cypress — validates logic flow in-memory.
 *
 * Requirements: 31.5
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { filterProducts, type FilterableProduct } from '@/lib/preorder/product-filters';
import { validateAddToCart, validateCart, type PreorderCartItem, type AvailabilityInfo } from '@/lib/preorder/cart-validation';
import { validateCheckout } from '@/lib/preorder/checkout-validation';
import { buildConfirmation, generateOrderNumber, generateCalendarEvent } from '@/lib/preorder/order-confirmation';
import { getLocalizedContent, availabilityLabels } from '@/lib/preorder/i18n';

const products: FilterableProduct[] = [
  { id: 'p1', availabilityMode: 'pattern_based', pickupDates: ['2025-04-12'], allowedLocations: ['loc-1', 'loc-2'], menuWeekId: 'mw-1', orderType: 'weekly_menu' },
  { id: 'p2', availabilityMode: 'always_available', pickupDates: [], allowedLocations: [], menuWeekId: null, orderType: null },
  { id: 'p3', availabilityMode: 'pattern_based', pickupDates: ['2025-04-15'], allowedLocations: ['loc-2'], menuWeekId: null, orderType: 'b2b_catering' },
];

const availMap = new Map<string, AvailabilityInfo>([
  ['p1', { orderable: true, cutoffDatetime: '2099-12-31T23:59:59Z', quantityRules: { min: 1, max: 12, step: 1 }, allowedLocations: ['loc-1', 'loc-2'], availableSlots: [{ key: '09:00-09:30', remaining: 10 }] }],
  ['p2', { orderable: true, cutoffDatetime: null, quantityRules: { min: 1, max: null, step: 1 }, allowedLocations: [], availableSlots: [] }],
  ['p3', { orderable: true, cutoffDatetime: '2099-12-31T23:59:59Z', quantityRules: { min: 6, max: 100, step: 6 }, allowedLocations: ['loc-2'], availableSlots: [] }],
]);

const customer = { name: 'Marie Dupont', email: 'marie@example.com', phone: '514-555-0202' };

describe('Customer Journey E2E', () => {
  it('complete B2C journey: browse → filter → cart → checkout → confirmation with calendar', () => {
    // Browse: filter for this week's menu
    const menuItems = filterProducts(products, { menuWeekId: 'mw-1' });
    expect(menuItems).toHaveLength(1);

    // See availability label in French
    const label = getLocalizedContent(availabilityLabels.available, 'fr');
    expect(label).toBe('Disponible');

    // Add to cart
    const item: PreorderCartItem = {
      productId: 'p1', productName: 'Croissant', quantity: 4,
      pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350,
    };
    expect(validateAddToCart(item, availMap.get('p1')!).allowed).toBe(true);

    // Checkout
    const checkout = validateCheckout([item], availMap, customer);
    expect(checkout.valid).toBe(true);

    // Confirmation
    const confirmation = buildConfirmation(
      { orderNumber: generateOrderNumber(), items: [{ ...item, pickupLocationLabel: 'Downtown' }], customer, totalAmount: 1400, createdAt: new Date().toISOString() },
      new Map([['Downtown', { label: 'Downtown', instructions: 'Side entrance' }]])
    );
    expect(confirmation.pickupGroups).toHaveLength(1);

    // Calendar event
    const ical = generateCalendarEvent(confirmation.pickupGroups[0], confirmation.orderNumber);
    expect(ical).toContain('BEGIN:VCALENDAR');
    expect(ical).toContain('20250412');
  });

  it('mixed cart: weekly menu + always-available items', () => {
    const items: PreorderCartItem[] = [
      { productId: 'p1', productName: 'Croissant', quantity: 2, pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupSlot: '09:00-09:30', unitPrice: 350 },
      { productId: 'p2', productName: 'Tarte', quantity: 1, pickupDate: null, pickupLocationId: null, pickupSlot: null, unitPrice: 2500 },
    ];
    const result = validateCart(items, availMap);
    expect(result.valid).toBe(true);
    expect(result.pickupGroups).toHaveLength(2); // different pickup configs
  });

  it('checkout fails with invalid customer info', () => {
    const item: PreorderCartItem = {
      productId: 'p2', productName: 'Tarte', quantity: 1,
      pickupDate: null, pickupLocationId: null, pickupSlot: null, unitPrice: 2500,
    };
    const badCustomer = { name: '', email: 'bad-email', phone: '' };
    const result = validateCheckout([item], availMap, badCustomer);
    expect(result.valid).toBe(false);
    expect(result.customerErrors.length).toBeGreaterThan(0);
  });
});
