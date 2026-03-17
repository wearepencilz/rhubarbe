-- Migration: Create walking_sprites table
-- Description: Store animated sprite configurations for game characters

CREATE TABLE IF NOT EXISTS walking_sprites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Sprite assets (URLs to uploaded images)
  idle_sprite_url TEXT NOT NULL,
  walk_sprite_url TEXT NOT NULL,
  jump_sprite_url TEXT NOT NULL,
  
  -- Sprite configuration
  frame_width INTEGER NOT NULL DEFAULT 32,
  frame_height INTEGER NOT NULL DEFAULT 48,
  walk_frame_count INTEGER NOT NULL DEFAULT 4,
  walk_frame_rate INTEGER NOT NULL DEFAULT 10,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for active sprites
CREATE INDEX IF NOT EXISTS idx_walking_sprites_active ON walking_sprites(is_active);

-- Add sprite fields directly to campaigns table for inline sprite configuration
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS idle_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS walk_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS jump_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS sprite_frame_width INTEGER DEFAULT 32,
ADD COLUMN IF NOT EXISTS sprite_frame_height INTEGER DEFAULT 48,
ADD COLUMN IF NOT EXISTS sprite_walk_frames INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS sprite_frame_rate INTEGER DEFAULT 10;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_walking_sprites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER walking_sprites_updated_at
BEFORE UPDATE ON walking_sprites
FOR EACH ROW
EXECUTE FUNCTION update_walking_sprites_updated_at();
