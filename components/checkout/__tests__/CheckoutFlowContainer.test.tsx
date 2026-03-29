import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { RegularCartItem, VolumeCartItem } from '@/lib/checkout/types';

// @vitest-environment jsdom

// Set up a proper localStorage before any component imports
const storageStore: Record<string, string> = {};
const storageMock = {
  getItem: (key: string): string | null => storageStore[key] ?? null,
  setItem: (key: string, val: string) => { storageStore[key] = val; },
  removeItem: (key: string) => { delete storageStore[key]; },
  clear: () => { for (const k of Object.keys(storageStore)) delete storageStore[k]; },
  get length() { return Object.keys(storageStore).length; },
  key: (i: number) => Object.keys(storageStore)[i] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', { value: storageMock, configurable: true });

const mockReplace = vi.fn();
const mockRouter = { replace: mockReplace, push: vi.fn(), back: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/contexts/LocaleContext', () => ({
  useLocale: () => ({ locale: 'en', setLocale: vi.fn() }),
}));

vi.mock('../FulfillmentStep', () => ({
  __esModule: true,
  default: ({ onNext }: any) => (
    <div data-testid="fulfillment-step">
      <button onClick={onNext}>Continue to Review</button>
    </div>
  ),
}));

vi.mock('../ReviewStep', () => ({
  __esModule: true,
  default: ({ onBack }: any) => (
    <div data-testid="review-step">
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock('../OrderReviewSummary', () => ({
  __esModule: true,
  default: ({ cartItems }: any) => (
    <div data-testid="order-summary">
      {cartItems.map((item: any, i: number) => (
        <span key={i}>{item.name || item.productName}</span>
      ))}
    </div>
  ),
}));

// Import useState before mocking
import { useState as reactUseState } from 'react';

vi.mock('@/lib/hooks/use-persisted-state', () => ({
  usePersistedState: (_key: string, initial: any) => reactUseState(initial),
}));

import CheckoutFlowContainer from '../CheckoutFlowContainer';

const regularItem: RegularCartItem = {
  productId: 'p1', variantId: 'v1', variantLabel: 'Large', name: 'Croissant',
  price: 500, quantity: 2, image: null, shopifyVariantId: null, allergens: [],
};

const volumeItem: VolumeCartItem = {
  variantId: 'v1', variantLabel: '12-pack', productId: 'vp1', productName: 'Brioche',
  shopifyProductId: null, shopifyVariantId: 'sv1', quantity: 12, price: 300, allergens: [],
};

describe('CheckoutFlowContainer', () => {
  beforeEach(() => {
    storageMock.clear();
    mockReplace.mockClear();
  });

  it('redirects to /order when regular cart is missing', () => {
    render(<CheckoutFlowContainer orderType="regular" />);
    expect(mockReplace).toHaveBeenCalledWith('/order');
  });

  it('redirects to /volume-order when volume cart is missing', () => {
    render(<CheckoutFlowContainer orderType="volume" />);
    expect(mockReplace).toHaveBeenCalledWith('/volume-order');
  });

  it('redirects to /cake-order when cake cart is missing', () => {
    render(<CheckoutFlowContainer orderType="cake" />);
    expect(mockReplace).toHaveBeenCalledWith('/cake-order');
  });

  it('renders fulfillment step when regular cart has items', () => {
    storageMock.setItem('rhubarbe:order:cart', JSON.stringify([regularItem]));
    render(<CheckoutFlowContainer orderType="regular" />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('Step 1 — Fulfillment')).toBeDefined();
    expect(screen.getByTestId('fulfillment-step')).toBeDefined();
  });

  it('parses volume cart from Map entries format', () => {
    storageMock.setItem('rhubarbe:volume:cart', JSON.stringify([['v1', volumeItem]]));
    render(<CheckoutFlowContainer orderType="volume" />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByTestId('fulfillment-step')).toBeDefined();
  });

  it('navigates to review step when onNext is called', () => {
    storageMock.setItem('rhubarbe:order:cart', JSON.stringify([regularItem]));
    render(<CheckoutFlowContainer orderType="regular" />);
    fireEvent.click(screen.getByText('Continue to Review'));
    expect(screen.getByText('Step 2 — Review')).toBeDefined();
    expect(screen.getByTestId('review-step')).toBeDefined();
  });

  it('navigates back to fulfillment from review', () => {
    storageMock.setItem('rhubarbe:order:cart', JSON.stringify([regularItem]));
    render(<CheckoutFlowContainer orderType="regular" />);
    fireEvent.click(screen.getByText('Continue to Review'));
    expect(screen.getByTestId('review-step')).toBeDefined();
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Step 1 — Fulfillment')).toBeDefined();
  });

  it('renders sidebar with responsive classes', () => {
    storageMock.setItem('rhubarbe:order:cart', JSON.stringify([regularItem]));
    const { container } = render(<CheckoutFlowContainer orderType="regular" />);
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside!.className).toContain('hidden');
    expect(aside!.className).toContain('md:block');
  });

  it('renders cart items in sidebar summary', () => {
    storageMock.setItem('rhubarbe:order:cart', JSON.stringify([regularItem]));
    render(<CheckoutFlowContainer orderType="regular" />);
    expect(screen.getByTestId('order-summary')).toBeDefined();
    expect(screen.getByText('Croissant')).toBeDefined();
  });
});
