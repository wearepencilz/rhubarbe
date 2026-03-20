import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  pickupLocations: {
    id: 'id',
    active: 'active',
    sortOrder: 'sortOrder',
  },
}));

import { GET, POST } from './route';
import { db } from '@/lib/db/client';

const mockSelect = db.select as ReturnType<typeof vi.fn>;
const mockInsert = db.insert as ReturnType<typeof vi.fn>;

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

describe('GET /api/pickup-locations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should return all locations when no filter', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([mockLocation]),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/pickup-locations');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('loc-1');
  });

  it('should filter by active=true', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([mockLocation]),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/pickup-locations?active=true');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('should handle database errors', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockRejectedValue(new Error('DB error')),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/pickup-locations');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to fetch');
  });
});

describe('POST /api/pickup-locations', () => {
  beforeEach(() => vi.clearAllMocks());

  const createRequest = (body: any) =>
    new NextRequest('http://localhost/api/pickup-locations', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  const validBody = {
    internalName: 'Main Store',
    publicLabel: { en: 'Main Store', fr: 'Magasin Principal' },
    address: '123 Main St',
    pickupInstructions: { en: 'Ring the bell', fr: 'Sonnez la cloche' },
    contactDetails: '555-1234',
  };

  describe('Required field validation', () => {
    it('should reject missing internalName', async () => {
      const { internalName, ...body } = validBody;
      const res = await POST(createRequest(body));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Internal name is required');
    });

    it('should reject missing address', async () => {
      const { address, ...body } = validBody;
      const res = await POST(createRequest(body));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Address is required');
    });

    it('should reject missing contactDetails', async () => {
      const { contactDetails, ...body } = validBody;
      const res = await POST(createRequest(body));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Contact details are required');
    });
  });

  describe('Bilingual validation', () => {
    it('should reject missing publicLabel', async () => {
      const { publicLabel, ...body } = validBody;
      const res = await POST(createRequest(body));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Public label is required in both English and French');
    });

    it('should reject publicLabel missing English', async () => {
      const res = await POST(createRequest({ ...validBody, publicLabel: { fr: 'Magasin' } }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Public label is required in both English and French');
    });

    it('should reject publicLabel missing French', async () => {
      const res = await POST(createRequest({ ...validBody, publicLabel: { en: 'Store' } }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Public label is required in both English and French');
    });

    it('should reject missing pickupInstructions', async () => {
      const { pickupInstructions, ...body } = validBody;
      const res = await POST(createRequest(body));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Pickup instructions are required in both English and French');
    });

    it('should reject pickupInstructions missing French', async () => {
      const res = await POST(createRequest({ ...validBody, pickupInstructions: { en: 'Ring bell' } }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Pickup instructions are required in both English and French');
    });
  });

  describe('Successful creation', () => {
    it('should create location with valid data', async () => {
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockLocation]),
        }),
      });

      const res = await POST(createRequest(validBody));
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBe('loc-1');
    });

    it('should default active to true and sortOrder to 0', async () => {
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockLocation]),
        }),
      });

      const res = await POST(createRequest(validBody));
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.active).toBe(true);
      expect(data.sortOrder).toBe(0);
    });
  });
});
