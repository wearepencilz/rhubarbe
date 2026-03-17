# Implementation Plan: Pixel Art Game


## Overview

This implementation plan breaks down the pixel art game feature into discrete coding tasks. The game is a browser-based promotional micro-game built with Phaser 3 and React, integrated into the existing Janine Next.js platform. Players compete to find hidden ice cream within a time limit, with the first 100 eligible winners receiving rewards through a validated leaderboard system.

## Tasks


- [x] 1. Set up database schema and migrations
  - Create PostgreSQL migration file for 7 game tables (campaigns, game_sessions, scores, rewards, validation_logs, analytics_events)
  - Add indexes for leaderboard queries (campaign_id, score DESC, created_at)
  - Add indexes for anti-cheat lookups (ip_address, browser_fingerprint with time constraints)
  - Add check constraints for data validation (name length, score range, valid dates)
  - Test migration rollback and re-apply
  - _Requirements: 13.1, 13.2, 13.3_

- [ ]* 1.1 Write property test for database round-trip
  - **Property 31: Database Round-Trip**
  - **Validates: Requirements 13.1, 13.2, 13.3, 30.6**
  - For any valid game data (session, score, reward), storing then retrieving should produce equivalent values


- [x] 2. Create database utility functions and connection management
  - Create `lib/db-game.ts` with PostgreSQL connection pooling
  - Implement retry logic for transient failures (3 attempts with exponential backoff)
  - Add query helper functions for common operations (insert, update, select with pagination)
  - Add transaction support for multi-table operations
  - _Requirements: 13.4, 13.5_

- [x]* 2.1 Write property test for database retry logic
  - **Property 32: Database Retry Logic**
  - **Validates: Requirements 13.4**
  - For any transient database failure, system should attempt operation up to 3 times

- [ ]* 2.2 Write unit tests for database utilities
  - Test connection pooling behavior
  - Test error handling for connection failures
  - Test transaction rollback on errors
  - _Requirements: 13.4, 13.5_


- [x] 3. Implement campaign management API endpoints
  - Create `app/api/game/campaigns/route.ts` for GET all campaigns
  - Create `app/api/game/campaigns/[id]/route.ts` for GET single campaign
  - Add campaign status validation (upcoming, active, paused, ended)
  - Add date range validation (end_date > start_date)
  - Return campaign config including timer duration and level data
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ]* 3.1 Write unit tests for campaign API
  - Test campaign retrieval by ID
  - Test campaign status filtering
  - Test date validation
  - Test error handling for non-existent campaigns
  - _Requirements: 12.1, 12.2, 12.3_


- [x] 4. Implement game session creation API
  - Create `app/api/game/sessions/route.ts` for POST new session
  - Validate player name (2-20 characters)
  - Generate unique session ID using UUID
  - Capture IP address and browser fingerprint
  - Check NextAuth session for Golden Spoon member status
  - Store session in database with campaign association
  - Return session ID and game configuration
  - _Requirements: 1.2, 1.5, 6.3, 6.4, 7.1_

- [ ]* 4.1 Write property test for name validation
  - **Property 1: Name Validation**
  - **Validates: Requirements 1.2**
  - For any string input, validation should accept 2-20 characters and reject all others

- [ ]* 4.2 Write property test for session ID uniqueness
  - **Property 14: Session ID Uniqueness**
  - **Validates: Requirements 6.3**
  - For any two game sessions created at any time, their session IDs should be distinct

- [ ]* 4.3 Write property test for session creation with player data
  - **Property 2: Session Creation with Player Data**
  - **Validates: Requirements 1.5**
  - For any valid player name and character ID, session should contain exact values provided


- [x] 5. Implement score validation service
  - Create `lib/game/score-validator.ts` with ScoreValidator class
  - Implement session ID uniqueness check (reject duplicate submissions)
  - Implement score range validation (0 to max possible based on timer)
  - Implement completion time validation (≥10 seconds, ≤timer duration)
  - Implement IP rate limiting (max 1 per 30 seconds using Vercel KV)
  - Implement browser fingerprint flagging (max 1 per 60 seconds)
  - Log all validation checks to validation_logs table
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 11.1, 11.3, 11.5_

- [ ]* 5.1 Write property test for duplicate session rejection
  - **Property 16: Duplicate Session Rejection**
  - **Validates: Requirements 7.1**
  - For any session ID already used, attempting another submission should be rejected

