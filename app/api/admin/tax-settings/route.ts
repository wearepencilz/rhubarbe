import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchTaxSettings, saveTaxSettings, isValidThreshold, parseTaxSettings } from '@/lib/tax/tax-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await fetchTaxSettings();
    return NextResponse.json({
      thresholdCategories: settings?.thresholdCategories ?? [],
    });
  } catch (error: any) {
    console.error('[tax-settings] GET failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = parseTaxSettings(body.thresholdCategories);

    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid thresholdCategories — expected an array of { category, threshold }' },
        { status: 400 },
      );
    }

    // Validate all thresholds
    for (const tc of parsed.thresholdCategories) {
      if (!isValidThreshold(tc.threshold)) {
        return NextResponse.json(
          { error: `Invalid threshold for "${tc.category}" — must be a positive integer >= 1` },
          { status: 400 },
        );
      }
    }

    await saveTaxSettings(parsed);

    return NextResponse.json({
      thresholdCategories: parsed.thresholdCategories,
    });
  } catch (error: any) {
    console.error('[tax-settings] PUT failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
