/**
 * Unit tests for product generation eligibility functions
 * 
 * Tests the core eligibility checking logic for format-flavour combinations.
 */

import { describe, it, expect } from 'vitest';
import { isFormatEligibleForFlavour, isFormatEligibleForFlavours, buildGenerationReport } from '@/lib/product-generation';

describe('isFormatEligibleForFlavour', () => {
  describe('backward compatibility - formats without eligibility rules', () => {
    it('should accept all flavours when format has no eligibleFlavourTypes field', () => {
      const format = {};
      const gelatoFlavour = { type: 'gelato' };
      const sorbetFlavour = { type: 'sorbet' };
      const softServeFlavour = { type: 'soft-serve-base' };

      expect(isFormatEligibleForFlavour(format, gelatoFlavour)).toBe(true);
      expect(isFormatEligibleForFlavour(format, sorbetFlavour)).toBe(true);
      expect(isFormatEligibleForFlavour(format, softServeFlavour)).toBe(true);
    });

    it('should accept all flavours when format has empty eligibleFlavourTypes array', () => {
      const format = { eligibleFlavourTypes: [] };
      const gelatoFlavour = { type: 'gelato' };
      const sorbetFlavour = { type: 'sorbet' };
      const softServeFlavour = { type: 'soft-serve-base' };

      expect(isFormatEligibleForFlavour(format, gelatoFlavour)).toBe(true);
      expect(isFormatEligibleForFlavour(format, sorbetFlavour)).toBe(true);
      expect(isFormatEligibleForFlavour(format, softServeFlavour)).toBe(true);
    });
  });

  describe('single eligible type', () => {
    it('should accept flavours matching the single eligible type', () => {
      const format = { eligibleFlavourTypes: ['gelato'] };
      const gelatoFlavour = { type: 'gelato' };

      expect(isFormatEligibleForFlavour(format, gelatoFlavour)).toBe(true);
    });

    it('should reject flavours not matching the single eligible type', () => {
      const format = { eligibleFlavourTypes: ['gelato'] };
      const sorbetFlavour = { type: 'sorbet' };
      const softServeFlavour = { type: 'soft-serve-base' };

      expect(isFormatEligibleForFlavour(format, sorbetFlavour)).toBe(false);
      expect(isFormatEligibleForFlavour(format, softServeFlavour)).toBe(false);
    });
  });

  describe('multiple eligible types', () => {
    it('should accept flavours matching any of the eligible types', () => {
      const format = { eligibleFlavourTypes: ['gelato', 'sorbet'] };
      const gelatoFlavour = { type: 'gelato' };
      const sorbetFlavour = { type: 'sorbet' };

      expect(isFormatEligibleForFlavour(format, gelatoFlavour)).toBe(true);
      expect(isFormatEligibleForFlavour(format, sorbetFlavour)).toBe(true);
    });

    it('should reject flavours not matching any eligible type', () => {
      const format = { eligibleFlavourTypes: ['gelato', 'sorbet'] };
      const softServeFlavour = { type: 'soft-serve-base' };
      const cookieFlavour = { type: 'cookie' };

      expect(isFormatEligibleForFlavour(format, softServeFlavour)).toBe(false);
      expect(isFormatEligibleForFlavour(format, cookieFlavour)).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle scoop format accepting gelato and sorbet', () => {
      const scoopFormat = { eligibleFlavourTypes: ['gelato', 'sorbet'] };
      const vanillaGelato = { type: 'gelato' };
      const lemonSorbet = { type: 'sorbet' };
      const softServe = { type: 'soft-serve-base' };

      expect(isFormatEligibleForFlavour(scoopFormat, vanillaGelato)).toBe(true);
      expect(isFormatEligibleForFlavour(scoopFormat, lemonSorbet)).toBe(true);
      expect(isFormatEligibleForFlavour(scoopFormat, softServe)).toBe(false);
    });

    it('should handle sandwich format accepting only gelato', () => {
      const sandwichFormat = { eligibleFlavourTypes: ['gelato'] };
      const chocolateGelato = { type: 'gelato' };
      const strawberrySorbet = { type: 'sorbet' };

      expect(isFormatEligibleForFlavour(sandwichFormat, chocolateGelato)).toBe(true);
      expect(isFormatEligibleForFlavour(sandwichFormat, strawberrySorbet)).toBe(false);
    });

    it('should handle soft-serve format accepting only soft-serve-base', () => {
      const softServeFormat = { eligibleFlavourTypes: ['soft-serve-base'] };
      const vanillaSoftServe = { type: 'soft-serve-base' };
      const chocolateGelato = { type: 'gelato' };

      expect(isFormatEligibleForFlavour(softServeFormat, vanillaSoftServe)).toBe(true);
      expect(isFormatEligibleForFlavour(softServeFormat, chocolateGelato)).toBe(false);
    });

    it('should handle legacy format without eligibility rules', () => {
      const legacyFormat = {};
      const anyFlavour1 = { type: 'gelato' };
      const anyFlavour2 = { type: 'sorbet' };
      const anyFlavour3 = { type: 'soft-serve-base' };

      expect(isFormatEligibleForFlavour(legacyFormat, anyFlavour1)).toBe(true);
      expect(isFormatEligibleForFlavour(legacyFormat, anyFlavour2)).toBe(true);
      expect(isFormatEligibleForFlavour(legacyFormat, anyFlavour3)).toBe(true);
    });
  });
});

