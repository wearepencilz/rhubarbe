/**
 * Integration tests for format eligibleFlavourTypes validation
 * 
 * Tests PUT /api/formats/[id] endpoint validation of eligibleFlavourTypes field
 * 
 * **Validates: Requirements 2.2, 2.3, 2.4**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PUT, GET } from '@/app/api/formats/[id]/route';
import { NextRequest } from 'next/server';
import { saveFormats, saveSettings } from '@/lib/db';
import type { Format } from '@/types';

describe('PUT /api/formats/[id] - eligibleFlavourTypes validation', () => {
  
  beforeEach(async () => {
    // Setup test formats
    const formats: Format[] = [
      {
        id: 'format-test-1',
        name: 'Test Scoop',
        slug: 'test-scoop',
        category: 'frozen',
        servingStyle: 'scoop',
        description: 'Test format',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 1,
        allowMixedTypes: false,
        canIncludeAddOns: false,
        defaultSizes: ['small', 'medium'],
        menuSection: 'ice-cream',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    await saveFormats(formats);
    
    // Setup test settings with taxonomies
    const settings = {
      taxonomies: {
        flavourTypes: [
          { id: 'gelato', label: 'Gelato', value: 'gelato', sortOrder: 1, archived: false },
          { id: 'sorbet', label: 'Sorbet', value: 'sorbet', sortOrder: 2, archived: false },
          { id: 'soft-serve-base', label: 'Soft Serve Base', value: 'soft-serve-base', sortOrder: 3, archived: false }
        ]
      }
    };
    await saveSettings(settings);
  });
  
  it('should accept valid eligibleFlavourTypes array', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-test-1', {
      method: 'PUT',
      body: JSON.stringify({
        eligibleFlavourTypes: ['gelato', 'sorbet']
      })
    });
    
    const response = await PUT(request, { params: { id: 'format-test-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.eligibleFlavourTypes).toEqual(['gelato', 'sorbet']);
  });
  
  it('should accept empty eligibleFlavourTypes array (accept all types)', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-test-1', {
      method: 'PUT',
      body: JSON.stringify({
        eligibleFlavourTypes: []
      })
    });
    
    const response = await PUT(request, { params: { id: 'format-test-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.eligibleFlavourTypes).toEqual([]);
  });
  
  it('should accept undefined eligibleFlavourTypes (accept all types)', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-test-1', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Name'
        // eligibleFlavourTypes not provided
      })
    });
    
    const response = await PUT(request, { params: { id: 'format-test-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.name).toBe('Updated Name');
  });
  
  it('should reject invalid taxonomy reference', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-test-1', {
      method: 'PUT',
      body: JSON.stringify({
        eligibleFlavourTypes: ['gelato', 'invalid-type']
      })
    });
    
    const response = await PUT(request, { params: { id: 'format-test-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid eligibleFlavourTypes');
    expect(data.details).toBeDefined();
    expect(data.details.length).toBeGreaterThan(0);
    expect(data.details[0].field).toBe('eligibleFlavourTypes');
    expect(data.details[0].constraint).toBe('invalid-taxonomy-reference');
    expect(data.details[0].value).toBe('invalid-type');
  });
  
  it('should reject multiple invalid taxonomy references', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-test-1', {
      method: 'PUT',
      body: JSON.stringify({
        eligibleFlavourTypes: ['invalid-1', 'gelato', 'invalid-2']
      })
    });
    
    const response = await PUT(request, { params: { id: 'format-test-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid eligibleFlavourTypes');
    expect(data.details.length).toBe(2);
    expect(data.details[0].value).toBe('invalid-1');
    expect(data.details[1].value).toBe('invalid-2');
  });
  
  it('should persist eligibleFlavourTypes to database', async () => {
    // Update format with eligibleFlavourTypes
    const putRequest = new NextRequest('http://localhost:3000/api/formats/format-test-1', {
      method: 'PUT',
      body: JSON.stringify({
        eligibleFlavourTypes: ['gelato', 'sorbet']
      })
    });
    
    await PUT(putRequest, { params: { id: 'format-test-1' } });
    
    // Verify it was persisted by fetching it
    const getRequest = new NextRequest('http://localhost:3000/api/formats/format-test-1');
    const response = await GET(getRequest, { params: { id: 'format-test-1' } });
    const data = await response.json();
    
    expect(data.eligibleFlavourTypes).toEqual(['gelato', 'sorbet']);
  });
  
  it('should update updatedAt timestamp when eligibleFlavourTypes is modified', async () => {
    // Get initial timestamp
    const getRequest1 = new NextRequest('http://localhost:3000/api/formats/format-test-1');
    const response1 = await GET(getRequest1, { params: { id: 'format-test-1' } });
    const data1 = await response1.json();
    const initialTimestamp = data1.updatedAt;
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update eligibleFlavourTypes
    const putRequest = new NextRequest('http://localhost:3000/api/formats/format-test-1', {
      method: 'PUT',
      body: JSON.stringify({
        eligibleFlavourTypes: ['gelato']
      })
    });
    
    await PUT(putRequest, { params: { id: 'format-test-1' } });
    
    // Get updated timestamp
    const getRequest2 = new NextRequest('http://localhost:3000/api/formats/format-test-1');
    const response2 = await GET(getRequest2, { params: { id: 'format-test-1' } });
    const data2 = await response2.json();
    
    expect(data2.updatedAt).not.toBe(initialTimestamp);
    expect(new Date(data2.updatedAt).getTime()).toBeGreaterThan(new Date(initialTimestamp).getTime());
  });
  
  it('should allow single flavour type', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-test-1', {
      method: 'PUT',
      body: JSON.stringify({
        eligibleFlavourTypes: ['soft-serve-base']
      })
    });
    
    const response = await PUT(request, { params: { id: 'format-test-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.eligibleFlavourTypes).toEqual(['soft-serve-base']);
  });
  
  it('should allow all valid flavour types', async () => {
    const request = new NextRequest('http://localhost:3000/api/formats/format-test-1', {
      method: 'PUT',
      body: JSON.stringify({
        eligibleFlavourTypes: ['gelato', 'sorbet', 'soft-serve-base']
      })
    });
    
    const response = await PUT(request, { params: { id: 'format-test-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.eligibleFlavourTypes).toEqual(['gelato', 'sorbet', 'soft-serve-base']);
  });
});
