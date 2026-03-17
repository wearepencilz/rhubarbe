// Quick test to see if reward allocation works
import { queryWithRetry } from './lib/db-game.ts';

async function testRewardAllocation() {
  try {
    console.log('Testing database connection...');
    
    // Get a recent campaign
    const campaignResult = await queryWithRetry(
      'SELECT id, name, reward_type FROM campaigns ORDER BY created_at DESC LIMIT 1'
    );
    
    console.log('Campaign:', campaignResult.rows[0]);
    
    // Get a recent score
    const scoreResult = await queryWithRetry(
      'SELECT id, session_id, score FROM scores ORDER BY created_at DESC LIMIT 1'
    );
    
    console.log('Score:', scoreResult.rows[0]);
    
    // Check if rewards table exists and has data
    const rewardResult = await queryWithRetry(
      'SELECT COUNT(*) as count FROM rewards'
    );
    
    console.log('Total rewards:', rewardResult.rows[0]);
    
    // Try to insert a test reward
    console.log('\nAttempting to create a test reward...');
    const testReward = await queryWithRetry(
      `INSERT INTO rewards (
        campaign_id,
        score_id,
        claim_code,
        player_name,
        reward_type,
        redemption_instructions,
        expiration_date,
        qr_code_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        campaignResult.rows[0].id,
        scoreResult.rows[0].id,
        'TEST99',
        'Test Player',
        'Test Reward',
        'Test instructions',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'data:image/png;base64,test'
      ]
    );
    
    console.log('Test reward created:', testReward.rows[0]);
    
    // Clean up test reward
    await queryWithRetry('DELETE FROM rewards WHERE claim_code = $1', ['TEST99']);
    console.log('Test reward deleted');
    
    console.log('\n✅ Database connection and reward creation works!');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
  
  process.exit(0);
}

testRewardAllocation();
