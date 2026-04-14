/**
 * Pure cake ordering logic — no DB, no side effects.
 * Every rule from the cake ordering spec is testable here.
 */

import type { PricingGridRow } from './order-helpers';
import { resolvePricingGridPrice, getActivePricingTier } from './order-helpers';

// ─── Types ───────────────────────────────────────────────────────────

export interface LeadTimeTier {
  minPeople: number;
  leadTimeDays: number;
  deliveryOnly: boolean;
}

export interface FlavourEntry {
  handle: string;
  active: boolean;
  endDate: string | null; // YYYY-MM-DD
  allergens?: string[];
}

export interface CapacityOrder {
  fulfillmentDate: string; // YYYY-MM-DD
  leadTimeDays: number;
}

// ─── Lead Time ───────────────────────────────────────────────────────

/** Resolve lead time: largest minPeople ≤ input. */
export function resolveLeadTimeDays(tiers: LeadTimeTier[], people: number): number {
  const tier = getActivePricingTier(tiers, people);
  return tier?.leadTimeDays ?? 0;
}

/** Resolve whether the active tier is delivery-only. */
export function isDeliveryOnly(tiers: LeadTimeTier[], people: number): boolean {
  const tier = getActivePricingTier(tiers, people);
  return tier?.deliveryOnly ?? false;
}

/** Shortest lead time across all tiers (for pre-size flavour filtering). */
export function shortestLeadTime(tiers: LeadTimeTier[]): number {
  if (tiers.length === 0) return 0;
  return Math.min(...tiers.map((t) => t.leadTimeDays));
}

// ─── Date Rules (spec §7) ────────────────────────────────────────────

/** Earliest available date = today + leadTimeDays. */
export function getEarliestDate(today: Date, leadTimeDays: number): Date {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + leadTimeDays);
  return d;
}

/** Latest available date = today + maxAdvanceDays. */
export function getLatestDate(today: Date, maxAdvanceDays: number): Date {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + maxAdvanceDays);
  return d;
}

/** Check if a date is available per all combined rules (spec §7.6). */
export function isDateAvailable(
  date: Date,
  earliestDate: Date,
  latestDate: Date,
  disabledDays: number[],
  blockedDates: Set<string>,
): boolean {
  const dateStr = toDateStr(date);
  if (date < earliestDate) return false;
  if (date > latestDate) return false;
  if (disabledDays.includes(date.getDay())) return false;
  if (blockedDates.has(dateStr)) return false;
  return true;
}

// ─── Capacity (spec §6) ─────────────────────────────────────────────

/**
 * Count how many existing orders have production windows overlapping
 * the candidate window [D - L, D].
 * Pure version — takes an array of existing orders instead of querying DB.
 */
export function countConflicts(
  candidateDate: string,
  candidateLeadTime: number,
  existingOrders: CapacityOrder[],
  fallbackLeadTime: number = 7,
): number {
  const D = parseDateStr(candidateDate);
  const windowStart = addDays(D, -candidateLeadTime);

  let count = 0;
  for (const order of existingOrders) {
    const E = parseDateStr(order.fulfillmentDate);
    const eLead = order.leadTimeDays || fallbackLeadTime;
    const eStart = addDays(E, -eLead);
    // Overlap: E >= windowStart AND eStart <= D
    if (E >= windowStart && eStart <= D) count++;
  }
  return count;
}

/** Is a date blocked by capacity? */
export function isDateBlockedByCapacity(
  candidateDate: string,
  candidateLeadTime: number,
  existingOrders: CapacityOrder[],
  maxCakes: number,
): boolean {
  return countConflicts(candidateDate, candidateLeadTime, existingOrders) >= maxCakes;
}

// ─── Flavour Filtering (spec §3, §7.3) ──────────────────────────────

/**
 * Filter flavours by active state and endDate vs lead time.
 * A flavour is hidden if today + leadTimeDays > endDate.
 */
export function filterAvailableFlavours(
  flavours: FlavourEntry[],
  today: Date,
  leadTimeDays: number,
): FlavourEntry[] {
  const earliest = getEarliestDate(today, leadTimeDays);
  const earliestStr = toDateStr(earliest);

  return flavours.filter((f) => {
    if (!f.active) return false;
    if (f.endDate && f.endDate < earliestStr) return false;
    return true;
  });
}

// ─── Allergens (spec §4) ────────────────────────────────────────────

/**
 * Consolidated allergen set: union of product-level + selected flavour allergens.
 */
export function consolidateAllergens(
  productAllergens: string[],
  selectedFlavours: FlavourEntry[],
): string[] {
  const set = new Set(productAllergens);
  for (const f of selectedFlavours) {
    for (const a of f.allergens ?? []) set.add(a);
  }
  return Array.from(set);
}

// ─── Size Resolution ─────────────────────────────────────────────────

/** Find the largest numeric sizeValue ≤ input. */
export function resolveNearestSize(availableSizes: string[], input: number): string | null {
  const numeric = availableSizes
    .map((s) => ({ str: s, num: parseInt(s) }))
    .filter((s) => !isNaN(s.num))
    .sort((a, b) => b.num - a.num);
  for (const size of numeric) {
    if (size.num <= input) return size.str;
  }
  return null;
}

/** For croquembouche: guest count × 3 = choux count for grid lookup. */
export function guestsToChoux(guests: number): number {
  return guests * 3;
}

// ─── Price Resolution ────────────────────────────────────────────────

/** Resolve grid price for a flavour + size. Re-exports for convenience. */
export { resolvePricingGridPrice };

// ─── Helpers ─────────────────────────────────────────────────────────

function parseDateStr(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
