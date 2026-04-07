import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies before importing the route
vi.mock('@/lib/shopify/cart', () => ({
  createCart: vi.fn(),
}));

vi.mock('@/lib/shopify/admin', () => ({
  getProductVariantId: vi.fn(),
}));

vi.mock('@/lib/db/queries/products', () => ({
  getTaxConfigByIds: vi.fn(),
}));

vi.mock('@/lib/tax/find-exempt-variant', () => ({
  findExemptVariant: vi.fn(),
}));

vi.mock('@/lib/db/queries/cake-products', () => ({
  getCakePricingGrid: vi.fn().mockResolvedValue([]),
}));

import { POST } from './route';
import { createCart } from '@/lib/shopify/cart';
import { getTaxConfigByIds } from '@/lib/db/queries/products';

const mockCreateCart = createCart as ReturnType<typeof vi.fn>;
const mockGetTaxConfigByIds = getTaxConfigByIds as ReturnType<typeof vi.fn>;

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/checkout/cake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const baseItem = {
  productId: 'prod-1',
  productName: 'Chocolate Cake',
  variantId: 'var-1',
  variantLabel: 'Large',
  shopifyVariantId: 'gid://shopify/ProductVariant/111',
  quantity: 1,
  price: 4500,
};

const basePayload = {
  items: [baseItem],
  pickupDate: '2026-06-15T10:00:00',
  numberOfPeople: 25,
  eventType: 'birthday',
  specialInstructions: null,
  locale: 'en',
};

describe('POST /api/checkout/cake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCart.mockResolvedValue({
      id: 'cart-abc',
      checkoutUrl: 'https://shop.example.com/checkout/cart-abc',
    });
    mockGetTaxConfigByIds.mockResolvedValue(new Map());
  });

  it('returns 400 when items array is empty', async () => {
    const res = await POST(makeRequest({ ...basePayload, items: [] }) as any);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('No items in cart');
  });

  it('returns 400 when pickupDate is missing', async () => {
    const { pickupDate: _, ...noDate } = basePayload;
    const res = await POST(makeRequest(noDate) as any);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('Pickup date is required');
  });

  it('always sets Fulfillment Type to "pickup" in cart attributes', async () => {
    const res = await POST(makeRequest(basePayload) as any);
    expect(res.status).toBe(200);

    const args = mockCreateCart.mock.calls[0][0];
    const attrs = args.attributes as Array<{ key: string; value: string }>;

    expect(attrs).toEqual(
      expect.arrayContaining([
        { key: 'Fulfillment Type', value: 'pickup' },
      ]),
    );
  });
});
