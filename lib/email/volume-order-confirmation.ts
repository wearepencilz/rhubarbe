/**
 * Volume order confirmation email builder and sender.
 *
 * Fetches the "volume-order-confirmation" template from the emailTemplates table,
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

export interface OrderItem {
  productName: string;
  quantity: number;
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  fulfillmentDate: Date | null;
  allergenNotes: string | null;
  items: OrderItem[];
}

const TEMPLATE_KEY = 'volume-order-confirmation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a human-readable variant breakdown string from order items.
 * Each line: "  • {quantity}× {productName}"
 */
function buildVariantBreakdown(items: OrderItem[]): string {
  return items
    .map((item) => `  • ${item.quantity}× ${item.productName}`)
    .join('\n');
}

/**
 * Compute total quantity across all order items.
 */
function computeTotalQuantity(items: OrderItem[]): number {
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

/**
 * Format a Date into a locale-friendly time string (e.g. "10:00 AM").
 */
function formatTime(date: Date, locale: 'en' | 'fr'): string {
  return date.toLocaleTimeString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a volume order confirmation email.
 *
 * 1. Fetches the email template from the `email_templates` table
 * 2. Selects the locale-appropriate subject and body
 * 3. Interpolates order variables
 * 4. Calls sendEmail()
 *
 * @throws Error if the template is not found in the database
 */
export async function sendVolumeOrderConfirmation(
  order: OrderWithItems,
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
  const fulfillmentDate = order.fulfillmentDate ?? new Date();
  const variables: Record<string, string> = {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    fulfillmentDate: formatDate(fulfillmentDate, locale),
    fulfillmentTime: formatTime(fulfillmentDate, locale),
    variantBreakdown: buildVariantBreakdown(order.items),
    allergenNote: order.allergenNotes ?? '',
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
