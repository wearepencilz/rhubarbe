import { describe, it, expect } from 'vitest';
import { resolveVariant, TaxConfig } from './resolve-variant';

const DEFAULT_VARIANT = 'gid://shopify/ProductVariant/111';
const EXEMPT_VARIANT = 'gid://shopify/ProductVariant/222';

describe('resolveVariant', () => {
  describe('always_taxable', () => {
    const config: TaxConfig = {
      taxBehavior: 'always_taxable',
      taxThreshold: 6,
      taxUnitCount: 1,
      shopifyTaxExemptVariantId: EXEMPT_VARIANT,
    };

    it('returns the default variant with isExempt false', () => {
      const result = resolveVariant(config, 10, DEFAULT_VARIANT);
      expect(result.variantId).toBe(DEFAULT_VARIANT);
      expect(result.isExempt).toBe(false);
      expect(result.fallback).toBe(false);
    });

    it('computes effectiveUnits as cartQuantity × taxUnitCount', () => {
      const result = resolveVariant(config, 3, DEFAULT_VARIANT);
      expect(result.effectiveUnits).toBe(3);
    });
  });

  describe('always_exempt', () => {
    it('returns the exempt variant when available', () => {
      const config: TaxConfig = {
        taxBehavior: 'always_exempt',
        taxThreshold: 6,
        taxUnitCount: 1,
        shopifyTaxExemptVariantId: EXEMPT_VARIANT,
      };
      const result = resolveVariant(config, 1, DEFAULT_VARIANT);
      expect(result.variantId).toBe(EXEMPT_VARIANT);
      expect(result.isExempt).toBe(true);
      expect(result.fallback).toBe(false);
    });

    it('falls back to default when exempt variant is null', () => {
      const config: TaxConfig = {
        taxBehavior: 'always_exempt',
        taxThreshold: 6,
        taxUnitCount: 1,
        shopifyTaxExemptVariantId: null,
      };
      const result = resolveVariant(config, 1, DEFAULT_VARIANT);
      expect(result.variantId).toBe(DEFAULT_VARIANT);
      expect(result.isExempt).toBe(false);
      expect(result.fallback).toBe(true);
    });
  });

  describe('quantity_threshold', () => {
    it('returns exempt variant when effectiveUnits >= threshold', () => {
      const config: TaxConfig = {
        taxBehavior: 'quantity_threshold',
        taxThreshold: 6,
        taxUnitCount: 1,
        shopifyTaxExemptVariantId: EXEMPT_VARIANT,
      };
      const result = resolveVariant(config, 6, DEFAULT_VARIANT);
      expect(result.variantId).toBe(EXEMPT_VARIANT);
      expect(result.isExempt).toBe(true);
      expect(result.fallback).toBe(false);
      expect(result.effectiveUnits).toBe(6);
    });

    it('returns taxable variant when effectiveUnits < threshold', () => {
      const config: TaxConfig = {
        taxBehavior: 'quantity_threshold',
        taxThreshold: 6,
        taxUnitCount: 1,
        shopifyTaxExemptVariantId: EXEMPT_VARIANT,
      };
      const result = resolveVariant(config, 5, DEFAULT_VARIANT);
      expect(result.variantId).toBe(DEFAULT_VARIANT);
      expect(result.isExempt).toBe(false);
      expect(result.fallback).toBe(false);
      expect(result.effectiveUnits).toBe(5);
    });

    it('multiplies cartQuantity by taxUnitCount for bundles (Req 7.3)', () => {
      const config: TaxConfig = {
        taxBehavior: 'quantity_threshold',
        taxThreshold: 6,
        taxUnitCount: 6,
        shopifyTaxExemptVariantId: EXEMPT_VARIANT,
      };
      // 1 box of 6 → effectiveUnits = 6 ≥ 6 → exempt
      const result = resolveVariant(config, 1, DEFAULT_VARIANT);
      expect(result.variantId).toBe(EXEMPT_VARIANT);
      expect(result.isExempt).toBe(true);
      expect(result.effectiveUnits).toBe(6);
    });

    it('falls back to taxable when exempt variant is null and threshold met', () => {
      const config: TaxConfig = {
        taxBehavior: 'quantity_threshold',
        taxThreshold: 6,
        taxUnitCount: 1,
        shopifyTaxExemptVariantId: null,
      };
      const result = resolveVariant(config, 10, DEFAULT_VARIANT);
      expect(result.variantId).toBe(DEFAULT_VARIANT);
      expect(result.isExempt).toBe(false);
      expect(result.fallback).toBe(true);
    });

    it('returns taxable with no fallback when below threshold and exempt is null', () => {
      const config: TaxConfig = {
        taxBehavior: 'quantity_threshold',
        taxThreshold: 6,
        taxUnitCount: 1,
        shopifyTaxExemptVariantId: null,
      };
      const result = resolveVariant(config, 3, DEFAULT_VARIANT);
      expect(result.variantId).toBe(DEFAULT_VARIANT);
      expect(result.isExempt).toBe(false);
      expect(result.fallback).toBe(false);
    });

    it('handles exact threshold boundary (Req 7.5)', () => {
      const config: TaxConfig = {
        taxBehavior: 'quantity_threshold',
        taxThreshold: 6,
        taxUnitCount: 1,
        shopifyTaxExemptVariantId: EXEMPT_VARIANT,
      };
      // Exactly at threshold → exempt
      expect(resolveVariant(config, 6, DEFAULT_VARIANT).isExempt).toBe(true);
      // One below → taxable
      expect(resolveVariant(config, 5, DEFAULT_VARIANT).isExempt).toBe(false);
    });
  });
});
