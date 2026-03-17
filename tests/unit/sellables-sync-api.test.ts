import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/sellables/[id]/sync/route';
import * as authModule from '@/lib/auth';
import * as dbModule from '@/lib/db';
import type { Sellable } from '@/types';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  getSellables: vi.fn(),
  saveSellables: vi.fn()
}));

describe('POST /api/sellables/[id]/sync', () => {
  const mockSellables: Sellable[] = [
    {
      id: 'sellable-1',
      internalName: 'Test Sellable',
      publicName: 'Vanilla Scoop',
      slug: 'vanilla-scoop',
      status: 'active',
      formatId: 'format-1',
      primaryFlavourIds: ['flavour-1'],
      price: 500,
      inventoryTracked: false,
      onlineOrderable: true,
      pickupOnly: false,
      shopifyProductId: 'shopify-123',
      syncStatus: 'pending',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require authentication', async () => {
    vi.mocked(authModule.auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/sellables/sellable-1/sync', {
      method: 'POST'
    });

    const response = await POST(request, { params: { id: 'sellable-1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(data.code).toBe('AUTH_REQUIRED');
  });

  it('should return 404 when sellable not found', async () => {
    vi.mocked(authModule.auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(dbModule.getSellables).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/sellables/nonexistent/sync', {
      method: 'POST'
    });

    const response = await POST(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Sellable not found');
    expect(data.code).toBe('NOT_FOUND');
  });

  it('should successfully sync sellable and update sync status', async () => {
    vi.mocked(authModule.auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(dbModule.getSellables).mockResolvedValue(mockSellables);
    vi.mocked(dbModule.saveSellables).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/sellables/sellable-1/sync', {
      method: 'POST'
    });

    const response = await POST(request, { params: { id: 'sellable-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('sellable-1');
    expect(data.syncStatus).toBe('synced');
    expect(data.lastSyncedAt).toBeDefined();
    expect(data.syncError).toBeUndefined();
    
    // Verify saveSellables was called with updated data
    expect(dbModule.saveSellables).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'sellable-1',
          syncStatus: 'synced',
          lastSyncedAt: expect.any(String)
        })
      ])
    );
  });

  it('should clear previous sync errors on successful sync', async () => {
    const sellableWithError: Sellable = {
      ...mockSellables[0],
      syncStatus: 'error',
      syncError: 'Previous error message'
    };

    vi.mocked(authModule.auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(dbModule.getSellables).mockResolvedValue([sellableWithError]);
    vi.mocked(dbModule.saveSellables).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/sellables/sellable-1/sync', {
      method: 'POST'
    });

    const response = await POST(request, { params: { id: 'sellable-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.syncStatus).toBe('synced');
    expect(data.syncError).toBeUndefined();
  });

  it('should update lastSyncedAt timestamp', async () => {
    const beforeSync = new Date().toISOString();
    
    vi.mocked(authModule.auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(dbModule.getSellables).mockResolvedValue(mockSellables);
    vi.mocked(dbModule.saveSellables).mockResolvedValue(true);

    const request = new NextRequest('http://localhost:3000/api/sellables/sellable-1/sync', {
      method: 'POST'
    });

    const response = await POST(request, { params: { id: 'sellable-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lastSyncedAt).toBeDefined();
    expect(new Date(data.lastSyncedAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeSync).getTime());
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(authModule.auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(dbModule.getSellables).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/sellables/sellable-1/sync', {
      method: 'POST'
    });

    const response = await POST(request, { params: { id: 'sellable-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to sync sellable');
  });
});
