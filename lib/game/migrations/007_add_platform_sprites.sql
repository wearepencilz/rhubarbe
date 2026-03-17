-- Migration: Add platform sprite fields to campaigns table
-- Description: Support for multiple platform sprite types (wood, stone, ice, bridge)

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS platform_wood_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS platform_stone_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS platform_ice_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS bridge_sprite_url TEXT;

-- Add comments
COMMENT ON COLUMN campaigns.platform_wood_sprite_url IS 'Wood platform sprite (120x40px @ 2x, displays as 60x20px)';
COMMENT ON COLUMN campaigns.platform_stone_sprite_url IS 'Stone platform sprite (120x40px @ 2x, displays as 60x20px)';
COMMENT ON COLUMN campaigns.platform_ice_sprite_url IS 'Ice platform sprite (120x40px @ 2x, displays as 60x20px)';
COMMENT ON COLUMN campaigns.bridge_sprite_url IS 'Bridge sprite for highest platform (120x40px @ 2x, displays as 60x20px)';
