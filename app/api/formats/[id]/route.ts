import { NextRequest, NextResponse } from 'next/server';
import { getFormats, saveFormats } from '@/lib/db';
import { withDeleteProtection, withUpdateProtection } from '@/lib/api-middleware';
import { createBackup } from '@/lib/data-protection';
import { validateEligibleFlavourTypes } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formats = await getFormats();
    const format = formats.find((f: any) => f.id === params.id);
    
    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(format);
  } catch (error) {
    console.error('Error fetching format:', error);
    return NextResponse.json(
      { error: 'Failed to fetch format' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUpdateProtection('format', async () => {
    const body = await request.json();
    const formats = await getFormats();
    const index = formats.findIndex((f: any) => f.id === params.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      );
    }
    
    // Validate eligibleFlavourTypes if provided
    if (body.eligibleFlavourTypes !== undefined) {
      const validationResult = await validateEligibleFlavourTypes(body.eligibleFlavourTypes);
      if (!validationResult.valid) {
        return NextResponse.json(
          { 
            error: 'Invalid eligibleFlavourTypes',
            details: validationResult.errors
          },
          { status: 400 }
        );
      }
    }
    
    formats[index] = {
      ...formats[index],
      ...body,
      id: params.id,
      updatedAt: new Date().toISOString()
    };
    
    await saveFormats(formats);
    
    return NextResponse.json(formats[index]);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withDeleteProtection('format', params.id, async () => {
    const formats = await getFormats();
    const index = formats.findIndex((f: any) => f.id === params.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      );
    }
    
    formats.splice(index, 1);
    await saveFormats(formats);
    
    return { success: true };
  });
}
