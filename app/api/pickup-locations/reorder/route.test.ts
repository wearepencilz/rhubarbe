import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/client', () => ({
  db: {
    update: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  pickupLocations: {
    id: 'id',
    sortOrder: 'sortOrder',
    updatedAt: 'updatedAt',
  },
}));

import { PATCH } from './route';
import { db } from '@/lib/db/client';

const mockUpdate = db.update as ReturnType<typeof vi.fn>;

const createRequest = (body: any) =>
  new NextRequest('http://localhost/api/pickup-locations/reorder', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

describe('PATCH /api/pickup-locations/reorder', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('Input validation', () => {
    it('should reject non-array body', async () => {
      const res = await PATCH(createRequest({ id: 'loc-1', sort_order: 0 }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('must be an array');
    });

    it('should reject empty array', async () => {
      const res = await PATCH(createRequest([]));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('At least one item');
    });

    it('should reject item missing id', async () => {
      const res = await PATCH(createRequest([{ sort_order: 0 }]));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('valid id');
    });

    it('should reject item missing sort_order', async () => {
      const res = await PATCH(createRequest([{ id: 'loc-1' }]));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('numeric sort_order');
    });

    it('should reject item with non-numeric sort_order', async () => {
      const res = await PATCH(createRequest([{ id: 'loc-1', sort_order: 'first' }]));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('numeric sort_order');
    });
  });

  describe('Successful reorder', () => {
    it('should update sort_order for each location', async () => {
      const loc1 = { id: 'loc-1', sortOrder: 0, active: true };
      const loc2 = { id: 'loc-2', sortOrder: 1, active: true };

      mockUpdate
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([loc1]),
            }),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([loc2]),
            }),
          }),
        });

      const res = await PATCH(createRequest([
        { id: 'loc-1', sort_order: 0 },
        { id: 'loc-2', sort_order: 1 },
      ]));

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.updated).toBe(2);
      expect(data.locations).toHaveLength(2);
    });

    it('should handle single item reorder', async () => {
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'loc-1', sortOrder: 5 }]),
          }),
        }),
      });

      const res = await PATCH(createRequest([{ id: 'loc-1', sort_order: 5 }]));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.updated).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      });

      const res = await PATCH(createRequest([{ id: 'loc-1', sort_order: 0 }]));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain('Failed to reorder');
    });
  });
});
