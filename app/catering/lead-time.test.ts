import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Unit tests for lead time calculation logic used in the volume order storefront.
 *
 * The functions under test are pure helpers defined in VolumeOrderPageClient.tsx.
 * We replicate them here to test in isolation (same pattern as volume-products.test.ts).
 *
 * Validates: Requirements 2.7, 2.8
 */

// ── Replicated pure logic from VolumeOrderPageClient.tsx ──

interface LeadTimeTier {
  minQuantity: number;
  leadTimeDays: number;
}

/** Find the applicable lead time in days for a given total quantity. */
function getLeadTimeDays(tiers: LeadTimeTier[], totalQuantity: number): number {
  const applicable = tiers
    .filter((t) => t.minQuantity <= totalQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity);
  return applicable[0]?.leadTimeDays ?? 0;
}

/** Compute the earliest fulfillment date given a lead time in days. */
function getEarliestDate(leadTimeDays: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + leadTimeDays);
  return date;
}

// ── Standard tier set used across tests ──

const standardTiers: LeadTimeTier[] = [
  { minQuantity: 1, leadTimeDays: 2 },
  { minQuantity: 11, leadTimeDays: 4 },
  { minQuantity: 41, leadTimeDays: 7 },
];

// ── Tests ──

describe('getLeadTimeDays – correct tier selection', () => {
  it('selects the first tier for a quantity at its lower bound', () => {
    expect(getLeadTimeDays(standardTiers, 1)).toBe(2);
  });

  it('selects the first tier for a quantity within its range', () => {
    expect(getLeadTimeDays(standardTiers, 5)).toBe(2);
  });

  it('selects the first tier for a quantity at the upper edge of its range', () => {
    expect(getLeadTimeDays(standardTiers, 10)).toBe(2);
  });

  it('selects the second tier when quantity equals its minQuantity', () => {
    expect(getLeadTimeDays(standardTiers, 11)).toBe(4);
  });

  it('selects the second tier for a quantity within its range', () => {
    expect(getLeadTimeDays(standardTiers, 25)).toBe(4);
  });

  it('selects the third tier when quantity equals its minQuantity', () => {
    expect(getLeadTimeDays(standardTiers, 41)).toBe(7);
  });

  it('selects the highest tier for a very large quantity', () => {
    expect(getLeadTimeDays(standardTiers, 500)).toBe(7);
  });

  it('returns 0 when quantity is below all tier minimums', () => {
    const tiers: LeadTimeTier[] = [{ minQuantity: 10, leadTimeDays: 3 }];
    expect(getLeadTimeDays(tiers, 5)).toBe(0);
  });

  it('returns 0 for empty tiers', () => {
    expect(getLeadTimeDays([], 10)).toBe(0);
  });

  it('handles a single tier correctly', () => {
    const tiers: LeadTimeTier[] = [{ minQuantity: 1, leadTimeDays: 5 }];
    expect(getLeadTimeDays(tiers, 1)).toBe(5);
    expect(getLeadTimeDays(tiers, 100)).toBe(5);
  });
});

describe('getEarliestDate – earliest date computation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today (midnight) when leadTimeDays is 0', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 14, 30)); // June 15 2025, 2:30 PM

    const result = getEarliestDate(0);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('adds the correct number of days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15, 10, 0)); // June 15 2025

    const result = getEarliestDate(4);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(19); // June 19
  });

  it('crosses month boundaries correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 29)); // Jan 29 2025

    const result = getEarliestDate(5);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(3);
  });

  it('resets time to midnight regardless of current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 3, 10, 23, 59, 59));

    const result = getEarliestDate(2);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe('Tier transition when quantity increases', () => {
  it('lead time increases when quantity crosses into a higher tier', () => {
    const atTen = getLeadTimeDays(standardTiers, 10);
    const atEleven = getLeadTimeDays(standardTiers, 11);

    expect(atTen).toBe(2);
    expect(atEleven).toBe(4);
    expect(atEleven).toBeGreaterThan(atTen);
  });

  it('lead time increases again at the next tier boundary', () => {
    const atForty = getLeadTimeDays(standardTiers, 40);
    const atFortyOne = getLeadTimeDays(standardTiers, 41);

    expect(atForty).toBe(4);
    expect(atFortyOne).toBe(7);
    expect(atFortyOne).toBeGreaterThan(atForty);
  });

  it('earliest date moves further out when tier increases', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 1));

    const lowTierDays = getLeadTimeDays(standardTiers, 10);
    const highTierDays = getLeadTimeDays(standardTiers, 11);

    const earlyDate = getEarliestDate(lowTierDays);
    const laterDate = getEarliestDate(highTierDays);

    expect(laterDate.getTime()).toBeGreaterThan(earlyDate.getTime());

    vi.useRealTimers();
  });
});
