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
    shopifyProductId: 'shopifyProductId',
    cakeEnabled: 'cakeEnabled',
    cakeDescription: 'cakeDescription',
    cakeInstructions: 'cakeInstructions',
    cakeMinPeople: 'cakeMinPeople',
    allergens: 'allergens',
  },
  cakeLeadTimeTiers: {
    productId: 'productId',
    minPeople: 'minPeople',
    leadTimeDays: 'leadTimeDays',
  },
}));

// Mock Shopify client
vi.mock('@/lib/shopify/client', () => ({
  shopifyFetch: vi.fn().mockResolvedValue({ data: { nodes: [] } }),
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

// Helper to build a chainable mock for tiers queries
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
  name: 'Chocolate Cake',
  slug: 'chocolate-cake',
  image: '/img/choco.jpg',
  price: 4500,
  shopifyProductId: 'gid://shopify/Product/1',
  cakeDescription: { en: 'Rich chocolate cake', fr: 'Gâteau au chocolat riche' },
  cakeInstructions: { en: 'Order 3 days ahead', fr: 'Commandez 3 jours à l\'avance' },
  cakeMinPeople: 8,
  allergens: ['dairy', 'gluten'],
};

const sampleTiers = [
  { productId: 'prod-1', minPeople: 1, leadTimeDays: 3 },
  { productId: 'prod-1', minPeople: 15, leadTimeDays: 5 },
  { productId: 'prod-1', minPeople: 30, leadTimeDays: 7 },
];

describe('GET /api/storefront/cake-products', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return cake products with lead time tiers', async () => {
    mockSelect
      .mockReturnValueOnce(mockProductsQuery([sampleProduct]))
      .mockReturnValueOnce(mockRelatedQuery(sampleTiers));

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('prod-1');
    expect(data[0].name).toBe('Chocolate Cake');
    expect(data[0].cakeMinPeople).toBe(8);
    expect(data[0].allergens).toEqual(['dairy', 'gluten']);
    expect(data[0].leadTimeTiers).toHaveLength(3);
    // pricingTiers come from Shopify (mocked as empty)
    expect(data[0].pricingTiers).toEqual([]);
  });

  it('should return empty array when no cake products exist', async () => {
    mockSelect.mockReturnValueOnce(mockProductsQuery([]));

    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual([]);
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it('should default null fields to safe values', async () => {
    const productWithNulls = {
      ...sampleProduct,
      image: null,
      price: null,
      shopifyProductId: null,
      cakeDescription: null,
      cakeInstructions: null,
      cakeMinPeople: null,
      allergens: null,
    };

    mockSelect
      .mockReturnValueOnce(mockProductsQuery([productWithNulls]))
      .mockReturnValueOnce(mockRelatedQuery([]));

    const res = await GET();
    const data = await res.json();

    expect(data[0].image).toBeNull();
    expect(data[0].price).toBeNull();
    expect(data[0].shopifyProductId).toBeNull();
    expect(data[0].cakeDescription).toEqual({ en: '', fr: '' });
    expect(data[0].cakeInstructions).toEqual({ en: '', fr: '' });
    expect(data[0].cakeMinPeople).toBe(1);
    expect(data[0].allergens).toEqual([]);
    expect(data[0].leadTimeTiers).toEqual([]);
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
    expect(data.error).toBe('Failed to fetch cake products');
  });

  it('should group tiers by product when multiple products exist', async () => {
    const product2 = {
      ...sampleProduct,
      id: 'prod-2',
      name: 'Vanilla Cake',
      slug: 'vanilla-cake',
    };

    const allTiers = [
      { productId: 'prod-1', minPeople: 1, leadTimeDays: 3 },
      { productId: 'prod-2', minPeople: 1, leadTimeDays: 2 },
      { productId: 'prod-2', minPeople: 20, leadTimeDays: 4 },
    ];

    mockSelect
      .mockReturnValueOnce(mockProductsQuery([sampleProduct, product2]))
      .mockReturnValueOnce(mockRelatedQuery(allTiers));

    const res = await GET();
    const data = await res.json();

    expect(data).toHaveLength(2);
    expect(data[0].leadTimeTiers).toHaveLength(1);
    expect(data[1].leadTimeTiers).toHaveLength(2);
  });
});
