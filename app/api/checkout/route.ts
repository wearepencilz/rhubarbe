import { NextRequest, NextResponse } from 'next/server';
import { createCart } from '@/lib/shopify/cart';

interface CheckoutItem {
  productId: string;
  productName: string;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  quantity: number;
  price: number;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  launchId: string;
  launchTitle: string;
  pickupDate: string;
  pickupLocationName: string;
  pickupLocationAddress: string;
  pickupSlot?: { startTime: string; endTime: string };
  locale: string;
}

/**
 * Resolve the first variant GID via Admin API.
 */
async function getAdminVariantId(shopifyProductId: string): Promise<string | null> {
  try {
    const { getProductVariantId } = await import('@/lib/shopify/admin');
    return await getProductVariantId(shopifyProductId);
  } catch (err) {
    console.error('[Checkout] Variant lookup failed for', shopifyProductId, err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const {
      items, launchId, launchTitle, pickupDate,
      pickupLocationName, pickupLocationAddress, pickupSlot, locale,
    } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Resolve Shopify variant IDs for each item
    const lines: Array<{ merchandiseId: string; quantity: number }> = [];
    const skippedItems: string[] = [];

    for (const item of items) {
      if (!item.shopifyProductId) {
        skippedItems.push(item.productName);
        continue;
      }
      // Use the specific variant ID if provided, otherwise fall back to first variant
      let variantId = item.shopifyVariantId || null;
      if (!variantId) {
        variantId = await getAdminVariantId(item.shopifyProductId);
      }
      if (!variantId) {
        skippedItems.push(item.productName);
        continue;
      }
      lines.push({ merchandiseId: variantId, quantity: item.quantity });
    }

    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'None of the selected products are linked to Shopify. Please contact us to place your order.' },
        { status: 422 },
      );
    }

    // Cart attributes — appear as "Additional details" on the Shopify order
    const attributes: Array<{ key: string; value: string }> = [
      { key: 'Menu', value: launchTitle },
      { key: 'Menu ID', value: launchId },
      { key: 'Pickup Date', value: pickupDate },
      { key: 'Pickup Location', value: pickupLocationName },
      { key: 'Pickup Address', value: pickupLocationAddress },
    ];
    if (pickupSlot) {
      attributes.push({ key: 'Pickup Slot', value: `${pickupSlot.startTime} – ${pickupSlot.endTime}` });
    }

    // Human-readable order note
    const isFr = locale === 'fr';
    const noteLines = [
      `Menu: ${launchTitle}`,
      `${isFr ? 'Cueillette' : 'Pickup'}: ${pickupDate}`,
      `${isFr ? 'Lieu' : 'Location'}: ${pickupLocationName} — ${pickupLocationAddress}`,
    ];
    if (pickupSlot) {
      noteLines.push(`${isFr ? 'Créneau' : 'Slot'}: ${pickupSlot.startTime} – ${pickupSlot.endTime}`);
    }
    noteLines.push('');
    for (const item of items) {
      noteLines.push(`${item.quantity}× ${item.productName}`);
    }
    if (skippedItems.length > 0) {
      noteLines.push('');
      noteLines.push(`${isFr ? 'Non liés à Shopify' : 'Not linked to Shopify'}: ${skippedItems.join(', ')}`);
    }
    const note = noteLines.join('\n');

    // Create Shopify cart via Storefront API
    const cart = await createCart({ lines, attributes, note });

    return NextResponse.json({
      checkoutUrl: cart.checkoutUrl,
      cartId: cart.id,
      skippedItems,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Checkout error:', errMsg, error);

    // Provide actionable error message for common issues
    if (errMsg.includes('does not exist') || errMsg.includes('not be published')) {
      return NextResponse.json(
        { error: 'One or more products are not published to the Storefront sales channel. Please publish them in Shopify Admin → Products → [Product] → Publishing.' },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout. Please try again.' },
      { status: 500 },
    );
  }
}
