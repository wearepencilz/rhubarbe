/**
 * Test script for game API endpoints
 * Run with: npx tsx scripts/test-game-api.ts
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({ 
      name, 
      passed: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
    console.error(`❌ ${name}:`, error instanceof Error ? error.message : error);
  }
}

async function createTestCampaign(): Promise<string> {
  // First, we need to manually insert a test campaign
  // This would normally be done through an admin interface
  const { insertOne } = await import('../lib/db-game');
  
  const campaign = await insertOne('campaigns', {
    name: 'Test Campaign',
    start_date: new Date(Date.now() - 86400000).toISOString(), // Started yesterday
    end_date: new Date(Date.now() + 86400000).toISOString(), // Ends tomorrow
    status: 'active',
    timer_duration: 60,
    reward_total: 100,
    reward_remaining: 100,
    level_config: JSON.stringify({
      platforms: [
        { x: 0, y: 400, width: 800, height: 50 },
        { x: 200, y: 300, width: 200, height: 20 },
      ],
      iceCreams: [{ x: 300, y: 250 }],
      spawnPoint: { x: 50, y: 350 },
    }),
  });

  return campaign.id;
}

async function runTests() {
  console.log('🚀 Starting Game API Tests\n');

  let campaignId: string;
  let sessionId: string;

  // Test 1: Create test campaign
  await test('Create test campaign', async () => {
    campaignId = await createTestCampaign();
    if (!campaignId) throw new Error('Failed to create campaign');
  });

  // Test 2: Get all campaigns
  await test('GET /api/game/campaigns', async () => {
    const response = await fetch(`${BASE_URL}/api/game/campaigns`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.campaigns || !Array.isArray(data.campaigns)) {
      throw new Error('Invalid response format');
    }
  });

  // Test 3: Get specific campaign
  await test('GET /api/game/campaigns/[id]', async () => {
    const response = await fetch(`${BASE_URL}/api/game/campaigns/${campaignId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.id !== campaignId) throw new Error('Campaign ID mismatch');
    if (!data.is_active) throw new Error('Campaign should be active');
  });

  // Test 4: Create game session
  await test('POST /api/game/sessions', async () => {
    const response = await fetch(`${BASE_URL}/api/game/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: 'TestPlayer',
        characterId: 'vanilla-kid',
        campaignId,
      }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    const data = await response.json();
    sessionId = data.sessionId;
    if (!sessionId) throw new Error('No session ID returned');
    if (!data.gameConfig) throw new Error('No game config returned');
  });

  // Test 5: Submit score
  await test('POST /api/game/scores', async () => {
    // Wait 31 seconds to avoid rate limit from previous tests
    console.log('  ⏳ Waiting 31s for rate limit...');
    await new Promise(resolve => setTimeout(resolve, 31000));
    
    const response = await fetch(`${BASE_URL}/api/game/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        score: 1500,
        completionTime: 45,
        clientTimestamp: Date.now(),
      }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    const data = await response.json();
    if (!data.valid) throw new Error('Score validation failed');
    if (typeof data.rank !== 'number') throw new Error('No rank returned');
  });

  // Test 6: Get leaderboard
  await test('GET /api/game/leaderboard/[campaignId]', async () => {
    const response = await fetch(`${BASE_URL}/api/game/leaderboard/${campaignId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.entries || !Array.isArray(data.entries)) {
      throw new Error('Invalid leaderboard format');
    }
    if (data.entries.length === 0) throw new Error('Leaderboard should have entries');
  });

  // Test 7: Validate duplicate session rejection
  await test('Reject duplicate session submission', async () => {
    const response = await fetch(`${BASE_URL}/api/game/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId, // Same session ID
        score: 2000,
        completionTime: 30,
        clientTimestamp: Date.now(),
      }),
    });
    if (response.ok) throw new Error('Should have rejected duplicate session');
    const data = await response.json();
    if (data.valid !== false) throw new Error('Should return valid: false');
  });

  // Test 8: Validate invalid player name
  await test('Reject invalid player name', async () => {
    const response = await fetch(`${BASE_URL}/api/game/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: 'A', // Too short
        characterId: 'vanilla-kid',
        campaignId,
      }),
    });
    if (response.ok) throw new Error('Should have rejected short name');
  });

  // Test 9: Validate negative score rejection
  await test('Reject negative score', async () => {
    // Create new session first
    const sessionResponse = await fetch(`${BASE_URL}/api/game/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: 'TestPlayer2',
        characterId: 'vanilla-kid',
        campaignId,
      }),
    });
    const sessionData = await sessionResponse.json();

    const response = await fetch(`${BASE_URL}/api/game/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionData.sessionId,
        score: -100, // Negative score
        completionTime: 30,
        clientTimestamp: Date.now(),
      }),
    });
    if (response.ok) throw new Error('Should have rejected negative score');
  });

  // Test 10: Validate reward allocation for top 100
  await test('Allocate reward for top 100 winner', async () => {
    // Wait 31 seconds to avoid rate limit (30s window + 1s buffer)
    console.log('  ⏳ Waiting 31s for rate limit...');
    await new Promise(resolve => setTimeout(resolve, 31000));
    
    // Create new session
    const sessionResponse = await fetch(`${BASE_URL}/api/game/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: 'WinnerPlayer',
        characterId: 'vanilla-kid',
        campaignId,
      }),
    });
    const sessionData = await sessionResponse.json();

    // Submit high score (max is 1000 + 60*10 = 1600)
    const response = await fetch(`${BASE_URL}/api/game/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionData.sessionId,
        score: 1550, // High but valid score
        completionTime: 20,
        clientTimestamp: Date.now(),
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    if (!data.valid) throw new Error('Score validation failed');
    if (!data.isWinner) throw new Error('Should be marked as winner');
    if (!data.reward) throw new Error('Should have reward details');
    if (!data.reward.claimCode) throw new Error('Should have claim code');
    if (data.reward.claimCode.length !== 16) throw new Error('Claim code should be 16 characters');
  });

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);

  if (results.some(r => !r.passed)) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
