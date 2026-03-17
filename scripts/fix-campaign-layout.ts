import { updateById, findAll } from '../lib/db-game.js';

async function fixCampaignLayout() {
  try {
    console.log('Fetching campaigns...');
    const campaigns = await findAll('campaigns');
    
    if (campaigns.length === 0) {
      console.log('No campaigns found');
      return;
    }

    // Fixed level configuration for 512x448 resolution (respects 32x48 sprite sizes)
    const fixedLevelConfig = {
      platforms: [
        // Ground level - platforms with gaps (falling = game over)
        { x: 0, y: 400, width: 160, height: 16 },      // Start platform
        { x: 220, y: 400, width: 160, height: 16 },    // After gap 1 (60px gap)
        { x: 440, y: 400, width: 160, height: 16 },    // After gap 2 (60px gap)
        { x: 660, y: 400, width: 364, height: 16 },    // End platform (extends to 1024)
        
        // Mid-level platforms - for ingredients
        { x: 100, y: 320, width: 80, height: 16 },     // Platform 1
        { x: 200, y: 320, width: 80, height: 16 },     // Platform 2
        { x: 360, y: 320, width: 80, height: 16 },     // Platform 3
        { x: 560, y: 320, width: 80, height: 16 },     // Platform 4
      ],
      iceCreams: [
        { x: 900, y: 360 }, // On final ground platform
      ],
      ingredients: [
        { x: 140, y: 280 },   // On platform 1
        { x: 400, y: 280 },   // On platform 3
        { x: 600, y: 280 },   // On platform 4
      ],
      hazards: [],  // No hazards - falling off is the hazard
      spawnPoint: { x: 40, y: 360 },
      worldWidth: 1024,  // 2 screens wide
    };

    console.log('\nFixed level configuration:');
    console.log('- 512x448 resolution (respects 32x48px player sprite)');
    console.log('- Ground platforms (16px height) at y=400 with 60px gaps');
    console.log('- Mid-level platforms at y=320 (80px above ground)');
    console.log('- Ingredients positioned on platforms');
    console.log('- Ice cream on final ground platform');
    console.log('- Falling below y=460 = game over');
    console.log('- Player spawns at x=40, y=360\n');

    for (const campaign of campaigns) {
      console.log(`Updating campaign: ${campaign.name} (${campaign.id})`);
      
      await updateById('campaigns', campaign.id, {
        level_config: JSON.stringify(fixedLevelConfig),
      });
      
      console.log('✓ Updated successfully\n');
    }

    console.log('All campaigns updated!');
    console.log('\nNext steps:');
    console.log('1. Stop dev server (Ctrl+C)');
    console.log('2. Clear Next.js cache: rm -rf .next');
    console.log('3. Restart dev server: npm run dev');
    console.log('4. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
    
  } catch (error) {
    console.error('Error updating campaigns:', error);
  }
  
  process.exit(0);
}

fixCampaignLayout();