describe('isFormatEligibleForFlavours', () => {
  describe('backward compatibility - formats without eligibility rules', () => {
    it('should accept all flavour combinations when format has no eligibleFlavourTypes field', () => {
      const format = { allowMixedTypes: true };
      const gelatoFlavour = { type: 'gelato' };
      const sorbetFlavour = { type: 'sorbet' };

      expect(isFormatEligibleForFlavours(format, [gelatoFlavour, sorbetFlavour])).toBe(true);
      expect(isFormatEligibleForFlavours(format, [gelatoFlavour, gelatoFlavour])).toBe(true);
    });

    it('should accept all flavour combinations when format has empty eligibleFlavourTypes array', () => {
      const format = { eligibleFlavourTypes: [], allowMixedTypes: true };
      const gelatoFlavour = { type: 'gelato' };
      const sorbetFlavour = { type: 'sorbet' };

      expect(isFormatEligibleForFlavours(format, [gelatoFlavour, sorbetFlavour])).toBe(true);
    });
  });

  describe('single type combinations', () => {
    it('should accept combinations where all flavours have the same eligible type', () => {
      const format = { 
        eligibleFlavourTypes: ['gelato', 'sorbet'],
        allowMixedTypes: false 
      };
      const gelatoFlavour1 = { type: 'gelato' };
      const gelatoFlavour2 = { type: 'gelato' };

      expect(isFormatEligibleForFlavours(format, [gelatoFlavour1, gelatoFlavour2])).toBe(true);
    });

    it('should reject combinations where any flavour is ineligible', () => {
      const format = { 
        eligibleFlavourTypes: ['gelato'],
        allowMixedTypes: false 
      };
      const gelatoFlavour = { type: 'gelato' };
      const sorbetFlavour = { type: 'sorbet' };

      expect(isFormatEligibleForFlavours(format, [gelatoFlavour, sorbetFlavour])).toBe(false);
    });
  });

  describe('mixed type combinations', () => {
    it('should accept mixed types when allowMixedTypes is true and all types are eligible', () => {
      const format = { 
        eligibleFlavourTypes: ['gelato', 'sorbet'],
        allowMixedTypes: true 
      };
      const gelatoFlavour = { type: 'gelato' };
      const sorbetFlavour = { type: 'sorbet' };

      expect(isFormatEligibleForFlavours(format, [gelatoFlavour, sorbetFlavour])).toBe(true);
    });

    it('should reject mixed types when allowMixedTypes is false', () => {
      const format = { 
        eligibleFlavourTypes: ['gelato', 'sorbet'],
        allowMixedTypes: false 
      };
      const gelatoFlavour = { type: 'gelato' };
      const sorbetFlavour = { type: 'sorbet' };

      expect(isFormatEligibleForFlavours(format, [gelatoFlavour, sorbetFlavour])).toBe(false);
    });

    it('should reject mixed types when one type is ineligible', () => {
      const format = { 
        eligibleFlavourTypes: ['gelato'],
        allowMixedTypes: true 
      };
      const gelatoFlavour = { type: 'gelato' };
      const sorbetFlavour = { type: 'sorbet' };

      expect(isFormatEligibleForFlavours(format, [gelatoFlavour, sorbetFlavour])).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle twist format allowing mixed gelato and sorbet', () => {
      const twistFormat = { 
        eligibleFlavourTypes: ['gelato', 'sorbet'],
        allowMixedTypes: true 
      };
      const vanillaGelato = { type: 'gelato' };
      const chocolateGelato = { type: 'gelato' };
      const lemonSorbet = { type: 'sorbet' };

      // Same type combinations
      expect(isFormatEligibleForFlavours(twistFormat, [vanillaGelato, chocolateGelato])).toBe(true);
      
      // Mixed type combinations
      expect(isFormatEligibleForFlavours(twistFormat, [vanillaGelato, lemonSorbet])).toBe(true);
      expect(isFormatEligibleForFlavours(twistFormat, [chocolateGelato, lemonSorbet])).toBe(true);
    });

    it('should handle gelato-only twist format', () => {
      const gelatoTwistFormat = { 
        eligibleFlavourTypes: ['gelato'],
        allowMixedTypes: false 
      };
      const vanillaGelato = { type: 'gelato' };
      const chocolateGelato = { type: 'gelato' };
      const lemonSorbet = { type: 'sorbet' };

      // Gelato combinations should work
      expect(isFormatEligibleForFlavours(gelatoTwistFormat, [vanillaGelato, chocolateGelato])).toBe(true);
      
      // Mixed with sorbet should fail
      expect(isFormatEligibleForFlavours(gelatoTwistFormat, [vanillaGelato, lemonSorbet])).toBe(false);
    });

    it('should handle format that requires same type but accepts multiple types', () => {
      const format = { 
        eligibleFlavourTypes: ['gelato', 'sorbet'],
        allowMixedTypes: false 
      };
      const vanillaGelato = { type: 'gelato' };
      const chocolateGelato = { type: 'gelato' };
      const lemonSorbet = { type: 'sorbet' };
      const strawberrySorbet = { type: 'sorbet' };

      // Same type combinations should work
      expect(isFormatEligibleForFlavours(format, [vanillaGelato, chocolateGelato])).toBe(true);
      expect(isFormatEligibleForFlavours(format, [lemonSorbet, strawberrySorbet])).toBe(true);
      
      // Mixed type should fail
      expect(isFormatEligibleForFlavours(format, [vanillaGelato, lemonSorbet])).toBe(false);
    });

    it('should handle three-flavour combinations', () => {
      const format = { 
        eligibleFlavourTypes: ['gelato', 'sorbet'],
        allowMixedTypes: true 
      };
      const vanillaGelato = { type: 'gelato' };
      const chocolateGelato = { type: 'gelato' };
      const lemonSorbet = { type: 'sorbet' };

      expect(isFormatEligibleForFlavours(format, [vanillaGelato, chocolateGelato, lemonSorbet])).toBe(true);
    });

    it('should reject if any flavour in multi-flavour combination is ineligible', () => {
      const format = { 
        eligibleFlavourTypes: ['gelato', 'sorbet'],
        allowMixedTypes: true 
      };
      const vanillaGelato = { type: 'gelato' };
      const lemonSorbet = { type: 'sorbet' };
      const softServe = { type: 'soft-serve-base' };

      expect(isFormatEligibleForFlavours(format, [vanillaGelato, lemonSorbet, softServe])).toBe(false);
    });
  });
});