- [ ]* 5.2 Write property test for score range validation
  - **Property 17: Score Range Validation**
  - **Validates: Requirements 7.2**
  - For any score submission, negative or exceeding max should be rejected

- [ ]* 5.3 Write property test for completion time validation
  - **Property 18: Completion Time Validation**
  - **Validates: Requirements 7.3, 11.2**
  - For any score submission, completion time <10s or >timer duration should be rejected

- [ ]* 5.4 Write property test for IP rate limiting
  - **Property 28: IP Rate Limiting**
  - **Validates: Requirements 11.1**
  - For any IP address, score submissions should be limited to max 1 per 30 seconds

- [ ]* 5.5 Write property test for browser fingerprint flagging
  - **Property 29: Browser Fingerprint Flagging**
  - **Validates: Requirements 11.3**
  - For any browser fingerprint, multiple submissions within 60s should be flagged

- [ ]* 5.6 Write property test for validation logging
  - **Property 30: Validation Logging Completeness**
  - **Validates: Requirements 11.5**
  - For any validation check, a log entry should be created with type, result, and timestamp


- [x] 6. Implement score submission API
  - Create `app/api/game/scores/route.ts` for POST score submission
  - Validate request payload (sessionId, score, completionTime, clientTimestamp)
  - Call ScoreValidator to validate submission
  - Store valid scores in scores table with timestamp
  - Return validation result with rank and winner status
  - Handle validation failures with appropriate error messages
  - _Requirements: 6.4, 7.4, 7.5, 8.1_

- [ ]* 6.1 Write property test for invalid submission logging
  - **Property 19: Invalid Submission Logging**
  - **Validates: Requirements 7.4**
  - For any score submission that fails validation, validator should create log entry with reason

- [ ]* 6.2 Write property test for valid score persistence
  - **Property 20: Valid Score Persistence**
  - **Validates: Requirements 7.5**
  - For any score submission that passes validation, score should be stored with timestamp

- [ ]* 6.3 Write property test for score submission completeness
  - **Property 15: Score Submission Completeness**
  - **Validates: Requirements 6.4**
  - For any completed session, score submission should include session ID, score, time, and name


- [x] 7. Implement leaderboard API
  - Create `app/api/game/leaderboard/[campaignId]/route.ts` for GET leaderboard
  - Query top 100 scores ordered by score DESC, created_at ASC
  - Include player name, score, rank, and Golden Spoon badge
  - Add pagination support for admin view (beyond top 100)
  - Implement caching with 5-second TTL using Vercel KV
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 7.1 Write property test for leaderboard ordering
  - **Property 21: Leaderboard Ordering**
  - **Validates: Requirements 8.1**
  - For any set of scores in a campaign, leaderboard should display in descending order

- [ ]* 7.2 Write property test for leaderboard entry completeness
  - **Property 22: Leaderboard Entry Completeness**
  - **Validates: Requirements 8.2**
  - For any score displayed, entry should include player name, score value, and rank

- [ ]* 7.3 Write property test for leaderboard update latency
  - **Property 23: Leaderboard Update Latency**
  - **Validates: Requirements 8.3**
  - For any new valid score, leaderboard should reflect updated rankings within 5 seconds


- [x] 8. Implement reward allocation system
  - Create `lib/game/reward-allocator.ts` with RewardAllocator class
  - Check if campaign has remaining rewards (reward_remaining > 0)
  - Generate unique 16-character claim code using crypto.randomBytes
  - Decrement campaign reward_remaining in transaction
  - Store reward in rewards table with expiration date (30 days)
  - Return reward details including claim code and redemption instructions
  - _Requirements: 9.1, 9.2, 9.3, 10.3_

- [ ]* 8.1 Write property test for reward limit enforcement
  - **Property 24: Reward Limit Enforcement**
  - **Validates: Requirements 9.1, 9.3**
  - For any campaign, total rewards allocated should never exceed 100

- [ ]* 8.2 Write property test for claim code uniqueness
  - **Property 25: Claim Code Uniqueness**
  - **Validates: Requirements 9.2**
  - For any two rewards allocated at any time, their claim codes should be distinct

- [ ]* 8.3 Write property test for claim code retrieval round-trip
  - **Property 27: Claim Code Retrieval Round-Trip**
  - **Validates: Requirements 10.3**
  - For any reward allocated to a session, storing then retrieving by session ID should return same code


