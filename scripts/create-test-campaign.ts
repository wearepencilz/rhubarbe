/**
 * Create a test campaign for game testing
 * Run with: npx tsx scripts/create-test-campaign.ts
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createTestCampaign() {
  const { insertOne } = await import('../lib/db-game');
  
  console.log('🎮 Creating test campaign...\n');
  
  try {
    const campaign = await insertOne('campaigns', {
      name: 'Ice Cream Hunt - Test Campaign',
      start_date: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
      end_date: new Date(Date.now() + 86400000 * 7).toISOString(), // Ends in 7 days
      status: 'active',
      timer_duration: 60,
      reward_total: 100,
      reward_remaining: 100,
      level_config: JSON.stringify({
        platforms: [
          // Ground
          { x: 0, y: 550, width: 800, height: 50 },
          // Platforms
          { x: 150, y: 450, width: 150, height: 20 },
          { x: 400, y: 350, width: 150, height: 20 },
          { x: 100, y: 250, width: 150, height: 20 },
          { x: 500, y: 200, width: 150, height: 20 },
        ],
        iceCreams: [
          { x: 575, y: 150 }, // On top platform
        ],
        spawnPoint: { x: 50, y: 500 },
      }),
    });

    console.log('✅ Campaign created successfully!\n');
    console.log('Campaign Details:');
    console.log(`  ID: ${campaign.id}`);
    console.log(`  Name: ${campaign.name}`);
    console.log(`  Status: ${campaign.status}`);
    console.log(`  Timer: ${campaign.timer_duration}s`);
    console.log(`  Rewards: ${campaign.reward_remaining}/${campaign.reward_total}`);
    console.log('\n🎯 Game URL:');
    console.log(`  http://localhost:3000/game/${campaign.id}`);
    console.log('\n📋 To test:');
    console.log('  1. Start the dev server: npm run dev');
    console.log('  2. Visit the game URL above');
    console.log('  3. Enter your name and select a character');
    console.log('  4. Play the game and find the ice cream!');
    console.log('  5. Check the leaderboard after completing');
    
  } catch (error) {
    console.error('❌ Error creating campaign:', error);
    process.exit(1);
  }
}

createTestCampaign();
