// Cake order config for the hybrid checkout flow
// Requirements: 2.4, 3.4, 7.3

import type { OrderTypeConfig } from '../order-type-config';
import type { CartItemUnion, CakeCartItem, FulfillmentState } from '../types';

interface LeadTimeTier {
  minPeople: number;
  leadTimeDays: number;
}

/**
 * Returns the lead time in days for a given number of people based on the tier list.
 * Filters tiers where minPeople <= numberOfPeople, picks the highest minPeople tier.
 */
function getLeadTimeDays(tiers: LeadTimeTier[], numberOfPeople: number): number {
  const applicable = tiers
    .filter((t) => t.minPeople <= numberOfPeople)
    .sort((a, b) => b.minPeople - a.minPeople);
  return applicable[0]?.leadTimeDays ?? 0;
}

export const cakeOrderConfig: OrderTypeConfig = {
  orderType: 'cake',

  // Cake orders support pickup/delivery toggle
  supportsFulfillmentToggle: true,

  // Cake orders compute earliest date from lead time tiers, no preset
  hasPresetDate: false,

  // Checkout API endpoint
  checkoutEndpoint: '/api/checkout/cake',

  // Delivery is disabled when any cart item has cakeDeliveryAvailable set to false
  isDeliveryDisabled: (cartItems: CartItemUnion[]): boolean => {
    return cartItems.some((item) => (item as any).cakeDeliveryAvailable === false);
  },

  deliveryDisabledReason: (locale: string): string =>
    locale === 'fr'
      ? 'Cueillette seulement'
      : 'Pickup only',

  // Compute the earliest fulfillment date based on the first cart item's lead time tiers and numberOfPeople
  getEarliestDate: (cartItems: CartItemUnion[]): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);

    if (cartItems.length === 0) return d;

    const firstItem = cartItems[0] as CakeCartItem;
    const tiers: LeadTimeTier[] = (firstItem as any).leadTimeTiers ?? [];
    const numberOfPeople = firstItem.numberOfPeople ?? 0;
    const days = getLeadTimeDays(tiers, numberOfPeople);

    d.setDate(d.getDate() + days);
    return d;
  },

  // Disabled pickup days are fetched at runtime from the pickup-config API
  getDisabledPickupDays: (): number[] => [],

  buildCheckoutPayload: (
    cartItems: CartItemUnion[],
    fulfillment: FulfillmentState,
    locale: string,
  ): Record<string, unknown> => {
    const items = (cartItems as CakeCartItem[]).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      variantId: item.shopifyVariantId,
      variantLabel: item.productName,
      shopifyVariantId: item.shopifyVariantId,
      shopifyProductId: item.shopifyProductId,
      quantity: 1,
      price: item.calculatedPrice,
    }));

    const isoDate = fulfillment.date
      ? `${fulfillment.date}T00:00:00`
      : '';

    const payload: Record<string, unknown> = {
      items,
      pickupDate: isoDate,
      numberOfPeople: fulfillment.numberOfPeople,
      eventType: fulfillment.eventType,
      specialInstructions: fulfillment.specialInstructions.trim() || null,
      fulfillmentType: fulfillment.fulfillmentType,
      locale,
      calculatedPrice: (cartItems[0] as CakeCartItem)?.calculatedPrice ?? undefined,
    };

    if (fulfillment.fulfillmentType === 'delivery' && fulfillment.address) {
      payload.deliveryAddress = fulfillment.address;
    }

    return payload;
  },

  getOrderSpecificFields: (
    _cartItems: CartItemUnion[],
    fulfillment: FulfillmentState,
    locale: string,
  ): Array<{ label: string; value: string }> => {
    const isFr = locale === 'fr';
    const fields: Array<{ label: string; value: string }> = [];

    if (fulfillment.numberOfPeople > 0) {
      fields.push({
        label: isFr ? 'Nombre de personnes' : 'Number of people',
        value: String(fulfillment.numberOfPeople),
      });
    }

    if (fulfillment.eventType) {
      fields.push({
        label: isFr ? 'Type d\'événement' : 'Event type',
        value: fulfillment.eventType,
      });
    }

    if (fulfillment.specialInstructions.trim()) {
      fields.push({
        label: isFr ? 'Instructions spéciales' : 'Special instructions',
        value: fulfillment.specialInstructions.trim(),
      });
    }

    return fields;
  },
};