- [ ] 9. Implement reward notification system
  - Create `lib/game/reward-notifier.ts` with email/SMS sending logic
  - Integrate with email service (e.g., SendGrid, Resend)
  - Integrate with SMS service (e.g., Twilio)
  - Send notification within 60 seconds of reward allocation
  - Implement retry logic for failed deliveries (1 retry after 5 minutes)
  - Log delivery status to analytics_events table
  - _Requirements: 10.2, 10.4_

- [ ]* 9.1 Write property test for notification delivery
  - **Property 26: Notification Delivery**
  - **Validates: Requirements 10.2**
  - For any eligible winner with contact info, notification should be sent within 60 seconds

- [ ]* 9.2 Write unit tests for notification system
  - Test email sending with valid claim code
  - Test SMS sending with valid claim code
  - Test retry logic for failed deliveries
  - Test error handling for invalid contact info
  - _Requirements: 10.2, 10.4_


- [ ] 10. Implement reward claim API
  - Create `app/api/game/rewards/claim/route.ts` for POST claim code validation
  - Validate claim code format (16 characters)
  - Look up reward by claim code
  - Check expiration date (must be before expiration_date)
  - Mark reward as redeemed with timestamp
  - Return reward details and redemption instructions
  - _Requirements: 10.1, 10.3, 10.4_

- [ ]* 10.1 Write unit tests for reward claim API
  - Test valid claim code redemption
  - Test expired claim code rejection
  - Test invalid claim code rejection
  - Test duplicate redemption prevention
  - _Requirements: 10.1, 10.3_


- [x] 11. Set up Phaser 3 game engine integration
  - Install Phaser 3 package (`npm install phaser`)
  - Create `lib/game/phaser-config.ts` with game configuration
  - Configure 4:3 aspect ratio viewport with responsive scaling
  - Set up pixel art rendering (disable anti-aliasing, use nearest neighbor)
  - Configure physics system (Arcade Physics)
  - Set target frame rate to 60 FPS with 30 FPS minimum
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 11.1 Write property test for viewport aspect ratio
  - **Property 3: Viewport Aspect Ratio Maintenance**
  - **Validates: Requirements 2.1, 2.3**
  - For any screen size or device orientation, viewport should maintain 4:3 aspect ratio

- [ ]* 11.2 Write property test for minimum frame rate
  - **Property 4: Minimum Frame Rate**
  - **Validates: Requirements 2.4**
  - For any gameplay session on supported devices, frame rate should remain ≥30 FPS


- [ ] 12. Create Phaser game scene with core gameplay
  - Create `lib/game/scenes/GameScene.ts` extending Phaser.Scene
  - Implement level loading from campaign levelConfig (platforms, ice cream positions)
  - Create player character sprite with physics body
  - Implement keyboard controls (arrow keys, WASD, spacebar for jump)
  - Implement collision detection between player and platforms
  - Implement collision detection between player and ice cream collectible
  - Add countdown timer display that updates every second
  - Calculate score based on remaining time when ice cream collected
  - End game session when timer reaches zero or objective completed
  - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.2_

- [ ]* 12.1 Write property test for timer initialization
  - **Property 7: Timer Initialization**
  - **Validates: Requirements 4.1**
  - For any campaign with timer duration 45-90s, session should initialize with exact timer value

- [ ]* 12.2 Write property test for timer expiration
  - **Property 8: Timer Expiration Ends Session**
  - **Validates: Requirements 4.3**
  - For any game session, when timer reaches zero, session should transition to completed state

- [ ]* 12.3 Write property test for timer update frequency
  - **Property 9: Timer Update Frequency**
  - **Validates: Requirements 4.4**
  - For any active session, displayed timer should update at least once per second

- [ ]* 12.4 Write property test for single ice cream per level
  - **Property 10: Single Ice Cream Per Level**
  - **Validates: Requirements 5.1**
  - For any level initialization, exactly one ice cream collectible should be placed

- [ ]* 12.5 Write property test for collision detection
  - **Property 11: Collision Detection Completes Objective**
  - **Validates: Requirements 5.2**
  - For any collision between player and ice cream, objective should be marked completed

