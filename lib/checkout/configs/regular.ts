// Regular order config for the hybrid checkout flow
// Requirements: 2.2, 3.2, 7.1

import type { OrderTypeConfig } from '../order-type-config';
import type { CartItemUnion, FulfillmentState, RegularCartItem } from '../types';

export const regularOrderConfig: OrderTypeConfig = {
  orderType: 'regular',

  // Regular orders are pickup only — no fulfillment toggle
  supportsFulfillmentToggle: false,

  // Dates come from the launch's pickupDate
  hasPresetDate: true,

  // Checkout API endpoint
  checkoutEndpoint: '/api/checkout',

  // Delivery is always disabled for regular orders
  isDeliveryDisabled: () => true,

  deliveryDisabledReason: (locale: string) =>
    locale === 'fr'
      ? 'Cueillette seulement pour les commandes de menu'
      : 'Pickup only for menu orders',

  // Regular orders use the launch's preset date; return today as fallback
  getEarliestDate: () => new Date(),

  // Disabled days are handled by launch config, not the order type
  getDisabledPickupDays: () => [],

  buildCheckoutPayload: (
    cartItems: CartItemUnion[],
    fulfillment: FulfillmentState,
    locale: string,
  ): Record<string, unknown> => {
    const items = (cartItems as RegularCartItem[]).map((item) => {
      const baseProductId = item.productId.includes('::')
        ? item.productId.split('::')[0]
        : item.productId;
      return {
        productId: baseProductId,
        productName: item.name,
        shopifyProductId: item.shopifyProductId || null,
        shopifyVariantId: item.shopifyVariantId || null,
        quantity: item.quantity,
        price: item.price,
      };
    });

    const payload: Record<string, unknown> = {
      items,
      launchId: (fulfillment as any).launchId ?? '',
      launchTitle: (fulfillment as any).launchTitle ?? '',
      pickupDate: fulfillment.date,
      pickupLocationName: (fulfillment as any).pickupLocationName ?? '',
      pickupLocationAddress: (fulfillment as any).pickupLocationAddress ?? '',
      locale,
    };

    if (fulfillment.pickupSlotId) {
      payload.pickupSlot = (fulfillment as any).pickupSlot ?? undefined;
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

    const menuName = (fulfillment as any).launchTitle;
    if (menuName) {
      fields.push({
        label: isFr ? 'Menu' : 'Menu',
        value: menuName,
      });
    }

    const locationName = (fulfillment as any).pickupLocationName;
    if (locationName) {
      fields.push({
        label: isFr ? 'Lieu de cueillette' : 'Pickup location',
        value: locationName,
      });
    }

    const pickupSlot = (fulfillment as any).pickupSlot;
    if (pickupSlot) {
      fields.push({
        label: isFr ? 'Créneau' : 'Pickup slot',
        value: `${pickupSlot.startTime} – ${pickupSlot.endTime}`,
      });
    }

    return fields;
  },
};
