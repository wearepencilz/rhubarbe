/**
 * Catering Ordering Rules — unit tests for all pure logic.
 * Maps to: docs/spec/rhubarbe_catering_ordering_spec.md
 *
 * Covers:
 *   - Ordering rule validation (variant-scope and order-scope)
 *   - Lead time computation
 *   - Menu filtering (dietary + temperature)
 *   - inferCateringTypeQuantities (from specialInstructions)
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  validateVariantQuantity,
  validateOrderTotal,
  DEFAULTS_BY_TYPE,
  type OrderingRules,
} from '@/lib/catering/ordering-rules';
import {
  getEarliestCateringDate,
  DEFAULT_LEAD_TIME_DAYS,
} from '@/lib/catering/lead-time';
import {
  filterCateringMenu,
  type CateringMenuProduct,
  type MenuFilters,
} from '@/lib/catering/menu-filter';

// ─── Fixtures ────────────────────────────────────────────────────────

const BRUNCH_RULES: OrderingRules = DEFAULTS_BY_TYPE.brunch;   // min 12, step 6, variant-scope
const LUNCH_RULES: OrderingRules = DEFAULTS_BY_TYPE.lunch;     // min 6,  step 1, order-scope
const DINATOIRE_RULES: OrderingRules = DEFAULTS_BY_TYPE.dinatoire; // min 3, step 1, order-scope

const PRODUCTS: CateringMenuProduct[] = [
  { id: 'p1', name: 'Croissant', cateringType: 'brunch', dietaryTags: ['vegetarian'], temperatureTags: ['hot'] },
  { id: 'p2', name: 'Tartare', cateringType: 'dinatoire', dietaryTags: [], temperatureTags: ['cold'] },
  { id: 'p3', name: 'Lunch Box', cateringType: 'lunch', dietaryTags: ['vegan', 'gluten-free'], temperatureTags: ['cold'] },
  { id: 'p4', name: 'Quiche', cateringType: 'brunch', dietaryTags: ['vegetarian', 'gluten-free'], temperatureTags: ['hot'] },
  { id: 'p5', name: 'Arancini', cateringType: 'dinatoire', dietaryTags: ['vegan'], temperatureTags: ['hot'] },
];

// ─── Ordering Rules — Brunch (variant-scope, min 12, step 6) ─────────

describe('Brunch ordering rules (variant-scope)', () => {
  it('qty 0 is always valid (not ordered)', () => {
    expect(validateVariantQuantity(0, BRUNCH_RULES).valid).toBe(true);
  });

  it('qty below minimum is invalid', () => {
    const r = validateVariantQuantity(6, BRUNCH_RULES);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/12/);
  });

  it('qty at minimum is valid', () => {
    expect(validateVariantQuantity(12, BRUNCH_RULES).valid).toBe(true);
  });

  it('qty at minimum + step is valid', () => {
    expect(validateVariantQuantity(18, BRUNCH_RULES).valid).toBe(true);
  });

  it('qty between valid steps is invalid', () => {
    const r = validateVariantQuantity(15, BRUNCH_RULES);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/6/);
  });

  it('large valid quantity (12 + 6k) is valid', () => {
    expect(validateVariantQuantity(48, BRUNCH_RULES).valid).toBe(true);
  });

  it('order-scope check is skipped for variant-scope type', () => {
    // validateOrderTotal should pass through for variant-scope
    expect(validateOrderTotal(3, BRUNCH_RULES).valid).toBe(true);
  });
});

// ─── Ordering Rules — Lunch (order-scope, min 6, step 1) ─────────────

describe('Lunch ordering rules (order-scope)', () => {
  it('total below minimum is invalid', () => {
    const r = validateOrderTotal(4, LUNCH_RULES);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/6/);
  });

  it('total at minimum is valid', () => {
    expect(validateOrderTotal(6, LUNCH_RULES).valid).toBe(true);
  });

  it('total above minimum with step 1 is valid', () => {
    expect(validateOrderTotal(11, LUNCH_RULES).valid).toBe(true);
  });

  it('variant-scope check is skipped for order-scope type', () => {
    // validateVariantQuantity should pass through for order-scope
    expect(validateVariantQuantity(2, LUNCH_RULES).valid).toBe(true);
  });
});

// ─── Ordering Rules — Dînatoire (order-scope, min 3, step 1) ─────────

describe('Dînatoire ordering rules (order-scope)', () => {
  it('total of 1 is invalid', () => {
    expect(validateOrderTotal(1, DINATOIRE_RULES).valid).toBe(false);
  });

  it('total of 2 is invalid', () => {
    expect(validateOrderTotal(2, DINATOIRE_RULES).valid).toBe(false);
  });

  it('total at minimum (3) is valid', () => {
    expect(validateOrderTotal(3, DINATOIRE_RULES).valid).toBe(true);
  });

  it('any quantity >= 3 is valid (step 1)', () => {
    for (const qty of [3, 4, 5, 10, 50, 100]) {
      expect(validateOrderTotal(qty, DINATOIRE_RULES).valid).toBe(true);
    }
  });
});

// ─── DEFAULTS_BY_TYPE completeness ───────────────────────────────────

describe('DEFAULTS_BY_TYPE', () => {
  it('has entries for all three catering types', () => {
    expect(DEFAULTS_BY_TYPE).toHaveProperty('brunch');
    expect(DEFAULTS_BY_TYPE).toHaveProperty('lunch');
    expect(DEFAULTS_BY_TYPE).toHaveProperty('dinatoire');
  });

  it('brunch uses variant-scope', () => {
    expect(DEFAULTS_BY_TYPE.brunch.orderScope).toBe('variant');
  });

  it('lunch uses order-scope', () => {
    expect(DEFAULTS_BY_TYPE.lunch.orderScope).toBe('order');
  });

  it('dinatoire uses order-scope', () => {
    expect(DEFAULTS_BY_TYPE.dinatoire.orderScope).toBe('order');
  });

  it('brunch minimum is 12', () => {
    expect(DEFAULTS_BY_TYPE.brunch.variantMinimum).toBe(12);
  });

  it('brunch increment is 6', () => {
    expect(DEFAULTS_BY_TYPE.brunch.increment).toBe(6);
  });

  it('lunch minimum is 6', () => {
    expect(DEFAULTS_BY_TYPE.lunch.orderMinimum).toBe(6);
  });

  it('dinatoire minimum is 3', () => {
    expect(DEFAULTS_BY_TYPE.dinatoire.orderMinimum).toBe(3);
  });
});

// ─── Lead Time ───────────────────────────────────────────────────────

describe('getEarliestCateringDate', () => {
  afterEach(() => vi.useRealTimers());

  it('default lead time is 28 days', () => {
    expect(DEFAULT_LEAD_TIME_DAYS).toBe(28);
  });

  it('returns today + 28 days at midnight by default', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 14, 0)); // Apr 15 2026 2pm

    const result = getEarliestCateringDate();
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4); // May
    expect(result.getDate()).toBe(13); // Apr 15 + 28 = May 13
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('respects custom lead time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15));

    const result = getEarliestCateringDate(7);
    expect(result.getDate()).toBe(22); // Apr 15 + 7 = Apr 22
  });

  it('crosses month boundary correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 20)); // Jan 20

    const result = getEarliestCateringDate(28);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(17); // Jan 20 + 28 = Feb 17
  });

  it('resets time to midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 23, 59, 59));

    const result = getEarliestCateringDate(1);
    expect(result.getHours()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

// ─── Menu Filter ─────────────────────────────────────────────────────

describe('filterCateringMenu', () => {
  it('no filters returns all products', () => {
    expect(filterCateringMenu(PRODUCTS, {})).toHaveLength(PRODUCTS.length);
  });

  it('single dietary filter returns matching products', () => {
    const result = filterCateringMenu(PRODUCTS, { dietaryTags: ['vegetarian'] });
    expect(result.map((p) => p.id)).toEqual(['p1', 'p4']);
  });

  it('multiple dietary filters use AND logic', () => {
    const result = filterCateringMenu(PRODUCTS, { dietaryTags: ['vegetarian', 'gluten-free'] });
    expect(result.map((p) => p.id)).toEqual(['p4']);
  });

  it('dietary filter with no matches returns empty', () => {
    const result = filterCateringMenu(PRODUCTS, { dietaryTags: ['dairy-free'] });
    expect(result).toHaveLength(0);
  });

  it('temperature filter returns matching products', () => {
    const hot = filterCateringMenu(PRODUCTS, { temperatureTag: 'hot' });
    expect(hot.map((p) => p.id)).toEqual(['p1', 'p4', 'p5']);

    const cold = filterCateringMenu(PRODUCTS, { temperatureTag: 'cold' });
    expect(cold.map((p) => p.id)).toEqual(['p2', 'p3']);
  });

  it('dietary + temperature filters combine with AND', () => {
    const result = filterCateringMenu(PRODUCTS, { dietaryTags: ['vegan'], temperatureTag: 'hot' });
    expect(result.map((p) => p.id)).toEqual(['p5']);
  });

  it('empty dietary array is treated as no filter', () => {
    const result = filterCateringMenu(PRODUCTS, { dietaryTags: [] });
    expect(result).toHaveLength(PRODUCTS.length);
  });

  it('preserves product order', () => {
    const result = filterCateringMenu(PRODUCTS, { temperatureTag: 'cold' });
    expect(result[0].id).toBe('p2');
    expect(result[1].id).toBe('p3');
  });
});

// ─── inferCateringTypeQuantities (from orders query) ─────────────────

// Replicate the pure function here for isolated testing
function inferCateringTypeQuantities(
  items: Array<{ productName: string; quantity: number }>,
  specialInstructions: string | null,
): Record<string, number> {
  const qtys: Record<string, number> = {};
  const lines = (specialInstructions ?? '').split('\n');
  const lineItems: Array<{ name: string; qty: number }> = [];
  for (const line of lines) {
    const m = line.match(/^(\d+)[×x]\s+(.+)/);
    if (m) lineItems.push({ qty: parseInt(m[1]), name: m[2].toLowerCase() });
  }
  const source = lineItems.length > 0
    ? lineItems
    : items.map((i) => ({ name: i.productName.toLowerCase(), qty: i.quantity }));
  for (const { name, qty } of source) {
    let type: string;
    if (name.includes('petit-déjeuner') || name.includes('breakfast') || name.includes('brunch') || name.includes('buffet')) type = 'brunch';
    else if (name.includes('lunch box') || name.includes('lunch')) type = 'lunch';
    else type = 'dinatoire';
    qtys[type] = (qtys[type] ?? 0) + qty;
  }
  return qtys;
}

describe('inferCateringTypeQuantities', () => {
  it('parses brunch from specialInstructions', () => {
    const si = '30× Petit-déjeuner — 1 person\n4× Cromesquis de boeuf — 1 set';
    const result = inferCateringTypeQuantities([], si);
    expect(result.brunch).toBe(30);
    expect(result.dinatoire).toBe(4);
    expect(result.lunch).toBeUndefined();
  });

  it('parses lunch from specialInstructions', () => {
    const si = '24× Lunch box — Choix du chef\n6× Arancini truffe';
    const result = inferCateringTypeQuantities([], si);
    expect(result.lunch).toBe(24);
    expect(result.dinatoire).toBe(6);
  });

  it('falls back to items array when no line items in specialInstructions', () => {
    const items = [
      { productName: 'Breakfast platter', quantity: 20 },
      { productName: 'Tartare de boeuf', quantity: 5 },
    ];
    const result = inferCateringTypeQuantities(items, 'Type: Volume Order\nFulfillment: April 22');
    expect(result.brunch).toBe(20);
    expect(result.dinatoire).toBe(5);
  });

  it('accumulates quantities for the same type across multiple lines', () => {
    const si = '4× Cromesquis\n3× Polpette\n2× Tartare';
    const result = inferCateringTypeQuantities([], si);
    expect(result.dinatoire).toBe(9);
  });

  it('handles empty specialInstructions with items fallback', () => {
    const items = [{ productName: 'Lunch box', quantity: 12 }];
    const result = inferCateringTypeQuantities(items, null);
    expect(result.lunch).toBe(12);
  });

  it('defaults unknown items to dinatoire', () => {
    const si = '5× Mystery item';
    const result = inferCateringTypeQuantities([], si);
    expect(result.dinatoire).toBe(5);
  });

  it('total quantity matches sum of all type quantities', () => {
    const si = '30× Petit-déjeuner\n14× Cromesquis';
    const result = inferCateringTypeQuantities([], si);
    const total = Object.values(result).reduce((s, q) => s + q, 0);
    expect(total).toBe(44);
  });
});
