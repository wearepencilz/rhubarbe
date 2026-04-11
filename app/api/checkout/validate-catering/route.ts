import { NextRequest, NextResponse } from 'next/server';
import { validateVariantQuantity, validateOrderTotal, DEFAULTS_BY_TYPE, type OrderingRules } from '@/lib/catering/ordering-rules';
import { getEarliestCateringDate, DEFAULT_LEAD_TIME_DAYS } from '@/lib/catering/lead-time';
import * as settingsQueries from '@/lib/db/queries/settings';
import { db } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, requestedDate } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 });
    }

    const allSettings = await settingsQueries.getAll();
    const typeSettings = (allSettings.cateringTypeSettings ?? {}) as Record<string, Partial<OrderingRules>>;
    const leadTimeDays = (allSettings.cateringLeadTimeDays as number) ?? DEFAULT_LEAD_TIME_DAYS;

    const errors: string[] = [];

    for (const item of items) {
      const [product] = await db
        .select({ cateringType: products.cateringType })
        .from(products)
        .where(eq(products.id, item.productId));

      const cateringType = product?.cateringType ?? '';
      const saved = typeSettings[cateringType];
      const defaults = DEFAULTS_BY_TYPE[cateringType];
      const rules: OrderingRules = {
        orderMinimum: saved?.orderMinimum ?? defaults?.orderMinimum ?? 1,
        orderScope: saved?.orderScope ?? defaults?.orderScope ?? 'order',
        variantMinimum: saved?.variantMinimum ?? defaults?.variantMinimum ?? 0,
        increment: saved?.increment ?? defaults?.increment ?? 1,
      };

      if (rules.orderScope === 'variant') {
        const result = validateVariantQuantity(item.quantity, rules);
        if (!result.valid) errors.push(`${item.productName}: ${result.error}`);
      } else {
        const result = validateOrderTotal(item.quantity, rules);
        if (!result.valid) errors.push(`${item.productName}: ${result.error}`);
      }
    }

    // Validate lead time
    if (requestedDate) {
      const earliest = getEarliestCateringDate(leadTimeDays);
      const requested = new Date(requestedDate);
      if (requested < earliest) {
        errors.push(`Earliest allowed date is ${earliest.toISOString().split('T')[0]}. Requested: ${requestedDate}.`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ valid: false, errors }, { status: 422 });
    }

    return NextResponse.json({ valid: true, errors: [] });
  } catch (error) {
    console.error('Error validating catering order:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
