import { NextRequest, NextResponse } from 'next/server';
import { queryWithRetry, updateById } from '@/lib/db-game';

const newLayout = {
  platforms: [
    { x: 0, y: 400, width: 850, height: 20 },      // Ground - Start
    { x: 942, y: 445, width: 133, height: 20 },    // Ground - Gap
    { x: 1069, y: 368, width: 289, height: 20 },   // Ground - End (32px above Start)
    { x: 45, y: 212, width: 196, height: 20 },     // Mid Platform 1
    { x: 520, y: 229, width: 143, height: 20 },    // Mid Platform 2
    { x: 918, y: 176, width: 224, height: 20 },    // Mid Platform 3 (ice cream above)
  ],
  iceCreams: [
    { x: 1020, y: 100 },
  ],
  ingredients: [
    { x: 142, y: 140 },   // Ingredient 1 - Vanilla
    { x: 578, y: 157 },   // Ingredient 2 - Chocolate
    { x: 986, y: 381 },   // Ingredient 3 - Strawberry
  ],
  hazards: [],
  spawnPoint: { x: 53, y: 337 },
  worldWidth: 1360,
};

export async function POST(request: NextRequest) {
  try {
    // Get all campaigns
    const result = await queryWithRetry(
      'SELECT id, name FROM campaigns ORDER BY created_at DESC'
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'No campaigns found' },
        { status: 404 }
      );
    }

    const updated = [];

    // Update each campaign
    for (const campaign of result.rows) {
      await updateById('campaigns', campaign.id, {
        level_config: JSON.stringify(newLayout)
      });
      
      updated.push({
        id: campaign.id,
        name: campaign.name
      });
    }

    return NextResponse.json({
      message: `Successfully updated ${updated.length} campaign(s)`,
      campaigns: updated,
      layout: newLayout
    });

  } catch (error) {
    console.error('Error updating campaigns:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update campaigns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
