import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFlavours, saveFlavours } from '@/lib/db';
import { transformSeedToFlavour } from '@/lib/seeds/flavours';
import type { Flavour, ErrorResponse } from '@/types';

/**
 * POST /api/flavours/seed/upload
 * Upload and process flavour seed file
 * Requires authentication
 */
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
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'skip';
    
    // Parse JSON body
    const uploadedSeeds = await request.json();
    
    if (!Array.isArray(uploadedSeeds)) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid file format. Expected an array of flavour seeds.',
        code: 'INVALID_FORMAT',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const existingFlavours = await getFlavours() as Flavour[];
    let finalFlavours: Flavour[] = [];
    let stats = {
      existing: existingFlavours.length,
      seeded: 0,
      skipped: 0,
      replaced: 0,
      errors: 0,
    };

    // Transform and validate uploaded seeds
    const transformedFlavours: Flavour[] = [];
    for (const seed of uploadedSeeds) {
      try {
        const flavour = transformSeedToFlavour(seed);
        transformedFlavours.push(flavour);
      } catch (error) {
        console.error('Error transforming seed:', seed, error);
        stats.errors++;
      }
    }

    if (transformedFlavours.length === 0) {
      const errorResponse: ErrorResponse = {
        error: 'No valid flavours found in uploaded file',
        code: 'NO_VALID_DATA',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    switch (mode) {
      case 'replace':
        finalFlavours = transformedFlavours;
        stats.replaced = existingFlavours.length;
        stats.seeded = transformedFlavours.length;
        break;

      case 'merge':
        const existingMap = new Map(existingFlavours.map(f => [f.id, f]));
        
        transformedFlavours.forEach(f => {
          if (existingMap.has(f.id)) {
            existingMap.set(f.id, {
              ...existingMap.get(f.id)!,
              ...f,
              updatedAt: new Date().toISOString(),
            });
            stats.replaced++;
          } else {
            existingMap.set(f.id, f);
            stats.seeded++;
          }
        });
        
        finalFlavours = Array.from(existingMap.values());
        break;

      case 'skip':
      default:
        const existingIds = new Set(existingFlavours.map(f => f.id));
        const newFlavours = transformedFlavours.filter(f => {
          if (existingIds.has(f.id)) {
            stats.skipped++;
            return false;
          }
          stats.seeded++;
          return true;
        });
        
        finalFlavours = [...existingFlavours, ...newFlavours];
        break;
    }

    await saveFlavours(finalFlavours);

    return NextResponse.json({
      success: true,
      message: `Upload completed in '${mode}' mode`,
      stats,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading flavours:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to process uploaded file',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
