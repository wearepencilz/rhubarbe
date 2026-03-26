import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth — must be before route import
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock volume product queries
vi.mock('@/lib/db/queries/volume-products', () => ({
  getVolumeProductById: vi.fn(),
  updateVolumeConfig: vi.fn(),
  setLeadTimeTiers: vi.fn(),
  setVolumeVariants: vi.fn(),
}));

import { GET, PUT } from './route';
import { auth } from '@/lib/auth';
import * as volumeProductQueries from '@/lib/db/queries/volume-products';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockGetById = volumeProductQueries.getVolumeProductById as ReturnType<typeof vi.fn>;
const mockUpdateConfig = volumeProductQueries.updateVolumeConfig as ReturnType<typeof vi.fn>;
const mockSetTiers = volumeProductQueries.setLeadTimeTiers as ReturnType<typeof vi.fn>;
const mockSetVariants = volumeProductQueries.setVolumeVariants as ReturnType<typeof vi.fn>;

const PRODUCT_ID = 'prod-001';

const mockProduct = {
  id: PRODUCT_ID,
  name: 'Lunch Box',
  volumeEnabled: true,
  volumeDescription: { en: 'Bulk lunch boxes', fr: 'Boîtes à lunch en gros' },
  volumeInstructions: { en: 'Order 2 days ahead', fr: "Commandez 2 jours à l'avance" },
  volumeMinOrderQuantity: 10,
  leadTimeTiers: [
    { id: 'tier-1', productId: PRODUCT_ID, minQuantity: 1, leadTimeDays: 2, createdAt: new Date() },
    { id: 'tier-2', productId: PRODUCT_ID, minQuantity: 11, leadTimeDays: 4, createdAt: new Date() },
  ],
  volumeVariants: [
    { id: 'var-1', productId: PRODUCT_ID, label: { en: "Chef's Choice", fr: 'Choix du chef' }, shopifyVariantId: 'sv-1', sortOrder: 0, active: true, createdAt: new Date() },
  ],
};

const makeRequest = (method: string, body?: any) =>
  new NextRequest(`http://localhost/api/volume-products/${PRODUCT_ID}`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });

const routeParams = { params: { id: PRODUCT_ID } };

describe('PUT /api/volume-products/[id]', () => {
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
    const res = await PUT(makeRequest('PUT', { volumeEnabled: true }), routeParams);
    expect(res.status).toBe(401);
  });

  it('should return 404 when product does not exist', async () => {
    mockGetById.mockResolvedValue(null);
    const res = await PUT(makeRequest('PUT', { volumeEnabled: true }), routeParams);
    expect(res.status).toBe(404);
  });

  describe('tier validation rejects overlapping/non-ascending ranges', () => {
    it('should return 400 for non-ascending minQuantity values', async () => {
      mockSetTiers.mockRejectedValue(
        new Error(
          'Lead time tiers must have strictly ascending minQuantity values. ' +
          'Tier at index 1 (minQuantity=5) is not greater than tier at index 0 (minQuantity=10).',
        ),
      );

      const res = await PUT(
        makeRequest('PUT', {
          leadTimeTiers: [
            { minQuantity: 10, leadTimeDays: 2 },
            { minQuantity: 5, leadTimeDays: 4 },
          ],
        }),
        routeParams,
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid lead time tier configuration');
      expect(data.details).toContain('strictly ascending');
    });

    it('should return 400 for duplicate minQuantity values', async () => {
      mockSetTiers.mockRejectedValue(
        new Error(
          'Lead time tiers must have strictly ascending minQuantity values. ' +
          'Tier at index 1 (minQuantity=10) is not greater than tier at index 0 (minQuantity=10).',
        ),
      );

      const res = await PUT(
        makeRequest('PUT', {
          leadTimeTiers: [
            { minQuantity: 10, leadTimeDays: 2 },
            { minQuantity: 10, leadTimeDays: 5 },
          ],
        }),
        routeParams,
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid lead time tier configuration');
    });
  });

  describe('successful volume product update round-trip', () => {
    it('should update config, tiers, and variants and return the updated product', async () => {
      const updatedProduct = {
        ...mockProduct,
        volumeMinOrderQuantity: 20,
        leadTimeTiers: [
          { id: 'tier-new-1', productId: PRODUCT_ID, minQuantity: 1, leadTimeDays: 3, createdAt: new Date() },
          { id: 'tier-new-2', productId: PRODUCT_ID, minQuantity: 21, leadTimeDays: 7, createdAt: new Date() },
        ],
      };

      // First call returns existing product, second call returns updated product
      mockGetById.mockResolvedValueOnce({ ...mockProduct }).mockResolvedValueOnce(updatedProduct);
      mockSetTiers.mockResolvedValue(updatedProduct.leadTimeTiers);

      const body = {
        volumeMinOrderQuantity: 20,
        leadTimeTiers: [
          { minQuantity: 1, leadTimeDays: 3 },
          { minQuantity: 21, leadTimeDays: 7 },
        ],
        volumeVariants: [
          { label: { en: "Chef's Choice", fr: 'Choix du chef' }, shopifyVariantId: 'sv-1' },
        ],
      };

      const res = await PUT(makeRequest('PUT', body), routeParams);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.volumeMinOrderQuantity).toBe(20);
      expect(data.leadTimeTiers).toHaveLength(2);
      expect(data.leadTimeTiers[0].leadTimeDays).toBe(3);
      expect(data.leadTimeTiers[1].minQuantity).toBe(21);

      expect(mockUpdateConfig).toHaveBeenCalledWith(PRODUCT_ID, { volumeMinOrderQuantity: 20 });
      expect(mockSetTiers).toHaveBeenCalledWith(PRODUCT_ID, body.leadTimeTiers);
      expect(mockSetVariants).toHaveBeenCalledWith(PRODUCT_ID, body.volumeVariants);
    });

    it('should update only config fields when tiers and variants are not provided', async () => {
      const updatedProduct = { ...mockProduct, volumeEnabled: false };
      mockGetById.mockResolvedValueOnce({ ...mockProduct }).mockResolvedValueOnce(updatedProduct);

      const res = await PUT(makeRequest('PUT', { volumeEnabled: false }), routeParams);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.volumeEnabled).toBe(false);

      expect(mockUpdateConfig).toHaveBeenCalledWith(PRODUCT_ID, { volumeEnabled: false });
      expect(mockSetTiers).not.toHaveBeenCalled();
      expect(mockSetVariants).not.toHaveBeenCalled();
    });
  });
});

describe('GET /api/volume-products/[id]', () => {
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
    expect(data.volumeVariants).toHaveLength(1);
  });
});
