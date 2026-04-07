/**
 * Pure variant resolution for Quebec tax law compliance.
 *
 * Selects the correct Shopify variant (taxable or tax-exempt) based on
 * a product's tax configuration and the effective unit count in the cart.
 */

export interface TaxConfig {
  taxBehavior: 'always_taxable' | 'always_exempt' | 'quantity_threshold';
  taxThreshold: number;
  taxUnitCount: number;
  shopifyTaxExemptVariantId: string | null;
  /** CMS variants with optional per-variant taxUnitCount */
  variants?: { id: string; taxUnitCount?: number }[];
}

/**
 * Get the effective taxUnitCount for a specific variant.
 * Falls back to the product-level taxUnitCount if the variant doesn't have one.
 */
export function getVariantTaxUnitCount(
  taxConfig: TaxConfig,
  variantId?: string | null,
): number {
  if (variantId && taxConfig.variants) {
    const variant = taxConfig.variants.find((v) => v.id === variantId);
    if (variant?.taxUnitCount && variant.taxUnitCount >= 1) {
      return variant.taxUnitCount;
    }
  }
  return taxConfig.taxUnitCount;
}

export interface VariantResolution {
  variantId: string;
  isExempt: boolean;
  effectiveUnits: number;
  fallback: boolean;
}

/**
 * Resolves which Shopify variant to use for a cart line based on tax config.
 *
 * @param taxConfig - The product's tax configuration from the DB
 * @param cartQuantity - Number of items in the cart line
 * @param defaultVariantId - The product's default (taxable) Shopify variant GID
 */
export function resolveVariant(
  taxConfig: TaxConfig,
  cartQuantity: number,
  defaultVariantId: string,
): VariantResolution {
  const effectiveUnits = cartQuantity * taxConfig.taxUnitCount;

  switch (taxConfig.taxBehavior) {
    case 'always_taxable':
      return {
        variantId: defaultVariantId,
        isExempt: false,
        effectiveUnits,
        fallback: false,
      };

    case 'always_exempt':
      if (taxConfig.shopifyTaxExemptVariantId) {
        return {
          variantId: taxConfig.shopifyTaxExemptVariantId,
          isExempt: true,
          effectiveUnits,
          fallback: false,
        };
      }
      return {
        variantId: defaultVariantId,
        isExempt: false,
        effectiveUnits,
        fallback: true,
      };

    case 'quantity_threshold': {
      if (effectiveUnits >= taxConfig.taxThreshold) {
        if (taxConfig.shopifyTaxExemptVariantId) {
          return {
            variantId: taxConfig.shopifyTaxExemptVariantId,
            isExempt: true,
            effectiveUnits,
            fallback: false,
          };
        }
        // Exempt variant missing — fall back to taxable
        return {
          variantId: defaultVariantId,
          isExempt: false,
          effectiveUnits,
          fallback: true,
        };
      }
      // Below threshold — taxable
      return {
        variantId: defaultVariantId,
        isExempt: false,
        effectiveUnits,
        fallback: false,
      };
    }
  }
}
