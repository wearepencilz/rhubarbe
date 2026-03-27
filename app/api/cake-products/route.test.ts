import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth — must be before route import
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock cake product queries
vi.mock('@/lib/db/queries/cake-products', () => ({
  listCakeProducts: vi.fn(),
  listNonCakeProducts: vi.fn(),
  updateCakeConfig: vi.fn(),
}));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import * as cakeProductQueries from '@/lib/db/queries/cake-products';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockListCake = cakeProductQueries.listCakeProducts as ReturnType<typeof vi.fn>;
const mockListNonCake = cakeProductQueries.listNonCakeProducts as ReturnType<typeof vi.fn>;
const mockUpdateConfig = cakeProductQueries.updateCakeConfig as ReturnType<typeof vi.fn>;

const makeRequest = (method: string, url: string, body?: any) =>
  new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });

describe('GET /api/cake-products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
  });

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest('GET', 'http://localhost/api/cake-products'));
    expect(res.status).toBe(401);
  });

  it('should return cake-enabled products', async () => {
    const products = [
      { id: '1', name: 'Chocolate Cake', cakeEnabled: true, tierCount: 2 },
    ];
    mockListCake.mockResolvedValue(products);

    const res = await GET(makeRequest('GET', 'http://localhost/api/cake-products'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(products);
    expect(mockListCake).toHaveBeenCalled();
  });

  it('should return candidates when ?candidates=true', async () => {
    const candidates = [
      { id: '2', name: 'Croissant', cakeEnabled: false },
    ];
    mockListNonCake.mockResolvedValue(candidates);

    const res = await GET(makeRequest('GET', 'http://localhost/api/cake-products?candidates=true'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(candidates);
    expect(mockListNonCake).toHaveBeenCalled();
  });
});

describe('POST /api/cake-products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
  });

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest('POST', 'http://localhost/api/cake-products', { productId: 'p1' }));
    expect(res.status).toBe(401);
  });

  it('should return 404 when product not found', async () => {
    mockUpdateConfig.mockResolvedValue(null);
    const res = await POST(makeRequest('POST', 'http://localhost/api/cake-products', { productId: 'nonexistent' }));
    expect(res.status).toBe(404);
  });

  it('should return 400 when productId is missing', async () => {
    const res = await POST(makeRequest('POST', 'http://localhost/api/cake-products', {}));
    expect(res.status).toBe(400);
  });
});
