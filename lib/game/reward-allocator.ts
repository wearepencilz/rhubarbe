import { queryWithRetry } from '@/lib/db-game';
import type { Campaign, Reward } from '@/types/game';
import { generateSimpleClaimCode, generateQRCode } from './qr-generator';
import { sendWinnerSMS, formatPhoneNumber } from './sms-service';

export interface RewardAllocationResult {
  success: boolean;
  reward?: {
    claimCode: string;
    expirationDate: string;
    redemptionInstructions: string;
  };
  error?: string;
}

export class RewardAllocator {
  /**
   * Allocate a reward to a winning score
   * Returns reward details if successful, or error if not in first 100 completers
   */
  async allocateReward(
    campaignId: string,
    scoreId: string,
    playerName: string,
    contactPhone?: string,
    contactEmail?: string
  ): Promise<RewardAllocationResult> {
    try {
      // Get campaign reward details
      const campaignResult = await queryWithRetry<Campaign>(
        `SELECT 
          name,
          reward_type, 
          reward_description,
          ticket_success_title,
          ticket_success_message
        FROM campaigns 
        WHERE id = $1`,
        [campaignId]
      );

      if (campaignResult.rows.length === 0) {
        return {
          success: false,
          error: 'Campaign not found',
        };
      }

      const campaign = campaignResult.rows[0] as any;

      // Generate simple 6-character claim code (e.g., ABC123)
      const claimCode = generateSimpleClaimCode();

      // Generate QR code
      const qrCodeUrl = await generateQRCode(claimCode, campaignId);

      // Calculate expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Use campaign-specific reward details or defaults
      const rewardType = campaign.reward_type || 'Free Scoop';
      const redemptionInstructions = campaign.ticket_success_message || this.getRedemptionInstructions();

      // Format phone number if provided
      let formattedPhone = null;
      if (contactPhone) {
        try {
          formattedPhone = formatPhoneNumber(contactPhone);
        } catch (error) {
          console.warn('Invalid phone number format:', contactPhone);
        }
      }

      // Insert reward record
      const rewardResult = await queryWithRetry<Reward>(
        `INSERT INTO rewards (
          campaign_id,
          score_id,
          claim_code,
          player_name,
          contact_email,
          contact_phone,
          reward_type,
          redemption_instructions,
          expiration_date,
          qr_code_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          campaignId,
          scoreId,
          claimCode,
          playerName,
          contactEmail || null,
          formattedPhone,
          rewardType,
          redemptionInstructions,
          expirationDate,
          qrCodeUrl,
        ]
      );

      const reward = rewardResult.rows[0];

      console.log('Reward record created:', reward);
      console.log('Claim code:', reward.claim_code);
      console.log('QR code URL:', reward.qr_code_url);

      // Send SMS notification if phone number provided
      if (formattedPhone) {
        try {
          console.log('Sending SMS to:', formattedPhone);
          const smsResult = await sendWinnerSMS(formattedPhone, claimCode, campaign.name, qrCodeUrl);
          console.log('SMS result:', smsResult);
        } catch (error) {
          console.error('Failed to send SMS notification:', error);
          // Don't fail the reward allocation if SMS fails
        }
      } else {
        console.log('No phone number provided, skipping SMS');
      }

      const rewardResponse = {
        claimCode: reward.claim_code,
        expirationDate: reward.expiration_date.toISOString(),
        redemptionInstructions: reward.redemption_instructions,
        rewardType: reward.reward_type,
        successTitle: campaign.ticket_success_title || '🎉 You Won!',
        qrCodeUrl: reward.qr_code_url,
      };

      console.log('Returning reward response:', rewardResponse);

      return {
        success: true,
        reward: rewardResponse as any,
      };
    } catch (error) {
      console.error('Error allocating reward:', error);
      
      return {
        success: false,
        error: 'Failed to allocate reward',
      };
    }
  }

  /**
   * Get redemption instructions for winners
   */
  private getRedemptionInstructions(): string {
    return 'Visit Janine ice cream shop and show this QR code or claim code to redeem your reward. Valid for 30 days.';
  }

  /**
   * Check if a score has already been allocated a reward
   */
  async hasReward(scoreId: string): Promise<boolean> {
    const result = await queryWithRetry<Reward>(
      'SELECT id FROM rewards WHERE score_id = $1 LIMIT 1',
      [scoreId]
    );
    return result.rows.length > 0;
  }

  /**
   * Get reward by score ID
   */
  async getRewardByScore(scoreId: string): Promise<Reward | null> {
    const result = await queryWithRetry<Reward>(
      'SELECT * FROM rewards WHERE score_id = $1 LIMIT 1',
      [scoreId]
    );
    return result.rows[0] || null;
  }
}
