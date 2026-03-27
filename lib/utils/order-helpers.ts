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
    return [pickupDate];
  }

  const days: string[] = [];
  const start = new Date(pickupWindowStart + 'T00:00:00');
  const end = new Date(pickupWindowEnd + 'T00:00:00');

  const current = new Date(start);
  while (current <= end) {
    days.push(current.toISOString().slice(0, 10));
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
 */
export function isSundayUnavailable(date: Date): boolean {
  return date.getDay() === 0;
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
