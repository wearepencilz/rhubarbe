/**
 * Update an existing campaign's level layout
 * 
 * Usage: npx tsx scripts/update-campaign-layout.ts <campaign-id>
 */

import { updateById } from '@/lib/db-game';

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

async function updateCampaignLayout(campaignId: string) {
  try {
    console.log(`Updating campaign ${campaignId} with new layout...`);
    
    const result = await updateById('campaigns', campaignId, {
      level_config: JSON.stringify(newLayout),
    });
    
    if (result) {
      console.log('✅ Campaign updated successfully!');
      console.log('New layout:', JSON.stringify(newLayout, null, 2));
    } else {
      console.error('❌ Campaign not found');
    }
  } catch (error) {
    console.error('❌ Error updating campaign:', error);
    throw error;
  }
}

// Get campaign ID from command line
const campaignId = process.argv[2];

if (!campaignId) {
  console.error('Usage: npx tsx scripts/update-campaign-layout.ts <campaign-id>');
  console.error('Example: npx tsx scripts/update-campaign-layout.ts 32c8a714-1ae8-4e6a-bfdf-76b5e8c8e8e8');
  process.exit(1);
}

updateCampaignLayout(campaignId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
