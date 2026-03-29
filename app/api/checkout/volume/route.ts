import { NextRequest, NextResponse } from 'next/server';
import { createCart } from '@/lib/shopify/cart';
import { getProductVariantId } from '@/lib/shopify/admin';
import { getTaxConfigByIds } from '@/lib/db/queries/products';
import { findExemptVariant } from '@/lib/tax/find-exempt-variant';

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
  fulfillmentDate: string;
  fulfillmentType?: 'pickup' | 'delivery';
  allergenNote: string | null;
  locale: string;
  deliveryAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

function formatFulfillmentDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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

    // Resolve Shopify variant IDs
    for (const item of items) {
      if (!item.shopifyVariantId && item.shopifyProductId) {
        const variantId = await getProductVariantId(item.shopifyProductId);
        if (variantId) item.shopifyVariantId = variantId;
      }
    }

    const unresolvableItems = items.filter((item) => !item.shopifyVariantId);
    if (unresolvableItems.length > 0) {
      const labels = unresolvableItems.map((i) => `${i.productName} — ${i.variantLabel}`);
      return NextResponse.json(
        { error: `The following variant(s) cannot be resolved: ${labels.join(', ')}. Please contact us.`, unresolvableVariants: labels },
        { status: 422 },
      );
    }

    const lines: Array<{ merchandiseId: string; quantity: number }> = items.map((item) => ({
      merchandiseId: item.shopifyVariantId,
      quantity: item.quantity,
    }));

    console.log('[Volume Checkout] Lines to create cart:', JSON.stringify(lines));

    // Convention-based tax variant resolution
    const productIds = items.map((item) => item.productId);
    const taxConfigs = await getTaxConfigByIds(productIds);

    for (let i = 0; i < lines.length; i++) {
      const item = items[i];
      const taxConfig = taxConfigs.get(item.productId);
      if (!taxConfig || !item.shopifyProductId) continue;

      if (taxConfig.taxBehavior === 'quantity_threshold') {
        const effectiveUnits = item.quantity * taxConfig.taxUnitCount;
        if (effectiveUnits >= taxConfig.taxThreshold) {
          const exemptId = await findExemptVariant(item.shopifyProductId, lines[i].merchandiseId);
          if (exemptId) {
            lines[i].merchandiseId = exemptId;
          } else {
            console.warn(`[Volume Checkout] No exempt variant found for ${item.productName}`);
          }
        }
      } else if (taxConfig.taxBehavior === 'always_exempt') {
        const exemptId = await findExemptVariant(item.shopifyProductId, lines[i].merchandiseId);
        if (exemptId) lines[i].merchandiseId = exemptId;
      }
    }

    const volumeProductId = items[0].productId;
    const attributes: Array<{ key: string; value: string }> = [
      { key: 'Order Type', value: 'volume' },
      { key: 'Volume Product', value: volumeProductId },
      { key: 'Fulfillment Date', value: fulfillmentDate },
      { key: 'Fulfillment Type', value: fulfillmentType || 'pickup' },
    ];
    if (allergenNote) attributes.push({ key: 'Allergen Note', value: allergenNote });
    if (fulfillmentType === 'delivery' && body.deliveryAddress) {
      const addr = body.deliveryAddress;
      attributes.push(
        { key: 'Delivery Street', value: addr.street },
        { key: 'Delivery City', value: addr.city },
        { key: 'Delivery Province', value: addr.province },
        { key: 'Delivery Postal Code', value: addr.postalCode },
      );
    }

    const isFr = locale === 'fr';
    const noteLines: string[] = [
      `Type: ${isFr ? 'Commande en volume' : 'Volume Order'}`,
      `${isFr ? 'Livraison' : 'Fulfillment'}: ${formatFulfillmentDateTime(fulfillmentDate)}`,
      `${isFr ? 'Mode' : 'Method'}: ${(fulfillmentType || 'pickup') === 'delivery' ? (isFr ? 'Livraison' : 'Delivery') : (isFr ? 'Cueillette' : 'Pickup')}`,
    ];
    for (const item of items) {
      noteLines.push(`${item.quantity}× ${item.productName} — ${item.variantLabel}`);
    }
    if (allergenNote) noteLines.push(`${isFr ? 'Préoccupations allergènes' : 'Allergen concerns'}: ${allergenNote}`);
    if (fulfillmentType === 'delivery' && body.deliveryAddress) {
      const addr = body.deliveryAddress;
      noteLines.push(`${isFr ? 'Adresse de livraison' : 'Delivery address'}: ${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}`);
    }
    const note = noteLines.join('\n');

    const cart = await createCart({ lines, attributes, note });

    return NextResponse.json({ checkoutUrl: cart.checkoutUrl, cartId: cart.id });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Volume Checkout] Error:', errMsg, error);

    if (errMsg.includes('does not exist') || errMsg.includes('not be published')) {
      return NextResponse.json(
        { error: 'One or more variants are not published to the Storefront sales channel.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: 'Failed to create checkout. Please try again.' }, { status: 500 });
  }
}
