import { NextRequest, NextResponse } from 'next/server';
import { findAll, insertOne } from '@/lib/db-game';
import type { WalkingSprite } from '@/types/sprite';

/**
 * GET /api/sprites - Get all walking sprites
 */
export async function GET() {
  try {
    const sprites = await findAll<WalkingSprite>('walking_sprites', {
      orderBy: 'created_at',
      order: 'DESC',
    });

    return NextResponse.json({ sprites });
  } catch (error) {
    console.error('Error fetching sprites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprites' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sprites - Create new walking sprite
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add auth check when NextAuth is properly configured

    const data = await request.json();

    // Validate required fields
    const required = [
      'name',
      'idle_sprite_url',
      'walk_sprite_url',
      'jump_sprite_url',
      'frame_width',
      'frame_height',
      'walk_frame_count',
      'walk_frame_rate',
    ];

    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const sprite = await insertOne<WalkingSprite>('walking_sprites', {
      name: data.name,
      description: data.description || null,
      idle_sprite_url: data.idle_sprite_url,
      walk_sprite_url: data.walk_sprite_url,
      jump_sprite_url: data.jump_sprite_url,
      frame_width: parseInt(data.frame_width),
      frame_height: parseInt(data.frame_height),
      walk_frame_count: parseInt(data.walk_frame_count),
      walk_frame_rate: parseInt(data.walk_frame_rate),
      is_active: true,
    });

    return NextResponse.json({ sprite }, { status: 201 });
  } catch (error) {
    console.error('Error creating sprite:', error);
    return NextResponse.json(
      { error: 'Failed to create sprite' },
      { status: 500 }
    );
  }
}
