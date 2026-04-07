/**
 * Category-level variant resolution for Quebec tax law compliance.
 *
 * Groups cart items by Shopify collection, sums effective units
 * per collection, and resolves variants based on collection-level thresholds.
 * Products not in a threshold-enabled collection are excluded from results
 * (the caller falls back to per-product resolution for those).
 */

/** A single cart item with its product metadata for category resolution */
export interface CategoryCartItem {
  productId: string;
  shopifyProductId: string;
  defaultVariantId: string;
  exemptVariantId: string | null;
  quantity: number;
  /** From CMS products table (tax_unit_count column), default 1 */
  taxUnitCount: number;
  /** Shopify collection titles this product belongs to */
  shopifyCollections: string[];
}

/** Category threshold configuration from the CMS settings table */
export interface ThresholdCategory {
  category: string;
  threshold: number;
}

/** Tax settings loaded from the CMS database */
export interface TaxSettings {
  thresholdCategories: ThresholdCategory[];
}

/** Result for a single cart item after category resolution */
export interface CategoryVariantResolution {
  productId: string;
  variantId: string;
  isExempt: boolean;
  effectiveUnits: number;
  categoryTotal: number;
  fallback: boolean;
}

/**
 * Resolves variants for all cart items using category-level aggregation.
 *
 * Returns resolutions only for items in threshold-enabled categories.
 * Items not in any threshold category are excluded from the result
 * (the caller falls back to per-product resolution for those).
 */
export function resolveCategoryVariants(
  items: CategoryCartItem[],
  settings: TaxSettings,
): CategoryVariantResolution[] {
  if (!settings.thresholdCategories.length) return [];

  // Build a lookup of threshold-enabled categories
  const thresholdMap = new Map<string, number>();
  for (const tc of settings.thresholdCategories) {
    if (tc.threshold >= 1) {
      thresholdMap.set(tc.category, tc.threshold);
    }
  }

  if (!thresholdMap.size) return [];

  // Group items by their matching threshold-enabled collection
  // A product can be in multiple collections; it gets grouped into
  // the first matching threshold-enabled collection it belongs to.
  const categoryGroups = new Map<string, CategoryCartItem[]>();

  for (const item of items) {
    if (!item.shopifyCollections.length) continue;

    // Find the first threshold-enabled collection this product belongs to
    const matchedCategory = item.shopifyCollections.find((c) => thresholdMap.has(c));
    if (!matchedCategory) continue;

    const group = categoryGroups.get(matchedCategory);
    if (group) {
      group.push(item);
    } else {
      categoryGroups.set(matchedCategory, [item]);
    }
  }

  // Resolve variants per category
  const results: CategoryVariantResolution[] = [];

  for (const [category, groupItems] of categoryGroups) {
    const threshold = thresholdMap.get(category)!;

    // Sum effective units across all items in this category
    const categoryTotal = groupItems.reduce(
      (sum, item) => sum + item.quantity * item.taxUnitCount,
      0,
    );

    const isExempt = categoryTotal >= threshold;

    for (const item of groupItems) {
      const effectiveUnits = item.quantity * item.taxUnitCount;

      if (isExempt) {
        if (item.exemptVariantId) {
          results.push({
            productId: item.productId,
            variantId: item.exemptVariantId,
            isExempt: true,
            effectiveUnits,
            categoryTotal,
            fallback: false,
          });
        } else {
          // Missing exempt variant — fall back to taxable
          results.push({
            productId: item.productId,
            variantId: item.defaultVariantId,
            isExempt: false,
            effectiveUnits,
            categoryTotal,
            fallback: true,
          });
        }
      } else {
        results.push({
          productId: item.productId,
          variantId: item.defaultVariantId,
          isExempt: false,
          effectiveUnits,
          categoryTotal,
          fallback: false,
        });
      }
    }
  }

  return results;
}
