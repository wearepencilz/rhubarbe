/**
 * Cake order confirmation email builder and sender.
 *
 * Fetches the "cake-order-confirmation" template from the emailTemplates table,
 * selects the locale-appropriate subject/body, interpolates order variables,
 * and sends via the shared sendEmail service.
 */

import { db } from '@/lib/db/client';
import { emailTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { interpolateTemplate } from '@/lib/email/interpolate';
import { sendEmail } from '@/lib/email/send';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CakeOrderItem {
  productName: string;
  quantity: number;
}

export interface CakeOrderForEmail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  fulfillmentDate: Date | null;
  specialInstructions: string | null;
  numberOfPeople: string | null;
  eventType: string | null;
  items: CakeOrderItem[];
}

const TEMPLATE_KEY = 'cake-order-confirmation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a human-readable variant breakdown string from order items.
 * Each line: "  • {quantity}× {productName}"
 */
function buildVariantBreakdown(items: CakeOrderItem[]): string {
  return items
    .map((item) => `  • ${item.quantity}× ${item.productName}`)
    .join('\n');
}

/**
 * Compute total quantity across all order items.
 */
function computeTotalQuantity(items: CakeOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Format a Date into a locale-friendly date string (e.g. "March 28, 2026").
 */
function formatDate(date: Date, locale: 'en' | 'fr'): string {
  return date.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a cake order confirmation email.
 *
 * 1. Fetches the email template from the `email_templates` table
 * 2. Selects the locale-appropriate subject and body
 * 3. Interpolates order variables
 * 4. Calls sendEmail()
 *
 * @throws Error if the template is not found in the database
 */
export async function sendCakeOrderConfirmation(
  order: CakeOrderForEmail,
  locale: 'en' | 'fr',
): Promise<void> {
  // 1. Fetch template
  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.templateKey, TEMPLATE_KEY));

  if (!template) {
    throw new Error(
      `Email template "${TEMPLATE_KEY}" not found in the database`,
    );
  }

  // 2. Select locale-appropriate subject and body (fall back to EN)
  const subject = template.subject[locale] || template.subject.en;
  const body = template.body[locale] || template.body.en;

  // 3. Build interpolation variables
  const pickupDate = order.fulfillmentDate ?? new Date();
  const variables: Record<string, string> = {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    pickupDate: formatDate(pickupDate, locale),
    numberOfPeople: order.numberOfPeople ?? '',
    eventType: order.eventType ?? '',
    variantBreakdown: buildVariantBreakdown(order.items),
    specialInstructions: order.specialInstructions ?? '',
    totalQuantity: String(computeTotalQuantity(order.items)),
  };

  const interpolatedSubject = interpolateTemplate(subject, variables);
  const interpolatedBody = interpolateTemplate(body, variables);

  // 4. Send
  await sendEmail({
    to: order.customerEmail,
    subject: interpolatedSubject,
    html: interpolatedBody,
    templateKey: TEMPLATE_KEY,
    orderId: order.id,
  });
}
