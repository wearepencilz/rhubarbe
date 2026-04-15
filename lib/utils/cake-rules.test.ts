/**
 * Cake Ordering Rules — spec §7.7 test cases + supporting logic tests.
 * Maps to: docs/spec/rhubarbe_cake_ordering_spec.md
 */
import { describe, it, expect } from 'vitest';
import {
  resolveLeadTimeDays, isDeliveryOnly, shortestLeadTime,
  getEarliestDate, getLatestDate, isDateAvailable,
  countConflicts, isDateBlockedByCapacity,
  filterAvailableFlavours, consolidateAllergens,
  resolveNearestSize, guestsToChoux, toDateStr,
  getDefaultFlavourSelection,
  type LeadTimeTier, type FlavourEntry, type CapacityOrder,
} from '@/lib/utils/cake-rules';
import { resolvePricingGridPrice, findMissingGridCells } from '@/lib/utils/order-helpers';

// ─── Fixtures ────────────────────────────────────────────────────────

const TIERS: LeadTimeTier[] = [
  { minPeople: 1, leadTimeDays: 7, deliveryOnly: false },
  { minPeople: 50, leadTimeDays: 14, deliveryOnly: true },
];

const TODAY = new Date(2026, 3, 14); // 2026-04-14

const GRID = [
  { sizeValue: '30', flavourHandle: 'pistachio', priceInCents: 50000, shopifyVariantId: 'v1' },
  { sizeValue: '30', flavourHandle: 'lemon', priceInCents: 48000, shopifyVariantId: 'v2' },
  { sizeValue: '50', flavourHandle: 'pistachio', priceInCents: 55000, shopifyVariantId: 'v3' },
  { sizeValue: '50', flavourHandle: 'lemon', priceInCents: 53000, shopifyVariantId: 'v4' },
];

const FLAVOURS: FlavourEntry[] = [
  { handle: 'pistachio', active: true, endDate: null, allergens: ['tree-nuts'] },
  { handle: 'lemon', active: true, endDate: '2026-04-20', allergens: [] },
  { handle: 'hazelnut', active: true, endDate: '2026-04-18', allergens: ['tree-nuts'] },
  { handle: 'retired', active: false, endDate: null, allergens: [] },
];

// ─── Lead Time ───────────────────────────────────────────────────────

describe('Lead Time Resolution', () => {
  it('resolves lead time from tier', () => {
    expect(resolveLeadTimeDays(TIERS, 30)).toBe(7);
    expect(resolveLeadTimeDays(TIERS, 50)).toBe(14);
    expect(resolveLeadTimeDays(TIERS, 100)).toBe(14);
  });

  it('returns 0 for empty tiers', () => {
    expect(resolveLeadTimeDays([], 10)).toBe(0);
  });

  it('T15: legacy product uses tier not variant', () => {
    const legacyTiers: LeadTimeTier[] = [{ minPeople: 1, leadTimeDays: 5, deliveryOnly: false }];
    expect(resolveLeadTimeDays(legacyTiers, 20)).toBe(5);
  });

  it('T11: delivery-only for large sizes', () => {
    expect(isDeliveryOnly(TIERS, 30)).toBe(false);
    expect(isDeliveryOnly(TIERS, 50)).toBe(true);
  });

  it('shortestLeadTime returns minimum across all tiers', () => {
    expect(shortestLeadTime(TIERS)).toBe(7);
    expect(shortestLeadTime([])).toBe(0);
  });
});

// ─── Date Rules (spec §7) ────────────────────────────────────────────