- [ ]* 12.6 Write property test for score calculation
  - **Property 12: Score Calculation from Remaining Time**
  - **Validates: Requirements 5.3, 6.1**
  - For any completion with remaining time T, score should be monotonically increasing function of T

- [ ]* 12.7 Write property test for completion ends session
  - **Property 13: Completion Ends Session**
  - **Validates: Requirements 5.4**
  - For any session where objective completed, should transition to completed state and display score


- [ ] 13. Implement touch controls for mobile devices
  - Create `components/game/TouchControls.tsx` client component
  - Render left, right, and jump buttons with 44x44px minimum touch targets
  - Implement touch event handlers with preventDefault to avoid page scrolling
  - Connect touch events to Phaser game input system
  - Show/hide controls based on device detection (touch capability)
  - Style with Tailwind for Game Boy aesthetic
  - _Requirements: 3.2, 3.3, 3.4, 14.1, 14.2_

- [ ]* 13.1 Write property test for input response latency
  - **Property 5: Input Response Latency**
  - **Validates: Requirements 3.3**
  - For any player input (keyboard or touch), character should respond within 50ms

- [ ]* 13.2 Write property test for simultaneous input handling
  - **Property 6: Simultaneous Input Handling**
  - **Validates: Requirements 3.4**
  - For any combination of movement and jump inputs, both actions should be processed

- [ ]* 13.3 Write unit tests for touch controls
  - Test touch controls render on touch devices
  - Test touch controls hidden on desktop
  - Test button press triggers correct game action
  - Test page scroll prevention during gameplay
  - _Requirements: 3.2, 14.1, 14.2_


- [x] 14. Create game container React component
  - Create `components/game/GameContainer.tsx` client component
  - Implement pre-game UI: name entry form with validation (2-20 characters)
  - Implement character selection screen with at least 3 character options
  - Initialize Phaser game instance on character selection
  - Handle Phaser-to-React communication via custom events
  - Implement post-game UI: score display, leaderboard position, reward notification
  - Handle game cleanup on component unmount
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.4, 8.4, 10.1_

- [ ]* 14.1 Write unit tests for game container
  - Test name entry form displays on initial load
  - Test name validation (empty, too short, too long)
  - Test character selection shows 3+ options
  - Test character selection triggers game initialization
  - Test post-game score display
  - Test Phaser cleanup on unmount
  - _Requirements: 1.1, 1.2, 1.3, 1.4_


- [x] 15. Create leaderboard display component
  - Create `components/game/LeaderboardDisplay.tsx` client component
  - Fetch top 100 scores from `/api/game/leaderboard/[campaignId]`
  - Display entries with rank, player name, score, and Golden Spoon badge
  - Highlight current player's position if in top 100
  - Implement auto-refresh every 5 seconds using useEffect
  - Handle loading and error states
  - Style with Tailwind for retro aesthetic
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 15.1 Write unit tests for leaderboard display
  - Test leaderboard fetches and displays top 100 scores
  - Test entries include rank, name, score
  - Test current player highlighting
  - Test auto-refresh behavior
  - Test loading state display
  - Test error state handling
  - _Requirements: 8.1, 8.2, 8.3, 8.4_


- [x] 16. Create game page route
  - Create `app/game/[campaignId]/page.tsx` for public game access
  - Fetch campaign data and validate status (must be 'active')
  - Display campaign name and description
  - Render GameContainer component with campaign ID
  - Render LeaderboardDisplay component below game
  - Handle campaign not found or inactive states
  - Add metadata for SEO
  - _Requirements: 12.1, 12.2, 12.3, 15.1_

- [ ]* 16.1 Write unit tests for game page
  - Test campaign data fetching
  - Test active campaign renders game
  - Test inactive campaign shows message
  - Test non-existent campaign shows 404
  - _Requirements: 12.1, 12.2, 12.3_


- [ ] 17. Checkpoint - Ensure core game functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Extend admin panel with game campaign management
  - Create `app/admin/game-campaigns/page.tsx` for campaign list view
  - Create `app/admin/game-campaigns/new/page.tsx` for campaign creation
  - Create `app/admin/game-campaigns/[id]/page.tsx` for campaign editing
  - Implement campaign CRUD operations (create, read, update, delete)
  - Add campaign status controls (upcoming, active, paused, ended)
  - Add level editor for configuring platforms and ice cream positions
  - Display reward allocation progress (X/100 rewards claimed)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 18.1 Write unit tests for admin campaign management
  - Test campaign list displays all campaigns
  - Test campaign creation form validation
  - Test campaign status updates
  - Test level editor saves configuration
  - Test reward progress display
  - _Requirements: 12.1, 12.2, 12.3, 12.4_


