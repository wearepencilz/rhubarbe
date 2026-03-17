-- Game Feature Database Schema
-- Migration: 001_initial_schema
-- Description: Creates tables for game campaigns, sessions, scores, rewards, and analytics

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CAMPAIGNS TABLE
-- Stores game campaign configurations
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
  timer_duration INTEGER NOT NULL DEFAULT 60,
  reward_total INTEGER NOT NULL DEFAULT 100,
  reward_remaining INTEGER NOT NULL DEFAULT 100,
  level_config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_status CHECK (status IN ('upcoming', 'active', 'paused', 'ended')),
  CONSTRAINT valid_timer CHECK (timer_duration >= 45 AND timer_duration <= 90),
  CONSTRAINT valid_reward_total CHECK (reward_total > 0),
  CONSTRAINT valid_reward_remaining CHECK (reward_remaining >= 0 AND reward_remaining <= reward_total)
);

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(status, start_date, end_date) 
  WHERE status = 'active';

-- ============================================================================
-- GAME_SESSIONS TABLE
-- Stores individual game session data
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  character_id VARCHAR(50) NOT NULL,
  ip_address INET NOT NULL,
  browser_fingerprint VARCHAR(255),
  is_golden_spoon BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_player_name CHECK (LENGTH(player_name) >= 2 AND LENGTH(player_name) <= 20)
);

-- Indexes for game_sessions
CREATE INDEX IF NOT EXISTS idx_sessions_campaign ON game_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sessions_ip ON game_sessions(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_fingerprint ON game_sessions(browser_fingerprint, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON game_sessions(created_at DESC);

-- ============================================================================
-- SCORES TABLE
-- Stores validated game scores
-- ============================================================================
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE UNIQUE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  completion_time INTEGER NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_score CHECK (score >= 0),
  CONSTRAINT valid_completion_time CHECK (completion_time >= 10)
);

-- Indexes for scores (optimized for leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores(campaign_id, score DESC, created_at ASC) 
  WHERE is_valid = TRUE AND is_flagged = FALSE;
CREATE INDEX IF NOT EXISTS idx_scores_player ON scores(player_name, campaign_id);
CREATE INDEX IF NOT EXISTS idx_scores_flagged ON scores(campaign_id, is_flagged) 
  WHERE is_flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_scores_session ON scores(session_id);

-- ============================================================================
-- REWARDS TABLE
-- Stores reward allocations and redemption status
-- ============================================================================
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  score_id UUID NOT NULL REFERENCES scores(id) ON DELETE CASCADE UNIQUE,
  claim_code VARCHAR(20) NOT NULL UNIQUE,
  player_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  reward_type VARCHAR(100) NOT NULL,
  redemption_instructions TEXT NOT NULL,
  redeemed_at TIMESTAMP,
  expiration_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_claim_code CHECK (LENGTH(claim_code) = 16),
  CONSTRAINT valid_contact CHECK (contact_email IS NOT NULL OR contact_phone IS NOT NULL)
);

-- Indexes for rewards
CREATE INDEX IF NOT EXISTS idx_rewards_claim_code ON rewards(claim_code);
CREATE INDEX IF NOT EXISTS idx_rewards_campaign ON rewards(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rewards_redeemed ON rewards(redeemed_at) 
  WHERE redeemed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_expired ON rewards(expiration_date) 
  WHERE redeemed_at IS NULL;

-- ============================================================================
-- VALIDATION_LOGS TABLE
-- Stores anti-cheat validation logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS validation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  validation_type VARCHAR(50) NOT NULL,
  passed BOOLEAN NOT NULL,
  reason TEXT,
  ip_address INET,
  browser_fingerprint VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for validation_logs
CREATE INDEX IF NOT EXISTS idx_validation_logs_session ON validation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_type ON validation_logs(validation_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_validation_logs_failed ON validation_logs(passed, created_at DESC) 
  WHERE passed = FALSE;
CREATE INDEX IF NOT EXISTS idx_validation_logs_ip ON validation_logs(ip_address, created_at DESC);

-- ============================================================================
-- ANALYTICS_EVENTS TABLE
-- Stores game analytics events
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_campaign ON analytics_events(campaign_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type, created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for campaigns updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to decrement reward_remaining when reward is allocated
CREATE OR REPLACE FUNCTION decrement_campaign_rewards()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns
  SET reward_remaining = reward_remaining - 1
  WHERE id = NEW.campaign_id AND reward_remaining > 0;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No rewards remaining for campaign %', NEW.campaign_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrement rewards on reward creation
DROP TRIGGER IF EXISTS decrement_rewards_on_insert ON rewards;
CREATE TRIGGER decrement_rewards_on_insert
  BEFORE INSERT ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION decrement_campaign_rewards();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE campaigns IS 'Game campaign configurations with reward limits and level data';
COMMENT ON TABLE game_sessions IS 'Individual game sessions with player info and anti-cheat data';
COMMENT ON TABLE scores IS 'Validated game scores for leaderboard';
COMMENT ON TABLE rewards IS 'Reward allocations for first 100 eligible winners';
COMMENT ON TABLE validation_logs IS 'Anti-cheat validation logs for monitoring';
COMMENT ON TABLE analytics_events IS 'Game analytics events for tracking player behavior';

COMMENT ON COLUMN campaigns.level_config IS 'JSONB containing platform positions and ice cream locations';
COMMENT ON COLUMN campaigns.reward_remaining IS 'Automatically decremented when rewards are allocated';
COMMENT ON COLUMN game_sessions.browser_fingerprint IS 'Used for anti-cheat duplicate detection';
COMMENT ON COLUMN scores.is_flagged IS 'Marked true by anti-cheat system for manual review';
COMMENT ON COLUMN rewards.claim_code IS '16-character unique code for reward redemption';
