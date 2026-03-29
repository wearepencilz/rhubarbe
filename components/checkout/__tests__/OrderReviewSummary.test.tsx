import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderReviewSummary from '../OrderReviewSummary';
import type { OrderTypeConfig } from '@/lib/checkout/order-type-config';
import type { FulfillmentState, RegularCartItem, VolumeCartItem, CakeCartItem } from '@/lib/checkout/types';

// @vitest-environment jsdom

function makeConfig(overrides: Partial<OrderTypeConfig> = {}): OrderTypeConfig {
  return {
    orderType: 'regular',
    supportsFulfillmentToggle: false,
    isDeliveryDisabled: () => true,
    deliveryDisabledReason: () => '',
    getEarliestDate: () => new Date(),
    getDisabledPickupDays: () => [],
    hasPresetDate: true,
    checkoutEndpoint: '/api/checkout',
    buildCheckoutPayload: () => ({}),
    getOrderSpecificFields: () => [],
    ...overrides,
  };
}

function makeFulfillment(overrides: Partial<FulfillmentState> = {}): FulfillmentState {
  return {
    fulfillmentType: 'pickup',
    date: '2025-03-15',
    pickupSlotId: null,
    pickupDay: null,
    address: { street: '', city: '', province: '', postalCode: '' },
    allergenNote: '',
    eventType: '',
    specialInstructions: '',
    numberOfPeople: 0,
    ...overrides,
  };
}

const regularItem: RegularCartItem = {
  productId: 'p1',
  variantId: 'v1',
  variantLabel: 'Large',
  name: 'Croissant',
  price: 500,
  quantity: 2,
  image: null,
  shopifyVariantId: null,
  allergens: [],
};

const volumeItem: VolumeCartItem = {
  variantId: 'vv1',
  variantLabel: '12 pack',
  productId: 'vp1',
  productName: 'Mini Quiche',
  shopifyProductId: null,
  shopifyVariantId: 'sv1',
  quantity: 3,
  price: 2400,
  allergens: [],
};

const cakeItem: CakeCartItem = {
  productId: 'cp1',
  productName: 'Chocolate Cake',
  shopifyProductId: null,
  shopifyVariantId: 'sc1',
  numberOfPeople: 10,
  calculatedPrice: 4500,
  image: null,
  allergens: [],
};

describe('OrderReviewSummary', () => {
  it('renders cart item name, variant, quantity, and line price', () => {
    render(
      <OrderReviewSummary
        config={makeConfig()}
        cartItems={[regularItem]}
        fulfillment={makeFulfillment()}
        locale="en"
      />,
    );
    expect(screen.getByText('Croissant')).toBeDefined();
    expect(screen.getByText('— Large')).toBeDefined();
    expect(screen.getByText('×2')).toBeDefined();
    // Price appears both as line price and subtotal (single item)
    expect(screen.getAllByText('$10.00').length).toBeGreaterThanOrEqual(1);
  });

  it('renders subtotal for multiple items', () => {
    render(
      <OrderReviewSummary
        config={makeConfig()}
        cartItems={[regularItem, { ...regularItem, name: 'Baguette', price: 300, quantity: 1 }]}
        fulfillment={makeFulfillment()}
        locale="en"
      />,
    );
    // 500*2 + 300*1 = 1300 cents = $13.00
    expect(screen.getByText('$13.00')).toBeDefined();
  });

  it('renders fulfillment method as Pickup in English', () => {
    render(
      <OrderReviewSummary
        config={makeConfig()}
        cartItems={[regularItem]}
        fulfillment={makeFulfillment({ fulfillmentType: 'pickup' })}
        locale="en"
      />,
    );
    expect(screen.getByText('Pickup')).toBeDefined();
  });

  it('renders fulfillment method as Livraison in French', () => {
    render(
      <OrderReviewSummary
        config={makeConfig()}
        cartItems={[regularItem]}
        fulfillment={makeFulfillment({ fulfillmentType: 'delivery' })}
        locale="fr"
      />,
    );
    // "Livraison" appears as both the section header and the method value
    expect(screen.getAllByText('Livraison').length).toBeGreaterThanOrEqual(2);
  });

  it('renders formatted date', () => {
    render(
      <OrderReviewSummary
        config={makeConfig()}
        cartItems={[regularItem]}
        fulfillment={makeFulfillment({ date: '2025-03-15' })}
        locale="en"
      />,
    );
    expect(screen.getByText('March 15, 2025')).toBeDefined();
  });

  it('renders pickup slot for regular orders', () => {
    const fulfillment = {
      ...makeFulfillment(),
      pickupSlot: { startTime: '10:00', endTime: '12:00' },
    };
    render(
      <OrderReviewSummary
        config={makeConfig({ orderType: 'regular' })}
        cartItems={[regularItem]}
        fulfillment={fulfillment as any}
        locale="en"
      />,
    );
    expect(screen.getByText('10:00 – 12:00')).toBeDefined();
  });

  it('renders delivery address when fulfillment is delivery', () => {
    render(
      <OrderReviewSummary
        config={makeConfig()}
        cartItems={[regularItem]}
        fulfillment={makeFulfillment({
          fulfillmentType: 'delivery',
          address: { street: '123 Main St', city: 'Montreal', province: 'QC', postalCode: 'H2X 1Y4' },
        })}
        locale="en"
      />,
    );
    expect(screen.getByText('123 Main St')).toBeDefined();
    expect(screen.getByText('Montreal, QC H2X 1Y4')).toBeDefined();
  });

  it('renders order-type-specific fields from config', () => {
    const config = makeConfig({
      getOrderSpecificFields: () => [
        { label: 'Allergen note', value: 'No nuts' },
        { label: 'Serves estimate', value: 'Approx. 20 people' },
      ],
    });
    render(
      <OrderReviewSummary
        config={config}
        cartItems={[volumeItem]}
        fulfillment={makeFulfillment()}
        locale="en"
      />,
    );
    expect(screen.getByText('Allergen note')).toBeDefined();
    expect(screen.getByText('No nuts')).toBeDefined();
    expect(screen.getByText('Serves estimate')).toBeDefined();
    expect(screen.getByText('Approx. 20 people')).toBeDefined();
  });

  it('renders volume item with productName and variantLabel', () => {
    render(
      <OrderReviewSummary
        config={makeConfig({ orderType: 'volume' })}
        cartItems={[volumeItem]}
        fulfillment={makeFulfillment()}
        locale="en"
      />,
    );
    expect(screen.getByText('Mini Quiche')).toBeDefined();
    expect(screen.getByText('— 12 pack')).toBeDefined();
    expect(screen.getByText('×3')).toBeDefined();
  });

  it('renders cake item with calculatedPrice and no variant', () => {
    render(
      <OrderReviewSummary
        config={makeConfig({ orderType: 'cake' })}
        cartItems={[cakeItem]}
        fulfillment={makeFulfillment()}
        locale="en"
      />,
    );
    expect(screen.getByText('Chocolate Cake')).toBeDefined();
    // Price appears both as line price and subtotal (single item)
    expect(screen.getAllByText('$45.00').length).toBeGreaterThanOrEqual(1);
  });

  it('renders French labels when locale is fr', () => {
    render(
      <OrderReviewSummary
        config={makeConfig()}
        cartItems={[regularItem]}
        fulfillment={makeFulfillment()}
        locale="fr"
      />,
    );
    expect(screen.getByText('Articles')).toBeDefined();
    expect(screen.getByText('Sous-total')).toBeDefined();
  });
});
