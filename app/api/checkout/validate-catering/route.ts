import { NextRequest, NextResponse } from 'next/server';
import { validateCateringOrder, type CateringOrderingRules, DEFAULT_RULES } from '@/lib/catering/ordering-rules';
import { getEarliestCateringDate, DEFAULT_LEAD_TIME_DAYS } from '@/lib/catering/lead-time';
import * as settingsQueries from '@/lib/db/queries/settings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, requestedDate } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 });
    }

    const allSettings = await settingsQueries.getAll();
    const rules = (allSettings.cateringOrderingRules as CateringOrderingRules) ?? DEFAULT_RULES;
    const leadTimeDays = (allSettings.cateringLeadTimeDays as number) ?? DEFAULT_LEAD_TIME_DAYS;

    const errors: string[] = [];

    // Validate quantities
    const orderResult = validateCateringOrder(items, rules);
    if (!orderResult.valid) {
      for (const e of orderResult.errors) errors.push(e.message);
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
