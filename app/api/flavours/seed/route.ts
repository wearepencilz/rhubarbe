import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFlavours, saveFlavours } from '@/lib/db';
import { flavoursSeed, transformSeedToFlavour } from '@/lib/seeds/flavours';
import type { Flavour, ErrorResponse } from '@/types';

/**
 * POST /api/flavours/seed
 * Seeds the database with initial flavour data
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
    const mode = searchParams.get('mode') || 'skip'; // 'skip', 'replace', or 'merge'
    
    const existingFlavours = await getFlavours() as Flavour[];
    let finalFlavours: Flavour[] = [];
    let stats = {
      existing: existingFlavours.length,
      seeded: 0,
      skipped: 0,
      replaced: 0,
    };

    // Transform seed data to full Flavour format
    const seedFlavours = flavoursSeed.map(transformSeedToFlavour);

    switch (mode) {
      case 'replace':
        // Replace all existing data with seed data
        finalFlavours = seedFlavours;
        stats.replaced = existingFlavours.length;
        stats.seeded = seedFlavours.length;
        break;

      case 'merge':
        // Merge: update existing by ID, add new ones
        const existingMap = new Map(existingFlavours.map(f => [f.id, f]));
        
        seedFlavours.forEach(seedFlavour => {
          if (existingMap.has(seedFlavour.id)) {
            // Update existing
            existingMap.set(seedFlavour.id, {
              ...existingMap.get(seedFlavour.id)!,
              ...seedFlavour,
              updatedAt: new Date().toISOString(),
            });
            stats.replaced++;
          } else {
            // Add new
            existingMap.set(seedFlavour.id, seedFlavour);
            stats.seeded++;
          }
        });
        
        finalFlavours = Array.from(existingMap.values());
        break;

      case 'skip':
      default:
        // Skip: only add flavours that don't exist
        const existingIds = new Set(existingFlavours.map(f => f.id));
        const newFlavours = seedFlavours.filter(seedFlavour => {
          if (existingIds.has(seedFlavour.id)) {
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
      message: `Seeding completed in '${mode}' mode`,
      stats,
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Error seeding flavours:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to seed flavours',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
