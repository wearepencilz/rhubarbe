-- Migration: 002_add_campaign_text_fields
-- Description: Adds customizable text fields for campaign title, description, and ticket success message

-- Add new text fields to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS display_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS ticket_success_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS ticket_success_message TEXT,
ADD COLUMN IF NOT EXISTS reward_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS reward_description TEXT;

-- Add comments for new columns
COMMENT ON COLUMN campaigns.display_title IS 'Custom title shown on game page (defaults to name if empty)';
COMMENT ON COLUMN campaigns.description IS 'Campaign description shown to players';
COMMENT ON COLUMN campaigns.ticket_success_title IS 'Title shown when player wins a ticket';
COMMENT ON COLUMN campaigns.ticket_success_message IS 'Message shown when player wins a ticket';
COMMENT ON COLUMN campaigns.reward_type IS 'Type of reward (e.g., "Free Scoop", "10% Off")';
COMMENT ON COLUMN campaigns.reward_description IS 'Detailed description of the reward';
