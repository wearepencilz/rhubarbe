// Volume order config for the hybrid checkout flow
// Requirements: 2.3, 3.3, 7.2

import type { OrderTypeConfig } from '../order-type-config';
import type { CartItemUnion, FulfillmentState, VolumeCartItem } from '../types';
import { calculateServesEstimate } from '@/lib/utils/order-helpers';

interface LeadTimeTier {
  minQuantity: number;
  leadTimeDays: number;
}

/**
 * Returns the lead time in days for a given quantity based on the tier list.
 * Filters tiers where minQuantity <= totalQuantity, picks the highest minQuantity tier.
 */
function getLeadTimeDays(tiers: LeadTimeTier[], totalQuantity: number): number {
  const applicable = tiers
    .filter((t) => t.minQuantity <= totalQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity);
  return applicable[0]?.leadTimeDays ?? 0;
}

export const volumeOrderConfig: OrderTypeConfig = {
  orderType: 'volume',

  // Volume orders support pickup/delivery toggle
  supportsFulfillmentToggle: true,

  // Volume orders compute earliest date from lead times, no preset
  hasPresetDate: false,

  // Checkout API endpoint
  checkoutEndpoint: '/api/checkout/volume',

  // Delivery is disabled when any cart item has pickupOnly set to true
  isDeliveryDisabled: (cartItems: CartItemUnion[]): boolean => {
    return cartItems.some((item) => (item as any).pickupOnly === true);
  },

  deliveryDisabledReason: (locale: string): string =>
    locale === 'fr'
      ? 'Certains articles sont en cueillette seulement'
      : 'Some items are pickup only',

  // Compute the earliest fulfillment date based on max lead time across all cart items
  getEarliestDate: (cartItems: CartItemUnion[]): Date => {
    let maxDays = 0;
    for (const item of cartItems) {
      const tiers: LeadTimeTier[] = (item as any).leadTimeTiers ?? [];
      const quantity = (item as VolumeCartItem).quantity ?? 0;
      const days = getLeadTimeDays(tiers, quantity);
      if (days > maxDays) maxDays = days;
    }
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + maxDays);
    return d;
  },

  // Disabled pickup days are fetched at runtime from the pickup-config API
  getDisabledPickupDays: (): number[] => [],

  buildCheckoutPayload: (
    cartItems: CartItemUnion[],
    fulfillment: FulfillmentState,
    locale: string,
  ): Record<string, unknown> => {
    const items = (cartItems as VolumeCartItem[]).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      shopifyVariantId: item.shopifyVariantId,
      shopifyProductId: item.shopifyProductId,
      quantity: item.quantity,
      price: item.price,
    }));

    const isoDate = fulfillment.date
      ? `${fulfillment.date}T00:00:00`
      : '';

    const payload: Record<string, unknown> = {
      items,
      fulfillmentDate: isoDate,
      fulfillmentType: fulfillment.fulfillmentType,
      allergenNote: fulfillment.allergenNote.trim() || null,
      locale,
    };

    if (fulfillment.fulfillmentType === 'delivery' && fulfillment.address) {
      payload.deliveryAddress = fulfillment.address;
    }

    return payload;
  },

  getOrderSpecificFields: (
    cartItems: CartItemUnion[],
    fulfillment: FulfillmentState,
    locale: string,
  ): Array<{ label: string; value: string }> => {
    const isFr = locale === 'fr';
    const fields: Array<{ label: string; value: string }> = [];

    if (fulfillment.allergenNote.trim()) {
      fields.push({
        label: isFr ? 'Note allergène' : 'Allergen note',
        value: fulfillment.allergenNote.trim(),
      });
    }

    // Calculate serves estimate from cart items
    const servesItems = cartItems.map((item) => ({
      quantity: (item as VolumeCartItem).quantity ?? 0,
      servesPerUnit: (item as any).servesPerUnit ?? null,
    }));
    const serves = calculateServesEstimate(servesItems);
    if (serves > 0) {
      fields.push({
        label: isFr ? 'Portions estimées' : 'Serves estimate',
        value: isFr
          ? `Environ ${serves} personnes`
          : `Approx. ${serves} people`,
      });
    }

    return fields;
  },
};
