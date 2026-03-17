import { NextRequest, NextResponse } from 'next/server';
import { findById, updateById, deleteById } from '@/lib/db-game';
import type { Campaign } from '@/types/game';

/**
 * GET /api/game/campaigns/[id]
 * Get campaign by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await findById<Campaign>('campaigns', params.id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/game/campaigns/[id]
 * Update campaign
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    console.log('Campaign update request:', {
      id: params.id,
      body: body,
    });
    
    // Validate required fields
    const allowedFields = [
      'name',
      'display_title',
      'description',
      'status',
      'start_date',
      'end_date',
      'timer_duration',
      'reward_total',
      'winner_count',
      'reward_type',
      'reward_description',
      'ticket_success_title',
      'ticket_success_message',
      'level_config',
      'walk_sprite_url',
      'sprite_frame_width',
      'sprite_frame_height',
      'sprite_walk_frames',
      'sprite_frame_rate',
      'player_sprite_url',
      'player_jump_sprite_url',
      'icecream_sprite_url',
      'ingredient_sprite_url',
      'platform_sprite_url',
      'background_url',
      'hazard_sprite_url',
    ];
    
    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    
    console.log('Filtered updates:', updates);
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    const campaign = await updateById<Campaign>('campaigns', params.id, updates);
    
    console.log('Campaign updated successfully:', campaign);
    
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/game/campaigns/[id]
 * Delete campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteById('campaigns', params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