- [ ] 19. Extend admin panel with game monitoring dashboard
  - Create `app/admin/game-campaigns/[id]/analytics/page.tsx` for analytics view
  - Display real-time metrics: total plays, completion rate, average score
  - Display flagged submissions for manual review
  - Display reward allocation status and remaining rewards
  - Add charts for plays over time and score distribution
  - Add export functionality for session and score data (CSV)
  - _Requirements: 11.4, 12.6, 12.7, 12.8_

- [ ]* 19.1 Write unit tests for admin analytics dashboard
  - Test metrics calculation and display
  - Test flagged submissions list
  - Test reward status display
  - Test data export functionality
  - _Requirements: 11.4, 12.6, 12.7_


- [ ] 20. Create game asset loading and optimization
  - Create `public/game/assets/` directory structure
  - Add placeholder pixel art sprites (player characters, ice cream, platforms)
  - Configure Phaser asset preloader with progress bar
  - Implement asset caching strategy using Vercel Blob in production
  - Optimize sprite sheets for fast loading (<500KB total)
  - Add loading screen with retro aesthetic
  - Handle asset loading failures with retry and fallback
  - _Requirements: 15.2, 15.3, 15.4_

- [ ]* 20.1 Write unit tests for asset loading
  - Test asset preloader displays progress
  - Test asset loading failure recovery
  - Test fallback graphics on load failure
  - Test loading screen display
  - _Requirements: 15.2, 15.3, 15.4_


- [ ] 21. Implement error handling and user feedback
  - Add error boundary component for game crashes
  - Implement network error handling with retry UI
  - Add user-friendly error messages for validation failures
  - Display "rewards exhausted" message when 100 rewards claimed
  - Add loading states for all async operations
  - Implement toast notifications for success/error feedback
  - Log errors to analytics for monitoring
  - _Requirements: 9.4, 13.5, 15.5, 15.6_

- [ ]* 21.1 Write unit tests for error handling
  - Test error boundary catches game crashes
  - Test network error retry UI
  - Test validation error messages
  - Test rewards exhausted message display
  - Test loading state display
  - _Requirements: 9.4, 13.5, 15.5_


- [ ] 22. Implement analytics event tracking
  - Create `lib/game/analytics.ts` for event tracking
  - Track game_start events (campaign_id, session_id, is_golden_spoon)
  - Track game_complete events (session_id, score, completion_time)
  - Track game_abandon events (session_id, time_remaining)
  - Track reward_claimed events (campaign_id, claim_code)
  - Store events in analytics_events table
  - Add privacy-compliant data collection (no PII)
  - _Requirements: 12.6, 12.7, 12.8_

- [ ]* 22.1 Write unit tests for analytics tracking
  - Test event creation with correct data
  - Test event storage in database
  - Test PII exclusion from events
  - Test event timestamp accuracy
  - _Requirements: 12.6, 12.7_


- [ ] 23. Implement responsive design and mobile optimization
  - Ensure game viewport scales correctly on mobile devices (320px to 768px width)
  - Test touch controls on various mobile devices and screen sizes
  - Optimize asset loading for mobile networks (3G target)
  - Implement orientation lock suggestion for landscape mode
  - Add viewport meta tags for proper mobile rendering
  - Test on iOS Safari, Chrome Mobile, and Samsung Internet
  - _Requirements: 14.1, 14.2, 14.3, 15.1_

- [ ]* 23.1 Write unit tests for responsive behavior
  - Test viewport scaling on different screen sizes
  - Test touch control visibility on mobile
  - Test orientation detection
  - Test mobile-specific UI adjustments
  - _Requirements: 14.1, 14.2, 14.3_


- [ ] 24. Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works for all UI elements
  - Add focus indicators for keyboard users
  - Provide text alternatives for game instructions
  - Add skip-to-content link for screen readers
  - Test with screen readers (NVDA, JAWS, VoiceOver)
  - Ensure color contrast meets WCAG AA standards
  - _Requirements: 16.1, 16.2, 16.3_

