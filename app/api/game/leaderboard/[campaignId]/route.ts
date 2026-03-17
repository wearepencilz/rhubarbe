import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getLeaderboard, count } from '@/lib/db-game';
import type { LeaderboardResponse } from '@/types/game';

interface RouteParams {
  params: {
    campaignId: string;
  };
}

/**
 * GET /api/game/leaderboard/[campaignId]
 * Get leaderboard for a campaign with caching
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { campaignId } = params;
    const { searchParams } = new URL(request.url);
    
    // Get pagination parameters
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate campaign ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(campaignId)) {
      return NextResponse.json(
        { error: 'Invalid campaign ID format' },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be non-negative' },
        { status: 400 }
      );
    }

    // Try to get from cache first (5 second TTL)
    const cacheKey = `game:leaderboard:${campaignId}:${limit}:${offset}`;
    
    try {
      const cached = await kv.get<LeaderboardResponse>(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, max-age=5',
          },
        });
      }
    } catch (cacheError) {
      console.warn('Cache read error:', cacheError);
      // Continue without cache
    }

    // Get leaderboard entries from database
    const entries = await getLeaderboard(campaignId, limit);

    // Get total player count for this campaign
    const totalPlayers = await count('scores', {
      campaign_id: campaignId,
      is_valid: true,
      is_flagged: false,
    });

    // Get campaign winner_count
    const { raw } = await import('@/lib/db-game');
    const campaignResult = await raw<{ winner_count: number }>(
      'SELECT winner_count FROM campaigns WHERE id = $1',
      [campaignId]
    );
    const winnerCount = campaignResult.rows[0]?.winner_count || 100;

    const response: LeaderboardResponse = {
      entries,
      totalPlayers,
      winnerCount,
    };

    // Cache the response for 5 seconds
    try {
      await kv.set(cacheKey, response, { ex: 5 });
    } catch (cacheError) {
      console.warn('Cache write error:', cacheError);
      // Continue without caching
    }

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=5',
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
