export interface OrderingRules {
  orderMinimum: number;
  orderScope: 'variant' | 'order';
  variantMinimum: number;
  increment: number;
}

export interface QuantityValidation {
  valid: boolean;
  error?: string;
}

/**
 * Defaults per catering type.
 */
export const DEFAULTS_BY_TYPE: Record<string, OrderingRules> = {
  brunch:     { orderMinimum: 12, orderScope: 'variant', variantMinimum: 12, increment: 6 },
  lunch:      { orderMinimum: 6,  orderScope: 'order',   variantMinimum: 0,  increment: 1 },
  dinatoire:  { orderMinimum: 3,  orderScope: 'order',   variantMinimum: 0,  increment: 1 },
};

/**
 * scope = "variant": validate a single variant's quantity.
 * qty must be 0 (not ordered) or >= variantMinimum and (qty - variantMinimum) % increment === 0.
 */
export function validateVariantQuantity(
  qty: number,
  rules: OrderingRules,
): QuantityValidation {
  if (qty === 0) return { valid: true };
  if (rules.orderScope !== 'variant') return { valid: true };
  if (qty < rules.variantMinimum) {
    return { valid: false, error: `Minimum ${rules.variantMinimum} per variant (got ${qty}).` };
  }
  if (rules.increment > 0 && (qty - rules.variantMinimum) % rules.increment !== 0) {
    return { valid: false, error: `Must be ${rules.variantMinimum} then increments of ${rules.increment}.` };
  }
  return { valid: true };
}

/**
 * scope = "order": validate the basket total.
 * total must be >= orderMinimum and (total - orderMinimum) % increment === 0.
 */
export function validateOrderTotal(
  total: number,
  rules: OrderingRules,
): QuantityValidation {
  if (rules.orderScope !== 'order') return { valid: true };
  if (total < rules.orderMinimum) {
    return { valid: false, error: `Minimum order quantity is ${rules.orderMinimum} (got ${total}).` };
  }
  if (rules.increment > 0 && (total - rules.orderMinimum) % rules.increment !== 0) {
    return { valid: false, error: `Must be ${rules.orderMinimum} then increments of ${rules.increment}.` };
  }
  return { valid: true };
}
