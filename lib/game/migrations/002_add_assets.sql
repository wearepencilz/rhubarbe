-- Migration: Add asset management to campaigns
-- Description: Add columns for storing sprite URLs and asset configuration

-- Add asset columns to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS player_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS icecream_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS ingredient_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS platform_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS background_url TEXT,
ADD COLUMN IF NOT EXISTS hazard_sprite_url TEXT,
ADD COLUMN IF NOT EXISTS asset_config JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN campaigns.player_sprite_url IS 'URL to player character sprite (32x48px recommended)';
COMMENT ON COLUMN campaigns.icecream_sprite_url IS 'URL to ice cream collectible sprite (32x32px recommended)';
COMMENT ON COLUMN campaigns.ingredient_sprite_url IS 'URL to ingredient sprite (24x24px recommended)';
COMMENT ON COLUMN campaigns.platform_sprite_url IS 'URL to platform texture (tileable)';
COMMENT ON COLUMN campaigns.background_url IS 'URL to background image';
COMMENT ON COLUMN campaigns.hazard_sprite_url IS 'URL to hazard sprite (20x20px recommended)';
COMMENT ON COLUMN campaigns.asset_config IS 'Additional asset configuration (sprite sheets, animations, etc.)';