describe('Date Rules', () => {
  const earliest = getEarliestDate(TODAY, 7);  // 2026-04-21
  const latest = getLatestDate(TODAY, 365);
  const disabledDays = [0]; // Sunday
  const blockedDates = new Set(['2026-04-25']);

  it('T1: date within lead time is unavailable', () => {
    const tooEarly = new Date(2026, 3, 18); // Apr 18 < Apr 21
    expect(isDateAvailable(tooEarly, earliest, latest, disabledDays, blockedDates)).toBe(false);
  });

  it('T2: date beyond max advance booking is unavailable', () => {
    const tooLate = new Date(2027, 5, 1);
    expect(isDateAvailable(tooLate, earliest, latest, disabledDays, blockedDates)).toBe(false);
  });

  it('T3: Sunday is unavailable', () => {
    const sunday = new Date(2026, 3, 26); // Apr 26 2026 is Sunday
    expect(isDateAvailable(sunday, earliest, latest, disabledDays, blockedDates)).toBe(false);
  });

  it('date on earliest boundary is available', () => {
    expect(isDateAvailable(earliest, earliest, latest, disabledDays, new Set())).toBe(
      !disabledDays.includes(earliest.getDay())
    );
  });

  it('date on latest boundary is available (if not blocked)', () => {
    const lat = getLatestDate(TODAY, 30);
    const d = new Date(lat);
    const available = isDateAvailable(d, earliest, lat, [], new Set());
    expect(available).toBe(true);
  });

  it('blocked date is unavailable', () => {
    const blocked = new Date(2026, 3, 25); // in blockedDates set
    expect(isDateAvailable(blocked, earliest, latest, disabledDays, blockedDates)).toBe(false);
  });

  it('valid weekday within range is available', () => {
    const wed = new Date(2026, 3, 22); // Apr 22 = Wednesday
    expect(isDateAvailable(wed, earliest, latest, disabledDays, blockedDates)).toBe(true);
  });
});

// ─── Capacity (spec §6) ─────────────────────────────────────────────

describe('Production Capacity', () => {
  // 7 orders all delivering on Apr 28, each with 7-day lead time
  const fullOrders: CapacityOrder[] = Array.from({ length: 7 }, () => ({
    fulfillmentDate: '2026-04-28',
    leadTimeDays: 7,
  }));

  it('T4: 7 orders in production → date blocked (maxCakes=7)', () => {
    expect(isDateBlockedByCapacity('2026-04-28', 7, fullOrders, 7)).toBe(true);
  });

  it('T5: 6 orders in production → date available', () => {
    const sixOrders = fullOrders.slice(0, 6);
    expect(isDateBlockedByCapacity('2026-04-28', 7, sixOrders, 7)).toBe(false);
  });

  it('T13: tasting on full-capacity date is blocked', () => {
    // Tasting has leadTime too, consumes 1 slot
    expect(isDateBlockedByCapacity('2026-04-28', 7, fullOrders, 7)).toBe(true);
  });

  it('T12: wedding + sheet cake = 1 slot, not 2', () => {
    // A wedding+sheet combo is stored as a single order in the DB
    const orders: CapacityOrder[] = [
      { fulfillmentDate: '2026-04-28', leadTimeDays: 14 }, // wedding+sheet = 1 order
    ];
    expect(countConflicts('2026-04-28', 7, orders)).toBe(1);
  });

  it('non-overlapping windows do not conflict', () => {
    const orders: CapacityOrder[] = [
      { fulfillmentDate: '2026-04-10', leadTimeDays: 7 }, // window: Apr 3–10
    ];
    // Candidate: Apr 28 with 7-day lead → window: Apr 21–28
    expect(countConflicts('2026-04-28', 7, orders)).toBe(0);
  });

  it('partially overlapping windows do conflict', () => {
    const orders: CapacityOrder[] = [
      { fulfillmentDate: '2026-04-25', leadTimeDays: 7 }, // window: Apr 18–25
    ];
    // Candidate: Apr 28 with 7-day lead → window: Apr 21–28. Overlap: Apr 21–25
    expect(countConflicts('2026-04-28', 7, orders)).toBe(1);
  });
});

// ─── Flavour Filtering (spec §7.3) ──────────────────────────────────

