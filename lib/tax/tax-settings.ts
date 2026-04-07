/**
 * CMS-backed tax threshold settings.
 *
 * Reads/writes the `tax_threshold_categories` key in the settings table
 * to manage which Shopify product categories have threshold behavior.
 */

import { getByKey, upsertMany } from '@/lib/db/queries/settings';
import type { TaxSettings, ThresholdCategory } from './resolve-category-variants';

const TAX_SETTINGS_KEY = 'tax_threshold_categories';

/**
 * Parse and validate a raw JSONB value into TaxSettings.
 * Filters out entries with invalid thresholds (< 1 or non-integer).
 * Returns null if the value is not a valid array.
 */
export function parseTaxSettings(raw: unknown): TaxSettings | null {
  if (!Array.isArray(raw)) {
    if (raw !== null && raw !== undefined) {
      console.warn('[tax-settings] Invalid threshold_categories value — expected array, got', typeof raw);
    }
    return null;
  }

  const valid: ThresholdCategory[] = [];

  for (const entry of raw) {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof entry.category !== 'string' ||
      !entry.category.trim()
    ) {
      continue;
    }

    const threshold = Number(entry.threshold);
    if (!Number.isInteger(threshold) || threshold < 1) {
      console.warn(`[tax-settings] Ignoring category "${entry.category}" — invalid threshold: ${entry.threshold}`);
      continue;
    }

    valid.push({ category: entry.category, threshold });
  }

  return { thresholdCategories: valid };
}

/**
 * Fetch tax settings from the CMS settings table.
 * Returns null if the setting doesn't exist or is invalid.
 */
export async function fetchTaxSettings(): Promise<TaxSettings | null> {
  try {
    const row = await getByKey(TAX_SETTINGS_KEY);
    if (!row) return null;
    return parseTaxSettings(row.value);
  } catch (error) {
    console.error('[tax-settings] Failed to fetch tax settings:', error);
    return null;
  }
}

/**
 * Save tax settings to the CMS settings table.
 */
export async function saveTaxSettings(settings: TaxSettings): Promise<void> {
  await upsertMany({
    [TAX_SETTINGS_KEY]: settings.thresholdCategories,
  });
}

/**
 * Validate that a threshold value is a positive integer >= 1.
 */
export function isValidThreshold(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && Number.isFinite(value);
}
