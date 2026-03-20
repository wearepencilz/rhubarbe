import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  pickupLocations: {
    id: 'id',
    active: 'active',
    updatedAt: 'updatedAt',
  },
}));

import { GET, PATCH, DELETE } from './route';
import { db } from '@/lib/db/client';

const mockSelect = db.select as ReturnType<typeof vi.fn>;
const mockUpdate = db.update as ReturnType<typeof vi.fn>;

const mockLocation = {
  id: 'loc-1',
  internalName: 'Main Store',
  publicLabel: { en: 'Main Store', fr: 'Magasin Principal' },
  address: '123 Main St',
  pickupInstructions: { en: 'Ring the bell', fr: 'Sonnez la cloche' },
  contactDetails: '555-1234',
  active: true,
  sortOrder: 0,
  mapOrDirectionsLink: null,
  operationalNotesForStaff: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const params = { id: 'loc-1' };

describe('GET /api/pickup-locations/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return location when found', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockLocation]),
      }),
    });

    const req = new NextRequest('http://localhost/api/pickup-locations/loc-1');
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe('loc-1');
  });

  it('should return 404 when not found', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const req = new NextRequest('http://localhost/api/pickup-locations/missing');
    const res = await GET(req, { params: { id: 'missing' } });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('not found');
  });

  it('should handle database errors', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('DB error')),
      }),
    });

    const req = new NextRequest('http://localhost/api/pickup-locations/loc-1');
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to fetch');
  });
});

describe('PATCH /api/pickup-locations/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  const createRequest = (body: any) =>
    new NextRequest('http://localhost/api/pickup-locations/loc-1', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  it('should return 404 when not found', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const res = await PATCH(createRequest({ internalName: 'New Name' }), { params: { id: 'missing' } });
    expect(res.status).toBe(404);
  });

  it('should update location with valid data', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockLocation]),
      }),
    });

    const updated = { ...mockLocation, internalName: 'Updated Store' };
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated]),
        }),
      }),
    });

    const res = await PATCH(createRequest({ internalName: 'Updated Store' }), { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.internalName).toBe('Updated Store');
  });

  it('should reject publicLabel missing French', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockLocation]),
      }),
    });

    const res = await PATCH(createRequest({ publicLabel: { en: 'Store' } }), { params });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Public label is required in both English and French');
  });

  it('should reject pickupInstructions missing English', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockLocation]),
      }),
    });

    const res = await PATCH(createRequest({ pickupInstructions: { fr: 'Sonnez' } }), { params });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Pickup instructions are required in both English and French');
  });

  it('should handle database errors', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('DB error')),
      }),
    });

    const res = await PATCH(createRequest({ internalName: 'X' }), { params });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to update');
  });
});

describe('DELETE /api/pickup-locations/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  const createRequest = () =>
    new NextRequest('http://localhost/api/pickup-locations/loc-1', { method: 'DELETE' });

  it('should return 404 when not found', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const res = await DELETE(createRequest(), { params: { id: 'missing' } });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('not found');
  });

  it('should soft delete (set active=false)', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockLocation]),
      }),
    });

    const deactivated = { ...mockLocation, active: false };
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([deactivated]),
        }),
      }),
    });

    const res = await DELETE(createRequest(), { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('deactivated successfully');
    expect(data.location.active).toBe(false);
  });

  it('should handle database errors', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('DB error')),
      }),
    });

    const res = await DELETE(createRequest(), { params });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to delete');
  });
});
