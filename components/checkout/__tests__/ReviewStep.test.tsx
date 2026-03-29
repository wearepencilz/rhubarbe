import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewStep from '../ReviewStep';
import type { OrderTypeConfig } from '@/lib/checkout/order-type-config';
import type { FulfillmentState, RegularCartItem } from '@/lib/checkout/types';

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
    buildCheckoutPayload: () => ({ items: [] }),
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

const cartItem: RegularCartItem = {
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

describe('ReviewStep', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders OrderReviewSummary with cart items', () => {
    render(
      <ReviewStep
        config={makeConfig()}
        cartItems={[cartItem]}
        fulfillment={makeFulfillment()}
        onBack={vi.fn()}
        locale="en"
      />,
    );
    expect(screen.getByText('Croissant')).toBeDefined();
  });

  it('renders Proceed to Payment and Back buttons in English', () => {
    render(
      <ReviewStep
        config={makeConfig()}
        cartItems={[cartItem]}
        fulfillment={makeFulfillment()}
        onBack={vi.fn()}
        locale="en"
      />,
    );
    expect(screen.getByText('Proceed to Payment')).toBeDefined();
    expect(screen.getByText('Back')).toBeDefined();
  });

  it('renders French labels when locale is fr', () => {
    render(
      <ReviewStep
        config={makeConfig()}
        cartItems={[cartItem]}
        fulfillment={makeFulfillment()}
        onBack={vi.fn()}
        locale="fr"
      />,
    );
    expect(screen.getByText('Procéder au paiement')).toBeDefined();
    expect(screen.getByText('Retour')).toBeDefined();
  });

  it('calls onBack when Back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <ReviewStep
        config={makeConfig()}
        cartItems={[cartItem]}
        fulfillment={makeFulfillment()}
        onBack={onBack}
        locale="en"
      />,
    );
    fireEvent.click(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows loading state and disables button during checkout', async () => {
    // Never-resolving fetch to keep loading state active
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}));

    render(
      <ReviewStep
        config={makeConfig()}
        cartItems={[cartItem]}
        fulfillment={makeFulfillment()}
        onBack={vi.fn()}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByText('Proceed to Payment'));

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeDefined();
    });

    const paymentBtn = screen.getByText('Processing...').closest('button')!;
    expect(paymentBtn.disabled).toBe(true);
  });

  it('shows error message on API failure and stays on page', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Cart creation failed' }), { status: 500 }),
    );

    render(
      <ReviewStep
        config={makeConfig()}
        cartItems={[cartItem]}
        fulfillment={makeFulfillment()}
        onBack={vi.fn()}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByText('Proceed to Payment'));

    await waitFor(() => {
      expect(screen.getByText('Cart creation failed')).toBeDefined();
    });
  });

  it('shows generic error on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(
      <ReviewStep
        config={makeConfig()}
        cartItems={[cartItem]}
        fulfillment={makeFulfillment()}
        onBack={vi.fn()}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByText('Proceed to Payment'));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeDefined();
    });
  });

  it('shows French generic error on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(
      <ReviewStep
        config={makeConfig()}
        cartItems={[cartItem]}
        fulfillment={makeFulfillment()}
        onBack={vi.fn()}
        locale="fr"
      />,
    );

    fireEvent.click(screen.getByText('Procéder au paiement'));

    await waitFor(() => {
      expect(screen.getByText('Une erreur est survenue. Veuillez réessayer.')).toBeDefined();
    });
  });

  it('does not show error on successful checkout', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ checkoutUrl: 'https://shopify.com/checkout/123' }), { status: 200 }),
    );

    render(
      <ReviewStep
        config={makeConfig()}
        cartItems={[cartItem]}
        fulfillment={makeFulfillment()}
        onBack={vi.fn()}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByText('Proceed to Payment'));

    // Wait for the fetch to resolve — the component will try to redirect
    // which throws in jsdom, but the error message should NOT be the API error
    await waitFor(() => {
      // The button should show loading or revert — no API error message
      const errorEl = screen.queryByText('Cart creation failed');
      expect(errorEl).toBeNull();
    });
  });

  it('calls buildCheckoutPayload with correct args and POSTs to checkoutEndpoint', async () => {
    const buildCheckoutPayload = vi.fn().mockReturnValue({ items: ['test'] });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ checkoutUrl: 'https://shopify.com/checkout/123' }), { status: 200 }),
    );

    const fulfillment = makeFulfillment();

    render(
      <ReviewStep
        config={makeConfig({ checkoutEndpoint: '/api/checkout/volume', buildCheckoutPayload })}
        cartItems={[cartItem]}
        fulfillment={fulfillment}
        onBack={vi.fn()}
        locale="en"
      />,
    );

    fireEvent.click(screen.getByText('Proceed to Payment'));

    await waitFor(() => {
      expect(buildCheckoutPayload).toHaveBeenCalledWith([cartItem], fulfillment, 'en');
      expect(fetchSpy).toHaveBeenCalledWith('/api/checkout/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: ['test'] }),
      });
    });
  });
});
