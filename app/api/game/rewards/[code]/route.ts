import { NextRequest, NextResponse } from 'next/server';
import { raw } from '@/lib/db-game';

/**
 * GET /api/game/rewards/[code]
 * Look up reward by claim code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { error: 'Claim code is required' },
        { status: 400 }
      );
    }

    // Look up reward
    const result = await raw(`
      SELECT 
        r.*,
        c.name as campaign_name
      FROM rewards r
      JOIN campaigns c ON r.campaign_id = c.id
      WHERE r.claim_code = $1
    `, [code.toUpperCase()]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    const reward = result.rows[0];

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Error looking up reward:', error);
    return NextResponse.json(
      { error: 'Failed to look up reward' },
      { status: 500 }
    );
  }
}
