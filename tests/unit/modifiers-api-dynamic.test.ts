import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT, DELETE } from '../../app/api/modifiers/[id]/route';
import { NextRequest } from 'next/server';
import type { Modifier, Sellable } from '../../types/index.js';

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  auth: vi.fn()
}));

// Mock the db module
vi.mock('../../lib/db.js', () => ({
  getModifiers: vi.fn(),
  saveModifiers: vi.fn(),
  getSellables: vi.fn()
}));

import { auth } from '../../lib/auth.js';
import { getModifiers, saveModifiers, getSellables } from '../../lib/db.js';

const mockModifiers: Modifier[] = [
  {
    id: '1',
    name: 'Hot Fudge',
    slug: 'hot-fudge',
    type: 'sauce',
    description: 'Rich chocolate sauce',
    price: 150,
    allergens: ['dairy'],
    dietaryFlags: ['vegetarian'],
    availableForFormatIds: ['format-1', 'format-2'],
    status: 'active',
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Sprinkles',
    slug: 'sprinkles',
    type: 'topping',
    description: 'Rainbow sprinkles',
    price: 50,
    allergens: [],
    dietaryFlags: ['vegan'],
    availableForFormatIds: ['format-1'],
    status: 'active',
    sortOrder: 1,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

const mockSellables: Sellable[] = [
  {
    id: 'sellable-1',
    internalName: 'Double Scoop with Fudge',
    publicName: 'Double Scoop Delight',
    slug: 'double-scoop-delight',
    status: 'active',
    formatId: 'format-1',
    primaryFlavourIds: ['flavour-1', 'flavour-2'],
    toppingIds: ['1'], // References modifier with id '1'
    price: 850,
    inventoryTracked: false,
    onlineOrderable: true,
    pickupOnly: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

describe('GET /api/modifiers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getModifiers).mockResolvedValue(mockModifiers);
  });

  it('should return a single modifier by id', async () => {
    const request = new NextRequest('http://localhost:3000/api/modifiers/1');
    const response = await GET(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('1');
    expect(data.name).toBe('Hot Fudge');
    expect(data.type).toBe('sauce');
  });

  it('should return 404 when modifier not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/modifiers/999');
    const response = await GET(request, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Modifier not found');
    expect(data.code).toBe('NOT_FOUND');
  });

  it('should handle database errors', async () => {
    vi.mocked(getModifiers).mockRejectedValue(new Error('Database error'));
    
    const request = new NextRequest('http://localhost:3000/api/modifiers/1');
    const response = await GET(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch modifier');
    expect(data.timestamp).toBeDefined();
  });
});

describe('PUT /api/modifiers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getModifiers).mockResolvedValue([...mockModifiers]);
    vi.mocked(saveModifiers).mockResolvedValue(undefined);
  });

  it('should update a modifier with valid data', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const updates = {
      name: 'Premium Hot Fudge',
      price: 200,
      description: 'Extra rich chocolate sauce',
    };

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('1');
    expect(data.name).toBe('Premium Hot Fudge');
    expect(data.price).toBe(200);
    expect(data.description).toBe('Extra rich chocolate sauce');
    expect(data.updatedAt).toBeDefined();
    expect(vi.mocked(saveModifiers)).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(data.code).toBe('AUTH_REQUIRED');
  });

  it('should return 404 when modifier not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/999', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const response = await PUT(request, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Modifier not found');
    expect(data.code).toBe('NOT_FOUND');
  });

  it('should return 400 when name is invalid', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ name: '' }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD');
    expect(data.details.field).toBe('name');
  });

  it('should return 400 when slug is invalid', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ slug: '   ' }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD');
    expect(data.details.field).toBe('slug');
  });

  it('should return 400 when price is negative', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ price: -50 }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD');
    expect(data.details.field).toBe('price');
  });

  it('should return 400 when allergens is not an array', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ allergens: 'dairy' }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD');
    expect(data.details.field).toBe('allergens');
  });

  it('should return 400 when dietaryFlags is not an array', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ dietaryFlags: 'vegan' }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD');
    expect(data.details.field).toBe('dietaryFlags');
  });

  it('should return 400 when availableForFormatIds is not an array', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ availableForFormatIds: 'format-1' }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD');
    expect(data.details.field).toBe('availableForFormatIds');
  });

  it('should return 400 when slug already exists on another modifier', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ slug: 'sprinkles' }), // Slug of modifier with id '2'
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('DUPLICATE_SLUG');
    expect(data.details.existingId).toBe('2');
  });

  it('should allow updating slug to the same value (case insensitive)', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ slug: 'HOT-FUDGE' }), // Same slug, different case
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.slug).toBe('HOT-FUDGE');
  });

  it('should not allow changing the id', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ id: '999', name: 'Updated' }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('1'); // ID should remain unchanged
    expect(data.name).toBe('Updated');
  });

  it('should handle database errors during update', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(saveModifiers).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    });

    const response = await PUT(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update modifier');
  });
});

describe('DELETE /api/modifiers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getModifiers).mockResolvedValue([...mockModifiers]);
    vi.mocked(saveModifiers).mockResolvedValue(undefined);
    vi.mocked(getSellables).mockResolvedValue([]);
  });

  it('should delete a modifier when not referenced', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/2', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Modifier deleted successfully');
    expect(vi.mocked(saveModifiers)).toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/modifiers/2', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(data.code).toBe('AUTH_REQUIRED');
  });

  it('should return 404 when modifier not found', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers/999', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Modifier not found');
    expect(data.code).toBe('NOT_FOUND');
  });

  it('should return 400 when modifier is referenced by sellables', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(getSellables).mockResolvedValue(mockSellables);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Cannot delete modifier: it is referenced by sellables');
    expect(data.code).toBe('REFERENTIAL_INTEGRITY_VIOLATION');
    expect(data.details.referencingSellableIds).toEqual(['sellable-1']);
    expect(data.details.count).toBe(1);
    expect(vi.mocked(saveModifiers)).not.toHaveBeenCalled();
  });

  it('should handle multiple sellables referencing the modifier', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    
    const multipleSellables: Sellable[] = [
      ...mockSellables,
      {
        id: 'sellable-2',
        internalName: 'Triple Scoop with Fudge',
        publicName: 'Triple Scoop Supreme',
        slug: 'triple-scoop-supreme',
        status: 'active',
        formatId: 'format-2',
        primaryFlavourIds: ['flavour-1', 'flavour-2', 'flavour-3'],
        toppingIds: ['1'], // Also references modifier with id '1'
        price: 1200,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    
    vi.mocked(getSellables).mockResolvedValue(multipleSellables);

    const request = new NextRequest('http://localhost:3000/api/modifiers/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('REFERENTIAL_INTEGRITY_VIOLATION');
    expect(data.details.referencingSellableIds).toEqual(['sellable-1', 'sellable-2']);
    expect(data.details.count).toBe(2);
  });

  it('should handle database errors during deletion', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(saveModifiers).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/modifiers/2', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to delete modifier');
  });
});
