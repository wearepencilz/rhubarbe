/**
 * @vitest-environment jsdom
 */

import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import VolumeOrderPageClient from './VolumeOrderPageClient';

// Mock useT hook
vi.mock('@/lib/i18n/useT', () => ({
  useT: vi.fn(() => ({ T: {}, locale: 'en' })),
}));

// Mock useLocale (used transitively)
vi.mock('@/contexts/LocaleContext', () => ({
  useLocale: vi.fn(() => ({ locale: 'en', setLocale: vi.fn() })),
}));

// Mock useTranslationOverrides (used transitively)
vi.mock('@/contexts/TranslationOverridesContext', () => ({
  useTranslationOverrides: vi.fn(() => ({})),
}));

import { useT } from '@/lib/i18n/useT';
const mockUseT = useT as ReturnType<typeof vi.fn>;

const sampleProducts = [
  {
    id: 'prod-1',
    name: 'Lunch Box',
    slug: 'lunch-box',
    image: '/img/lunch.jpg',
    price: 2500,
    volumeDescription: { en: 'Bulk lunch boxes', fr: 'Boîtes à lunch en gros' },
    volumeInstructions: { en: 'Order 2 days ahead', fr: '' },
    volumeMinOrderQuantity: 10,
    allergens: ['nuts'],
    leadTimeTiers: [{ minQuantity: 1, leadTimeDays: 2 }],
    variants: [
      { id: 'v1', label: { en: "Chef's Choice", fr: 'Choix du chef' }, shopifyVariantId: 'gid://1' },
      { id: 'v2', label: { en: 'Vegetarian', fr: '' }, shopifyVariantId: null },
    ],
  },
];

describe('VolumeOrderPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseT.mockReturnValue({ T: {}, locale: 'en' });
  });

  it('renders product name, description, variants, and min quantity in English', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleProducts),
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Lunch Box')).toBeDefined();
    });

    expect(screen.getByText('Bulk lunch boxes')).toBeDefined();
    expect(screen.getByText("Chef's Choice")).toBeDefined();
    expect(screen.getByText('Vegetarian')).toBeDefined();
    expect(screen.getByText(/Min\.\s*10\s*units/)).toBeDefined();
  });

  it('renders French translations and falls back to English when French is missing', async () => {
    mockUseT.mockReturnValue({ T: {}, locale: 'fr' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleProducts),
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Lunch Box')).toBeDefined();
    });

    // French description available → use it
    expect(screen.getByText('Boîtes à lunch en gros')).toBeDefined();
    // French variant label available → use it
    expect(screen.getByText('Choix du chef')).toBeDefined();
    // French variant label missing → fall back to English
    expect(screen.getByText('Vegetarian')).toBeDefined();
    // Min quantity label in French
    expect(screen.getByText(/Min\.\s*10\s*unités/)).toBeDefined();
  });

  it('shows empty state when no products are returned', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('No products available at this time.')).toBeDefined();
    });
  });

  it('shows error state on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load products. Please try again.')).toBeDefined();
    });
  });

  it('renders a quantity input for each variant', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleProducts),
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Lunch Box')).toBeDefined();
    });

    // Each variant should have a quantity input
    expect(screen.getByLabelText("Chef's Choice quantity")).toBeDefined();
    expect(screen.getByLabelText('Vegetarian quantity')).toBeDefined();
  });

  it('disables add-to-order button when total quantity is below minimum', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleProducts),
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Lunch Box')).toBeDefined();
    });

    const addButton = screen.getByRole('button', { name: /add to order/i });
    expect(addButton).toBeDisabled();
  });

  it('enables add-to-order button when total quantity meets minimum', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleProducts),
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Lunch Box')).toBeDefined();
    });

    const input1 = screen.getByLabelText("Chef's Choice quantity");
    const input2 = screen.getByLabelText('Vegetarian quantity');

    // Set quantities that sum to >= 10 (the min)
    fireEvent.change(input1, { target: { value: '6' } });
    fireEvent.change(input2, { target: { value: '4' } });

    const addButton = screen.getByRole('button', { name: /add to order/i });
    expect(addButton).not.toBeDisabled();
  });

  it('shows bilingual minimum quantity warning when total is below min and > 0', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleProducts),
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Lunch Box')).toBeDefined();
    });

    const input1 = screen.getByLabelText("Chef's Choice quantity");
    fireEvent.change(input1, { target: { value: '3' } });

    // Warning should appear (English)
    expect(screen.getByText(/Minimum 10 units required \(current total: 3\)/)).toBeDefined();
  });

  it('shows French minimum quantity warning when locale is fr', async () => {
    mockUseT.mockReturnValue({ T: {}, locale: 'fr' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleProducts),
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Lunch Box')).toBeDefined();
    });

    const input1 = screen.getByLabelText('Choix du chef quantity');
    fireEvent.change(input1, { target: { value: '5' } });

    // Warning should appear (French)
    expect(screen.getByText(/Minimum 10 unités requis \(total actuel : 5\)/)).toBeDefined();
  });

  it('does not show warning when all quantities are zero', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleProducts),
    });

    render(<VolumeOrderPageClient />);

    await waitFor(() => {
      expect(screen.getByText('Lunch Box')).toBeDefined();
    });

    // No warning when total is 0
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
