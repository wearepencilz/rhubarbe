// OrderTypeConfig strategy interface for the hybrid checkout flow
// Requirements: 2.1, 2.2, 2.3, 2.4, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3

import type { CartItemUnion, FulfillmentState } from './types';

export interface OrderTypeConfig {
  orderType: 'regular' | 'volume' | 'cake';

  // Fulfillment constraints
  supportsFulfillmentToggle: boolean;
  isDeliveryDisabled: (cartItems: CartItemUnion[]) => boolean;
  deliveryDisabledReason: (locale: string) => string;

  // Date constraints
  getEarliestDate: (cartItems: CartItemUnion[]) => Date;
  getDisabledPickupDays: () => number[];
  hasPresetDate: boolean;

  // Checkout API
  checkoutEndpoint: string;
  buildCheckoutPayload: (
    cartItems: CartItemUnion[],
    fulfillment: FulfillmentState,
    locale: string,
  ) => Record<string, unknown>;

  // Review display
  getOrderSpecificFields: (
    cartItems: CartItemUnion[],
    fulfillment: FulfillmentState,
    locale: string,
  ) => Array<{ label: string; value: string }>;
}
