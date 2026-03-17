import { NextResponse } from 'next/server';
import { queryWithRetry } from '@/lib/db-game';

export async function POST() {
  try {
    console.log('Running migration: Add sprite columns to campaigns...');

    // Add sprite columns to campaigns table
    await queryWithRetry(`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS idle_sprite_url TEXT,
      ADD COLUMN IF NOT EXISTS walk_sprite_url TEXT,
      ADD COLUMN IF NOT EXISTS jump_sprite_url TEXT,
      ADD COLUMN IF NOT EXISTS sprite_frame_width INTEGER DEFAULT 32,
      ADD COLUMN IF NOT EXISTS sprite_frame_height INTEGER DEFAULT 48,
      ADD COLUMN IF NOT EXISTS sprite_walk_frames INTEGER DEFAULT 4,
      ADD COLUMN IF NOT EXISTS sprite_frame_rate INTEGER DEFAULT 10;
    `, []);

    console.log('✅ Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Sprite columns added to campaigns table',
      columns: [
        'idle_sprite_url',
        'walk_sprite_url',
        'jump_sprite_url',
        'sprite_frame_width',
        'sprite_frame_height',
        'sprite_walk_frames',
        'sprite_frame_rate'
      ]
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Migration failed' 
      },
      { status: 500 }
    );
  }
}
