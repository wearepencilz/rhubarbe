import { NextRequest, NextResponse } from 'next/server';
import { getOfferings, getFormats, getFlavours, getComponents } from '@/lib/db';
import { Offering, OfferingFull, Format, Flavour, Component } from '@/types';

// GET /api/offerings/[id]/full - Get offering with populated format and flavours
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerings = await getOfferings();
    const offering = offerings.find((o: Offering) => o.id === params.id);

    if (!offering) {
      return NextResponse.json(
        { error: 'Offering not found' },
        { status: 404 }
      );
    }

    // Fetch related data
    const formats = await getFormats();
    const flavours = await getFlavours();
    const components = await getComponents();

    // Resolve format
    const format = formats.find((f: Format) => f.id === offering.formatId);
    if (!format) {
      return NextResponse.json(
        { error: 'Format not found for this offering' },
        { status: 404 }
      );
    }

    // Resolve primary flavours
    const primaryFlavours = offering.primaryFlavourIds
      .map((id: string) => flavours.find((f: Flavour) => f.id === id))
      .filter(Boolean) as Flavour[];

    // Resolve secondary flavours (if present)
    const secondaryFlavours = offering.secondaryFlavourIds
      ? offering.secondaryFlavourIds
          .map((id: string) => flavours.find((f: Flavour) => f.id === id))
          .filter(Boolean) as Flavour[]
      : undefined;

    // Resolve components (if present)
    const resolvedComponents = offering.componentIds
      ? offering.componentIds
          .map((id: string) => components.find((c: Component) => c.id === id))
          .filter(Boolean) as Component[]
      : undefined;

    // Build full offering
    const offeringFull: OfferingFull = {
      ...offering,
      format,
      primaryFlavours,
      secondaryFlavours,
      components: resolvedComponents,
    };

    return NextResponse.json(offeringFull);
  } catch (error) {
    console.error('Error fetching full offering:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offering details' },
      { status: 500 }
    );
  }
}
