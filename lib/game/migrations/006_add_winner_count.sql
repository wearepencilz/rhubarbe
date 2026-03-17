-- Migration 006: Add winner_count field to campaigns
-- Description: Add configurable winner count (replaces hardcoded 100)

-- Add winner_count column with default of 100
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS winner_count INTEGER NOT NULL DEFAULT 100;

-- Add constraint to ensure winner_count is positive
ALTER TABLE campaigns ADD CONSTRAINT valid_winner_count CHECK (winner_count > 0);
