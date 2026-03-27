import { describe, it, expect } from 'vitest';
import {
  generatePickupDays,
  calculateServesEstimate,
  isSundayUnavailable,
  getActivePricingTier,
} from './order-helpers';

describe('generatePickupDays', () => {
  it('returns single pickupDate when window is null', () => {
    expect(generatePickupDays(null, null, '2025-03-28')).toEqual(['2025-03-28']);
  });

  it('returns single pickupDate when only start is null', () => {
    expect(generatePickupDays(null, '2025-04-01', '2025-03-28')).toEqual(['2025-03-28']);
  });

  it('returns single pickupDate when only end is null', () => {
    expect(generatePickupDays('2025-03-28', null, '2025-03-28')).toEqual(['2025-03-28']);
  });

  it('returns single day when start === end', () => {
    expect(generatePickupDays('2025-04-19', '2025-04-19', '2025-03-28')).toEqual(['2025-04-19']);
  });

  it('returns inclusive range for multi-day window', () => {
    expect(generatePickupDays('2025-04-18', '2025-04-21', '2025-03-28')).toEqual([
      '2025-04-18',
      '2025-04-19',
      '2025-04-20',
      '2025-04-21',
    ]);
  });
});

describe('calculateServesEstimate', () => {
  it('returns 0 for empty array', () => {
    expect(calculateServesEstimate([])).toBe(0);
  });

  it('sums quantity × servesPerUnit', () => {
    expect(
      calculateServesEstimate([
        { quantity: 2, servesPerUnit: 10 },
        { quantity: 3, servesPerUnit: 5 },
      ])
    ).toBe(35);
  });

  it('treats null servesPerUnit as 0', () => {
    expect(
      calculateServesEstimate([
        { quantity: 5, servesPerUnit: null },
        { quantity: 2, servesPerUnit: 8 },
      ])
    ).toBe(16);
  });

  it('returns 0 when all servesPerUnit are null', () => {
    expect(
      calculateServesEstimate([
        { quantity: 3, servesPerUnit: null },
      ])
    ).toBe(0);
  });
});

describe('isSundayUnavailable', () => {
  it('returns true for a Sunday', () => {
    // 2025-01-05 is a Sunday
    expect(isSundayUnavailable(new Date(2025, 0, 5))).toBe(true);
  });

  it('returns false for a Saturday', () => {
    // 2025-01-04 is a Saturday
    expect(isSundayUnavailable(new Date(2025, 0, 4))).toBe(false);
  });

  it('returns false for a Monday', () => {
    // 2025-01-06 is a Monday
    expect(isSundayUnavailable(new Date(2025, 0, 6))).toBe(false);
  });
});

describe('getActivePricingTier', () => {
  const tiers = [
    { minPeople: 10, priceInCents: 5000 },
    { minPeople: 25, priceInCents: 4000 },
    { minPeople: 50, priceInCents: 3000 },
  ];

  it('returns null when headcount is below all tiers', () => {
    expect(getActivePricingTier(tiers, 5)).toBeNull();
  });

  it('returns the matching tier at exact boundary', () => {
    expect(getActivePricingTier(tiers, 25)).toEqual({ minPeople: 25, priceInCents: 4000 });
  });

  it('returns the highest applicable tier', () => {
    expect(getActivePricingTier(tiers, 30)).toEqual({ minPeople: 25, priceInCents: 4000 });
  });

  it('returns the top tier when headcount exceeds all', () => {
    expect(getActivePricingTier(tiers, 100)).toEqual({ minPeople: 50, priceInCents: 3000 });
  });

  it('returns null for empty tiers array', () => {
    expect(getActivePricingTier([], 10)).toBeNull();
  });

  it('handles unsorted tiers', () => {
    const unsorted = [
      { minPeople: 50, priceInCents: 3000 },
      { minPeople: 10, priceInCents: 5000 },
      { minPeople: 25, priceInCents: 4000 },
    ];
    expect(getActivePricingTier(unsorted, 30)).toEqual({ minPeople: 25, priceInCents: 4000 });
  });
});
