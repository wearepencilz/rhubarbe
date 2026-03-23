import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import * as ordersQuery from '@/lib/db/queries/orders';

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
 * Parse a Shopify order webhook payload and insert into our DB.
 * Cart attributes (Menu, Pickup Date, etc.) are set during checkout.
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

  const pickupDate = attrs.get('Pickup Date');
  const pickupLocation = attrs.get('Pickup Location');
  const pickupAddress = attrs.get('Pickup Address');
  const pickupSlotRaw = attrs.get('Pickup Slot');
  const launchId = attrs.get('Menu ID') || null;
  const launchTitle = attrs.get('Menu') || null;

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

  const orderData = {
    orderNumber: String(shopifyOrder.order_number || shopifyOrder.name || shopifyOrderId),
    shopifyOrderId,
    launchId,
    launchTitle,
    customerName,
    customerEmail,
    customerPhone,
    specialInstructions: shopifyOrder.note || null,
    subtotal: toCents(shopifyOrder.subtotal_price),
    tax: toCents(shopifyOrder.total_tax),
    total: toCents(shopifyOrder.total_price),
    status: 'confirmed' as const,
    paymentStatus: 'paid' as const,
    orderDate: new Date(shopifyOrder.created_at || Date.now()),
  };

  // Build order items from line items
  const itemsData = (shopifyOrder.line_items || []).map((li: any) => ({
    orderId: '', // will be set by create()
    productId: '00000000-0000-0000-0000-000000000000', // placeholder UUID — Shopify doesn't map 1:1
    productName: li.title + (li.variant_title ? ` — ${li.variant_title}` : ''),
    quantity: li.quantity,
    unitPrice: toCents(li.price),
    subtotal: toCents(li.price) * li.quantity,
    pickupDate: pickupDate ? new Date(pickupDate) : new Date(),
    pickupLocationId: '00000000-0000-0000-0000-000000000000', // placeholder
    pickupLocationName: pickupLocation ? `${pickupLocation}${pickupAddress ? ' — ' + pickupAddress : ''}` : 'TBD',
    pickupSlot: pickupSlot || null,
  }));

  const created = await ordersQuery.create(orderData, itemsData);
  console.log(`[Webhook] Created order ${created.orderNumber} (Shopify #${shopifyOrderId})`);
}
