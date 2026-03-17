import { NextRequest, NextResponse } from 'next/server';
import { raw } from '@/lib/db-game';

/**
 * POST /api/game/rewards/[code]/claim
 * Mark reward as claimed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const { claimedBy } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Claim code is required' },
        { status: 400 }
      );
    }

    if (!claimedBy || typeof claimedBy !== 'string') {
      return NextResponse.json(
        { error: 'Staff name is required' },
        { status: 400 }
      );
    }

    // Check if reward exists and is not already claimed
    const checkResult = await raw(`
      SELECT id, claimed_at, expiration_date
      FROM rewards
      WHERE claim_code = $1
    `, [code.toUpperCase()]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    const reward = checkResult.rows[0];

    if (reward.claimed_at) {
      return NextResponse.json(
        { error: 'Reward already claimed' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(reward.expiration_date) < new Date()) {
      return NextResponse.json(
        { error: 'Reward has expired' },
        { status: 400 }
      );
    }

    // Mark as claimed
    const updateResult = await raw(`
      UPDATE rewards
      SET 
        claimed_at = NOW(),
        claimed_by = $2
      WHERE claim_code = $1
      RETURNING *
    `, [code.toUpperCase(), claimedBy]);

    return NextResponse.json({
      success: true,
      reward: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    return NextResponse.json(
      { error: 'Failed to claim reward' },
      { status: 500 }
    );
  }
}
