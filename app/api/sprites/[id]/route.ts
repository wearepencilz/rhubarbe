import { NextRequest, NextResponse } from 'next/server';
import { findById, updateById, deleteById } from '@/lib/db-game';
import type { WalkingSprite } from '@/types/sprite';

/**
 * GET /api/sprites/[id] - Get single sprite
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sprite = await findById<WalkingSprite>('walking_sprites', params.id);

    if (!sprite) {
      return NextResponse.json({ error: 'Sprite not found' }, { status: 404 });
    }

    return NextResponse.json({ sprite });
  } catch (error) {
    console.error('Error fetching sprite:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprite' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sprites/[id] - Update sprite
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add auth check when NextAuth is properly configured

    const data = await request.json();

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.idle_sprite_url) updateData.idle_sprite_url = data.idle_sprite_url;
    if (data.walk_sprite_url) updateData.walk_sprite_url = data.walk_sprite_url;
    if (data.jump_sprite_url) updateData.jump_sprite_url = data.jump_sprite_url;
    if (data.frame_width) updateData.frame_width = parseInt(data.frame_width);
    if (data.frame_height) updateData.frame_height = parseInt(data.frame_height);
    if (data.walk_frame_count) updateData.walk_frame_count = parseInt(data.walk_frame_count);
    if (data.walk_frame_rate) updateData.walk_frame_rate = parseInt(data.walk_frame_rate);
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const sprite = await updateById<WalkingSprite>(
      'walking_sprites',
      params.id,
      updateData
    );

    if (!sprite) {
      return NextResponse.json({ error: 'Sprite not found' }, { status: 404 });
    }

    return NextResponse.json({ sprite });
  } catch (error) {
    console.error('Error updating sprite:', error);
    return NextResponse.json(
      { error: 'Failed to update sprite' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sprites/[id] - Delete sprite
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add auth check when NextAuth is properly configured

    const deleted = await deleteById('walking_sprites', params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Sprite not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sprite:', error);
    return NextResponse.json(
      { error: 'Failed to delete sprite' },
      { status: 500 }
    );
  }
}
