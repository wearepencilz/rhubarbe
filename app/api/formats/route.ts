import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFormats, saveFormats } from '@/lib/db';
import type { Format, ErrorResponse } from '@/types';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const formats = await getFormats() as Format[];
    return NextResponse.json(formats);
  } catch (error) {
    console.error('Error fetching formats:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch formats',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    const errorResponse: ErrorResponse = {
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    const body = await request.json();
    const formats = await getFormats() as Format[];
    
    // Validate unique name
    const duplicateName = formats.find(
      f => f.name.toLowerCase() === body.name.toLowerCase()
    );
    
    if (duplicateName) {
      const errorResponse: ErrorResponse = {
        error: 'A format with this name already exists',
        code: 'DUPLICATE_NAME',
        details: { existingId: duplicateName.id },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }
    
    // Validate unique slug
    const duplicateSlug = formats.find(
      f => f.slug.toLowerCase() === body.slug.toLowerCase()
    );
    
    if (duplicateSlug) {
      const errorResponse: ErrorResponse = {
        error: 'A format with this slug already exists',
        code: 'DUPLICATE_SLUG',
        details: { existingId: duplicateSlug.id },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }
    
    // Validate slug is URL-safe
    const urlSafeRegex = /^[a-z0-9-]+$/;
    if (!urlSafeRegex.test(body.slug)) {
      const errorResponse: ErrorResponse = {
        error: 'Slug must be URL-safe (lowercase letters, numbers, and hyphens only)',
        code: 'INVALID_SLUG',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // Validate minFlavours <= maxFlavours
    if (body.minFlavours > body.maxFlavours) {
      const errorResponse: ErrorResponse = {
        error: 'Minimum flavours must be less than or equal to maximum flavours',
        code: 'INVALID_FLAVOUR_RANGE',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const now = new Date().toISOString();
    const newFormat: Format = {
      id: randomUUID(),
      ...body,
      createdAt: now,
      updatedAt: now,
    };
    
    formats.push(newFormat);
    await saveFormats(formats);
    
    return NextResponse.json(newFormat, { status: 201 });
  } catch (error) {
    console.error('Error creating format:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to create format',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
