/**
 * Score Validation Service
 * Implements anti-cheat measures for game score submissions
 */

import { kv } from '@vercel/kv';
import {
  isSessionUsed,
  checkRateLimit,
  checkBrowserFingerprint,
  logValidation,
  findById,
} from '@/lib/db-game';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  flagged: boolean;
}

export interface ScoreSubmission {
  sessionId: string;
  score: number;
  completionTime: number;
  clientTimestamp: number;
  ipAddress: string;
  browserFingerprint?: string;
}

export class ScoreValidator {
  /**
   * Validate a score submission with comprehensive anti-cheat checks
   */
  async validate(submission: ScoreSubmission): Promise<ValidationResult> {
    const { sessionId, score, completionTime, ipAddress, browserFingerprint } = submission;

    // 1. Validate session exists and hasn't been used
    const sessionValid = await this.validateSession(sessionId);
    if (!sessionValid.valid) {
      await this.logValidation(sessionId, 'session_validation', false, sessionValid.reason, ipAddress, browserFingerprint);
      return sessionValid;
    }

    // 2. Validate score range
    const scoreValid = await this.validateScore(score, sessionId);
    if (!scoreValid.valid) {
      await this.logValidation(sessionId, 'score_validation', false, scoreValid.reason, ipAddress, browserFingerprint);
      return scoreValid;
    }

    // 3. Validate completion time
    const timeValid = this.validateCompletionTime(completionTime, sessionId);
    if (!timeValid.valid) {
      await this.logValidation(sessionId, 'time_validation', false, timeValid.reason, ipAddress, browserFingerprint);
      return timeValid;
    }

    // 4. Check IP rate limiting
    const rateLimitValid = await this.validateSubmissionRate(ipAddress);
    if (!rateLimitValid.valid) {
      await this.logValidation(sessionId, 'rate_limit', false, rateLimitValid.reason, ipAddress, browserFingerprint);
      return rateLimitValid;
    }

    // 5. Check browser fingerprint for suspicious activity
    const fingerprintValid = await this.validateBrowserFingerprint(browserFingerprint);
    if (!fingerprintValid.valid) {
      await this.logValidation(sessionId, 'fingerprint_check', false, fingerprintValid.reason, ipAddress, browserFingerprint);
      return fingerprintValid;
    }

    // All validations passed
    await this.logValidation(sessionId, 'full_validation', true, 'All checks passed', ipAddress, browserFingerprint);
    
    return {
      valid: true,
      flagged: false,
    };
  }

