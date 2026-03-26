import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Shopify cart module
vi.mock('@/lib/shopify/cart', () => ({
  createCart: vi.fn(),
}));

import { POST } from './route';
import { createCart } from '@/lib/shopify/cart';

const mockCreateCart = createCart as ReturnType<typeof vi.fn>;

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/checkout/volume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const baseItem = {
  productId: 'prod-1',
  productName: 'Lunch Box',
  variantId: 'var-1',
  variantLabel: "Chef's Choice",
  shopifyVariantId: 'gid://shopify/ProductVariant/111',
  quantity: 10,
  price: 2500,
};

const basePayload = {
  items: [baseItem],
  fulfillmentDate: '2026-03-28T10:00:00',
  allergenNote: null,
  locale: 'en',
};

describe('POST /api/checkout/volume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateCart.mockResolvedValue({
      id: 'cart-123',
      checkoutUrl: 'https://shop.example.com/checkout/cart-123',
    });
  });

  it('should include order type "volume" and fulfillment date in cart attributes', async () => {
    const res = await POST(makeRequest(basePayload) as any);
    expect(res.status).toBe(200);

    const args = mockCreateCart.mock.calls[0][0];
    const attrs = args.attributes as Array<{ key: string; value: string }>;

    expect(attrs).toEqual(
      expect.arrayContaining([
        { key: 'Order Type', value: 'volume' },
        { key: 'Fulfillment Date', value: '2026-03-28T10:00:00' },
      ]),
    );
  });

  it('should include allergen note in cart attributes and order note when provided', async () => {
    const payload = { ...basePayload, allergenNote: 'No peanuts, dairy-free' };
    const res = await POST(makeRequest(payload) as any);
    expect(res.status).toBe(200);

    const args = mockCreateCart.mock.calls[0][0];
    const attrs = args.attributes as Array<{ key: string; value: string }>;
    const note = args.note as string;

    // Allergen note in cart attributes
    expect(attrs).toEqual(
      expect.arrayContaining([{ key: 'Allergen Note', value: 'No peanuts, dairy-free' }]),
    );

    // Allergen note in order note text
    expect(note).toContain('No peanuts, dairy-free');
  });

  it('should return 422 when a variant has no shopifyVariantId', async () => {
    const badItem = { ...baseItem, shopifyVariantId: '', variantLabel: 'Vegan' };
    const payload = { ...basePayload, items: [badItem] };

    const res = await POST(makeRequest(payload) as any);
    expect(res.status).toBe(422);

    const data = await res.json();
    expect(data.error).toContain('Lunch Box — Vegan');
    expect(data.unresolvableVariants).toEqual(['Lunch Box — Vegan']);
  });
});