describe('buildGenerationReport', () => {
  describe('empty results', () => {
    it('should handle no products created and no skipped combinations', () => {
      const report = buildGenerationReport({
        createdProducts: [],
        skippedCombinations: [],
        totalProducts: 0
      });

      expect(report.success).toBe(true);
      expect(report.created).toBe(0);
      expect(report.skipped).toBe(0);
      expect(report.total).toBe(0);
      expect(report.message).toBe('No products to generate.');
      expect(report.details).toBeUndefined();
    });
  });

  describe('only created products', () => {
    it('should generate report for single product created', () => {
      const report = buildGenerationReport({
        createdProducts: [
          { formatName: 'Scoop', flavourType: 'gelato', flavourName: 'Vanilla' }
        ],
        skippedCombinations: [],
        totalProducts: 1
      });

      expect(report.success).toBe(true);
      expect(report.created).toBe(1);
      expect(report.skipped).toBe(0);
      expect(report.total).toBe(1);
      expect(report.message).toContain('Generated 1 product');
      expect(report.breakdown.byFormat['Scoop']).toEqual({
        created: 1,
        skipped: 0,
        flavourTypes: ['gelato']
      });
      expect(report.breakdown.byFlavourType['gelato']).toBe(1);
      expect(report.details).toBeUndefined();
    });

    it('should generate report for multiple products created', () => {
      const report = buildGenerationReport({
        createdProducts: [
          { formatName: 'Scoop', flavourType: 'gelato', flavourName: 'Vanilla' },
          { formatName: 'Scoop', flavourType: 'sorbet', flavourName: 'Lemon' },
          { formatName: 'Sandwich', flavourType: 'gelato', flavourName: 'Chocolate' }
        ],
        skippedCombinations: [],
        totalProducts: 3
      });

      expect(report.success).toBe(true);
      expect(report.created).toBe(3);
      expect(report.skipped).toBe(0);
      expect(report.total).toBe(3);
      expect(report.message).toContain('Generated');
      expect(report.message).toContain('3');
      expect(report.breakdown.byFormat['Scoop']).toEqual({
        created: 2,
        skipped: 0,
        flavourTypes: ['gelato', 'sorbet']
      });
      expect(report.breakdown.byFormat['Sandwich']).toEqual({
        created: 1,
        skipped: 0,
        flavourTypes: ['gelato']
      });
      expect(report.breakdown.byFlavourType['gelato']).toBe(2);
      expect(report.breakdown.byFlavourType['sorbet']).toBe(1);
    });
  });

  describe('only skipped combinations', () => {
    it('should generate report for only skipped combinations', () => {
      const report = buildGenerationReport({
        createdProducts: [],
        skippedCombinations: [
          { formatName: 'Sandwich', flavourName: 'Lemon', reason: 'Flavour type sorbet not eligible' }
        ],
        totalProducts: 0
      });

      expect(report.success).toBe(true);
      expect(report.created).toBe(0);
      expect(report.skipped).toBe(1);
      expect(report.total).toBe(0);
      expect(report.message).toContain('No products created');
      expect(report.message).toContain('1 combination skipped');
      expect(report.breakdown.byFormat['Sandwich']).toEqual({
        created: 0,
        skipped: 1,
        flavourTypes: []
      });
      expect(report.details).toBeDefined();
      expect(report.details?.skippedCombinations).toHaveLength(1);
    });
  });

  describe('mixed results', () => {
    it('should generate report with both created and skipped products', () => {
      const report = buildGenerationReport({
        createdProducts: [
          { formatName: 'Scoop', flavourType: 'gelato', flavourName: 'Vanilla' },
          { formatName: 'Scoop', flavourType: 'sorbet', flavourName: 'Lemon' }
        ],
        skippedCombinations: [
          { formatName: 'Sandwich', flavourName: 'Lemon', reason: 'Flavour type sorbet not eligible' }
        ],
        totalProducts: 2
      });

      expect(report.success).toBe(true);
      expect(report.created).toBe(2);
      expect(report.skipped).toBe(1);
      expect(report.total).toBe(2);
      expect(report.message).toContain('Generated 2 products');
      expect(report.message).toContain('Skipped 1 combination');
      expect(report.breakdown.byFormat['Scoop']).toEqual({
        created: 2,
        skipped: 0,
        flavourTypes: ['gelato', 'sorbet']
      });
      expect(report.breakdown.byFormat['Sandwich']).toEqual({
        created: 0,
        skipped: 1,
        flavourTypes: []
      });
      expect(report.details).toBeDefined();
      expect(report.details?.skippedCombinations).toHaveLength(1);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle launch with mixed types and eligibility rules', () => {
      const report = buildGenerationReport({
        createdProducts: [
          { formatName: 'Scoop', flavourType: 'gelato', flavourName: 'Vanilla Bean' },
          { formatName: 'Scoop', flavourType: 'gelato', flavourName: 'Dark Chocolate' },
          { formatName: 'Scoop', flavourType: 'sorbet', flavourName: 'Lemon' },
          { formatName: 'Sandwich', flavourType: 'gelato', flavourName: 'Vanilla Bean' },
          { formatName: 'Sandwich', flavourType: 'gelato', flavourName: 'Dark Chocolate' },
          { formatName: 'Twist', flavourType: 'gelato', flavourName: 'Vanilla Bean + Dark Chocolate' },
          { formatName: 'Twist', flavourType: 'gelato', flavourName: 'Vanilla Bean + Lemon' },
          { formatName: 'Twist', flavourType: 'gelato', flavourName: 'Dark Chocolate + Lemon' }
        ],
        skippedCombinations: [
          { formatName: 'Sandwich', flavourName: 'Lemon', reason: 'Flavour type sorbet not eligible for this format' }
        ],
        totalProducts: 8
      });

      expect(report.success).toBe(true);
      expect(report.created).toBe(8);
      expect(report.skipped).toBe(1);
      expect(report.total).toBe(8);
      expect(report.breakdown.byFormat['Scoop'].created).toBe(3);
      expect(report.breakdown.byFormat['Sandwich'].created).toBe(2);
      expect(report.breakdown.byFormat['Sandwich'].skipped).toBe(1);
      expect(report.breakdown.byFormat['Twist'].created).toBe(3);
      expect(report.breakdown.byFlavourType['gelato']).toBe(7);
      expect(report.breakdown.byFlavourType['sorbet']).toBe(1);
    });

    it('should handle soft-serve launch with specific eligibility', () => {
      const report = buildGenerationReport({
        createdProducts: [
          { formatName: 'Soft Serve', flavourType: 'soft-serve-base', flavourName: 'Vanilla Soft Serve' },
          { formatName: 'Soft Serve', flavourType: 'soft-serve-base', flavourName: 'Chocolate Soft Serve' },
          { formatName: 'Sundae', flavourType: 'soft-serve-base', flavourName: 'Vanilla Soft Serve Sundae' },
          { formatName: 'Sundae', flavourType: 'soft-serve-base', flavourName: 'Chocolate Soft Serve Sundae' }
        ],
        skippedCombinations: [
          { formatName: 'Scoop', flavourName: 'Vanilla Soft Serve', reason: 'Flavour type soft-serve-base not eligible for this format' },
          { formatName: 'Scoop', flavourName: 'Chocolate Soft Serve', reason: 'Flavour type soft-serve-base not eligible for this format' }
        ],
        totalProducts: 4
      });

      expect(report.success).toBe(true);
      expect(report.created).toBe(4);
      expect(report.skipped).toBe(2);
      expect(report.breakdown.byFormat['Soft Serve'].created).toBe(2);
      expect(report.breakdown.byFormat['Sundae'].created).toBe(2);
      expect(report.breakdown.byFormat['Scoop'].skipped).toBe(2);
      expect(report.breakdown.byFlavourType['soft-serve-base']).toBe(4);
    });
  });

  describe('message generation', () => {
    it('should use singular form for 1 product', () => {
      const report = buildGenerationReport({
        createdProducts: [
          { formatName: 'Scoop', flavourType: 'gelato', flavourName: 'Vanilla' }
        ],
        skippedCombinations: [],
        totalProducts: 1
      });

      expect(report.message).toContain('1 product');
      expect(report.message).not.toContain('products');
    });

    it('should use plural form for multiple products', () => {
      const report = buildGenerationReport({
        createdProducts: [
          { formatName: 'Scoop', flavourType: 'gelato', flavourName: 'Vanilla' },
          { formatName: 'Scoop', flavourType: 'sorbet', flavourName: 'Lemon' }
        ],
        skippedCombinations: [],
        totalProducts: 2
      });

      expect(report.message).toContain('2 products');
    });

    it('should use singular form for 1 skipped combination', () => {
      const report = buildGenerationReport({
        createdProducts: [
          { formatName: 'Scoop', flavourType: 'gelato', flavourName: 'Vanilla' }
        ],
        skippedCombinations: [
          { formatName: 'Sandwich', flavourName: 'Lemon', reason: 'Not eligible' }
        ],
        totalProducts: 1
      });

      expect(report.message).toContain('1 combination');
      expect(report.message).not.toContain('combinations');
    });

    it('should use plural form for multiple skipped combinations', () => {
      const report = buildGenerationReport({
        createdProducts: [
          { formatName: 'Scoop', flavourType: 'gelato', flavourName: 'Vanilla' }
        ],
        skippedCombinations: [
          { formatName: 'Sandwich', flavourName: 'Lemon', reason: 'Not eligible' },
          { formatName: 'Sandwich', flavourName: 'Strawberry', reason: 'Not eligible' }
        ],
        totalProducts: 1
      });

      expect(report.message).toContain('2 combinations');
    });
  });
});
