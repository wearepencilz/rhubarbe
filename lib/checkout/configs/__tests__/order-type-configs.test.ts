import { describe, it, expect } from 'vitest';
import { regularOrderConfig } from '../regular';
import { volumeOrderConfig } from '../volume';
import { cakeOrderConfig } from '../cake';
import type {
  RegularCartItem,
  VolumeCartItem,
  CakeCartItem,
  FulfillmentState,
} from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function makeRegularItem(overrides: Partial<RegularCartItem> = {}): RegularCartItem {
  return {
    productId: 'prod-1',
    variantId: 'var-1',
    variantLabel: 'Classic',
    name: 'Rhubarb Pie',
    price: 1200,
    quantity: 2,
    image: null,
    shopifyVariantId: 'gid://shopify/ProductVariant/1',
    allergens: [],
    ...overrides,
  };
}

function makeVolumeItem(
  overrides: Partial<VolumeCartItem & { pickupOnly?: boolean; leadTimeTiers?: any[]; servesPerUnit?: number }> = {},
): VolumeCartItem & { pickupOnly?: boolean; leadTimeTiers?: any[]; servesPerUnit?: number } {
  return {
    variantId: 'v-1',
    variantLabel: 'Box of 12',
    productId: 'vp-1',
    productName: 'Croissants',
    shopifyProductId: 'gid://shopify/Product/1',
    shopifyVariantId: 'gid://shopify/ProductVariant/10',
    quantity: 5,
    price: 4800,
    allergens: [],
    ...overrides,
  };
}

function makeCakeItem(
  overrides: Partial<CakeCartItem & { cakeDeliveryAvailable?: boolean; leadTimeTiers?: any[] }> = {},
): CakeCartItem & { cakeDeliveryAvailable?: boolean; leadTimeTiers?: any[] } {
  return {
    productId: 'cake-1',
    productName: 'Chocolate Cake',
    shopifyProductId: 'gid://shopify/Product/2',
    shopifyVariantId: 'gid://shopify/ProductVariant/20',
    numberOfPeople: 10,
    calculatedPrice: 5500,
    image: null,
    allergens: [],
    ...overrides,
  };
}


// ===========================================================================
// regularOrderConfig
// ===========================================================================

describe('regularOrderConfig', () => {
  const config = regularOrderConfig;

  it('has orderType "regular"', () => {
    expect(config.orderType).toBe('regular');
  });

  it('supportsFulfillmentToggle is false', () => {
    expect(config.supportsFulfillmentToggle).toBe(false);
  });

  it('isDeliveryDisabled always returns true', () => {
    expect(config.isDeliveryDisabled([])).toBe(true);
    expect(config.isDeliveryDisabled([makeRegularItem()])).toBe(true);
  });

  it('hasPresetDate is true', () => {
    expect(config.hasPresetDate).toBe(true);
  });

  it('checkoutEndpoint is /api/checkout', () => {
    expect(config.checkoutEndpoint).toBe('/api/checkout');
  });

  it('buildCheckoutPayload returns correct shape with items, launchId, launchTitle, pickupDate, locale', () => {
    const items = [makeRegularItem(), makeRegularItem({ productId: 'prod-2', name: 'Tart' })];
    const fulfillment = makeFulfillment({
      date: '2025-04-01',
      pickupSlotId: null,
    });
    // Attach launch info the way the container would
    (fulfillment as any).launchId = 'launch-42';
    (fulfillment as any).launchTitle = 'Spring Menu';
    (fulfillment as any).pickupLocationName = 'Main Shop';
    (fulfillment as any).pickupLocationAddress = '123 Rue Principale';

    const payload = config.buildCheckoutPayload(items, fulfillment, 'en');

    expect(payload).toHaveProperty('items');
    expect(Array.isArray(payload.items)).toBe(true);
    expect((payload.items as any[]).length).toBe(2);
    expect(payload.launchId).toBe('launch-42');
    expect(payload.launchTitle).toBe('Spring Menu');
    expect(payload.pickupDate).toBe('2025-04-01');
    expect(payload.locale).toBe('en');
    expect(payload.pickupLocationName).toBe('Main Shop');
    expect(payload.pickupLocationAddress).toBe('123 Rue Principale');
  });

  it('buildCheckoutPayload includes pickupSlot when pickupSlotId is set', () => {
    const fulfillment = makeFulfillment({ pickupSlotId: 'slot-1' });
    (fulfillment as any).launchId = 'l1';
    (fulfillment as any).launchTitle = 'Menu';
    (fulfillment as any).pickupSlot = { startTime: '10:00', endTime: '11:00' };

    const payload = config.buildCheckoutPayload([makeRegularItem()], fulfillment, 'fr');
    expect(payload.pickupSlot).toEqual({ startTime: '10:00', endTime: '11:00' });
  });

  it('buildCheckoutPayload strips composite productId (id::variant)', () => {
    const item = makeRegularItem({ productId: 'prod-1::var-1' });
    const fulfillment = makeFulfillment();
    const payload = config.buildCheckoutPayload([item], fulfillment, 'en');
    const mapped = (payload.items as any[])[0];
    expect(mapped.productId).toBe('prod-1');
  });
});


