import { queryWithRetry, getPool } from '@/lib/db-game';

async function updateCampaignLevels() {
  try {
    console.log('Updating campaign levels to new Mario-style layout...');

    // New level configuration
    const newLevelConfig = {
      platforms: [
        // Ground level - with gaps for falling
        { x: 0, y: 550, width: 300, height: 50 },      // Start platform
        { x: 400, y: 550, width: 300, height: 50 },    // Gap at 300-400
        { x: 800, y: 550, width: 300, height: 50 },    // Gap at 700-800
        { x: 1200, y: 550, width: 400, height: 50 },   // End platform
        
        // Floating platforms
        { x: 500, y: 400, width: 150, height: 20 },    // Mid-air platform 1
        { x: 900, y: 350, width: 150, height: 20 },    // Mid-air platform 2
      ],
      iceCreams: [
        { x: 1400, y: 200 }, // Far right on second screen
      ],
      ingredients: [
        { x: 150, y: 450 },   // First platform
        { x: 550, y: 300 },   // On floating platform 1
        { x: 1000, y: 250 },  // Above floating platform 2
      ],
      hazards: [
        { x: 350, y: 580 },   // In first gap
        { x: 750, y: 580 },   // In second gap
      ],
      spawnPoint: { x: 50, y: 450 },
      worldWidth: 1600,
    };

    // Update all campaigns
    const result = await queryWithRetry(
      `UPDATE campaigns 
       SET level_config = $1 
       WHERE level_config IS NOT NULL
       RETURNING id, name`,
      [JSON.stringify(newLevelConfig)]
    );

    console.log(`✅ Updated ${result.rowCount} campaign(s):`);
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.id})`);
    });

    // Close pool
    const pool = getPool();
    await pool.end();
  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  }
}

updateCampaignLevels()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
