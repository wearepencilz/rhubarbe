import { NextRequest, NextResponse } from 'next/server';
import { createCart } from '@/lib/shopify/cart';
import { getProductVariantId } from '@/lib/shopify/admin';

interface VolumeCheckoutItem {
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  shopifyVariantId: string;
  shopifyProductId?: string;
  quantity: number;
  price: number;
}

interface VolumeCheckoutRequest {
  items: VolumeCheckoutItem[];
  fulfillmentDate: string;     // ISO datetime
  fulfillmentType?: 'pickup' | 'delivery';
  allergenNote: string | null; // order-level
  locale: string;              // "en" | "fr"
}

/**
 * Format an ISO date string into a human-readable form.
 * e.g. "2026-03-28T10:00:00" → "March 28, 2026 at 10:00 AM"
 */
function formatFulfillmentDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: VolumeCheckoutRequest = await request.json();
    const { items, fulfillmentDate, fulfillmentType, allergenNote, locale } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    if (!fulfillmentDate) {
      return NextResponse.json({ error: 'Fulfillment date is required' }, { status: 400 });
    }

    // Resolve Shopify variant IDs — look up default variant for items missing one
    for (const item of items) {
      if (!item.shopifyVariantId && item.shopifyProductId) {
        const variantId = await getProductVariantId(item.shopifyProductId);
        if (variantId) {
          item.shopifyVariantId = variantId;
        }
      }
    }

    // Validate that every item now has a Shopify variant ID
    const unresolvableItems = items.filter((item) => !item.shopifyVariantId);
    if (unresolvableItems.length > 0) {
      const labels = unresolvableItems.map((i) => `${i.productName} — ${i.variantLabel}`);
      return NextResponse.json(
        {
          error: `The following variant(s) cannot be resolved to a Shopify product: ${labels.join(', ')}. Please contact us to place your order.`,
          unresolvableVariants: labels,
        },
        { status: 422 },
      );
    }

    // Build cart lines from variant items
    const lines: Array<{ merchandiseId: string; quantity: number }> = items.map((item) => ({
      merchandiseId: item.shopifyVariantId,
      quantity: item.quantity,
    }));

    // Derive a product identifier from the first item (volume orders are per-product)
    const volumeProductId = items[0].productId;

    // Cart attributes — appear as "Additional details" on the Shopify order
    const attributes: Array<{ key: string; value: string }> = [
      { key: 'Order Type', value: 'volume' },
      { key: 'Volume Product', value: volumeProductId },
      { key: 'Fulfillment Date', value: fulfillmentDate },
      { key: 'Fulfillment Type', value: fulfillmentType || 'pickup' },
    ];
    if (allergenNote) {
      attributes.push({ key: 'Allergen Note', value: allergenNote });
    }

    // Build human-readable order note
    const isFr = locale === 'fr';
    const fulfillmentFormatted = formatFulfillmentDateTime(fulfillmentDate);

    const noteLines: string[] = [
      `Type: ${isFr ? 'Commande en volume' : 'Volume Order'}`,
      `${isFr ? 'Livraison' : 'Fulfillment'}: ${fulfillmentFormatted}`,
      `${isFr ? 'Mode' : 'Method'}: ${(fulfillmentType || 'pickup') === 'delivery' ? (isFr ? 'Livraison' : 'Delivery') : (isFr ? 'Cueillette' : 'Pickup')}`,
    ];
    for (const item of items) {
      noteLines.push(`${item.quantity}× ${item.productName} — ${item.variantLabel}`);
    }
    if (allergenNote) {
      noteLines.push(`${isFr ? 'Préoccupations allergènes' : 'Allergen concerns'}: ${allergenNote}`);
    }
    const note = noteLines.join('\n');

    // Create Shopify cart via Storefront API
    const cart = await createCart({ lines, attributes, note });

    return NextResponse.json({
      checkoutUrl: cart.checkoutUrl,
      cartId: cart.id,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Volume Checkout] Error:', errMsg, error);

    if (errMsg.includes('does not exist') || errMsg.includes('not be published')) {
      return NextResponse.json(
        { error: 'One or more variants are not published to the Storefront sales channel. Please publish them in Shopify Admin.' },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout. Please try again.' },
      { status: 500 },
    );
  }
}
