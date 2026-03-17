#!/usr/bin/env tsx
/**
 * Verify campaign layouts
 * Run with: npx tsx scripts/verify-campaign-layout.ts
 */

import { queryWithRetry } from '../lib/db-game';

async function verifyCampaigns() {
  try {
    console.log('🔍 Verifying campaign layouts...\n');

    // Get all campaigns
    const result = await queryWithRetry(
      'SELECT id, name, level_config FROM campaigns ORDER BY created_at DESC'
    );

    if (result.rows.length === 0) {
      console.log('No campaigns found.');
      return;
    }

    console.log(`Found ${result.rows.length} campaign(s):\n`);

    // Check each campaign
    for (const campaign of result.rows) {
      console.log(`📋 Campaign: ${campaign.name}`);
      console.log(`   ID: ${campaign.id}`);
      
      const config = typeof campaign.level_config === 'string' 
        ? JSON.parse(campaign.level_config)
        : campaign.level_config;
      
      console.log(`   World Width: ${config.worldWidth}px`);
      console.log(`   Spawn Point: x=${config.spawnPoint.x}, y=${config.spawnPoint.y}`);
      console.log(`   Platforms: ${config.platforms.length}`);
      
      // Show platform Y positions
      config.platforms.forEach((p: any, i: number) => {
        console.log(`     ${i + 1}. y=${p.y}, width=${p.width}`);
      });
      
      console.log(`   Ingredients: ${config.ingredients.length}`);
      config.ingredients.forEach((ing: any, i: number) => {
        console.log(`     ${i + 1}. x=${ing.x}, y=${ing.y}`);
      });
      
      console.log(`   Ice Cream: x=${config.iceCreams[0].x}, y=${config.iceCreams[0].y}`);
      console.log('');
    }

    console.log('✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error verifying campaigns:', error);
    process.exit(1);
  }
}

// Run the verification
verifyCampaigns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
