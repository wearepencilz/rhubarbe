/**
 * Email sending service using the Resend API.
 *
 * - Validates recipient email format before sending
 * - Logs every attempt to the emailLogs table
 * - Retries up to 3 times with exponential backoff (1s, 2s, 4s) on failure
 */

import { db } from '@/lib/db/client';
import { emailLogs } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateKey?: string;
  orderId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate a basic email address format. */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/** Sleep for the given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Resend API call
// ---------------------------------------------------------------------------

const RESEND_API_URL = 'https://api.resend.com/emails';

interface ResendPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

/**
 * Calls the Resend API to send an email.
 * Throws on non-2xx responses.
 */
async function callResendApi(payload: ResendPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => 'unknown error');
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Log helper
// ---------------------------------------------------------------------------

async function logEmailAttempt(
  recipientEmail: string,
  templateKey: string,
  orderId: string | undefined,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    await db.insert(emailLogs).values({
      recipientEmail,
      templateKey,
      orderId: orderId ?? null,
      status,
      errorMessage: errorMessage ?? null,
    });
  } catch (err) {
    // Logging should never break the send flow
    console.error('[Email] Failed to write email log:', err);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second

/**
 * Send a transactional email via Resend.
 *
 * 1. Validates the recipient email format.
 * 2. Attempts to send via the Resend API, retrying up to 3 times with
 *    exponential backoff (1 s → 2 s → 4 s) on failure.
 * 3. Logs every attempt (success or failure) to the `emailLogs` table.
 *
 * @returns `true` if the email was sent successfully, `false` otherwise.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, templateKey = 'unknown', orderId } = options;

  // --- Validate email ---
  if (!isValidEmail(to)) {
    console.error(`[Email] Invalid recipient email: ${to}`);
    await logEmailAttempt(to, templateKey, orderId, 'failed', 'Invalid email address format');
    return false;
  }

  const fromAddress = process.env.EMAIL_FROM ?? 'Rhubarbe <noreply@rhubarbe.ca>';

  // --- Retry loop ---
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await callResendApi({
        from: fromAddress,
        to: [to],
        subject,
        html,
      });

      // Success — log and return
      await logEmailAttempt(to, templateKey, orderId, 'sent');
      return true;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[Email] Attempt ${attempt}/${MAX_RETRIES} failed for ${to}:`,
        lastError.message
      );

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        await sleep(delay);
      }
    }
  }

  // All retries exhausted — log failure
  await logEmailAttempt(
    to,
    templateKey,
    orderId,
    'failed',
    lastError?.message ?? 'Unknown error after retries'
  );
  return false;
}
