import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import * as ordersQuery from '@/lib/db/queries/orders';
import { sendVolumeOrderConfirmation, OrderWithItems } from '@/lib/email/volume-order-confirmation';
import { sendCakeOrderConfirmation, CakeOrderForEmail } from '@/lib/email/cake-order-confirmation';

/**
 * Shopify Webhook: orders/paid
 *
 * Shopify sends this when a checkout is completed and payment is captured.
 * We verify the HMAC signature, extract order + line item data, and insert
 * into our CMS database so it shows up in the admin orders page.
 *
 * Setup in Shopify Admin → Settings → Notifications → Webhooks:
 *   Event: Order payment
 *   URL:   https://your-domain.com/api/shopify/webhooks/orders-paid
 *   Format: JSON
 */

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify HMAC signature
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (secret && hmacHeader) {
    const digest = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (digest !== hmacHeader) {
      console.error('[Webhook] HMAC verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (secret) {
    // Secret is configured but no HMAC header — reject
    console.error('[Webhook] Missing HMAC header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // If no secret configured, skip verification (dev mode)

  try {
    const shopifyOrder = JSON.parse(rawBody);
    await processShopifyOrder(shopifyOrder);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Webhook] Processing failed:', error?.message, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}


/**
 * Build the specialInstructions field for the order.
 * For cake orders, include number of people and event type metadata alongside the order note.
 * For launch orders, strip out the structured info (menu, pickup, items) and keep only genuine customer notes.
 * For other order types, just use the Shopify order note.
 */
function buildSpecialInstructions(
  orderType: string,
  orderNote: string | null,
  numberOfPeople: string | null,
  eventType: string | null,
  launchTitle: string | null,
  pickupLocation: string | null,
  pickupAddress: string | null,
  pickupSlot: string | null,
  pickupDate: string | null,
): string | null {
  if (orderType === 'cake') {
    const parts: string[] = [];
    if (numberOfPeople) parts.push(`Number of People: ${numberOfPeople}`);
    if (eventType) parts.push(`Event Type: ${eventType}`);
    if (orderNote) parts.push(orderNote);
    return parts.length > 0 ? parts.join('\n') : null;
  }

  if (orderType === 'launch' && orderNote) {
    // Strip out the structured lines we already store in dedicated DB columns
    const stripped = orderNote
      .split('\n')
      .filter((line) => {
        const l = line.trim();
        if (!l) return false;
        // Skip lines that match structured data patterns
        if (/^Menu:/i.test(l)) return false;
        if (/^(Pickup|Cueillette):/i.test(l)) return false;
        if (/^(Location|Lieu):/i.test(l)) return false;
        if (/^(Slot|Créneau):/i.test(l)) return false;
        if (/^(Not linked to Shopify|Non liés à Shopify):/i.test(l)) return false;
        // Skip item lines like "2× Croissant"
        if (/^\d+×/.test(l)) return false;
        return true;
      })
      .join('\n')
      .trim();
    return stripped || null;
  }

  return orderNote || null;
}


/**
 * Parse a Shopify order webhook payload and insert into our DB.
 * Cart attributes (Menu, Pickup Date, Order Type, etc.) are set during checkout.
 */
async function processShopifyOrder(shopifyOrder: any) {
  const shopifyOrderId = String(shopifyOrder.id);

  // Dedup — don't insert the same order twice
  const existing = await ordersQuery.getByShopifyOrderId(shopifyOrderId);
  if (existing) {
    console.log(`[Webhook] Order ${shopifyOrderId} already exists, skipping`);
    return;
  }

  // Extract cart attributes set during checkout
  const attrs = new Map<string, string>();
  for (const attr of shopifyOrder.note_attributes || []) {
    attrs.set(attr.name, attr.value);
  }

  // Determine order type — default to "launch" for backward compatibility
  const orderTypeAttr = attrs.get('Order Type');
  const orderType: 'launch' | 'volume' | 'cake' =
    orderTypeAttr === 'volume' ? 'volume' :
    orderTypeAttr === 'cake' ? 'cake' :
    'launch';

  const pickupDate = attrs.get('Pickup Date');
  const pickupLocation = attrs.get('Pickup Location');
  const pickupAddress = attrs.get('Pickup Address');
  const pickupSlotRaw = attrs.get('Pickup Slot');
  const launchId = attrs.get('Menu ID') || null;
  const launchTitle = attrs.get('Menu') || null;

  // Volume order specific attributes
  const fulfillmentDateRaw = attrs.get('Fulfillment Date') || null;
  const allergenNotes = attrs.get('Allergen Note') || null;

  // Cake order specific attributes
  const cakePickupDateRaw = attrs.get('Pickup Date') || null;
  const cakeSpecialInstructions = attrs.get('Special Instructions') || null;
  const cakeNumberOfPeople = attrs.get('Number of People') || null;
  const cakeEventType = attrs.get('Event Type') || null;

  // Resolve fulfillment date: for cake orders use Pickup Date, for volume use Fulfillment Date
  const fulfillmentDate = orderType === 'cake'
    ? (cakePickupDateRaw ? new Date(cakePickupDateRaw) : null)
    : (fulfillmentDateRaw ? new Date(fulfillmentDateRaw) : null);

  // Parse pickup slot "10:00 – 10:30" format
  let pickupSlot: { startTime: string; endTime: string } | undefined;
  if (pickupSlotRaw) {
    const parts = pickupSlotRaw.split(/\s*[–-]\s*/);
    if (parts.length === 2) {
      pickupSlot = { startTime: parts[0].trim(), endTime: parts[1].trim() };
    }
  }

  // Customer info
  const customer = shopifyOrder.customer || {};
  const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unknown';
  const customerEmail = customer.email || shopifyOrder.email || '';
  const customerPhone = customer.phone || shopifyOrder.phone || '';

  // Pricing — Shopify sends amounts as strings like "45.00", we store in cents
  const toCents = (val: string | number | undefined) => Math.round(parseFloat(String(val || '0')) * 100);

  // For cake orders: store special instructions in allergenNotes, extract metadata from note/attributes
  const resolvedAllergenNotes = orderType === 'cake'
    ? (cakeSpecialInstructions || null)
    : allergenNotes;

  const orderData = {
    orderNumber: String(shopifyOrder.order_number || shopifyOrder.name || shopifyOrderId),
    shopifyOrderId,
    launchId,
    launchTitle,
    customerName,
    customerEmail,
    customerPhone,
    specialInstructions: buildSpecialInstructions(orderType, shopifyOrder.note, cakeNumberOfPeople, cakeEventType, launchTitle, pickupLocation, pickupAddress, pickupSlotRaw, pickupDate),
    subtotal: toCents(shopifyOrder.subtotal_price),
    tax: toCents(shopifyOrder.total_tax),
    total: toCents(shopifyOrder.total_price),
    status: 'confirmed' as const,
    paymentStatus: 'paid' as const,
    orderDate: new Date(shopifyOrder.created_at || Date.now()),
    orderType,
    fulfillmentDate: fulfillmentDate ?? undefined,
    allergenNotes: resolvedAllergenNotes,
  };

  // Build order items from line items
  // For volume orders, the Shopify line item title contains the variant label
  const itemsData = (shopifyOrder.line_items || []).map((li: any) => {
    // For volume orders, li.title is the product name and li.variant_title is the variant label
    // We store the full label as "Product — Variant" to preserve the variant label
    const productName = li.title + (li.variant_title ? ` — ${li.variant_title}` : '');

    return {
      orderId: '', // will be set by create()
      productId: '00000000-0000-0000-0000-000000000000', // placeholder UUID — Shopify doesn't map 1:1
      productName,
      quantity: li.quantity,
      unitPrice: toCents(li.price),
      subtotal: toCents(li.price) * li.quantity,
      pickupDate: pickupDate ? new Date(pickupDate) : (fulfillmentDate ?? new Date()),
      pickupLocationId: '00000000-0000-0000-0000-000000000000', // placeholder
      pickupLocationName: pickupLocation ? `${pickupLocation}${pickupAddress ? ' — ' + pickupAddress : ''}` : 'TBD',
      pickupSlot: pickupSlot || null,
    };
  });

  const created = await ordersQuery.create(orderData, itemsData);
  console.log(`[Webhook] Created order ${created.orderNumber} (Shopify #${shopifyOrderId}, type=${orderType})`);

  // Send confirmation email for volume orders (non-blocking)
  if (orderType === 'volume') {
    try {
      const locale = (attrs.get('Locale') as 'en' | 'fr') || 'en';
      const emailOrder: OrderWithItems = {
        id: created.id,
        orderNumber: created.orderNumber,
        customerName,
        customerEmail,
        fulfillmentDate,
        allergenNotes,
        items: itemsData.map((item: { productName: string; quantity: number }) => ({
          productName: item.productName,
          quantity: item.quantity,
        })),
      };
      await sendVolumeOrderConfirmation(emailOrder, locale);
    } catch (err) {
      console.error('[Webhook] Email send failed for order', created.orderNumber, err);
      // Don't fail the webhook — email failure is non-blocking
    }
  }

  // Send confirmation email for cake orders (non-blocking)
  if (orderType === 'cake') {
    try {
      const locale = (attrs.get('Locale') as 'en' | 'fr') || 'en';
      const emailOrder: CakeOrderForEmail = {
        id: created.id,
        orderNumber: created.orderNumber,
        customerName,
        customerEmail,
        fulfillmentDate,
        specialInstructions: cakeSpecialInstructions,
        numberOfPeople: cakeNumberOfPeople,
        eventType: cakeEventType,
        items: itemsData.map((item: { productName: string; quantity: number }) => ({
          productName: item.productName,
          quantity: item.quantity,
        })),
      };
      await sendCakeOrderConfirmation(emailOrder, locale);
    } catch (err) {
      console.error('[Webhook] Cake email send failed for order', created.orderNumber, err);
      // Don't fail the webhook — email failure is non-blocking
    }
  }
}
