import { NextRequest, NextResponse } from 'next/server';
import { raw } from '@/lib/db-game';

/**
 * POST /api/game/campaigns/[id]/reset
 * Reset a campaign by deleting all sessions, scores, and rewards
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    console.log('Resetting campaign:', campaignId);

    // Delete all rewards for this campaign
    const rewardsResult = await raw(
      'DELETE FROM rewards WHERE campaign_id = $1',
      [campaignId]
    );
    console.log('Deleted rewards:', rewardsResult.rowCount);

    // Delete all scores for this campaign
    const scoresResult = await raw(
      'DELETE FROM scores WHERE campaign_id = $1',
      [campaignId]
    );
    console.log('Deleted scores:', scoresResult.rowCount);

    // Delete all sessions for this campaign
    const sessionsResult = await raw(
      'DELETE FROM game_sessions WHERE campaign_id = $1',
      [campaignId]
    );
    console.log('Deleted sessions:', sessionsResult.rowCount);

    return NextResponse.json({
      success: true,
      message: 'Campaign reset successfully',
      deleted: {
        rewards: rewardsResult.rowCount,
        scores: scoresResult.rowCount,
        sessions: sessionsResult.rowCount,
      },
    });
  } catch (error) {
    console.error('Error resetting campaign:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
