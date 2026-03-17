import { getPool } from '../../db-game';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkDatabase() {
  const pool = getPool();
  
  try {
    console.log('🔍 Checking database tables...\n');
    
    // Check what tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if walking_sprites table exists
    const walkingSpritesExists = tablesResult.rows.some(
      row => row.table_name === 'walking_sprites'
    );
    
    if (!walkingSpritesExists) {
      console.log('\n⚠️  walking_sprites table does not exist');
      console.log('Creating walking_sprites table...\n');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS walking_sprites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          idle_sprite_url TEXT NOT NULL,
          walk_sprite_url TEXT NOT NULL,
          jump_sprite_url TEXT NOT NULL,
          frame_width INTEGER NOT NULL,
          frame_height INTEGER NOT NULL,
          walk_frame_count INTEGER NOT NULL,
          walk_frame_rate INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('✅ walking_sprites table created successfully');
    } else {
      console.log('\n✅ walking_sprites table exists');
    }
    
    console.log('\n✅ Database check complete');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkDatabase().catch(console.error);
