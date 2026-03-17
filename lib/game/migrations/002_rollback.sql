-- Rollback: Remove asset management columns

ALTER TABLE campaigns
DROP COLUMN IF EXISTS player_sprite_url,
DROP COLUMN IF EXISTS icecream_sprite_url,
DROP COLUMN IF EXISTS ingredient_sprite_url,
DROP COLUMN IF EXISTS platform_sprite_url,
DROP COLUMN IF EXISTS background_url,
DROP COLUMN IF EXISTS hazard_sprite_url,
DROP COLUMN IF EXISTS asset_config;
