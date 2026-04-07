import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as cakeProductQueries from '@/lib/db/queries/cake-products';
import { findMissingGridCells } from '@/lib/utils/order-helpers';

// GET /api/cake-products/[id] - Get a single cake product with tiers and variants
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  try {
    const product = await cakeProductQueries.getCakeProductById(params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Cake product not found', timestamp: new Date().toISOString() },
        { status: 404 },
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching cake product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cake product', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

// PUT /api/cake-products/[id] - Update cake config, tiers, and variants
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    // Check product exists
    const existing = await cakeProductQueries.getCakeProductById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Cake product not found', timestamp: new Date().toISOString() },
        { status: 404 },
      );
    }

    // Update cake config fields
    const configFields: Parameters<typeof cakeProductQueries.updateCakeConfig>[1] = {};

    if (body.cakeEnabled !== undefined) configFields.cakeEnabled = body.cakeEnabled;
    if (body.cakeDescription !== undefined) configFields.cakeDescription = body.cakeDescription;
    if (body.cakeInstructions !== undefined) configFields.cakeInstructions = body.cakeInstructions;
    if (body.cakeMinPeople !== undefined) configFields.cakeMinPeople = body.cakeMinPeople;
    if (body.cakeFlavourNotes !== undefined) configFields.cakeFlavourNotes = body.cakeFlavourNotes;
    if (body.cakeDeliveryAvailable !== undefined) configFields.cakeDeliveryAvailable = body.cakeDeliveryAvailable;
    if (body.cakeProductType !== undefined) configFields.cakeProductType = body.cakeProductType;
    if (body.cakeFlavourConfig !== undefined) configFields.cakeFlavourConfig = body.cakeFlavourConfig;
    if (body.cakeTierDetailConfig !== undefined) configFields.cakeTierDetailConfig = body.cakeTierDetailConfig;
    if (body.cakeMaxFlavours !== undefined) configFields.cakeMaxFlavours = body.cakeMaxFlavours;

    if (Object.keys(configFields).length > 0) {
      await cakeProductQueries.updateCakeConfig(params.id, configFields);
    }

    // Validate pricing grid completeness when both flavour config and grid are provided
    if (body.cakeFlavourConfig && body.pricingGrid) {
      const activeFlavours = (body.cakeFlavourConfig as Array<{ handle: string; active: boolean }>)
        .filter((f) => f.active)
        .map((f) => f.handle);
      const sizeValues = [...new Set((body.pricingGrid as Array<{ sizeValue: string }>).map((r) => r.sizeValue))];

      if (activeFlavours.length > 0 && sizeValues.length > 0) {
        const missing = findMissingGridCells(body.pricingGrid, sizeValues, activeFlavours);
        if (missing.length > 0) {
          return NextResponse.json(
            {
              error: 'Incomplete pricing grid',
              details: `Missing prices for ${missing.length} (size, flavour) combination(s)`,
              missingCells: missing,
              timestamp: new Date().toISOString(),
            },
            { status: 400 },
          );
        }
      }
    }

    // Update lead time tiers if provided
    if (body.leadTimeTiers !== undefined) {
      try {
        await cakeProductQueries.setCakeLeadTimeTiers(params.id, body.leadTimeTiers);
      } catch (err: any) {
        return NextResponse.json(
          {
            error: 'Invalid lead time tier configuration',
            details: err.message,
            timestamp: new Date().toISOString(),
          },
          { status: 400 },
        );
      }
    }

    // Update cake variants if provided
    if (body.cakeVariants !== undefined) {
      await cakeProductQueries.setCakeVariants(params.id, body.cakeVariants);
    }

    // Update pricing tiers if provided
    if (body.pricingTiers !== undefined) {
      try {
        await cakeProductQueries.setCakePricingTiers(params.id, body.pricingTiers);
      } catch (err: any) {
        return NextResponse.json(
          {
            error: 'Invalid pricing tier configuration',
            details: err.message,
            timestamp: new Date().toISOString(),
          },
          { status: 400 },
        );
      }
    }

    // Update pricing grid if provided
    if (body.pricingGrid !== undefined) {
      await cakeProductQueries.setCakePricingGrid(params.id, body.pricingGrid);
    }

    // Update addon links if provided
    if (body.addonLinks !== undefined) {
      await cakeProductQueries.setCakeAddonLinks(params.id, body.addonLinks);
    }

    // Return the updated product with tiers and variants
    const updated = await cakeProductQueries.getCakeProductById(params.id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating cake product:', error);
    return NextResponse.json(
      { error: 'Failed to update cake product', timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
