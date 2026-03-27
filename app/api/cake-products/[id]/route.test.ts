import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth — must be before route import
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock cake product queries
vi.mock('@/lib/db/queries/cake-products', () => ({
  getCakeProductById: vi.fn(),
  updateCakeConfig: vi.fn(),
  setCakeLeadTimeTiers: vi.fn(),
  setCakeVariants: vi.fn(),
}));

import { GET, PUT } from './route';
import { auth } from '@/lib/auth';
import * as cakeProductQueries from '@/lib/db/queries/cake-products';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockGetById = cakeProductQueries.getCakeProductById as ReturnType<typeof vi.fn>;
const mockUpdateConfig = cakeProductQueries.updateCakeConfig as ReturnType<typeof vi.fn>;
const mockSetTiers = cakeProductQueries.setCakeLeadTimeTiers as ReturnType<typeof vi.fn>;
const mockSetVariants = cakeProductQueries.setCakeVariants as ReturnType<typeof vi.fn>;

const PRODUCT_ID = 'cake-001';

const mockProduct = {
  id: PRODUCT_ID,
  name: 'Chocolate Cake',
  cakeEnabled: true,
  cakeDescription: { en: 'Rich chocolate cake', fr: 'Gâteau au chocolat' },
  cakeInstructions: { en: 'Order 3 days ahead', fr: 'Commandez 3 jours à l\'avance' },
  cakeMinPeople: 8,
  leadTimeTiers: [
    { id: 'tier-1', productId: PRODUCT_ID, minPeople: 10, leadTimeDays: 3, createdAt: new Date() },
    { id: 'tier-2', productId: PRODUCT_ID, minPeople: 25, leadTimeDays: 5, createdAt: new Date() },
  ],
  cakeVariants: [
    { id: 'var-1', productId: PRODUCT_ID, label: { en: 'Round', fr: 'Rond' }, shopifyVariantId: 'sv-1', sortOrder: 0, active: true, createdAt: new Date() },
  ],
};

const makeRequest = (method: string, body?: any) =>
  new NextRequest(`http://localhost/api/cake-products/${PRODUCT_ID}`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });

const routeParams = { params: { id: PRODUCT_ID } };

describe('GET /api/cake-products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
  });

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest('GET'), routeParams);
    expect(res.status).toBe(401);
  });

  it('should return 404 when product not found', async () => {
    mockGetById.mockResolvedValue(null);
    const res = await GET(makeRequest('GET'), routeParams);
    expect(res.status).toBe(404);
  });

  it('should return the product with tiers and variants', async () => {
    mockGetById.mockResolvedValue({ ...mockProduct });
    const res = await GET(makeRequest('GET'), routeParams);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(PRODUCT_ID);
    expect(data.leadTimeTiers).toHaveLength(2);
    expect(data.cakeVariants).toHaveLength(1);
  });
});

describe('PUT /api/cake-products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockGetById.mockResolvedValue({ ...mockProduct });
    mockUpdateConfig.mockResolvedValue({ ...mockProduct });
    mockSetTiers.mockResolvedValue([]);
    mockSetVariants.mockResolvedValue([]);
  });

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makeRequest('PUT', { cakeEnabled: true }), routeParams);
    expect(res.status).toBe(401);
  });

  it('should return 404 when product does not exist', async () => {
    mockGetById.mockResolvedValue(null);
    const res = await PUT(makeRequest('PUT', { cakeEnabled: true }), routeParams);
    expect(res.status).toBe(404);
  });

  it('should return 400 for non-ascending minPeople values', async () => {
    mockSetTiers.mockRejectedValue(
      new Error(
        'Lead time tiers must have strictly ascending minPeople values. ' +
        'Tier at index 1 (minPeople=5) is not greater than tier at index 0 (minPeople=20).',
      ),
    );

    const res = await PUT(
      makeRequest('PUT', {
        leadTimeTiers: [
          { minPeople: 20, leadTimeDays: 3 },
          { minPeople: 5, leadTimeDays: 5 },
        ],
      }),
      routeParams,
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid lead time tier configuration');
    expect(data.details).toContain('strictly ascending');
  });

  it('should return 400 for duplicate minPeople values', async () => {
    mockSetTiers.mockRejectedValue(
      new Error(
        'Lead time tiers must have strictly ascending minPeople values. ' +
        'Tier at index 1 (minPeople=15) is not greater than tier at index 0 (minPeople=15).',
      ),
    );

    const res = await PUT(
      makeRequest('PUT', {
        leadTimeTiers: [
          { minPeople: 15, leadTimeDays: 3 },
          { minPeople: 15, leadTimeDays: 7 },
        ],
      }),
      routeParams,
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid lead time tier configuration');
  });
});
