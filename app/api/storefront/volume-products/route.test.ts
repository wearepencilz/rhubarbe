import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  products: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    image: 'image',
    price: 'price',
    volumeEnabled: 'volumeEnabled',
    volumeDescription: 'volumeDescription',
    volumeInstructions: 'volumeInstructions',
    volumeMinOrderQuantity: 'volumeMinOrderQuantity',
    allergens: 'allergens',
  },
  volumeLeadTimeTiers: {
    productId: 'productId',
    minQuantity: 'minQuantity',
    leadTimeDays: 'leadTimeDays',
  },
  volumeVariants: {
    id: 'id',
    productId: 'productId',
    label: 'label',
    shopifyVariantId: 'shopifyVariantId',
    active: 'active',
    sortOrder: 'sortOrder',
  },
}));

import { GET } from './route';
import { db } from '@/lib/db/client';

const mockSelect = db.select as ReturnType<typeof vi.fn>;

// Helper to build a chainable mock for the products query
function mockProductsQuery(products: any[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(products),
      }),
    }),
  };
}

// Helper to build a chainable mock for tiers/variants queries
function mockRelatedQuery(rows: any[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(rows),
      }),
    }),
  };
}

const sampleProduct = {
  id: 'prod-1',
  name: 'Lunch Box',
  slug: 'lunch-box',
  image: '/img/lunch.jpg',
  price: 2500,
  volumeDescription: { en: 'Bulk lunch boxes', fr: 'Boîtes à lunch en gros' },
  volumeInstructions: { en: 'Order 2 days ahead', fr: 'Commandez 2 jours à l\'avance' },
  volumeMinOrderQuantity: 10,
  allergens: ['nuts', 'dairy'],
};

const sampleTiers = [
  { productId: 'prod-1', minQuantity: 1, leadTimeDays: 2 },
  { productId: 'prod-1', minQuantity: 11, leadTimeDays: 4 },
];

const sampleVariants = [
  { id: 'var-1', productId: 'prod-1', label: { en: "Chef's Choice", fr: 'Choix du chef' }, shopifyVariantId: 'gid://shopify/1' },
  { id: 'var-2', productId: 'prod-1', label: { en: 'Vegetarian', fr: 'Végétarien' }, shopifyVariantId: null },
];

describe('GET /api/storefront/volume-products', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return volume products with tiers and variants', async () => {
    // First call: products query
    mockSelect
      .mockReturnValueOnce(mockProductsQuery([sampleProduct]))
      // Second call: tiers query
      .mockReturnValueOnce(mockRelatedQuery(sampleTiers))
      // Third call: variants query
      .mockReturnValueOnce(mockRelatedQuery(sampleVariants));

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('prod-1');
    expect(data[0].name).toBe('Lunch Box');
    expect(data[0].slug).toBe('lunch-box');
    expect(data[0].image).toBe('/img/lunch.jpg');
    expect(data[0].price).toBe(2500);
    expect(data[0].volumeDescription).toEqual({ en: 'Bulk lunch boxes', fr: 'Boîtes à lunch en gros' });
    expect(data[0].volumeMinOrderQuantity).toBe(10);
    expect(data[0].allergens).toEqual(['nuts', 'dairy']);
    expect(data[0].leadTimeTiers).toHaveLength(2);
    expect(data[0].variants).toHaveLength(2);
    expect(data[0].variants[0].label).toEqual({ en: "Chef's Choice", fr: 'Choix du chef' });
  });

  it('should return empty array when no volume products exist', async () => {
    mockSelect.mockReturnValueOnce(mockProductsQuery([]));

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual([]);
  });

  it('should default null fields to safe values', async () => {
    const productWithNulls = {
      ...sampleProduct,
      image: null,
      price: null,
      volumeDescription: null,
      volumeInstructions: null,
      volumeMinOrderQuantity: null,
      allergens: null,
    };

    mockSelect
      .mockReturnValueOnce(mockProductsQuery([productWithNulls]))
      .mockReturnValueOnce(mockRelatedQuery([]))
      .mockReturnValueOnce(mockRelatedQuery([]));

    const res = await GET();
    const data = await res.json();

    expect(data[0].image).toBeNull();
    expect(data[0].price).toBeNull();
    expect(data[0].volumeDescription).toEqual({ en: '', fr: '' });
    expect(data[0].volumeInstructions).toEqual({ en: '', fr: '' });
    expect(data[0].volumeMinOrderQuantity).toBe(1);
    expect(data[0].allergens).toEqual([]);
    expect(data[0].leadTimeTiers).toEqual([]);
    expect(data[0].variants).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockRejectedValue(new Error('DB connection failed')),
        }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe('Failed to fetch volume products');
  });

  it('should not include launch, menu, or launch-product fields', async () => {
    mockSelect
      .mockReturnValueOnce(mockProductsQuery([sampleProduct]))
      .mockReturnValueOnce(mockRelatedQuery(sampleTiers))
      .mockReturnValueOnce(mockRelatedQuery(sampleVariants));

    const res = await GET();
    const data = await res.json();
    const product = data[0];

    // Verify no launch/menu related fields are present
    expect(product).not.toHaveProperty('launchId');
    expect(product).not.toHaveProperty('menuId');
    expect(product).not.toHaveProperty('launchProducts');
    expect(product).not.toHaveProperty('pickupDate');
    expect(product).not.toHaveProperty('pickupLocationId');
  });
});
