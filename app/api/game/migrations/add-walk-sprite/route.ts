import { NextResponse } from 'next/server';
import { queryWithRetry } from '@/lib/db-game';

export async function POST() {
  try {
    // Add the column
    await queryWithRetry(`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS player_walk_sprite_url TEXT
    `);

    return NextResponse.json({
      message: 'Successfully added player_walk_sprite_url column to campaigns table'
    });

  } catch (error) {
    console.error('Error adding column:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add column',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
