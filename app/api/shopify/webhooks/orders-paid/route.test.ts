import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the orders query module — must be hoisted before imports
vi.mock('@/lib/db/queries/orders', () => ({
  getByShopifyOrderId: vi.fn(),
  create: vi.fn(),
}));

// Mock the email sender — must be hoisted before imports
vi.mock('@/lib/email/volume-order-confirmation', () => ({
  sendVolumeOrderConfirmation: vi.fn(),
}));

import { POST } from './route';
import * as ordersQuery from '@/lib/db/queries/orders';
import * as emailModule from '@/lib/email/volume-order-confirmation';

const mockGetByShopifyOrderId = ordersQuery.getByShopifyOrderId as ReturnType<typeof vi.fn>;
const mockCreate = ordersQuery.create as ReturnType<typeof vi.fn>;
const mockSendVolumeOrderConfirmation = emailModule.sendVolumeOrderConfirmation as ReturnType<typeof vi.fn>;

// Build a minimal Shopify order payload
function makeShopifyOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 99001,
    order_number: 1001,
    name: '#1001',
    created_at: '2026-03-28T10:00:00Z',
    email: 'customer@example.com',
    customer: {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'customer@example.com',
      phone: '',
    },
    subtotal_price: '45.00',
    total_tax: '5.00',
    total_price: '50.00',
    note: null,
    note_attributes: [],
    line_items: [
      {
        title: 'Lunch Box',
        variant_title: "Chef's Choice",
        quantity: 10,
        price: '4.50',
      },
    ],
    ...overrides,
  };
}

