/**
 * Convention-based tax-exempt variant lookup.
 *
 * Given a taxable variant GID, finds its exempt twin by looking for a variant
 * on the same Shopify product with identical options except Tax = "false".
 *
 * Convention: products with quantity-threshold tax behavior have a "Tax" option
 * with values "true" (taxable) and "false" (exempt). Each taxable variant has
 * a matching exempt variant with the same other options.
 */

import { shopifyAdminFetch } from '@/lib/shopify/admin';

interface ShopifyVariantNode {
  id: string;
  taxable: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
}

// Simple in-memory cache: shopifyProductId → { variants, timestamp }
const variantCache = new Map<string, { variants: ShopifyVariantNode[]; ts: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Fetch all variants for a Shopify product (with caching).
 */
async function getProductVariants(shopifyProductId: string): Promise<ShopifyVariantNode[]> {
  const cached = variantCache.get(shopifyProductId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.variants;
  }

  const data = await shopifyAdminFetch(
    `query getProductVariants($id: ID!) {
      product(id: $id) {
        variants(first: 100) {
          edges {
            node {
              id
              taxable
              selectedOptions { name value }
            }
          }
        }
      }
    }`,
    { id: shopifyProductId },
  );

  const variants: ShopifyVariantNode[] =
    data.product?.variants?.edges?.map((e: any) => e.node) || [];

  variantCache.set(shopifyProductId, { variants, ts: Date.now() });
  return variants;
}

/**
 * Find the tax-exempt twin of a given variant.
 *
 * Looks for a variant with the same options except Tax = "false".
 * Returns the exempt variant's Admin GID, or null if not found.
 */
export async function findExemptVariant(
  shopifyProductId: string,
  taxableVariantId: string,
): Promise<string | null> {
  const variants = await getProductVariants(shopifyProductId);

  // Find the taxable variant to get its options
  const taxableVariant = variants.find((v) => v.id === taxableVariantId);
  if (!taxableVariant) return null;

  // Get the non-Tax options for matching
  const matchOptions = taxableVariant.selectedOptions
    .filter((o) => o.name !== 'Tax')
    .map((o) => `${o.name}=${o.value}`);

  // Find the variant with same options but Tax = "false"
  const exemptVariant = variants.find((v) => {
    if (v.id === taxableVariantId) return false;
    if (v.taxable) return false; // Must be non-taxable

    const otherOptions = v.selectedOptions
      .filter((o) => o.name !== 'Tax')
      .map((o) => `${o.name}=${o.value}`);

    // Same non-Tax options
    if (otherOptions.length !== matchOptions.length) return false;
    return matchOptions.every((opt) => otherOptions.includes(opt));
  });

  return exemptVariant?.id || null;
}

/**
 * Clear the variant cache for a specific product (e.g. after creating Tax option).
 */
export function clearVariantCache(shopifyProductId?: string) {
  if (shopifyProductId) {
    variantCache.delete(shopifyProductId);
  } else {
    variantCache.clear();
  }
}
