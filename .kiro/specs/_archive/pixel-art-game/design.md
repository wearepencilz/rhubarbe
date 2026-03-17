# Design Document: Pixel Art Game

## Overview

The pixel art game is a browser-based promotional micro-game that integrates into the Janine ice cream shop platform. Built with Phaser 3 and React, it provides a retro Game Boy-style platformer experience where players compete to find hidden ice cream within a time limit. The first 100 eligible winners receive unlockable rewards through a validated leaderboard system.

### Design Goals

- Seamless integration with existing Next.js 14.2 App Router architecture
- Mobile-first responsive design with touch controls
- Server-side score validation with anti-cheat measures
- Reusable campaign template for future promotions
- Sub-3-second load time on 3G connections
- 30+ FPS gameplay on devices from the past 3 years

### Key Technical Decisions

1. **Phaser 3 for game engine**: Proven 2D framework with excellent performance, physics, and React integration patterns
2. **PostgreSQL for persistence**: Leverages existing database infrastructure with proper indexing for leaderboard queries
3. **Server-side validation**: All score submissions validated on backend to prevent client-side manipulation
4. **Vercel Blob for assets**: CDN-backed storage for fast asset delivery with existing infrastructure
5. **Component isolation**: Game logic encapsulated in dedicated React components that don't interfere with existing store functionality

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Game UI    │  │  Leaderboard │  │  Admin Panel    │  │
│  │  (React +    │  │     UI       │  │  (Extended)     │  │
│  │   Phaser)    │  │              │  │                 │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                  │                    │            │
│  ┌──────┴──────────────────┴────────────────────┴────────┐ │
│  │              API Routes (/api/game/*)                  │ │
│  │  - /sessions    - /scores      - /rewards             │ │
│  │  - /validate    - /leaderboard - /campaigns           │ │
│  └──────┬──────────────────┬────────────────────┬────────┘ │
└─────────┼──────────────────┼────────────────────┼──────────┘
          │                  │                    │
   ┌──────┴──────┐    ┌──────┴──────┐    ┌───────┴────────┐
   │  PostgreSQL │    │ Vercel Blob │    │   Vercel KV    │
   │  (Game Data)│    │  (Assets)   │    │ (Rate Limits)  │
   └─────────────┘    └─────────────┘    └────────────────┘
```

### Data Flow

1. **Game Initialization**: Player enters name → Character selection → Session created in DB → Game loads from Vercel Blob
2. **Gameplay**: Phaser handles rendering/physics → Local state updates → Timer countdown
3. **Score Submission**: Game completes → Client sends score + session ID → Server validates → DB persistence → Leaderboard update
4. **Reward Allocation**: Valid score → Check eligibility → Generate claim code → Send notification → Display to player

### Integration Points

- **NextAuth**: Retrieve Golden Spoon member status from existing session
- **Admin Panel**: Extend `/admin/*` routes with game monitoring dashboard
- **Database**: Add new tables to existing PostgreSQL instance
- **Asset Storage**: Use existing Vercel Blob configuration
- **Rate Limiting**: Use existing Vercel KV for IP-based throttling

## Components and Interfaces

### Frontend Components

#### GameContainer (React Component)
```typescript
interface GameContainerProps {
  campaignId: string;
  onComplete: (score: number) => void;
}
```

Responsibilities:
- Initialize Phaser 3 game instance
- Manage game lifecycle (mount/unmount)
- Handle communication between React and Phaser
- Display pre-game UI (name entry, character selection)
- Display post-game UI (score, leaderboard, rewards)

#### PhaserGame (Phaser Scene)
```typescript
class GameScene extends Phaser.Scene {
  player: Player;
  iceCreams: Phaser.Physics.Arcade.Group;
  timer: number;
  sessionId: string;
}
```

Responsibilities:
- Render game world with pixel art assets
- Handle player input (keyboard/touch)
- Manage physics and collisions
- Track game state and timer
- Emit events to React layer

#### TouchControls (React Component)
```typescript
interface TouchControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  visible: boolean;
}
```

Responsibilities:
- Render mobile touch buttons
- Handle touch events with 50ms response time
- Prevent page scrolling during gameplay
- Minimum 44x44px touch targets

#### LeaderboardDisplay (React Component)
```typescript
interface LeaderboardDisplayProps {
  campaignId: string;
  currentPlayerName?: string;
  refreshInterval?: number; // default 5000ms
}
```

Responsibilities:
- Fetch and display top 100 scores
- Highlight current player's position
- Auto-refresh every 5 seconds
- Handle loading and error states

### Backend API Endpoints

#### POST /api/game/sessions
```typescript
Request: {
  playerName: string;
  characterId: string;
  campaignId: string;
}

Response: {
  sessionId: string;
  gameConfig: {
    timerDuration: number;
    levelData: LevelConfig;
  }
}
```

Creates a new game session and returns configuration.

#### POST /api/game/scores
```typescript
Request: {
  sessionId: string;
  score: number;
  completionTime: number;
  clientTimestamp: number;
}

Response: {
  valid: boolean;
  rank?: number;
  isWinner?: boolean;
  claimCode?: string;
  message?: string;
}
```

Validates and records score, allocates rewards if eligible.

#### GET /api/game/leaderboard/:campaignId
```typescript
Response: {
  entries: Array<{
    rank: number;
    playerName: string;
    score: number;
    isGoldenSpoon: boolean;
    timestamp: string;
  }>;
  totalPlayers: number;
}
```

Returns top 100 scores for campaign.

#### GET /api/game/campaigns/:campaignId
```typescript
Response: {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'paused' | 'ended';
  timerDuration: number;
  rewardTotal: number;
  rewardRemaining: number;
  levelConfig: LevelConfig;
}
```

Returns campaign configuration and status.

#### POST /api/game/rewards/claim
```typescript
Request: {
  claimCode: string;
}

Response: {
  valid: boolean;
  rewardType: string;
  instructions: string;
  expirationDate: string;
}
```

Validates claim code and returns reward details.

### Anti-Cheat Validation Service

```typescript
interface ValidationResult {
  valid: boolean;
  reason?: string;
  flagged: boolean;
}

class ScoreValidator {
  validateSession(sessionId: string): Promise<boolean>;
  validateScore(score: number, timerDuration: number): boolean;
  validateCompletionTime(time: number): boolean;
  validateSubmissionRate(ipAddress: string): Promise<boolean>;
  validateBrowserFingerprint(fingerprint: string): Promise<boolean>;
  logValidation(result: ValidationResult): Promise<void>;
}
```

Validation rules:
- Session ID must exist and not be reused
- Score must be within valid range (0 to max possible based on timer)
- Completion time must be ≥10 seconds
- Submission rate: max 1 per 30 seconds per IP
- Browser fingerprint: max 1 per 60 seconds
- All checks logged with timestamps

## Data Models

### Database Schema (PostgreSQL)

#### campaigns table
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_status CHECK (status IN ('upcoming', 'active', 'paused', 'ended'))
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
```

#### game_sessions table
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  player_name VARCHAR(100) NOT NULL,
  character_id VARCHAR(50) NOT NULL,
  ip_address INET NOT NULL,
  browser_fingerprint VARCHAR(255),
  is_golden_spoon BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT valid_player_name CHECK (LENGTH(player_name) BETWEEN 2 AND 20)
);

CREATE INDEX idx_sessions_campaign ON game_sessions(campaign_id);
CREATE INDEX idx_sessions_ip ON game_sessions(ip_address, created_at);
CREATE INDEX idx_sessions_fingerprint ON game_sessions(browser_fingerprint, created_at);
```

#### scores table
```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) UNIQUE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  player_name VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  completion_time INTEGER NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_score CHECK (score >= 0),
  CONSTRAINT valid_completion_time CHECK (completion_time >= 10)
);

CREATE INDEX idx_scores_campaign_score ON scores(campaign_id, score DESC, created_at);
CREATE INDEX idx_scores_player ON scores(player_name, campaign_id);
CREATE INDEX idx_scores_flagged ON scores(is_flagged) WHERE is_flagged = TRUE;
```

#### rewards table
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  score_id UUID NOT NULL REFERENCES scores(id) UNIQUE,
  claim_code VARCHAR(20) NOT NULL UNIQUE,
  player_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  reward_type VARCHAR(100) NOT NULL,
  redemption_instructions TEXT NOT NULL,
  redeemed_at TIMESTAMP,
  expiration_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_claim_code CHECK (LENGTH(claim_code) = 16)
);

CREATE INDEX idx_rewards_claim_code ON rewards(claim_code);
CREATE INDEX idx_rewards_campaign ON rewards(campaign_id);
CREATE INDEX idx_rewards_redeemed ON rewards(redeemed_at) WHERE redeemed_at IS NOT NULL;
```

#### validation_logs table
```sql
CREATE TABLE validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id),
  validation_type VARCHAR(50) NOT NULL,
  passed BOOLEAN NOT NULL,
  reason TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_validation_logs_session ON validation_logs(session_id);
CREATE INDEX idx_validation_logs_type ON validation_logs(validation_type, created_at);
```

#### analytics_events table
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  session_id UUID REFERENCES game_sessions(id),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_campaign ON analytics_events(campaign_id, event_type, created_at);
```

### TypeScript Interfaces

```typescript
interface Campaign {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'paused' | 'ended';
  timerDuration: number;
  rewardTotal: number;
  rewardRemaining: number;
  levelConfig: LevelConfig;
}

interface LevelConfig {
  platforms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  iceCreams: Array<{
    x: number;
    y: number;
  }>;
  spawnPoint: {
    x: number;
    y: number;
  };
}

interface GameSession {
  id: string;
  campaignId: string;
  playerName: string;
  characterId: string;
  ipAddress: string;
  browserFingerprint?: string;
  isGoldenSpoon: boolean;
  createdAt: Date;
  completedAt?: Date;
}

interface Score {
  id: string;
  sessionId: string;
  campaignId: string;
  playerName: string;
  score: number;
  completionTime: number;
  isValid: boolean;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: Date;
}

interface Reward {
  id: string;
  campaignId: string;
  scoreId: string;
  claimCode: string;
  playerName: string;
  contactEmail?: string;
  contactPhone?: string;
  rewardType: string;
  redemptionInstructions: string;
  redeemedAt?: Date;
  expirationDate: Date;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

Before defining properties, I analyzed each acceptance criterion for testability:

**Requirement 1: Player Registration and Character Selection**

1.1. WHEN a Player accesses the game, THE Game_System SHALL display a name entry form
  Thoughts: This is about what UI should be displayed on initial load. This is testable as an example.
  Testable: yes - example

1.2. THE Game_System SHALL validate that the entered name contains between 2 and 20 characters
  Thoughts: This is a validation rule that should apply to all possible name inputs. We can generate random strings and verify the validation logic.
  Testable: yes - property

1.3. WHEN a Player submits a valid name, THE Game_System SHALL display a character selection screen
  Thoughts: This is about UI state transition after valid input. Testable as an example.
  Testable: yes - example

1.4. THE Game_System SHALL provide at least 3 distinct Character options for selection
  Thoughts: This is a constraint on the character selection data. Testable as an example.
  Testable: yes - example

1.5. WHEN a Player selects a Character, THE Game_System SHALL initialize a new Game_Session with the selected Character and Player name
  Thoughts: This is about session creation with specific data. We can test that for any valid character and name, a session is created with those values.
  Testable: yes - property

**Requirement 2: Game Viewport and Rendering**

2.1. THE Game_System SHALL render the game within a 4:3 aspect ratio Viewport
  Thoughts: This is a constraint that should hold for all screen sizes. We can test various viewport dimensions.
  Testable: yes - property

2.2. THE Game_System SHALL use pixel art graphics with a retro visual style
  Thoughts: This is a design aesthetic, not computationally testable.
  Testable: no

2.3. THE Game_System SHALL maintain the Viewport aspect ratio across different screen sizes
  Thoughts: This is the same as 2.1, redundant.
  Testable: redundant with 2.1

2.4. THE Game_System SHALL render at a minimum of 30 frames per second during gameplay
  Thoughts: This is a performance requirement that can be measured across different devices.
  Testable: yes - property

**Requirement 3: Game Controls**

3.1. THE Game_System SHALL provide keyboard controls for left movement, right movement, and jump actions
  Thoughts: This is about the presence of keyboard handlers. Testable as an example.
  Testable: yes - example

3.2. WHERE the Player uses a touch device, THE Game_System SHALL display Touch_Controls
  Thoughts: This is about conditional UI rendering based on device type. Testable as an example.
  Testable: yes - example

3.3. WHEN a Player presses or touches a movement control, THE Character SHALL respond within 50 milliseconds
  Thoughts: This is a performance requirement about input latency that should hold for all inputs.
  Testable: yes - property

3.4. THE Game_System SHALL support simultaneous input for movement and jump actions
  Thoughts: This is about input handling logic that should work for any combination of inputs.
  Testable: yes - property

**Requirement 4: Gameplay Timer and Duration**

4.1. WHEN a Game_Session starts, THE Game_System SHALL initialize a countdown timer between 45 and 90 seconds
  Thoughts: This is about timer initialization with campaign-configured values. Testable as a property.
  Testable: yes - property

4.2. WHILE the Game_Session is active, THE Game_System SHALL display the remaining time to the Player
  Thoughts: This is about UI display during gameplay. Testable as an example.
  Testable: yes - example

4.3. WHEN the timer reaches zero, THE Game_System SHALL end the Game_Session
  Thoughts: This is a state transition rule that should hold for all sessions.
  Testable: yes - property

4.4. THE Game_System SHALL update the displayed timer at least once per second
  Thoughts: This is a UI update frequency requirement. Testable as a property.
  Testable: yes - property

**Requirement 5: Hidden Ice Cream Collection**

5.1. THE Game_System SHALL place exactly one Hidden_Ice_Cream collectible within the game level
  Thoughts: This is a constraint on level initialization. Testable as a property.
  Testable: yes - property

5.2. WHEN the Character contacts the Hidden_Ice_Cream, THE Game_System SHALL mark the objective as completed
  Thoughts: This is collision detection logic that should work for any valid collision.
  Testable: yes - property

5.3. WHEN the objective is completed, THE Game_System SHALL calculate a score based on remaining time
  Thoughts: This is score calculation logic that should work for any completion time.
  Testable: yes - property

5.4. WHEN the objective is completed, THE Game_System SHALL end the Game_Session and display the score
  Thoughts: This is a state transition that should happen for all completions.
  Testable: yes - property

**Requirement 6: Score Calculation**

6.1. WHEN a Player completes the objective, THE Game_System SHALL calculate a score using remaining time as a primary factor
  Thoughts: This is the same as 5.3, redundant.
  Testable: redundant with 5.3

6.2. THE Game_System SHALL assign a score of zero if the timer expires before objective completion
  Thoughts: This is an edge case of score calculation.
  Testable: edge-case

6.3. THE Game_System SHALL generate a unique session identifier for each Game_Session
  Thoughts: This is about uniqueness across all sessions. Testable as a property.
  Testable: yes - property

6.4. THE Game_System SHALL transmit the score, session identifier, and Player name to the Score_Validator
  Thoughts: This is about data transmission completeness. Testable as a property.
  Testable: yes - property

**Requirement 7: Server-Side Score Validation**

7.1. WHEN the Game_System submits a score, THE Score_Validator SHALL verify the session identifier is unique
  Thoughts: This is validation logic that should reject duplicate session IDs.
  Testable: yes - property

7.2. WHEN the Game_System submits a score, THE Score_Validator SHALL verify the score value is within valid range
  Thoughts: This is validation logic for score bounds.
  Testable: yes - property

7.3. WHEN the Game_System submits a score, THE Score_Validator SHALL verify the completion time is physically possible
  Thoughts: This is validation logic for time bounds.
  Testable: yes - property

7.4. IF the Score_Validator detects invalid data, THEN THE Score_Validator SHALL reject the submission and log the attempt
  Thoughts: This is error handling that should work for any invalid input.
  Testable: yes - property

7.5. WHEN the Score_Validator accepts a score, THE Leaderboard_System SHALL record the score with timestamp
  Thoughts: This is about data persistence after validation.
  Testable: yes - property

**Requirement 8: Leaderboard Display**

8.1. THE Leaderboard_System SHALL display the top 100 scores in descending order
  Thoughts: This is about sorting and limiting results. Testable as a property.
  Testable: yes - property

8.2. THE Leaderboard_System SHALL display each entry with Player name, score, and rank
  Thoughts: This is about data completeness in display. Testable as a property.
  Testable: yes - property

8.3. WHEN a new valid score is recorded, THE Leaderboard_System SHALL update the rankings within 5 seconds
  Thoughts: This is a performance requirement about update latency.
  Testable: yes - property

8.4. THE Leaderboard_System SHALL highlight the current Player's position if they appear in the top 100
  Thoughts: This is about conditional UI highlighting. Testable as an example.
  Testable: yes - example

**Requirement 9: Reward Allocation**

9.1. THE Reward_System SHALL allocate rewards to the first 100 Eligible_Winner entries
  Thoughts: This is about reward limit enforcement across all winners.
  Testable: yes - property

9.2. WHEN a Player becomes an Eligible_Winner, THE Reward_System SHALL generate a unique Claim_Code or QR_Pass
  Thoughts: This is about uniqueness of claim codes.
  Testable: yes - property

9.3. THE Reward_System SHALL prevent allocation of more than 100 rewards per Campaign
  Thoughts: This is the same as 9.1, redundant.
  Testable: redundant with 9.1

9.4. WHEN all 100 rewards are allocated, THE Reward_System SHALL display a "rewards exhausted" message to subsequent Players
  Thoughts: This is an edge case when reward limit is reached.
  Testable: edge-case

**Requirement 10: Reward Delivery**

10.1. WHEN a Player becomes an Eligible_Winner, THE Reward_System SHALL display the Claim_Code or QR_Pass on screen
  Thoughts: This is about UI display after winning. Testable as an example.
  Testable: yes - example

10.2. WHERE the Player provides contact information, THE Reward_System SHALL send the Claim_Code via email or SMS
  Thoughts: This is about notification delivery for all winners with contact info.
  Testable: yes - property

10.3. THE Reward_System SHALL store the Claim_Code association with the Player's session for retrieval
  Thoughts: This is a round-trip property: store then retrieve should return the same code.
  Testable: yes - property

10.4. THE Reward_System SHALL provide a mechanism for Players to retrieve lost Claim_Codes using their email or phone number
  Thoughts: This is about retrieval functionality. Testable as an example.
  Testable: yes - example

**Requirement 11: Anti-Cheat Detection**

11.1. WHEN the Score_Validator receives a score, THE Anti_Cheat_System SHALL verify the score submission rate is below 1 per 30 seconds per IP address
  Thoughts: This is rate limiting logic that should work for all IP addresses.
  Testable: yes - property

11.2. WHEN the Score_Validator receives a score, THE Anti_Cheat_System SHALL verify the completion time exceeds a minimum threshold of 10 seconds
  Thoughts: This is the same as 7.3, redundant.
  Testable: redundant with 7.3

11.3. IF the Anti_Cheat_System detects multiple submissions from the same browser fingerprint within 60 seconds, THEN THE Anti_Cheat_System SHALL flag the submissions as suspicious
  Thoughts: This is detection logic for rapid submissions.
  Testable: yes - property

11.4. WHEN the Anti_Cheat_System flags a submission, THE Admin_Panel SHALL display the flagged entry for manual review
  Thoughts: This is about admin UI display. Testable as an example.
  Testable: yes - example

11.5. THE Anti_Cheat_System SHALL log all validation checks with timestamps and identifiers
  Thoughts: This is about logging completeness for all validations.
  Testable: yes - property

**Requirement 13: Database Persistence**

13.1. THE Leaderboard_System SHALL store all valid scores in a PostgreSQL database
  Thoughts: This is about persistence. Best tested as a round-trip property.
  Testable: yes - property

13.2. THE Reward_System SHALL store all Claim_Code allocations in a PostgreSQL database
  Thoughts: This is about persistence. Best tested as a round-trip property.
  Testable: yes - property

13.3. THE Game_System SHALL store all Game_Session metadata including timestamps and Player identifiers
  Thoughts: This is about persistence. Best tested as a round-trip property.
  Testable: yes - property

13.4. WHEN a database write operation fails, THE Game_System SHALL retry the operation up to 3 times
  Thoughts: This is retry logic that should work for any transient failure.
  Testable: yes - property

13.5. IF all retry attempts fail, THEN THE Game_System SHALL log the error and display a user-friendly error message
  Thoughts: This is error handling. Testable as an example.
  Testable: yes - example

**Requirement 30: Testing and Quality Assurance**

30.6. FOR ALL valid Game_Session data, submitting to Score_Validator then retrieving from Leaderboard_System SHALL produce equivalent score values
  Thoughts: This is explicitly a round-trip property.
  Testable: yes - property


### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- **2.3 is redundant with 2.1**: Both test viewport aspect ratio maintenance
- **6.1 is redundant with 5.3**: Both test score calculation based on remaining time
- **9.3 is redundant with 9.1**: Both test the 100 reward limit
- **11.2 is redundant with 7.3**: Both test minimum completion time validation
- **13.1, 13.2, 13.3 can be combined**: All test database persistence via round-trip

**Combined Properties:**
- Database round-trip: For any game data (session, score, or reward), storing then retrieving should produce equivalent values

**Properties to Remove:**
- 2.3 (covered by 2.1)
- 6.1 (covered by 5.3)
- 9.3 (covered by 9.1)
- 11.2 (covered by 7.3)

### Correctness Properties

### Property 1: Name Validation

*For any* string input, the name validation should accept strings with length between 2 and 20 characters (inclusive) and reject all others.

**Validates: Requirements 1.2**

### Property 2: Session Creation with Player Data

*For any* valid player name and character ID, creating a new game session should result in a session record that contains the exact player name and character ID provided.

**Validates: Requirements 1.5**

### Property 3: Viewport Aspect Ratio Maintenance

*For any* screen size or device orientation, the game viewport should maintain a 4:3 aspect ratio.

**Validates: Requirements 2.1, 2.3**

### Property 4: Minimum Frame Rate

*For any* gameplay session on supported devices (past 3 years), the frame rate should remain at or above 30 FPS.

**Validates: Requirements 2.4**

### Property 5: Input Response Latency

*For any* player input (keyboard or touch), the character should respond within 50 milliseconds.

**Validates: Requirements 3.3**

### Property 6: Simultaneous Input Handling

*For any* combination of movement and jump inputs pressed simultaneously, both actions should be processed and reflected in character behavior.

**Validates: Requirements 3.4**

### Property 7: Timer Initialization

*For any* campaign configuration with timer duration between 45 and 90 seconds, the game session should initialize with that exact timer value.

**Validates: Requirements 4.1**

### Property 8: Timer Expiration Ends Session

*For any* game session, when the timer reaches zero, the session should transition to the completed state.

**Validates: Requirements 4.3**

### Property 9: Timer Update Frequency

*For any* active game session, the displayed timer should update at least once per second.

**Validates: Requirements 4.4**

### Property 10: Single Ice Cream Per Level

*For any* level initialization, exactly one ice cream collectible should be placed in the game world.

**Validates: Requirements 5.1**

### Property 11: Collision Detection Completes Objective

*For any* collision between the player character and the ice cream collectible, the game objective should be marked as completed.

**Validates: Requirements 5.2**

### Property 12: Score Calculation from Remaining Time

*For any* game completion with remaining time T, the calculated score should be a monotonically increasing function of T (more remaining time = higher score).

**Validates: Requirements 5.3, 6.1**

### Property 13: Completion Ends Session

*For any* game session where the objective is completed, the session should transition to the completed state and display the final score.

**Validates: Requirements 5.4**

### Property 14: Session ID Uniqueness

*For any* two game sessions created at any time, their session IDs should be distinct.

**Validates: Requirements 6.3**

### Property 15: Score Submission Completeness

*For any* completed game session, the score submission to the validator should include session ID, score value, completion time, and player name.

**Validates: Requirements 6.4**

### Property 16: Duplicate Session Rejection

*For any* session ID that has already been used for a score submission, attempting to submit another score with the same session ID should be rejected.

**Validates: Requirements 7.1**

### Property 17: Score Range Validation

*For any* score submission, if the score value is negative or exceeds the maximum possible score for the campaign's timer duration, the submission should be rejected.

**Validates: Requirements 7.2**

### Property 18: Completion Time Validation

*For any* score submission, if the completion time is less than 10 seconds or greater than the campaign's timer duration, the submission should be rejected.

**Validates: Requirements 7.3, 11.2**

### Property 19: Invalid Submission Logging

*For any* score submission that fails validation, the validator should create a log entry with the rejection reason and timestamp.

**Validates: Requirements 7.4**

### Property 20: Valid Score Persistence

*For any* score submission that passes validation, the score should be stored in the database with a timestamp.

**Validates: Requirements 7.5**

### Property 21: Leaderboard Ordering

*For any* set of scores in a campaign, the leaderboard should display them in descending order by score value.

**Validates: Requirements 8.1**

### Property 22: Leaderboard Entry Completeness

*For any* score displayed on the leaderboard, the entry should include player name, score value, and rank.

**Validates: Requirements 8.2**

### Property 23: Leaderboard Update Latency

*For any* new valid score submission, the leaderboard should reflect the updated rankings within 5 seconds.

**Validates: Requirements 8.3**

### Property 24: Reward Limit Enforcement

*For any* campaign, the total number of rewards allocated should never exceed 100.

**Validates: Requirements 9.1, 9.3**

### Property 25: Claim Code Uniqueness

*For any* two rewards allocated at any time within a campaign, their claim codes should be distinct.

**Validates: Requirements 9.2**

### Property 26: Notification Delivery

*For any* eligible winner who provides contact information (email or phone), a notification containing the claim code should be sent within 60 seconds.

**Validates: Requirements 10.2**

### Property 27: Claim Code Retrieval Round-Trip

*For any* reward allocated to a session, storing the claim code then retrieving it by session ID should return the same claim code.

**Validates: Requirements 10.3**

### Property 28: IP Rate Limiting

*For any* IP address, score submissions should be limited to a maximum of 1 per 30 seconds.

**Validates: Requirements 11.1**

### Property 29: Browser Fingerprint Flagging

*For any* browser fingerprint, if multiple score submissions occur within 60 seconds, all submissions after the first should be flagged as suspicious.

**Validates: Requirements 11.3**

### Property 30: Validation Logging Completeness

*For any* validation check performed, a log entry should be created with validation type, result, and timestamp.

**Validates: Requirements 11.5**

### Property 31: Database Round-Trip

*For any* valid game data (session, score, or reward), storing it in the database then retrieving it should produce equivalent values.

**Validates: Requirements 13.1, 13.2, 13.3, 30.6**

### Property 32: Database Retry Logic

*For any* transient database failure, the system should attempt the operation up to 3 times before giving up.

**Validates: Requirements 13.4**


## Error Handling

### Client-Side Error Handling

**Asset Loading Failures**
- Display error message with retry button
- Log error details to analytics
- Fallback to simplified graphics if available
- Provide contact information for persistent issues

**Network Disconnection**
- Pause game immediately
- Display reconnection message
- Queue score submission for retry
- Resume game state when connection restored

**Game State Corruption**
- Detect invalid state transitions
- Reset to last known good state
- Log corruption details for debugging
- Offer player option to restart session

**Browser Compatibility Issues**
- Detect unsupported features at startup
- Display compatibility message with supported browsers
- Gracefully degrade features when possible
- Prevent game initialization on incompatible browsers

### Server-Side Error Handling

**Database Connection Failures**
- Implement exponential backoff retry (3 attempts)
- Return 503 Service Unavailable with retry-after header
- Log connection errors with context
- Alert monitoring system for persistent failures

**Validation Failures**
- Return 400 Bad Request with specific error message
- Log validation failure details
- Increment anti-cheat metrics
- Rate limit repeated validation failures

**Reward Exhaustion**
- Return 200 OK with exhaustion flag
- Display appropriate message to player
- Continue recording scores for leaderboard
- Log exhaustion event for analytics

**External Service Failures (Email/SMS)**
- Retry once after 5-minute delay
- Log delivery failure with provider response
- Display claim code on screen as fallback
- Store failed notification for manual retry

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
  };
}
```

### Monitoring and Alerting

- Log all errors to structured logging system
- Alert on error rate thresholds (>5% of requests)
- Track error patterns by type and endpoint
- Dashboard for real-time error monitoring

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with reference to design document property
- Tag format: `Feature: pixel-art-game, Property {number}: {property_text}`

**Property Test Examples**:

```typescript
// Property 1: Name Validation
test('Feature: pixel-art-game, Property 1: Name validation', () => {
  fc.assert(
    fc.property(fc.string(), (name) => {
      const isValid = validatePlayerName(name);
      const length = name.length;
      
      if (length >= 2 && length <= 20) {
        expect(isValid).toBe(true);
      } else {
        expect(isValid).toBe(false);
      }
    }),
    { numRuns: 100 }
  );
});

// Property 12: Score Calculation from Remaining Time
test('Feature: pixel-art-game, Property 12: Score increases with remaining time', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 90 }),
      fc.integer({ min: 1, max: 90 }),
      (time1, time2) => {
        const score1 = calculateScore(time1);
        const score2 = calculateScore(time2);
        
        if (time1 > time2) {
          expect(score1).toBeGreaterThan(score2);
        } else if (time1 < time2) {
          expect(score1).toBeLessThan(score2);
        } else {
          expect(score1).toBe(score2);
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Property 31: Database Round-Trip
test('Feature: pixel-art-game, Property 31: Database round-trip', () => {
  fc.assert(
    fc.property(
      fc.record({
        playerName: fc.string({ minLength: 2, maxLength: 20 }),
        score: fc.integer({ min: 0, max: 10000 }),
        completionTime: fc.integer({ min: 10, max: 90 })
      }),
      async (scoreData) => {
        const stored = await storeScore(scoreData);
        const retrieved = await retrieveScore(stored.id);
        
        expect(retrieved.playerName).toBe(scoreData.playerName);
        expect(retrieved.score).toBe(scoreData.score);
        expect(retrieved.completionTime).toBe(scoreData.completionTime);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Framework**: Jest with React Testing Library

**Coverage Areas**:

1. **Component Rendering**
   - Name entry form displays correctly
   - Character selection shows 3+ options
   - Touch controls render on mobile devices
   - Leaderboard displays top 100 entries

2. **Edge Cases**
   - Empty name submission rejected
   - Timer expiration with score of zero
   - Reward exhaustion message display
   - Network disconnection handling

3. **Integration Points**
   - NextAuth session retrieval
   - Golden Spoon member badge display
   - Admin panel data fetching
   - Campaign status checking

4. **Error Conditions**
   - Asset loading failure recovery
   - Database connection retry logic
   - Validation failure responses
   - Rate limit enforcement

**Unit Test Examples**:

```typescript
// Example: Name entry form
describe('Name Entry Form', () => {
  it('should display name input on initial load', () => {
    render(<GameContainer campaignId="test" />);
    expect(screen.getByLabelText(/enter your name/i)).toBeInTheDocument();
  });
  
  it('should reject empty name submission', () => {
    render(<GameContainer campaignId="test" />);
    const input = screen.getByLabelText(/enter your name/i);
    const submit = screen.getByRole('button', { name: /continue/i });
    
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(submit);
    
    expect(screen.getByText(/name must be between 2 and 20 characters/i)).toBeInTheDocument();
  });
});

// Edge case: Reward exhaustion
describe('Reward System', () => {
  it('should display exhaustion message when 100 rewards allocated', async () => {
    const campaign = await createCampaignWithRewards(100);
    
    const response = await submitScore({
      sessionId: 'test-session',
      score: 1000,
      campaignId: campaign.id
    });
    
    expect(response.isWinner).toBe(false);
    expect(response.message).toContain('rewards exhausted');
  });
});
```

### End-to-End Testing

**Framework**: Playwright

**Test Scenarios**:

1. Complete gameplay flow: name entry → character selection → gameplay → score submission → leaderboard display
2. Reward allocation: first 100 winners receive claim codes
3. Anti-cheat detection: rapid submissions flagged
4. Mobile touch controls: gameplay on touch devices
5. Campaign lifecycle: upcoming → active → ended states

### Performance Testing

**Metrics to Track**:
- Asset load time (target: <3s on 3G)
- Frame rate during gameplay (target: ≥30 FPS)
- Score submission latency (target: <1s)
- Leaderboard update time (target: <5s)
- Database query performance (target: <100ms)

**Tools**:
- Lighthouse for load performance
- Chrome DevTools for frame rate monitoring
- k6 for API load testing
- PostgreSQL EXPLAIN for query optimization

### Test Coverage Goals

- Unit test coverage: ≥80% of business logic
- Property test coverage: All 32 correctness properties
- Integration test coverage: All API endpoints
- E2E test coverage: Critical user journeys
- Performance test coverage: All performance requirements

### Continuous Integration

- Run unit and property tests on every commit
- Run integration tests on pull requests
- Run E2E tests on staging deployment
- Run performance tests weekly
- Block deployment on test failures

