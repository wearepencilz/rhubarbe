import { NextResponse } from 'next/server';
import { RewardAllocator } from '@/lib/game/reward-allocator';
import { queryWithRetry } from '@/lib/db-game';

/**
 * GET /api/game/test-reward
 * Test reward allocation
 */
export async function GET() {
  console.log('=== TEST REWARD ENDPOINT CALLED ===');
  
  try {
    console.log('Step 1: Fetching campaign...');
    
    // Get the most recent campaign
    const campaignResult = await queryWithRetry(
      'SELECT id, name, reward_type FROM campaigns ORDER BY created_at DESC LIMIT 1'
    );
    
    console.log('Campaign result:', campaignResult.rows);
    
    if (campaignResult.rows.length === 0) {
      console.log('No campaigns found');
      return NextResponse.json({ error: 'No campaigns found' }, { status: 404 });
    }
    
    const campaign = campaignResult.rows[0];
    console.log('Campaign:', campaign);
    
    console.log('Step 2: Fetching score...');
    
    // Get the most recent score
    const scoreResult = await queryWithRetry(
      'SELECT id FROM scores ORDER BY created_at DESC LIMIT 1'
    );
    
    console.log('Score result:', scoreResult.rows);
    
    if (scoreResult.rows.length === 0) {
      console.log('No scores found');
      return NextResponse.json({ error: 'No scores found' }, { status: 404 });
    }
    
    const score = scoreResult.rows[0];
    console.log('Score:', score);
    
    console.log('Step 3: Allocating reward...');
    
    // Try to allocate a reward
    const rewardAllocator = new RewardAllocator();
    const result = await rewardAllocator.allocateReward(
      campaign.id,
      score.id,
      'Test Player',
      '+12255551234',
      'test@example.com'
    );
    
    console.log('Allocation result:', JSON.stringify(result, null, 2));
    
    // Clean up test reward if created
    if (result.success && result.reward) {
      console.log('Step 4: Cleaning up test reward...');
      await queryWithRetry(
        'DELETE FROM rewards WHERE claim_code = $1',
        [result.reward.claimCode]
      );
      console.log('Test reward cleaned up');
    }
    
    console.log('=== TEST COMPLETE ===');
    
    return NextResponse.json({
      success: true,
      allocationResult: result,
      campaign,
      score,
    });
  } catch (error) {
    console.error('=== TEST ERROR ===');
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error?.constructor?.name,
      },
      { status: 500 }
    );
  }
}
