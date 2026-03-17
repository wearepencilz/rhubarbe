-- Migration 005: Remove minimum completion time constraint
-- Description: Remove the 10-second minimum completion time check

-- Remove the constraint that requires completion_time >= 10
ALTER TABLE scores DROP CONSTRAINT IF EXISTS valid_completion_time;

-- Add back a simpler constraint that just checks it's non-negative
ALTER TABLE scores ADD CONSTRAINT valid_completion_time CHECK (completion_time >= 0);
