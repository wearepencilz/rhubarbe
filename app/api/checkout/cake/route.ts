import { NextRequest, NextResponse } from 'next/server';
import { createCart } from '@/lib/shopify/cart';
import { getProductVariantId } from '@/lib/shopify/admin';
import { getTaxConfigByIds } from '@/lib/db/queries/products';
import { findExemptVariant } from '@/lib/tax/find-exempt-variant';

interface CakeCheckoutItem {
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  shopifyVariantId: string;
  shopifyProductId?: string;
  quantity: number;
  price: number;
}

interface CakeCheckoutRequest {
  items: CakeCheckoutItem[];
  pickupDate: string;
  numberOfPeople: number;
  eventType: string;
  specialInstructions: string | null;
  fulfillmentType?: 'pickup' | 'delivery';
  locale: string;
  calculatedPrice?: number;
  deliveryAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

function formatPickupDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export async function POST(request: NextRequest) {
  try {
    const body: CakeCheckoutRequest = await request.json();
    const { items, pickupDate, numberOfPeople, eventType, specialInstructions, fulfillmentType, locale, calculatedPrice } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }
    if (!pickupDate) {
      return NextResponse.json({ error: 'Pickup date is required' }, { status: 400 });
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
            console.warn(`[Cake Checkout] No exempt variant found for ${item.productName}`);
          }
        }
      } else if (taxConfig.taxBehavior === 'always_exempt') {
        const exemptId = await findExemptVariant(item.shopifyProductId, lines[i].merchandiseId);
        if (exemptId) lines[i].merchandiseId = exemptId;
      }
    }

    const cakeProductId = items[0].productId;
    const resolvedFulfillmentType = fulfillmentType || 'pickup';
    const isDelivery = resolvedFulfillmentType === 'delivery';

    const attributes: Array<{ key: string; value: string }> = [
      { key: 'Order Type', value: 'cake' },
      { key: 'Cake Product', value: cakeProductId },
      { key: 'Pickup Date', value: pickupDate },
      { key: 'Fulfillment Type', value: resolvedFulfillmentType },
      { key: 'Number of People', value: String(numberOfPeople) },
      { key: 'Event Type', value: eventType },
    ];
    if (calculatedPrice != null) attributes.push({ key: 'Calculated Price', value: String(calculatedPrice) });
    if (specialInstructions) attributes.push({ key: 'Special Instructions', value: specialInstructions });
    if (isDelivery && body.deliveryAddress) {
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
      `Type: ${isFr ? 'Commande de gâteau' : 'Cake Order'}`,
      `${isFr ? 'Mode' : 'Method'}: ${isDelivery ? (isFr ? 'Livraison' : 'Delivery') : (isFr ? 'Cueillette' : 'Pickup')}`,
      `${isFr ? 'Date' : 'Date'}: ${formatPickupDate(pickupDate)}`,
      `${isFr ? 'Personnes' : 'People'}: ${numberOfPeople}`,
      `${isFr ? 'Événement' : 'Event'}: ${eventType}`,
    ];
    if (calculatedPrice != null) {
      noteLines.push(`${isFr ? 'Prix calculé' : 'Calculated Price'}: $${(calculatedPrice / 100).toFixed(2)}`);
    }
    for (const item of items) {
      noteLines.push(`${item.quantity}× ${item.productName} — ${item.variantLabel}`);
    }
    if (specialInstructions) noteLines.push(`${isFr ? 'Instructions spéciales' : 'Special instructions'}: ${specialInstructions}`);
    if (isDelivery && body.deliveryAddress) {
      const addr = body.deliveryAddress;
      noteLines.push(`${isFr ? 'Adresse de livraison' : 'Delivery address'}: ${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}`);
    }
    const note = noteLines.join('\n');

    const cart = await createCart({ lines, attributes, note });

    return NextResponse.json({ checkoutUrl: cart.checkoutUrl, cartId: cart.id });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Cake Checkout] Error:', errMsg, error);

    if (errMsg.includes('does not exist') || errMsg.includes('not be published')) {
      return NextResponse.json(
        { error: 'One or more variants are not published to the Storefront sales channel.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: 'Failed to create checkout. Please try again.' }, { status: 500 });
  }
}
