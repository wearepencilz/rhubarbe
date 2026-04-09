export interface CateringOrderingRule {
  minQuantity: number;
  quantityStep: number;
  label: { en: string; fr: string };
}

export type CateringOrderingRules = Record<string, CateringOrderingRule>;

export interface QuantityValidation {
  valid: boolean;
  error?: string;
}

export interface OrderLineItem {
  productId: string;
  productName: string;
  cateringType: string;
  quantity: number;
}

export interface OrderValidation {
  valid: boolean;
  errors: Array<{
    productId: string;
    productName: string;
    cateringType: string;
    quantity: number;
    rule: CateringOrderingRule;
    message: string;
  }>;
}

export function validateCateringQuantity(
  quantity: number,
  cateringType: string,
  rules: CateringOrderingRules,
): QuantityValidation {
  const rule = rules[cateringType];
  if (!rule) return { valid: false, error: `No ordering rules configured for type "${cateringType}".` };
  if (quantity < rule.minQuantity) return { valid: false, error: `Minimum quantity is ${rule.minQuantity} (got ${quantity}).` };
  if ((quantity - rule.minQuantity) % rule.quantityStep !== 0) {
    return { valid: false, error: `Quantity must be ${rule.minQuantity} then increments of ${rule.quantityStep} (got ${quantity}).` };
  }
  return { valid: true };
}

export function validateCateringOrder(
  items: OrderLineItem[],
  rules: CateringOrderingRules,
): OrderValidation {
  const errors: OrderValidation['errors'] = [];
  for (const item of items) {
    const rule = rules[item.cateringType];
    if (!rule) {
      errors.push({ ...item, rule: { minQuantity: 0, quantityStep: 0, label: { en: '', fr: '' } }, message: `No ordering rules configured for type "${item.cateringType}".` });
      continue;
    }
    const result = validateCateringQuantity(item.quantity, item.cateringType, rules);
    if (!result.valid) {
      errors.push({ ...item, rule, message: result.error! });
    }
  }
  return { valid: errors.length === 0, errors };
}

export const DEFAULT_RULES: CateringOrderingRules = {
  brunch: { minQuantity: 12, quantityStep: 6, label: { en: 'Brunch', fr: 'Brunch' } },
  lunch: { minQuantity: 6, quantityStep: 1, label: { en: 'Lunch', fr: 'Lunch' } },
  dinatoire: { minQuantity: 3, quantityStep: 1, label: { en: 'Dînatoire', fr: 'Dînatoire' } },
};
