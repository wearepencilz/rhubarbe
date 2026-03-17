import { NextRequest, NextResponse } from 'next/server';
import { getOfferings, getFormats, getFlavours } from '@/lib/db';
import { Offering, Format, Flavour, ValidationResult, ValidationError } from '@/types';

// POST /api/offerings/[id]/validate - Validate offering against format rules
export async function POST(
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

    const errors: ValidationError[] = [];

    // Get format
    const formats = await getFormats();
    const format = formats.find((f: Format) => f.id === offering.formatId);
    
    if (!format) {
      errors.push({
        field: 'formatId',
        message: 'Format not found',
      });
      return NextResponse.json({ valid: false, errors });
    }

    // Get flavours
    const flavours = await getFlavours();
    const primaryFlavours = offering.primaryFlavourIds
      .map((id: string) => flavours.find((f: Flavour) => f.id === id))
      .filter(Boolean) as Flavour[];

    // Check flavour count matches format min/max
    if (format.requiresFlavours) {
      if (primaryFlavours.length < format.minFlavours) {
        errors.push({
          field: 'primaryFlavourIds',
          message: `Format requires at least ${format.minFlavours} flavour(s), but ${primaryFlavours.length} provided`,
        });
      }
      if (primaryFlavours.length > format.maxFlavours) {
        errors.push({
          field: 'primaryFlavourIds',
          message: `Format allows maximum ${format.maxFlavours} flavour(s), but ${primaryFlavours.length} provided`,
        });
      }
    }

    // Format-specific validation
    const formatName = format.name.toLowerCase();

    // Twist format validation
    if (formatName.includes('twist')) {
      if (primaryFlavours.length !== 2) {
        errors.push({
          field: 'primaryFlavourIds',
          message: 'Twist format requires exactly 2 flavours',
        });
      }
      
      // Check twist eligibility
      const ineligibleFlavours = primaryFlavours.filter(f => !f.canBeUsedInTwist);
      if (ineligibleFlavours.length > 0) {
        errors.push({
          field: 'primaryFlavourIds',
          message: `The following flavours are not eligible for twist: ${ineligibleFlavours.map(f => f.name).join(', ')}`,
        });
      }
    }

    // Pint format validation
    if (formatName.includes('pint')) {
      if (primaryFlavours.length !== 1) {
        errors.push({
          field: 'primaryFlavourIds',
          message: 'Pint format requires exactly 1 flavour',
        });
      }
      
      // Check pint eligibility
      const ineligibleFlavours = primaryFlavours.filter(f => !f.canBeSoldAsPint);
      if (ineligibleFlavours.length > 0) {
        errors.push({
          field: 'primaryFlavourIds',
          message: `The following flavours are not eligible for pint: ${ineligibleFlavours.map(f => f.name).join(', ')}`,
        });
      }
    }

    // Sandwich format validation
    if (formatName.includes('sandwich')) {
      if (primaryFlavours.length !== 1) {
        errors.push({
          field: 'primaryFlavourIds',
          message: 'Sandwich format requires exactly 1 flavour',
        });
      }
      
      // Check sandwich eligibility
      const ineligibleFlavours = primaryFlavours.filter(f => !f.canBeUsedInSandwich);
      if (ineligibleFlavours.length > 0) {
        errors.push({
          field: 'primaryFlavourIds',
          message: `The following flavours are not eligible for sandwich: ${ineligibleFlavours.map(f => f.name).join(', ')}`,
        });
      }
    }

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating offering:', error);
    return NextResponse.json(
      { error: 'Failed to validate offering' },
      { status: 500 }
    );
  }
}