- [ ]* 24.1 Write unit tests for accessibility
  - Test ARIA labels presence
  - Test keyboard navigation flow
  - Test focus indicators visibility
  - Test color contrast ratios
  - _Requirements: 16.1, 16.2, 16.3_


- [ ] 25. Implement security and privacy measures
  - Add rate limiting to all game API endpoints (100 requests per minute per IP)
  - Implement CSRF protection for score submissions
  - Sanitize all user inputs (player names, contact info)
  - Add Content Security Policy headers for game assets
  - Implement secure session management with HttpOnly cookies
  - Add privacy policy disclosure for data collection
  - Ensure GDPR compliance for EU users
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]* 25.1 Write unit tests for security measures
  - Test rate limiting enforcement
  - Test input sanitization
  - Test CSRF token validation
  - Test session security
  - _Requirements: 17.1, 17.2, 17.3_


- [ ] 26. Checkpoint - Ensure all features integrated and tested
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27. Set up property-based testing framework
  - Install fast-check package (`npm install --save-dev fast-check @types/fast-check`)
  - Create `lib/game/__tests__/properties/` directory for property tests
  - Configure Jest to run property tests with 100 iterations minimum
  - Create test utilities for generating valid game data
  - Add property test tagging format: "Feature: pixel-art-game, Property N: {description}"
  - _Requirements: 30.1, 30.2, 30.3, 30.4_

- [ ]* 27.1 Verify all 32 property tests are implemented
  - Confirm all property tests from tasks 1.1 through 25.1 are created
  - Verify each test references correct property number from design document
  - Verify each test validates correct requirements
  - Run full property test suite and confirm all pass
  - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6_


- [ ] 28. Create integration tests for end-to-end flows
  - Install Playwright for E2E testing (`npm install --save-dev @playwright/test`)
  - Create `tests/e2e/game/` directory for E2E tests
  - Write test: Complete gameplay flow (name entry → character select → play → score → leaderboard)
  - Write test: Reward allocation for first 100 winners
  - Write test: Anti-cheat detection flags rapid submissions
  - Write test: Mobile touch controls gameplay
  - Write test: Campaign lifecycle (upcoming → active → ended)
  - _Requirements: 30.7, 30.8_

- [ ]* 28.1 Run integration test suite
  - Execute all E2E tests in headless mode
  - Verify all critical user journeys pass
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on mobile viewports
  - _Requirements: 30.7, 30.8_


- [ ] 29. Implement performance monitoring and optimization
  - Add Lighthouse CI to measure load performance (target: <3s on 3G)
  - Implement frame rate monitoring in Phaser (log drops below 30 FPS)
  - Add performance marks for key operations (session creation, score submission)
  - Optimize database queries with EXPLAIN ANALYZE
  - Add indexes for slow queries identified in testing
  - Implement query result caching for leaderboard (5s TTL)
  - Monitor API endpoint latency (target: <1s for score submission, <100ms for queries)
  - _Requirements: 15.1, 15.7, 15.8_

- [ ]* 29.1 Run performance test suite
  - Test asset load time on simulated 3G connection
  - Test frame rate on target devices (past 3 years)
  - Test score submission latency under load
  - Test leaderboard query performance with 10,000+ scores
  - Test database query performance
  - _Requirements: 15.1, 15.7, 15.8_


- [ ] 30. Create documentation and deployment preparation
  - Create README for game feature with setup instructions
  - Document database schema and migration process
  - Document API endpoints with request/response examples
  - Create admin user guide for campaign management
  - Add environment variable documentation (.env.example)
  - Create deployment checklist (database setup, env vars, asset upload)
  - Document monitoring and alerting setup
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 31. Final checkpoint - Complete feature validation
  - Ensure all tests pass (unit, property, integration, E2E)
  - Verify all 40 requirements are implemented and tested
  - Verify all 32 correctness properties have passing tests
  - Test complete user journey from game start to reward claim
  - Verify admin panel functionality for campaign management
  - Verify anti-cheat system flags suspicious activity
  - Verify performance targets met (load time, frame rate, API latency)
  - Ask the user if questions arise or if ready for deployment.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end user flows
- Checkpoints ensure incremental validation at key milestones
- All code should be written in TypeScript following Next.js 14.2 conventions
- Follow existing Janine project structure and styling patterns (Tailwind, App Router)
- Integrate with existing NextAuth authentication and admin panel
- Use existing database connection and Vercel infrastructure