// Build a NextRequest with the given body (no HMAC secret set → verification skipped)
function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/shopify/webhooks/orders-paid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/shopify/webhooks/orders-paid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing order (no duplicate)
    mockGetByShopifyOrderId.mockResolvedValue(null);
    // Default: create returns a minimal order record
    mockCreate.mockResolvedValue({ orderNumber: '#1001', id: 'order-uuid-1' });
    // Default: email sends successfully
    mockSendVolumeOrderConfirmation.mockResolvedValue(undefined);
    // Ensure SHOPIFY_WEBHOOK_SECRET is not set so HMAC verification is skipped
    delete process.env.SHOPIFY_WEBHOOK_SECRET;
  });

  // Requirements: 4.1 — volume order type attribute → orderType = "volume"
  describe('volume order type detection (Req 4.1)', () => {
    it('stores orderType = "volume" when note_attributes contains Order Type = volume', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [
          { name: 'Order Type', value: 'volume' },
          { name: 'Fulfillment Date', value: '2026-04-10T10:00:00' },
          { name: 'Allergen Note', value: 'No peanuts' },
        ],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const [orderData] = mockCreate.mock.calls[0];
      expect(orderData.orderType).toBe('volume');
    });

    it('stores orderType = "launch" when Order Type attribute is absent (Req 4.7)', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const [orderData] = mockCreate.mock.calls[0];
      expect(orderData.orderType).toBe('launch');
    });

    it('stores orderType = "launch" when Order Type attribute has an unrecognised value', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [{ name: 'Order Type', value: 'unknown' }],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const [orderData] = mockCreate.mock.calls[0];
      expect(orderData.orderType).toBe('launch');
    });
  });

  // Requirements: 4.4 — fulfillmentDate extracted and stored
  describe('fulfillment date extraction (Req 4.4)', () => {
    it('stores fulfillmentDate parsed from the Fulfillment Date attribute', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [
          { name: 'Order Type', value: 'volume' },
          { name: 'Fulfillment Date', value: '2026-04-10T10:00:00' },
        ],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const [orderData] = mockCreate.mock.calls[0];
      expect(orderData.fulfillmentDate).toBeInstanceOf(Date);
      expect((orderData.fulfillmentDate as Date).toISOString()).toContain('2026-04-10');
    });

    it('stores fulfillmentDate as undefined when Fulfillment Date attribute is absent', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [{ name: 'Order Type', value: 'volume' }],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const [orderData] = mockCreate.mock.calls[0];
      // fulfillmentDate should be undefined (not set) when attribute is missing
      expect(orderData.fulfillmentDate).toBeUndefined();
    });
  });

  // Requirements: 4.4 — allergenNotes extracted and stored
  describe('allergen notes extraction (Req 4.4)', () => {
    it('stores allergenNotes from the Allergen Note attribute', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [
          { name: 'Order Type', value: 'volume' },
          { name: 'Allergen Note', value: 'No peanuts, dairy-free for 3 boxes' },
        ],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const [orderData] = mockCreate.mock.calls[0];
      expect(orderData.allergenNotes).toBe('No peanuts, dairy-free for 3 boxes');
    });

    it('stores allergenNotes as null when Allergen Note attribute is absent', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const [orderData] = mockCreate.mock.calls[0];
      expect(orderData.allergenNotes).toBeNull();
    });
  });

  // Combined volume order scenario
  describe('full volume order payload', () => {
    it('correctly extracts all volume fields together', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [
          { name: 'Order Type', value: 'volume' },
          { name: 'Fulfillment Date', value: '2026-05-01T09:00:00' },
          { name: 'Allergen Note', value: 'Nut allergy' },
        ],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const [orderData] = mockCreate.mock.calls[0];
      expect(orderData.orderType).toBe('volume');
      expect(orderData.fulfillmentDate).toBeInstanceOf(Date);
      expect(orderData.allergenNotes).toBe('Nut allergy');
    });
  });

  // Deduplication — should not call create if order already exists
  describe('deduplication', () => {
    it('skips create when order already exists', async () => {
      mockGetByShopifyOrderId.mockResolvedValue({ id: 'existing-order' });

      const shopifyOrder = makeShopifyOrder();
      const res = await POST(makeRequest(shopifyOrder));

      expect(res.status).toBe(200);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // Requirements: 5.1, 5.5 — confirmation email trigger
  describe('confirmation email trigger (Req 5.1, 5.5)', () => {
    it('sends confirmation email for volume orders', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [
          { name: 'Order Type', value: 'volume' },
          { name: 'Fulfillment Date', value: '2026-04-10T10:00:00' },
          { name: 'Allergen Note', value: 'No peanuts' },
        ],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);
      expect(mockSendVolumeOrderConfirmation).toHaveBeenCalledTimes(1);

      const [emailOrder, locale] = mockSendVolumeOrderConfirmation.mock.calls[0];
      expect(emailOrder.orderNumber).toBe('#1001');
      expect(emailOrder.customerName).toBe('Jane Doe');
      expect(emailOrder.customerEmail).toBe('customer@example.com');
      expect(emailOrder.fulfillmentDate).toBeInstanceOf(Date);
      expect(emailOrder.allergenNotes).toBe('No peanuts');
      expect(emailOrder.items).toHaveLength(1);
      expect(emailOrder.items[0].quantity).toBe(10);
      expect(locale).toBe('en');
    });

    it('uses locale from cart attributes when provided', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [
          { name: 'Order Type', value: 'volume' },
          { name: 'Fulfillment Date', value: '2026-04-10T10:00:00' },
          { name: 'Locale', value: 'fr' },
        ],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const [, locale] = mockSendVolumeOrderConfirmation.mock.calls[0];
      expect(locale).toBe('fr');
    });

    it('does not send confirmation email for launch orders', async () => {
      const shopifyOrder = makeShopifyOrder({
        note_attributes: [],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);
      expect(mockSendVolumeOrderConfirmation).not.toHaveBeenCalled();
    });

    it('returns 200 even when email sending fails (Req 5.5)', async () => {
      mockSendVolumeOrderConfirmation.mockRejectedValue(new Error('Email service down'));

      const shopifyOrder = makeShopifyOrder({
        note_attributes: [
          { name: 'Order Type', value: 'volume' },
          { name: 'Fulfillment Date', value: '2026-04-10T10:00:00' },
        ],
      });

      const res = await POST(makeRequest(shopifyOrder));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(mockSendVolumeOrderConfirmation).toHaveBeenCalledTimes(1);
    });
  });
});
