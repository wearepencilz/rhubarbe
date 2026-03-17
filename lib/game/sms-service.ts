/**
 * SMS notification service for game rewards
 * Uses Twilio for SMS delivery
 */

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS notification to winner with QR code
 * @param phone - Phone number in E.164 format (e.g., +1234567890)
 * @param claimCode - Simple claim code (e.g., ABC123)
 * @param campaignName - Name of the campaign
 * @param qrCodeUrl - Data URL of the QR code image (optional)
 */
export async function sendWinnerSMS(
  phone: string,
  claimCode: string,
  campaignName: string,
  qrCodeUrl?: string
): Promise<SMSResult> {
  try {
    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn('Twilio not configured. SMS notification skipped.');
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }

    // Format message
    const message = `🎉 Congrats! You won ${campaignName}!\n\nYour claim code: ${claimCode}\n\nShow this at Janine to redeem your reward. Valid for 30 days.`;

    // Prepare request body
    const body: Record<string, string> = {
      To: phone,
      From: process.env.TWILIO_PHONE_NUMBER,
      Body: message,
    };

    // Add QR code as MMS if provided and it's a valid URL
    // Note: Twilio MMS requires a publicly accessible URL, not a data URL
    // For data URLs, we'd need to upload to a server first
    if (qrCodeUrl && qrCodeUrl.startsWith('http')) {
      body.MediaUrl = qrCodeUrl;
    }

    // Send SMS/MMS via Twilio
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }

    const data = await response.json();
    console.log('SMS sent successfully:', data.sid);

    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format phone number to E.164 format
 * Assumes US numbers if no country code provided
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 1 and has 11 digits, it's already formatted
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If already has country code
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  // Invalid format
  throw new Error('Invalid phone number format');
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  try {
    const formatted = formatPhoneNumber(phone);
    return formatted.length >= 11 && formatted.length <= 15;
  } catch {
    return false;
  }
}
