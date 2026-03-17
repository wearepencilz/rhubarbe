import { NextRequest, NextResponse } from 'next/server';
import { insertOne, findById, raw } from '@/lib/db-game';
import { scoreValidator } from '@/lib/game/score-validator';
import { RewardAllocator } from '@/lib/game/reward-allocator';
import type { SubmitScoreRequest, SubmitScoreResponse } from '@/types/game';

/**
 * POST /api/game/scores
 * Submit and validate a game score
 */
export async function POST(request: NextRequest) {
  try {
    const body: SubmitScoreRequest = await request.json();
    const { sessionId, score, completionTime, clientTimestamp } = body;

    // Validate request payload
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Valid session ID is required' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { error: 'Valid score is required' },
        { status: 400 }
      );
    }

    if (typeof completionTime !== 'number' || completionTime < 0) {
      return NextResponse.json(
        { error: 'Valid completion time is required' },
        { status: 400 }
      );
    }

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';

    // Get browser fingerprint
    const browserFingerprint = request.headers.get('x-browser-fingerprint') || undefined;

    // Validate the score submission
    const validationResult = await scoreValidator.validate({
      sessionId,
      score,
      completionTime,
      clientTimestamp,
      ipAddress,
      browserFingerprint,
    });

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          valid: false,
          message: validationResult.reason || 'Score validation failed',
        } as SubmitScoreResponse,
        { status: 400 }
      );
    }

    // Get session to retrieve campaign and player info
    const session = await findById('game_sessions', sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Store the score
    const scoreRecord = await insertOne('scores', {
      session_id: sessionId,
      campaign_id: session.campaign_id,
      player_name: session.player_name,
      score,
      completion_time: completionTime,
      is_valid: true,
      is_flagged: validationResult.flagged,
      flag_reason: validationResult.flagged ? validationResult.reason : null,
    });

    // Update session completion time
    await raw(
      'UPDATE game_sessions SET completed_at = NOW() WHERE id = $1',
      [sessionId]
    );

    // Get player's rank on leaderboard (by score)
    const rankResult = await raw<{ rank: string }>(
      `
      SELECT COUNT(*) + 1 as rank
      FROM scores
      WHERE campaign_id = $1
        AND is_valid = TRUE
        AND is_flagged = FALSE
        AND (score > $2 OR (score = $2 AND created_at < $3))
      `,
      [session.campaign_id, score, scoreRecord.created_at]
    );

    const rank = parseInt(rankResult.rows[0]?.rank || '0', 10);

    // Get completion order (first 100 to complete get rewards)
    const completionOrderResult = await raw<{ completion_order: string }>(
      `
      SELECT COUNT(*) + 1 as completion_order
      FROM scores
      WHERE campaign_id = $1
        AND is_valid = TRUE
        AND created_at < $2
      `,
      [session.campaign_id, scoreRecord.created_at]
    );

    const completionOrder = parseInt(completionOrderResult.rows[0]?.completion_order || '0', 10);

    // Get campaign winner_count
    const campaignResult = await raw<{ winner_count: number }>(
      'SELECT winner_count FROM campaigns WHERE id = $1',
      [session.campaign_id]
    );
    const winnerCount = campaignResult.rows[0]?.winner_count || 100;

    // Check if player is eligible for reward (within winner_count and not flagged)
    const isWinner = completionOrder <= winnerCount && !validationResult.flagged;

    // Allocate reward if eligible
    let rewardDetails;
    if (isWinner) {
      console.log('Player is a winner (completion order:', completionOrder, ')');
      console.log('Session data:', {
        campaign_id: session.campaign_id,
        player_name: session.player_name,
        contact_phone: (session as any).contact_phone,
        contact_email: (session as any).contact_email,
      });
      
      const rewardAllocator = new RewardAllocator();
      
      try {
        const allocationResult = await rewardAllocator.allocateReward(
          session.campaign_id,
          scoreRecord.id,
          session.player_name,
          (session as any).contact_phone,
          (session as any).contact_email
        );

        console.log('Reward allocation result:', allocationResult);
        console.log('Allocation success?', allocationResult.success);
        console.log('Reward object:', allocationResult.reward);

        if (allocationResult.success && allocationResult.reward) {
          rewardDetails = allocationResult.reward;
          console.log('Setting rewardDetails:', rewardDetails);
        } else {
          console.error('Reward allocation failed:', allocationResult.error);
        }
      } catch (error) {
        console.error('Exception during reward allocation:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      }
    }

    const response: SubmitScoreResponse = {
      valid: true,
      rank,
      isWinner,
      reward: rewardDetails,
      message: isWinner 
        ? `Congratulations! You are one of the first ${winnerCount} to complete the game. Check your reward below.`
        : validationResult.flagged
        ? 'Score submitted but flagged for review.'
        : `Score submitted successfully. You finished in position #${completionOrder}.`,
    };

    console.log('Sending response:', response);
    console.log('Response has reward?', !!response.reward);
    if (response.reward) {
      console.log('Response reward details:', JSON.stringify(response.reward, null, 2));
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error submitting score:', error);
    
    // Check if it's a duplicate session error
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { 
          valid: false,
          message: 'This session has already been used for a score submission' 
        } as SubmitScoreResponse,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}
