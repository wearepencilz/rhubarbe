/**
 * E2E-style Test: Staff Journey
 *
 * Tests the complete staff workflow from report generation to order management.
 * No Playwright/Cypress — validates logic flow in-memory.
 *
 * Requirements: 31.6
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { generatePrepSheet, generatePickupList, prepSheetToCsv, pickupListToCsv, type Order } from '@/lib/preorder/order-operations';
import { logError, getErrorLogs, clearErrorLogs } from '@/lib/preorder/error-handling';

const orders: Order[] = [
  {
    id: 'o1', orderNumber: 'RHU-100', customerName: 'Alice', customerEmail: 'a@test.com',
    customerPhone: '555-0001', specialInstructions: 'Gluten-free if possible', status: 'confirmed', totalAmount: 4200,
    items: [
      { id: 'i1', productId: 'p1', productName: 'Croissant', quantity: 6, unitPrice: 350, pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupLocationLabel: 'Downtown', pickupSlot: '09:00-09:30', category: 'Viennoiserie' },
      { id: 'i2', productId: 'p2', productName: 'Pain au Chocolat', quantity: 6, unitPrice: 350, pickupDate: '2025-04-12', pickupLocationId: 'loc-1', pickupLocationLabel: 'Downtown', pickupSlot: '09:00-09:30', category: 'Viennoiserie' },
    ],
    createdAt: '2025-04-10T08:00:00Z', updatedAt: '2025-04-10T08:00:00Z',
  },
  {
    id: 'o2', orderNumber: 'RHU-101', customerName: 'Bob', customerEmail: 'b@test.com',
    customerPhone: '555-0002', specialInstructions: null, status: 'confirmed', totalAmount: 2100,
    items: [
      { id: 'i3', productId: 'p1', productName: 'Croissant', quantity: 6, unitPrice: 350, pickupDate: '2025-04-13', pickupLocationId: 'loc-2', pickupLocationLabel: 'Mile End', pickupSlot: '10:00-10:30', category: 'Viennoiserie' },
    ],
    createdAt: '2025-04-10T09:00:00Z', updatedAt: '2025-04-10T09:00:00Z',
  },
];

describe('Staff Journey E2E', () => {
  it('generates prep sheet with date breakdown across multiple days', () => {
    const sheet = generatePrepSheet(orders);
    const croissant = sheet.find(e => e.productName === 'Croissant');
    expect(croissant).toBeDefined();
    expect(croissant!.totalQuantity).toBe(12); // 6 + 6
    expect(croissant!.breakdownByDate).toHaveLength(2);
  });

  it('generates location-specific pickup list', () => {
    const list = generatePickupList(orders, '2025-04-12', 'loc-1');
    expect(list).toHaveLength(1);
    expect(list[0].customerName).toBe('Alice');
    expect(list[0].items).toHaveLength(2);
  });

  it('exports reports as CSV for download', () => {
    const sheet = generatePrepSheet(orders);
    const sheetCsv = prepSheetToCsv(sheet);
    expect(sheetCsv.split('\n').length).toBeGreaterThan(1);

    const list = generatePickupList(orders, '2025-04-12', 'loc-1');
    const listCsv = pickupListToCsv(list);
    expect(listCsv).toContain('RHU-100');
  });

  it('tracks capacity adjustments via error logging', () => {
    clearErrorLogs();
    logError({ type: 'capacity_adjustment', severity: 'info', message: 'Capacity increased', context: { slot: '09:00', newCapacity: 20, reason: 'Extra staff' }, userId: 'staff-1' });

    const logs = getErrorLogs({ type: 'capacity_adjustment' });
    expect(logs).toHaveLength(1);
    expect(logs[0].userId).toBe('staff-1');
    clearErrorLogs();
  });
});
