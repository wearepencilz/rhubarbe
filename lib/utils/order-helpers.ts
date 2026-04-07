/**
 * Pure logic helpers for order flows.
 * No DB imports, no side effects — safe for client-side use and property testing.
 */

/**
 * Generate an inclusive array of date strings (YYYY-MM-DD) for a pickup window.
 * When both start and end are provided, returns every day from start to end inclusive.
 * When the window is null, returns just the single pickupDate.
 */
export function generatePickupDays(
  pickupWindowStart: string | null,
  pickupWindowEnd: string | null,
  pickupDate: string
): string[] {
  if (!pickupWindowStart || !pickupWindowEnd) {
    return [pickupDate.split('T')[0]];
  }

  const days: string[] = [];
  const startStr = pickupWindowStart.split('T')[0];
  const endStr = pickupWindowEnd.split('T')[0];
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');

  const current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Calculate the total serves estimate from cart items.
 * Returns sum of (quantity × servesPerUnit) across all items.
 * Treats null servesPerUnit as 0. Returns 0 for empty array.
 */
export function calculateServesEstimate(
  items: Array<{ quantity: number; servesPerUnit: number | null }>
): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * (item.servesPerUnit ?? 0),
    0
  );
}

/**
 * Returns true if the given date falls on a Sunday.
 * @deprecated Use isPickupDayDisabled with configurable disabled days instead.
 */
export function isSundayUnavailable(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * Returns true if the given date's day-of-week is in the disabledDays array.
 * Days use JS convention: 0 = Sunday, 1 = Monday, … 6 = Saturday.
 * Returns false when disabledDays is empty or undefined.
 */
export function isPickupDayDisabled(date: Date, disabledDays?: number[]): boolean {
  if (!disabledDays || disabledDays.length === 0) return false;
  return disabledDays.includes(date.getDay());
}

/**
 * Returns the pricing tier with the largest minPeople that is ≤ headcount.
 * Returns null if no tier applies (headcount below all tiers).
 * Does not assume tiers are sorted.
 */
export function getActivePricingTier<T extends { minPeople: number }>(
  tiers: T[],
  headcount: number
): T | null {
  let best: T | null = null;

  for (const tier of tiers) {
    if (tier.minPeople <= headcount) {
      if (best === null || tier.minPeople > best.minPeople) {
        best = tier;
      }
    }
  }

  return best;
}

// ─── Pricing Grid Helpers ────────────────────────────────────────────

export interface PricingGridRow {
  sizeValue: string;
  flavourHandle: string;
  priceInCents: number;
  shopifyVariantId: string | null;
}

export interface CakeTierDetailEntry {
  sizeValue: string;
  layers: number;
  diameters: string;
  label: { en: string; fr: string } | null;
}

/**
 * Look up a price from a two-axis pricing grid.
 * Returns the matching entry or null if no match found.
 * Used by both the storefront client (price display) and checkout API (variant resolution).
 */
export function resolvePricingGridPrice(
  grid: PricingGridRow[],
  sizeValue: string,
  flavourHandle: string,
): { priceInCents: number; shopifyVariantId: string | null } | null {
  const match = grid.find(
    (row) => row.sizeValue === sizeValue && row.flavourHandle === flavourHandle,
  );
  if (!match) return null;
  return { priceInCents: match.priceInCents, shopifyVariantId: match.shopifyVariantId };
}

/**
 * Look up tier detail (layers, diameters) for a given size value.
 * Returns the matching entry or null if no match found.
 */
export function getTierDetailForSize(
  tierDetails: CakeTierDetailEntry[],
  sizeValue: string,
): CakeTierDetailEntry | null {
  return tierDetails.find((td) => td.sizeValue === sizeValue) ?? null;
}

/**
 * Returns the set of (sizeValue, flavourHandle) combinations that are missing from the grid.
 * Used by admin validation before saving.
 */
export function findMissingGridCells(
  grid: PricingGridRow[],
  sizeValues: string[],
  flavourHandles: string[],
): Array<{ sizeValue: string; flavourHandle: string }> {
  const existing = new Set(grid.map((r) => `${r.sizeValue}|${r.flavourHandle}`));
  const missing: Array<{ sizeValue: string; flavourHandle: string }> = [];
  for (const size of sizeValues) {
    for (const flavour of flavourHandles) {
      if (!existing.has(`${size}|${flavour}`)) {
        missing.push({ sizeValue: size, flavourHandle: flavour });
      }
    }
  }
  return missing;
}
