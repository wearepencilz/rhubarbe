import { NextRequest, NextResponse } from 'next/server';
import { getOfferings, getComponents } from '@/lib/db';
import { Offering, OfferingFull, Component } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerings = await getOfferings();
    const offering = offerings.find((o: Offering) => o.id === params.id);

    if (!offering) {
      return NextResponse.json({ error: 'Offering not found' }, { status: 404 });
    }

    const components = await getComponents();
    const resolvedComponents = offering.componentIds
      ? offering.componentIds.map((id: string) => components.find((c: Component) => c.id === id)).filter(Boolean)
      : undefined;

    const offeringFull: OfferingFull = { ...offering, components: resolvedComponents };
    return NextResponse.json(offeringFull);
  } catch (error) {
    console.error('Error fetching full offering:', error);
    return NextResponse.json({ error: 'Failed to fetch offering details' }, { status: 500 });
  }
}