// ===========================================================================
// volumeOrderConfig
// ===========================================================================

describe('volumeOrderConfig', () => {
  const config = volumeOrderConfig;

  it('has orderType "volume"', () => {
    expect(config.orderType).toBe('volume');
  });

  it('supportsFulfillmentToggle is true', () => {
    expect(config.supportsFulfillmentToggle).toBe(true);
  });

  it('checkoutEndpoint is /api/checkout/volume', () => {
    expect(config.checkoutEndpoint).toBe('/api/checkout/volume');
  });

  // --- isDeliveryDisabled (Req 2.3) ---

  it('isDeliveryDisabled returns true when any item has pickupOnly=true', () => {
    const items = [
      makeVolumeItem({ pickupOnly: false }),
      makeVolumeItem({ pickupOnly: true }),
    ];
    expect(config.isDeliveryDisabled(items)).toBe(true);
  });

  it('isDeliveryDisabled returns false when no items have pickupOnly=true', () => {
    const items = [
      makeVolumeItem({ pickupOnly: false }),
      makeVolumeItem(), // pickupOnly undefined
    ];
    expect(config.isDeliveryDisabled(items)).toBe(false);
  });

  it('isDeliveryDisabled returns false for empty cart', () => {
    expect(config.isDeliveryDisabled([])).toBe(false);
  });

  // --- getEarliestDate (Req 3.3) ---

  it('getEarliestDate returns today when cart is empty', () => {
    const result = config.getEarliestDate([]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(result.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  it('getEarliestDate computes correct date based on lead time tiers and quantity', () => {
    const tiers = [
      { minQuantity: 1, leadTimeDays: 3 },
      { minQuantity: 10, leadTimeDays: 5 },
      { minQuantity: 50, leadTimeDays: 10 },
    ];
    // quantity=12 → matches tier minQuantity=10 → 5 days
    const item = makeVolumeItem({ quantity: 12, leadTimeTiers: tiers });
    const result = config.getEarliestDate([item]);

    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expected.setDate(expected.getDate() + 5);

    expect(result.toISOString().slice(0, 10)).toBe(expected.toISOString().slice(0, 10));
  });

  it('getEarliestDate picks the max lead time across multiple items', () => {
    const item1 = makeVolumeItem({
      quantity: 5,
      leadTimeTiers: [{ minQuantity: 1, leadTimeDays: 2 }],
    });
    const item2 = makeVolumeItem({
      quantity: 5,
      leadTimeTiers: [{ minQuantity: 1, leadTimeDays: 7 }],
    });
    const result = config.getEarliestDate([item1, item2]);

    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expected.setDate(expected.getDate() + 7);

    expect(result.toISOString().slice(0, 10)).toBe(expected.toISOString().slice(0, 10));
  });

  // --- buildCheckoutPayload (Req 7.2) ---

  it('buildCheckoutPayload returns correct shape with items, fulfillmentDate, fulfillmentType, allergenNote, locale', () => {
    const items = [makeVolumeItem()];
    const fulfillment = makeFulfillment({
      fulfillmentType: 'delivery',
      date: '2025-06-01',
      allergenNote: 'No nuts',
    });

    const payload = config.buildCheckoutPayload(items, fulfillment, 'en');

    expect(payload.fulfillmentDate).toBe('2025-06-01T00:00:00');
    expect(payload.fulfillmentType).toBe('delivery');
    expect(payload.allergenNote).toBe('No nuts');
    expect(payload.locale).toBe('en');
    expect(Array.isArray(payload.items)).toBe(true);

    const mapped = (payload.items as any[])[0];
    expect(mapped).toHaveProperty('productId');
    expect(mapped).toHaveProperty('productName');
    expect(mapped).toHaveProperty('shopifyVariantId');
    expect(mapped).toHaveProperty('quantity');
    expect(mapped).toHaveProperty('price');
  });

  it('buildCheckoutPayload trims allergenNote and returns null when empty', () => {
    const payload = config.buildCheckoutPayload(
      [makeVolumeItem()],
      makeFulfillment({ allergenNote: '   ' }),
      'en',
    );
    expect(payload.allergenNote).toBeNull();
  });

  it('buildCheckoutPayload includes deliveryAddress when fulfillmentType is delivery', () => {
    const address = { street: '123 Main St', city: 'Montreal', province: 'QC', postalCode: 'H2X 1Y4' };
    const fulfillment = makeFulfillment({
      fulfillmentType: 'delivery',
      date: '2025-06-01',
      address,
    });
    const payload = config.buildCheckoutPayload([makeVolumeItem()], fulfillment, 'en');
    expect(payload.deliveryAddress).toEqual(address);
  });

  it('buildCheckoutPayload omits deliveryAddress when fulfillmentType is pickup', () => {
    const fulfillment = makeFulfillment({
      fulfillmentType: 'pickup',
      date: '2025-06-01',
      address: { street: '123 Main St', city: 'Montreal', province: 'QC', postalCode: 'H2X 1Y4' },
    });
    const payload = config.buildCheckoutPayload([makeVolumeItem()], fulfillment, 'en');
    expect(payload.deliveryAddress).toBeUndefined();
  });
});


// ===========================================================================
// cakeOrderConfig
// ===========================================================================

describe('cakeOrderConfig', () => {
  const config = cakeOrderConfig;

  it('has orderType "cake"', () => {
    expect(config.orderType).toBe('cake');
  });

  it('supportsFulfillmentToggle is true', () => {
    expect(config.supportsFulfillmentToggle).toBe(true);
  });

  it('checkoutEndpoint is /api/checkout/cake', () => {
    expect(config.checkoutEndpoint).toBe('/api/checkout/cake');
  });

  // --- isDeliveryDisabled (Req 2.4) ---

  it('isDeliveryDisabled returns true when item has cakeDeliveryAvailable=false', () => {
    const items = [makeCakeItem({ cakeDeliveryAvailable: false })];
    expect(config.isDeliveryDisabled(items)).toBe(true);
  });

  it('isDeliveryDisabled returns false when item has cakeDeliveryAvailable=true', () => {
    const items = [makeCakeItem({ cakeDeliveryAvailable: true })];
    expect(config.isDeliveryDisabled(items)).toBe(false);
  });

  it('isDeliveryDisabled returns false when cakeDeliveryAvailable is not set', () => {
    const items = [makeCakeItem()]; // no cakeDeliveryAvailable property
    expect(config.isDeliveryDisabled(items)).toBe(false);
  });

  // --- getEarliestDate (Req 3.4) ---

  it('getEarliestDate returns today when cart is empty', () => {
    const result = config.getEarliestDate([]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(result.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  it('getEarliestDate computes correct date based on lead time tiers and numberOfPeople', () => {
    const tiers = [
      { minPeople: 1, leadTimeDays: 3 },
      { minPeople: 10, leadTimeDays: 5 },
      { minPeople: 30, leadTimeDays: 10 },
    ];
    // numberOfPeople=15 → matches tier minPeople=10 → 5 days
    const item = makeCakeItem({ numberOfPeople: 15, leadTimeTiers: tiers });
    const result = config.getEarliestDate([item]);

    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expected.setDate(expected.getDate() + 5);

    expect(result.toISOString().slice(0, 10)).toBe(expected.toISOString().slice(0, 10));
  });

  it('getEarliestDate uses highest applicable tier', () => {
    const tiers = [
      { minPeople: 1, leadTimeDays: 2 },
      { minPeople: 20, leadTimeDays: 7 },
      { minPeople: 50, leadTimeDays: 14 },
    ];
    // numberOfPeople=50 → matches all tiers, picks minPeople=50 → 14 days
    const item = makeCakeItem({ numberOfPeople: 50, leadTimeTiers: tiers });
    const result = config.getEarliestDate([item]);

    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expected.setDate(expected.getDate() + 14);

    expect(result.toISOString().slice(0, 10)).toBe(expected.toISOString().slice(0, 10));
  });

  // --- buildCheckoutPayload (Req 7.3) ---

  it('buildCheckoutPayload returns correct shape with items, pickupDate, numberOfPeople, eventType, specialInstructions, fulfillmentType, locale', () => {
    const items = [makeCakeItem({ calculatedPrice: 7500 })];
    const fulfillment = makeFulfillment({
      fulfillmentType: 'pickup',
      date: '2025-07-10',
      numberOfPeople: 20,
      eventType: 'Birthday',
      specialInstructions: 'Write "Happy Birthday" on top',
    });

    const payload = config.buildCheckoutPayload(items, fulfillment, 'fr');

    expect(payload.pickupDate).toBe('2025-07-10T00:00:00');
    expect(payload.numberOfPeople).toBe(20);
    expect(payload.eventType).toBe('Birthday');
    expect(payload.specialInstructions).toBe('Write "Happy Birthday" on top');
    expect(payload.fulfillmentType).toBe('pickup');
    expect(payload.locale).toBe('fr');
    expect(payload.calculatedPrice).toBe(7500);
    expect(Array.isArray(payload.items)).toBe(true);

    const mapped = (payload.items as any[])[0];
    expect(mapped).toHaveProperty('productId');
    expect(mapped).toHaveProperty('productName');
    expect(mapped).toHaveProperty('shopifyVariantId');
    expect(mapped).toHaveProperty('price', 7500);
  });

  it('buildCheckoutPayload trims specialInstructions and returns null when empty', () => {
    const payload = config.buildCheckoutPayload(
      [makeCakeItem()],
      makeFulfillment({ specialInstructions: '   ' }),
      'en',
    );
    expect(payload.specialInstructions).toBeNull();
  });

  it('buildCheckoutPayload includes deliveryAddress when fulfillmentType is delivery', () => {
    const address = { street: '456 Oak Ave', city: 'Laval', province: 'QC', postalCode: 'H7N 3B2' };
    const fulfillment = makeFulfillment({
      fulfillmentType: 'delivery',
      date: '2025-07-10',
      numberOfPeople: 10,
      eventType: 'Birthday',
      address,
    });
    const payload = config.buildCheckoutPayload([makeCakeItem()], fulfillment, 'en');
    expect(payload.deliveryAddress).toEqual(address);
  });

  it('buildCheckoutPayload omits deliveryAddress when fulfillmentType is pickup', () => {
    const fulfillment = makeFulfillment({
      fulfillmentType: 'pickup',
      date: '2025-07-10',
      address: { street: '456 Oak Ave', city: 'Laval', province: 'QC', postalCode: 'H7N 3B2' },
    });
    const payload = config.buildCheckoutPayload([makeCakeItem()], fulfillment, 'en');
    expect(payload.deliveryAddress).toBeUndefined();
  });
});
