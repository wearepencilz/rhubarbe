-- Migration 004: Remove reward_remaining logic
-- Description: Remove the reward_remaining column and trigger since we now use completion order

-- Drop the trigger that decrements reward_remaining
DROP TRIGGER IF EXISTS decrement_rewards_on_insert ON rewards;

-- Drop the function that decrements reward_remaining
DROP FUNCTION IF EXISTS decrement_campaign_rewards();

-- Remove the reward_remaining column from campaigns
ALTER TABLE campaigns DROP COLUMN IF EXISTS reward_remaining;

-- Remove the constraint that checked reward_remaining
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS valid_reward_remaining;

-- Also relax the contact constraint on rewards table to allow placeholder emails
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS valid_contact;
