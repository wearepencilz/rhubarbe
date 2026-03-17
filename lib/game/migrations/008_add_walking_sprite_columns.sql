-- Migration 008: Add walking sprite columns to campaigns table
-- Description: Add sprite animation fields for inline sprite configuration

-- Add sprite fields directly to campaigns table for inline sprite configuration
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS idle_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS walk_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS jump_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS sprite_frame_width INTEGER DEFAULT 32,
ADD COLUMN IF NOT EXISTS sprite_frame_height INTEGER DEFAULT 48,
ADD COLUMN IF NOT EXISTS sprite_walk_frames INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS sprite_frame_rate INTEGER DEFAULT 10;