  /**
   * Validate that session ID exists and hasn't been used for score submission
   */
  async validateSession(sessionId: string): Promise<ValidationResult> {
    try {
      // Check if session exists
      const session = await findById('game_sessions', sessionId);
      if (!session) {
        return {
          valid: false,
          reason: 'Session not found',
          flagged: true,
        };
      }

      // Check if session has already been used for a score submission
      const alreadyUsed = await isSessionUsed(sessionId);
      if (alreadyUsed) {
        return {
          valid: false,
          reason: 'Session ID already used for score submission',
          flagged: true,
        };
      }

      return { valid: true, flagged: false };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        reason: 'Session validation failed',
        flagged: false,
      };
    }
  }

  /**
   * Validate that score is within valid range based on campaign timer
   */
  async validateScore(score: number, sessionId: string): Promise<ValidationResult> {
    try {
      // Score must be non-negative
      if (score < 0) {
        return {
          valid: false,
          reason: 'Score cannot be negative',
          flagged: true,
        };
      }

      // Get session to find campaign
      const session = await findById('game_sessions', sessionId);
      if (!session) {
        return {
          valid: false,
          reason: 'Session not found for score validation',
          flagged: false,
        };
      }

      // Get campaign to check timer duration
      const campaign = await findById('campaigns', session.campaign_id);
      if (!campaign) {
        return {
          valid: false,
          reason: 'Campaign not found for score validation',
          flagged: false,
        };
      }

      // Calculate maximum possible score
      // Formula: 1000 base + (remaining_time * 10) + (ingredients * 50)
      // Max remaining time = timer_duration
      // Max ingredients = 3 (hardcoded in game)
      const maxIngredients = 3;
      const maxPossibleScore = 1000 + (campaign.timer_duration * 10) + (maxIngredients * 50);

      if (score > maxPossibleScore) {
        return {
          valid: false,
          reason: `Score ${score} exceeds maximum possible ${maxPossibleScore}`,
          flagged: true,
        };
      }

      return { valid: true, flagged: false };
    } catch (error) {
      console.error('Score validation error:', error);
      return {
        valid: false,
        reason: 'Score validation failed',
        flagged: false,
      };
    }
  }

  /**
   * Validate that completion time is physically possible
   */
  validateCompletionTime(completionTime: number, sessionId: string): ValidationResult {
    // No minimum time - allow fast completions
    
    // Maximum completion time should not exceed timer duration
    // This will be checked against campaign timer in score validation
    // For now, just ensure it's reasonable (under 2 minutes)
    if (completionTime > 120) {
      return {
        valid: false,
        reason: `Completion time ${completionTime}s exceeds maximum 120s`,
        flagged: true,
      };
    }

    return { valid: true, flagged: false };
  }

  /**
   * Validate submission rate (max 1 per 30 seconds per IP)
   */
  async validateSubmissionRate(ipAddress: string): Promise<ValidationResult> {
    try {
      const canSubmit = await checkRateLimit(ipAddress, 30);
      
      if (!canSubmit) {
        return {
          valid: false,
          reason: 'Rate limit exceeded: max 1 submission per 30 seconds',
          flagged: true,
        };
      }

      return { valid: true, flagged: false };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow submission if rate limit check fails (fail open)
      return { valid: true, flagged: false };
    }
  }

  /**
   * Validate browser fingerprint (flag if multiple submissions within 60 seconds)
   */
  async validateBrowserFingerprint(fingerprint?: string): Promise<ValidationResult> {
    if (!fingerprint) {
      // No fingerprint provided, can't validate but don't fail
      return { valid: true, flagged: false };
    }

    try {
      const submissionCount = await checkBrowserFingerprint(fingerprint, 60);
      
      if (submissionCount > 0) {
        return {
          valid: true, // Don't reject, but flag for review
          reason: `Multiple submissions from same fingerprint within 60s (count: ${submissionCount})`,
          flagged: true,
        };
      }

      return { valid: true, flagged: false };
    } catch (error) {
      console.error('Fingerprint check error:', error);
      return { valid: true, flagged: false };
    }
  }

  /**
   * Log validation result
   */
  private async logValidation(
    sessionId: string,
    validationType: string,
    passed: boolean,
    reason?: string,
    ipAddress?: string,
    browserFingerprint?: string
  ): Promise<void> {
    try {
      await logValidation({
        sessionId,
        validationType,
        passed,
        reason,
        ipAddress,
        browserFingerprint,
      });
    } catch (error) {
      console.error('Failed to log validation:', error);
      // Don't throw - logging failure shouldn't break validation
    }
  }

  /**
   * Check if IP has exceeded hourly submission limit (10 per hour)
   */
  async checkHourlyLimit(ipAddress: string): Promise<boolean> {
    try {
      const key = `game:ratelimit:hourly:${ipAddress}`;
      const count = await kv.get<number>(key) || 0;

      if (count >= 10) {
        return false; // Limit exceeded
      }

      // Increment counter with 1 hour expiry
      await kv.set(key, count + 1, { ex: 3600 });
      return true;
    } catch (error) {
      console.error('Hourly limit check error:', error);
      return true; // Fail open
    }
  }

  /**
   * Check if session initialization limit exceeded (20 per hour per IP)
   */
  async checkSessionInitLimit(ipAddress: string): Promise<boolean> {
    try {
      const key = `game:session:limit:${ipAddress}`;
      const count = await kv.get<number>(key) || 0;

      if (count >= 20) {
        return false; // Limit exceeded
      }

      // Increment counter with 1 hour expiry
      await kv.set(key, count + 1, { ex: 3600 });
      return true;
    } catch (error) {
      console.error('Session init limit check error:', error);
      return true; // Fail open
    }
  }
}

// Export singleton instance
export const scoreValidator = new ScoreValidator();
