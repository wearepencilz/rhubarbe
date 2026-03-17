import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { insertOne, getActiveCampaign } from '@/lib/db-game';
import type { CreateSessionRequest, CreateSessionResponse } from '@/types/game';

/**
 * POST /api/game/sessions
 * Create a new game session
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json();
    const { playerName, characterId, campaignId, contactPhone, contactEmail } = body;

    // Validate player name (2-20 characters)
    if (!playerName || playerName.length < 2 || playerName.length > 20) {
      return NextResponse.json(
        { error: 'Player name must be between 2 and 20 characters' },
        { status: 400 }
      );
    }

    // Validate character ID
    if (!characterId || typeof characterId !== 'string') {
      return NextResponse.json(
        { error: 'Valid character ID is required' },
        { status: 400 }
      );
    }

    // Validate campaign ID
    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { error: 'Valid campaign ID is required' },
        { status: 400 }
      );
    }

    // Get campaign and verify it's active
    const campaign = await getActiveCampaign(campaignId);
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or not active' },
        { status: 404 }
      );
    }

    // Build sprite configuration from campaign fields
    let spriteConfig = null;
    if ((campaign as any).walk_sprite_url) {
      spriteConfig = {
        idleSpriteUrl: (campaign as any).player_sprite_url || (campaign as any).walk_sprite_url,
        walkSpriteUrl: (campaign as any).walk_sprite_url,
        jumpSpriteUrl: (campaign as any).player_jump_sprite_url || (campaign as any).player_sprite_url,
        frameWidth: (campaign as any).sprite_frame_width || 32,
        frameHeight: (campaign as any).sprite_frame_height || 48,
        walkFrameCount: (campaign as any).sprite_walk_frames || 4,
        walkFrameRate: (campaign as any).sprite_frame_rate || 10,
      };
    }

    // Check if campaign has started and not ended
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    if (now < startDate) {
      return NextResponse.json(
        { 
          error: 'Campaign has not started yet',
          startsAt: campaign.start_date 
        },
        { status: 400 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        { error: 'Campaign has ended' },
        { status: 400 }
      );
    }

    // Get IP address from request
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    // Get browser fingerprint from headers (if provided by client)
    const browserFingerprint = request.headers.get('x-browser-fingerprint') || undefined;

    // Check if user is a Golden Spoon member (from NextAuth session)
    // Make this optional - if auth fails, just treat as non-Golden Spoon
    let isGoldenSpoon = false;
    try {
      const session = await auth();
      isGoldenSpoon = session?.user ? true : false; // Simplified - enhance based on your auth logic
    } catch (error) {
      // Auth not configured or failed - treat as non-Golden Spoon member
      console.log('Auth check skipped for game session (not configured)');
    }

    // Create game session
    const gameSession = await insertOne('game_sessions', {
      campaign_id: campaignId,
      player_name: playerName,
      character_id: characterId,
      ip_address: ip,
      browser_fingerprint: browserFingerprint,
      is_golden_spoon: isGoldenSpoon,
      contact_phone: contactPhone || null,
      contact_email: contactEmail || null,
    });

    // Prepare response with game configuration
    const response: CreateSessionResponse = {
      sessionId: gameSession.id,
      gameConfig: {
        timerDuration: campaign.timer_duration,
        levelData: campaign.level_config,
        assets: {
          playerSpriteUrl: (campaign as any).player_sprite_url || null,
          playerWalkSpriteUrl: (campaign as any).player_walk_sprite_url || null,
          playerJumpSpriteUrl: (campaign as any).player_jump_sprite_url || null,
          icecreamSpriteUrl: (campaign as any).icecream_sprite_url || null,
          ingredientSpriteUrl: (campaign as any).ingredient_sprite_url || null,
          platformSpriteUrl: (campaign as any).platform_sprite_url || null,
          backgroundUrl: (campaign as any).background_url || null,
          hazardSpriteUrl: (campaign as any).hazard_sprite_url || null,
        },
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating game session:', error);
    return NextResponse.json(
      { error: 'Failed to create game session' },
      { status: 500 }
    );
  }
}
