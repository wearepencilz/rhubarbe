#!/usr/bin/env tsx
/**
 * Update all campaigns with new platform layout (16px higher)
 * Run with: npx tsx scripts/update-all-campaigns-layout.ts
 */

import { queryWithRetry, updateById } from '../lib/db-game';

const newLayout = {
  platforms: [
    { x: 0, y: 400, width: 850, height: 20 },      // Ground - Start
    { x: 942, y: 445, width: 133, height: 20 },    // Ground - Gap
    { x: 1069, y: 368, width: 289, height: 20 },   // Ground - End (32px above Start)
    { x: 45, y: 212, width: 196, height: 20 },     // Mid Platform 1
    { x: 520, y: 229, width: 143, height: 20 },    // Mid Platform 2
    { x: 918, y: 176, width: 224, height: 20 },    // Mid Platform 3 (ice cream above)
  ],
  iceCreams: [
    { x: 1020, y: 100 },
  ],
  ingredients: [
    { x: 142, y: 140 },   // Ingredient 1 - Vanilla
    { x: 578, y: 157 },   // Ingredient 2 - Chocolate
    { x: 986, y: 381 },   // Ingredient 3 - Strawberry
  ],
  hazards: [],
  spawnPoint: { x: 53, y: 337 },
  worldWidth: 1360,
};

async function updateAllCampaigns() {
  try {
    console.log('🎮 Updating all campaigns with new platform layout...\n');

    // Get all campaigns
    const result = await queryWithRetry(
      'SELECT id, name FROM campaigns ORDER BY created_at DESC'
    );

    if (result.rows.length === 0) {
      console.log('No campaigns found.');
      return;
    }

    console.log(`Found ${result.rows.length} campaign(s) to update:\n`);

    // Update each campaign
    for (const campaign of result.rows) {
      console.log(`Updating: ${campaign.name} (${campaign.id})`);
      
      await updateById('campaigns', campaign.id, {
        level_config: JSON.stringify(newLayout)
      });
      
      console.log(`✅ Updated successfully\n`);
    }

    console.log('🎉 All campaigns updated with new layout!');
    console.log('\nChanges applied:');
    console.log('- Updated to 400x500 viewport with 1360x500 world');
    console.log('- New platform positions for 4:5 aspect ratio');
    console.log('- Spawn point at (53, 337)');
    console.log('- Physics: gravity=2200, speed=250, jump=-938');
    console.log('\nPlayers can now play existing campaigns with the new layout.');

  } catch (error) {
    console.error('❌ Error updating campaigns:', error);
    process.exit(1);
  }
}

// Run the update
updateAllCampaigns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
