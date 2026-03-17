import { findAll } from '../lib/db-game.js';

async function checkCampaigns() {
  try {
    const campaigns = await findAll('campaigns');
    console.log('Campaigns:', JSON.stringify(campaigns, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkCampaigns();
