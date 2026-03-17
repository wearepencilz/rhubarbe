/**
 * Update campaign dates to make it active now
 * Run with: npx tsx scripts/update-campaign-dates.ts <campaign-id>
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function updateCampaignDates() {
  const campaignId = process.argv[2];
  
  if (!campaignId) {
    console.error('❌ Please provide a campaign ID');
    console.log('Usage: npx tsx scripts/update-campaign-dates.ts <campaign-id>');
    process.exit(1);
  }
  
  const { updateById } = await import('../lib/db-game');
  
  console.log(`🎮 Updating campaign ${campaignId}...\n`);
  
  try {
    const campaign = await updateById('campaigns', campaignId, {
      start_date: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
      end_date: new Date(Date.now() + 86400000 * 7).toISOString(), // Ends in 7 days
      status: 'active',
    });

    console.log('✅ Campaign updated successfully!\n');
    console.log('Campaign Details:');
    console.log(`  ID: ${campaign.id}`);
    console.log(`  Name: ${campaign.name}`);
    console.log(`  Status: ${campaign.status}`);
    console.log(`  Start: ${new Date(campaign.start_date).toLocaleString()}`);
    console.log(`  End: ${new Date(campaign.end_date).toLocaleString()}`);
    console.log('\n🎯 Game URL:');
    console.log(`  http://localhost:3000/game/${campaign.id}`);
    
  } catch (error) {
    console.error('❌ Error updating campaign:', error);
    process.exit(1);
  }
}

updateCampaignDates();
