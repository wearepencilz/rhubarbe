-- Migration 007: Add contact info and QR code support
-- Adds email/phone collection and simpler claim codes with QR

-- Add contact fields to rewards table
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS claimed_by VARCHAR(255);

-- Keep claim_code flexible for both old (16 char) and new (6 char) codes
-- No need to alter the column type

-- Add index for faster claim code lookups
CREATE INDEX IF NOT EXISTS idx_rewards_claim_code ON rewards(claim_code);
CREATE INDEX IF NOT EXISTS idx_rewards_claimed_at ON rewards(claimed_at);

-- Add contact fields to sessions table for tracking
ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

COMMENT ON COLUMN rewards.contact_phone IS 'Player phone number for SMS notifications';
COMMENT ON COLUMN rewards.contact_email IS 'Player email for notifications';
COMMENT ON COLUMN rewards.qr_code_url IS 'URL to QR code image for scanning at counter';
COMMENT ON COLUMN rewards.claimed_at IS 'Timestamp when reward was claimed/redeemed';
COMMENT ON COLUMN rewards.claimed_by IS 'Staff member or system that processed the claim';