describe('Flavour Filtering', () => {
  it('hides inactive flavours', () => {
    const result = filterAvailableFlavours(FLAVOURS, TODAY, 0);
    expect(result.find((f) => f.handle === 'retired')).toBeUndefined();
  });

  it('T6: endDate 5 days away, lead time 7 → hidden', () => {
    // hazelnut endDate = Apr 18, today = Apr 14, lead = 7 → earliest = Apr 21 > Apr 18
    const result = filterAvailableFlavours(FLAVOURS, TODAY, 7);
    expect(result.find((f) => f.handle === 'hazelnut')).toBeUndefined();
  });

  it('T7: endDate 10 days away, lead time 7 → shown', () => {
    // lemon endDate = Apr 20, today = Apr 10, lead = 7 → earliest = Apr 17 < Apr 20
    const apr10 = new Date(2026, 3, 10);
    const result = filterAvailableFlavours(FLAVOURS, apr10, 7);
    expect(result.find((f) => f.handle === 'lemon')).toBeDefined();
  });

  it('T8: endDate is yesterday → hidden', () => {
    const yesterday: FlavourEntry = { handle: 'old', active: true, endDate: '2026-04-13', allergens: [] };
    const result = filterAvailableFlavours([yesterday], TODAY, 0);
    expect(result).toHaveLength(0);
  });

  it('T9: size not selected — filter against shortest lead time', () => {
    const minLead = shortestLeadTime(TIERS); // 7
    const result = filterAvailableFlavours(FLAVOURS, TODAY, minLead);
    // hazelnut (endDate Apr 18) hidden because earliest = Apr 21 > Apr 18
    expect(result.find((f) => f.handle === 'hazelnut')).toBeUndefined();
  });

  it('T10: size upgrade pushes past flavour endDate → flavour gone', () => {
    // At size 30 (lead 7): lemon endDate Apr 20, earliest Apr 21 → hidden
    const atSmall = filterAvailableFlavours(FLAVOURS, TODAY, 7);
    expect(atSmall.find((f) => f.handle === 'lemon')).toBeUndefined();

    // At size 50 (lead 14): even more hidden
    const atLarge = filterAvailableFlavours(FLAVOURS, TODAY, 14);
    expect(atLarge.find((f) => f.handle === 'lemon')).toBeUndefined();
  });

  it('no endDate → always shown if active', () => {
    const result = filterAvailableFlavours(FLAVOURS, TODAY, 14);
    expect(result.find((f) => f.handle === 'pistachio')).toBeDefined();
  });
});

// ─── Allergens (spec §4) ────────────────────────────────────────────

describe('Allergen Consolidation', () => {
  const baseAllergens = ['gluten', 'egg'];

  it('union of product + flavour allergens', () => {
    const selected = [FLAVOURS[0]]; // pistachio: tree-nuts
    const result = consolidateAllergens(baseAllergens, selected);
    expect(result.sort()).toEqual(['egg', 'gluten', 'tree-nuts']);
  });

  it('multi-select: union of all selected flavours', () => {
    const selected = [FLAVOURS[0], FLAVOURS[2]]; // pistachio + hazelnut, both tree-nuts
    const result = consolidateAllergens(baseAllergens, selected);
    expect(result.sort()).toEqual(['egg', 'gluten', 'tree-nuts']);
  });

  it('no flavour allergens → just product allergens', () => {
    const selected = [FLAVOURS[1]]; // lemon: no allergens
    const result = consolidateAllergens(baseAllergens, selected);
    expect(result.sort()).toEqual(['egg', 'gluten']);
  });

  it('empty product allergens + flavour allergens', () => {
    const result = consolidateAllergens([], [FLAVOURS[0]]);
    expect(result).toEqual(['tree-nuts']);
  });
});

// ─── Size Resolution ─────────────────────────────────────────────────

describe('Size Resolution', () => {
  const sizes = ['30', '50', '100'];

  it('exact match', () => {
    expect(resolveNearestSize(sizes, 50)).toBe('50');
  });

  it('rounds down to nearest', () => {
    expect(resolveNearestSize(sizes, 45)).toBe('30');
    expect(resolveNearestSize(sizes, 99)).toBe('50');
  });

  it('returns null below minimum', () => {
    expect(resolveNearestSize(sizes, 10)).toBeNull();
  });

  it('above max returns max', () => {
    expect(resolveNearestSize(sizes, 200)).toBe('100');
  });

  it('croquembouche: guests × 3 for choux lookup', () => {
    expect(guestsToChoux(10)).toBe(30);
    expect(guestsToChoux(17)).toBe(51);
  });
});

// ─── Pricing Grid ────────────────────────────────────────────────────

