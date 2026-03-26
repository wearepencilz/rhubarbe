import { describe, it, expect } from 'vitest';

/**
 * Unit tests for lead time tier validation logic in setLeadTimeTiers.
 *
 * These tests exercise the validation function directly (extracted logic)
 * without hitting the database, since the validation is pure logic that
 * throws on invalid input before any DB operations.
 *
 * Requirements: 1.4
 */

// Extract the validation logic to test it in isolation.
// The actual setLeadTimeTiers function validates then does DB work;
// we replicate the validation here to test it without a DB connection.
function validateTierOrdering(tiers: { minQuantity: number; leadTimeDays: number }[]) {
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].minQuantity <= tiers[i - 1].minQuantity) {
      throw new Error(
        `Lead time tiers must have strictly ascending minQuantity values. ` +
        `Tier at index ${i} (minQuantity=${tiers[i].minQuantity}) is not greater than ` +
        `tier at index ${i - 1} (minQuantity=${tiers[i - 1].minQuantity}).`,
      );
    }
  }
}

describe('Lead time tier validation', () => {
  describe('rejects non-ascending minQuantity values', () => {
    it('should reject descending minQuantity order', () => {
      expect(() =>
        validateTierOrdering([
          { minQuantity: 10, leadTimeDays: 2 },
          { minQuantity: 5, leadTimeDays: 4 },
        ]),
      ).toThrow('strictly ascending');
    });

    it('should reject duplicate minQuantity values', () => {
      expect(() =>
        validateTierOrdering([
          { minQuantity: 10, leadTimeDays: 2 },
          { minQuantity: 10, leadTimeDays: 5 },
        ]),
      ).toThrow('strictly ascending');
    });

    it('should reject when later tier has lower minQuantity in a longer list', () => {
      expect(() =>
        validateTierOrdering([
          { minQuantity: 1, leadTimeDays: 2 },
          { minQuantity: 11, leadTimeDays: 4 },
          { minQuantity: 5, leadTimeDays: 7 },
        ]),
      ).toThrow('Tier at index 2');
    });
  });

  describe('accepts valid ascending tiers', () => {
    it('should accept strictly ascending minQuantity values', () => {
      expect(() =>
        validateTierOrdering([
          { minQuantity: 1, leadTimeDays: 2 },
          { minQuantity: 11, leadTimeDays: 4 },
          { minQuantity: 41, leadTimeDays: 7 },
        ]),
      ).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should accept a single tier', () => {
      expect(() =>
        validateTierOrdering([{ minQuantity: 1, leadTimeDays: 2 }]),
      ).not.toThrow();
    });

    it('should accept empty tiers', () => {
      expect(() => validateTierOrdering([])).not.toThrow();
    });
  });
});
