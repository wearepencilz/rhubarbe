/**
 * Integration Test: Staff Workflow
 *
 * Tests content type CRUD operations, order management,
 * and report generation — all in-memory, no DB required.
 *
 * Requirements: 31.6
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { generatePrepSheet, generatePickupList, prepSheetToCsv, pickupListToCsv, type Order } from '@/lib/preorder/order-operations';
import { logError, getErrorLogs, clearErrorLogs } from '@/lib/preorder/error-handling';
import { validateBilingual, getLocalizedContent, isFullyTranslated } from '@/lib/preorder/i18n';

const sampleOrders: Order[] = [
  {
    id: 'o1', orderNumber: 'RHU-001', customerName: 'Alice', customerEmail: 'a@test.com',
    customerPhone: '555-0001', specialInstructions: 'No nuts', status: 'confirmed', totalAmount: 2100,
    items: [
      { id: 'i1', productId: 'p1', productName: 'Croissant', quantity: 6, unitPrice: 350,
        pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupLocationLabel: 'Downtown', pickupSlot: '09:00-09:30', category: 'Viennoiserie' },
    ],
    createdAt: '2025-04-10T10:00:00Z', updatedAt: '2025-04-10T10:00:00Z',
  },
  {
    id: 'o2', orderNumber: 'RHU-002', customerName: 'Bob', customerEmail: 'b@test.com',
    customerPhone: '555-0002', specialInstructions: null, status: 'confirmed', totalAmount: 3500,
    items: [
      { id: 'i2', productId: 'p1', productName: 'Croissant', quantity: 4, unitPrice: 350,
        pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupLocationLabel: 'Downtown', pickupSlot: '10:00-10:30', category: 'Viennoiserie' },
      { id: 'i3', productId: 'p2', productName: 'Tarte Citron', quantity: 1, unitPrice: 2100,
        pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupLocationLabel: 'Downtown', pickupSlot: '10:00-10:30', category: 'Pâtisserie' },
    ],
    createdAt: '2025-04-10T11:00:00Z', updatedAt: '2025-04-10T11:00:00Z',
  },
  {
    id: 'o3', orderNumber: 'RHU-003', customerName: 'Charlie', customerEmail: 'c@test.com',
    customerPhone: '555-0003', specialInstructions: null, status: 'cancelled', totalAmount: 700,
    items: [
      { id: 'i4', productId: 'p1', productName: 'Croissant', quantity: 2, unitPrice: 350,
        pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupLocationLabel: 'Downtown', pickupSlot: '09:00-09:30', category: 'Viennoiserie' },
    ],
    createdAt: '2025-04-10T12:00:00Z', updatedAt: '2025-04-10T12:00:00Z',
  },
];

describe('Staff Workflow', () => {
  it('generates prep sheet excluding cancelled orders', () => {
    const sheet = generatePrepSheet(sampleOrders);
    // Cancelled order (o3) should be excluded → Croissant total = 6 + 4 = 10
    const croissant = sheet.find(e => e.productName === 'Croissant');
    expect(croissant).toBeDefined();
    expect(croissant!.totalQuantity).toBe(10);
    expect(croissant!.specialInstructions).toContain('No nuts');
  });

  it('generates prep sheet filtered by location', () => {
    const sheet = generatePrepSheet(sampleOrders, { locationId: 'loc-999' });
    expect(sheet).toHaveLength(0);
  });

  it('generates pickup list sorted by slot', () => {
    const list = generatePickupList(sampleOrders, '2025-04-12', 'loc-1');
    expect(list).toHaveLength(2); // Alice + Bob (Charlie cancelled)
    expect(list[0].slot).toBe('09:00-09:30');
    expect(list[1].slot).toBe('10:00-10:30');
  });

  it('exports prep sheet and pickup list as CSV', () => {
    const sheet = generatePrepSheet(sampleOrders);
    const csv = prepSheetToCsv(sheet);
    expect(csv).toContain('Product,Category,Total Quantity');
    expect(csv).toContain('Croissant');

    const list = generatePickupList(sampleOrders, '2025-04-12', 'loc-1');
    const listCsv = pickupListToCsv(list);
    expect(listCsv).toContain('Slot,Customer,Order #');
    expect(listCsv).toContain('Alice');
  });

  it('logs and retrieves errors', () => {
    clearErrorLogs();
    logError({ type: 'slot_capacity', severity: 'warning', message: 'Slot nearly full', context: { remaining: 2 } });
    logError({ type: 'order_validation', severity: 'error', message: 'Invalid quantity', context: {} });

    const all = getErrorLogs();
    expect(all).toHaveLength(2);

    const warnings = getErrorLogs({ severity: 'warning' });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toBe('Slot nearly full');
    clearErrorLogs();
  });

  it('validates bilingual content and provides localized fallback', () => {
    expect(validateBilingual({ en: 'Hello', fr: 'Bonjour' })).toHaveLength(0);
    expect(validateBilingual({ en: '', fr: 'Bonjour' })).toHaveLength(1);
    expect(isFullyTranslated({ en: 'Hello', fr: 'Bonjour' })).toBe(true);
    expect(isFullyTranslated({ en: 'Hello', fr: '' })).toBe(false);

    // Fallback: missing fr → use en
    expect(getLocalizedContent({ en: 'Hello', fr: '' }, 'fr')).toBe('Hello');
    expect(getLocalizedContent({ en: 'Hello', fr: 'Bonjour' }, 'fr')).toBe('Bonjour');
  });
});
