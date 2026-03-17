import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../../app/api/modifiers/route';
import { NextRequest } from 'next/server';
import type { Modifier } from '../../types/index.js';

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  auth: vi.fn()
}));

// Mock the db module
vi.mock('../../lib/db.js', () => ({
  getModifiers: vi.fn(),
  saveModifiers: vi.fn()
}));

import { auth } from '../../lib/auth.js';
import { getModifiers, saveModifiers } from '../../lib/db.js';

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
  {
    id: '3',
    name: 'Caramel Drizzle',
    slug: 'caramel-drizzle',
    type: 'drizzle',
    description: 'Sweet caramel',
    price: 100,
    allergens: ['dairy'],
    dietaryFlags: [],
    availableForFormatIds: ['format-2'],
    status: 'archived',
    sortOrder: 2,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

describe('GET /api/modifiers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getModifiers).mockResolvedValue(mockModifiers);
  });

  it('should return all modifiers when no filters applied', async () => {
    const request = new NextRequest('http://localhost:3000/api/modifiers');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
    expect(data).toEqual(mockModifiers);
  });

  it('should filter modifiers by type', async () => {
    const request = new NextRequest('http://localhost:3000/api/modifiers?type=sauce');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].type).toBe('sauce');
    expect(data[0].name).toBe('Hot Fudge');
  });

  it('should filter modifiers by status', async () => {
    const request = new NextRequest('http://localhost:3000/api/modifiers?status=active');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data.every((m: Modifier) => m.status === 'active')).toBe(true);
  });

  it('should filter modifiers by formatId', async () => {
    const request = new NextRequest('http://localhost:3000/api/modifiers?formatId=format-1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data.every((m: Modifier) => m.availableForFormatIds.includes('format-1'))).toBe(true);
  });

  it('should apply multiple filters', async () => {
    const request = new NextRequest('http://localhost:3000/api/modifiers?type=topping&status=active&formatId=format-1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Sprinkles');
  });

  it('should return empty array when no modifiers match filters', async () => {
    const request = new NextRequest('http://localhost:3000/api/modifiers?type=crunch');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('should handle database errors', async () => {
    vi.mocked(getModifiers).mockRejectedValue(new Error('Database error'));
    
    const request = new NextRequest('http://localhost:3000/api/modifiers');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch modifiers');
    expect(data.timestamp).toBeDefined();
  });
});

describe('POST /api/modifiers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getModifiers).mockResolvedValue(mockModifiers);
    vi.mocked(saveModifiers).mockResolvedValue(undefined);
  });

  it('should create a new modifier with valid data', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const newModifier = {
      name: 'Cookie Crumbles',
      slug: 'cookie-crumbles',
      type: 'crunch',
      description: 'Crushed cookies',
      price: 75,
      allergens: ['gluten'],
      dietaryFlags: [],
      availableForFormatIds: ['format-1', 'format-2'],
      status: 'active',
    };

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify(newModifier),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe(newModifier.name);
    expect(data.slug).toBe(newModifier.slug);
    expect(data.type).toBe(newModifier.type);
    expect(data.price).toBe(newModifier.price);
    expect(data.id).toBeDefined();
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(data.code).toBe('AUTH_REQUIRED');
  });

  it('should return 400 when name is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ slug: 'test', type: 'topping', price: 100 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('MISSING_REQUIRED_FIELD');
    expect(data.details.field).toBe('name');
  });

  it('should return 400 when slug is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', type: 'topping', price: 100 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('MISSING_REQUIRED_FIELD');
    expect(data.details.field).toBe('slug');
  });

  it('should return 400 when type is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', slug: 'test', price: 100 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('MISSING_REQUIRED_FIELD');
    expect(data.details.field).toBe('type');
  });

  it('should return 400 when price is missing or invalid', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', slug: 'test', type: 'topping' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD_VALUE');
    expect(data.details.field).toBe('price');
  });

  it('should return 400 when price is negative', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test', 
        slug: 'test', 
        type: 'topping', 
        price: -50,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD_VALUE');
    expect(data.details.field).toBe('price');
  });

  it('should return 400 when allergens is not an array', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test', 
        slug: 'test', 
        type: 'topping', 
        price: 100,
        allergens: 'dairy'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD_VALUE');
    expect(data.details.field).toBe('allergens');
  });

  it('should return 400 when dietaryFlags is not an array', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test', 
        slug: 'test', 
        type: 'topping', 
        price: 100,
        allergens: [],
        dietaryFlags: 'vegan'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD_VALUE');
    expect(data.details.field).toBe('dietaryFlags');
  });

  it('should return 400 when availableForFormatIds is not an array', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test', 
        slug: 'test', 
        type: 'topping', 
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: 'format-1'
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_FIELD_VALUE');
    expect(data.details.field).toBe('availableForFormatIds');
  });

  it('should return 400 when slug already exists', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'New Hot Fudge', 
        slug: 'hot-fudge', // Duplicate slug
        type: 'sauce', 
        price: 200,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('DUPLICATE_SLUG');
    expect(data.details.existingId).toBe('1');
  });

  it('should set default status to active when not provided', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test', 
        slug: 'test-modifier', 
        type: 'topping', 
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.status).toBe('active');
  });

  it('should set default sortOrder to 0 when not provided', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(getModifiers).mockResolvedValue([]); // Empty array to avoid duplicate slug

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test', 
        slug: 'test-modifier', 
        type: 'topping', 
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.sortOrder).toBe(0);
  });

  it('should handle database errors during creation', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'admin@test.com' } } as any);
    vi.mocked(getModifiers).mockResolvedValue([]); // Empty array to avoid duplicate slug
    vi.mocked(saveModifiers).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/modifiers', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test', 
        slug: 'test-modifier', 
        type: 'topping', 
        price: 100,
        allergens: [],
        dietaryFlags: [],
        availableForFormatIds: []
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create modifier');
  });
});