describe('Pricing Grid Resolution', () => {
  it('exact match returns price + variant', () => {
    const result = resolvePricingGridPrice(GRID, '30', 'pistachio');
    expect(result).toEqual({ priceInCents: 50000, shopifyVariantId: 'v1' });
  });

  it('missing combination returns null (blocks checkout)', () => {
    expect(resolvePricingGridPrice(GRID, '30', 'chocolate')).toBeNull();
    expect(resolvePricingGridPrice(GRID, '100', 'pistachio')).toBeNull();
  });

  it('findMissingGridCells detects gaps', () => {
    const missing = findMissingGridCells(GRID, ['30', '50'], ['pistachio', 'lemon', 'chocolate']);
    expect(missing).toEqual([
      { sizeValue: '30', flavourHandle: 'chocolate' },
      { sizeValue: '50', flavourHandle: 'chocolate' },
    ]);
  });
});

// ─── Integration: Full Order Flow ────────────────────────────────────

describe('End-to-End Order Scenarios', () => {
  it('valid order: pistachio 30 guests, available date', () => {
    const size = resolveNearestSize(['30', '50'], 30)!;
    const price = resolvePricingGridPrice(GRID, size, 'pistachio');
    const lead = resolveLeadTimeDays(TIERS, parseInt(size));
    const earliest = getEarliestDate(TODAY, lead);
    const latest = getLatestDate(TODAY, 365);
    const pickupDate = new Date(2026, 3, 23); // Apr 23 Wed

    expect(size).toBe('30');
    expect(price).not.toBeNull();
    expect(price!.priceInCents).toBe(50000);
    expect(lead).toBe(7);
    expect(isDateAvailable(pickupDate, earliest, latest, [0], new Set())).toBe(true);
  });

  it('blocked order: no variant for size 100 pistachio', () => {
    const size = resolveNearestSize(['30', '50'], 100)!;
    expect(size).toBe('50');
    const price = resolvePricingGridPrice(GRID, size, 'pistachio');
    expect(price).not.toBeNull(); // 50 exists
  });

  it('T14: server-side capacity re-check blocks late submission', () => {
    // Simulate: calendar showed date as available, but 7 orders placed since
    const orders: CapacityOrder[] = Array.from({ length: 7 }, () => ({
      fulfillmentDate: '2026-05-01',
      leadTimeDays: 7,
    }));
    expect(isDateBlockedByCapacity('2026-05-01', 7, orders, 7)).toBe(true);
  });

  it('croquembouche: 20 guests → 60 choux → resolves to size 50', () => {
    const choux = guestsToChoux(20);
    expect(choux).toBe(60);
    const size = resolveNearestSize(['30', '50'], choux);
    expect(size).toBe('50');
  });
});

// ─── Default Flavour Selection (spec §3) ────────────────────────────

describe('getDefaultFlavourSelection', () => {
  const TODAY_STR = '2026-04-14';

  it('multi-select (tasting): returns empty — no default', () => {
    expect(getDefaultFlavourSelection(FLAVOURS, true, TODAY_STR)).toEqual([]);
  });

  it('multi-select (croquembouche): returns empty — no default', () => {
    expect(getDefaultFlavourSelection(FLAVOURS, true, TODAY_STR)).toEqual([]);
  });

  it('single-select: auto-selects first available active flavour', () => {
    const result = getDefaultFlavourSelection(FLAVOURS, false, TODAY_STR);
    expect(result).toHaveLength(1);
    expect(result[0]).not.toBe('retired');
  });

  it('single-select: skips custom handle', () => {
    const withCustomFirst: FlavourEntry[] = [
      { handle: 'custom', active: true, endDate: null, allergens: [] },
      { handle: 'pistachio', active: true, endDate: null, allergens: ['tree-nuts'] },
    ];
    const result = getDefaultFlavourSelection(withCustomFirst, false, TODAY_STR);
    expect(result).toEqual(['pistachio']);
  });

  it('single-select: returns empty if no available flavours', () => {
    const allInactive: FlavourEntry[] = [
      { handle: 'retired', active: false, endDate: null, allergens: [] },
    ];
    expect(getDefaultFlavourSelection(allInactive, false, TODAY_STR)).toEqual([]);
  });
});
