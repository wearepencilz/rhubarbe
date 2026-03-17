/**
 * Unit tests for GET /api/formats/[id]/eligible-flavours endpoint
 * 
 * Tests the endpoint that returns a format and its eligible flavours.
 * Validates: Requirements 11.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/formats/[id]/eligible-flavours/route';
import { NextRequest } from 'next/server';
import { saveFormats, saveFlavours } from '@/lib/db';
import type { Format, Flavour } from '@/types';

describe('GET /api/formats/[id]/eligible-flavours', () => {
  beforeEach(async () => {
    // Setup test data
    const testFormats: Format[] = [
      {
        id: 'format-1',
        name: 'Single Scoop',
        slug: 'single-scoop',
        category: 'scoop',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'format-2',
        name: 'Sandwich',
        slug: 'sandwich',
        category: 'sandwich',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    const testFlavours: Flavour[] = [
      {
        id: 'flavour-1',
        name: 'Vanilla Gelato',
        slug: 'vanilla-gelato',
        type: 'gelato',
        ingredients: [],
        keyNotes: ['vanilla', 'cream'],
        allergens: ['dairy'],
        dietaryTags: [],
        status: 'active',
        featured: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'flavour-2',
        name: 'Lemon Sorbet',
        slug: 'lemon-sorbet',
        type: 'sorbet',
        ingredients: [],
        keyNotes: ['lemon', 'citrus'],
        allergens: [],
        dietaryTags: ['vegan'],
        status: 'active',
        featured: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'flavour-3',
        name: 'Chocolate Cookie',
        slug: 'chocolate-cookie',
        type: 'cookie',
        ingredients: [],
        keyNotes: ['chocolate', 'cookie'],
        allergens: ['gluten', 'dairy'],
        dietaryTags: [],
        status: 'active',
        featured: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'flavour-4',
        name: 'Archived Gelato',
        slug: 'archived-gelato',
        type: 'gelato',
        ingredients: [],
        keyNotes: ['test'],
        allergens: [],
        dietaryTags: [],
        status: 'archived',
        featured: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    await saveFormats(testFormats);
    await saveFlavours(testFlavours);
  });

  it('should return format and eligible flavours for scoop format', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-1/eligible-flavours');
    const response = await GET(request, { params: { id: 'format-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.format).toBeDefined();
    expect(data.format.id).toBe('format-1');
    expect(data.format.category).toBe('scoop');
    
    expect(data.eligibleFlavours).toBeDefined();
    expect(Array.isArray(data.eligibleFlavours)).toBe(true);
    
    // Scoop format should include gelato and sorbet, but not cookie
    expect(data.eligibleFlavours.length).toBe(3); // 2 active + 1 archived
    expect(data.eligibleFlavours.some((f: Flavour) => f.id === 'flavour-1')).toBe(true); // gelato
    expect(data.eligibleFlavours.some((f: Flavour) => f.id === 'flavour-2')).toBe(true); // sorbet
    expect(data.eligibleFlavours.some((f: Flavour) => f.id === 'flavour-4')).toBe(true); // archived gelato
    expect(data.eligibleFlavours.some((f: Flavour) => f.id === 'flavour-3')).toBe(false); // cookie not eligible
  });

  it('should return format and eligible flavours for sandwich format', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-2/eligible-flavours');
    const response = await GET(request, { params: { id: 'format-2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.format).toBeDefined();
    expect(data.format.id).toBe('format-2');
    expect(data.format.category).toBe('sandwich');
    
    expect(data.eligibleFlavours).toBeDefined();
    
    // Sandwich format should include gelato and cookie
    expect(data.eligibleFlavours.length).toBe(3); // 1 gelato + 1 cookie + 1 archived gelato
    expect(data.eligibleFlavours.some((f: Flavour) => f.id === 'flavour-1')).toBe(true); // gelato
    expect(data.eligibleFlavours.some((f: Flavour) => f.id === 'flavour-3')).toBe(true); // cookie
    expect(data.eligibleFlavours.some((f: Flavour) => f.id === 'flavour-4')).toBe(true); // archived gelato
    expect(data.eligibleFlavours.some((f: Flavour) => f.id === 'flavour-2')).toBe(false); // sorbet not eligible
  });

  it('should filter by status when status query param is provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-1/eligible-flavours?status=active');
    const response = await GET(request, { params: { id: 'format-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.eligibleFlavours).toBeDefined();
    
    // Should only include active flavours
    expect(data.eligibleFlavours.length).toBe(2); // Only active gelato and sorbet
    expect(data.eligibleFlavours.every((f: Flavour) => f.status === 'active')).toBe(true);
    expect(data.eligibleFlavours.some((f: Flavour) => f.id === 'flavour-4')).toBe(false); // archived excluded
  });

  it('should return 404 when format not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/nonexistent/eligible-flavours');
    const response = await GET(request, { params: { id: 'nonexistent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Format not found');
    expect(data.code).toBe('NOT_FOUND');
  });

  it('should return empty array when no flavours are eligible', async () => {
    // Create a soft-serve format (only soft-serve-base flavours eligible)
    const softServeFormat: Format = {
      id: 'format-soft-serve',
      name: 'Soft Serve',
      slug: 'soft-serve',
      category: 'soft-serve',
      requiresFlavours: true,
      minFlavours: 1,
      maxFlavours: 1,
      allowMixedTypes: false,
      canIncludeAddOns: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };
    
    const formats = [softServeFormat];
    await saveFormats(formats);

    const request = new NextRequest('http://localhost:3000/api/formats/format-soft-serve/eligible-flavours');
    const response = await GET(request, { params: { id: 'format-soft-serve' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.format).toBeDefined();
    expect(data.eligibleFlavours).toBeDefined();
    expect(data.eligibleFlavours.length).toBe(0); // No soft-serve-base flavours in test data
  });
});
