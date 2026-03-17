/**
 * Type definitions for the pixel art game feature
 */

export interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'paused' | 'ended';
  timer_duration: number;
  reward_total: number;
  reward_remaining: number;
  level_config: LevelConfig;
  created_at: string;
  updated_at: string;
}

export interface LevelConfig {
  platforms: Platform[];
  iceCreams: IceCream[];
  spawnPoint: Point;
  backgroundTheme?: string;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'solid' | 'platform';
}

export interface IceCream {
  x: number;
  y: number;
  hidden?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface GameSession {
  id: string;
  campaign_id: string;
  player_name: string;
  character_id: string;
  ip_address: string;
  browser_fingerprint?: string;
  is_golden_spoon: boolean;
  created_at: string;
  completed_at?: string;
}

export interface Score {
  id: string;
  session_id: string;
  campaign_id: string;
  player_name: string;
  score: number;
  completion_time: number;
  is_valid: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  completion_time: number;
  created_at: string;
  is_golden_spoon: boolean;
  rank: number;
}

export interface Reward {
  id: string;
  campaign_id: string;
  score_id: string;
  claim_code: string;
  qr_code_url?: string;
  player_name: string;
  contact_email?: string;
  contact_phone?: string;
  reward_type: string;
  redemption_instructions: string;
  redeemed_at?: Date;
  expiration_date: Date;
  created_at: Date;
}

export interface ValidationLog {
  id: string;
  session_id?: string;
  validation_type: string;
  passed: boolean;
  reason?: string;
  ip_address?: string;
  browser_fingerprint?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  campaign_id: string;
  session_id?: string;
  event_type: string;
  event_data?: Record<string, any>;
  created_at: string;
}

// API Request/Response types

export interface CreateSessionRequest {
  playerName: string;
  characterId: string;
  campaignId: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  gameConfig: {
    timerDuration: number;
    levelData: LevelConfig;
    assets?: {
      playerSpriteUrl: string | null;
      playerWalkSpriteUrl: string | null;
      playerJumpSpriteUrl: string | null;
      icecreamSpriteUrl: string | null;
      ingredientSpriteUrl: string | null;
      platformSpriteUrl: string | null;
      hazardSpriteUrl: string | null;
      backgroundUrl: string | null;
    };
  };
}

export interface SubmitScoreRequest {
  sessionId: string;
  score: number;
  completionTime: number;
  clientTimestamp: number;
}

export interface SubmitScoreResponse {
  valid: boolean;
  rank?: number;
  isWinner?: boolean;
  reward?: {
    claimCode: string;
    expirationDate: string;
    redemptionInstructions: string;
  };
  message?: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  winnerCount: number;
}

export interface CampaignResponse extends Campaign {
  computed_status: 'upcoming' | 'active' | 'paused' | 'ended';
  is_active: boolean;
  time_until_start: number;
  time_until_end: number;
}
