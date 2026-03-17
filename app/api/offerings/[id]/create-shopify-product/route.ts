import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOfferings, saveOfferings, getFlavours, getFormats } from '@/lib/db';
import { createProduct } from '@/lib/shopify/admin';
import type { Offering, Flavour, Format, ErrorResponse } from '@/types';

/**
 * POST /api/offerings/[id]/create-shopify-product
 * Creates a new Shopify product from an offering
 * Requires authentication
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session) {
    const errorResponse: ErrorResponse = {
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    const offerings = await getOfferings() as Offering[];
    const offering = offerings.find(o => o.id === params.id);
    
    if (!offering) {
      const errorResponse: ErrorResponse = {
        error: 'Offering not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if already linked to Shopify
    if (offering.shopifyProductId) {
      const errorResponse: ErrorResponse = {
        error: 'Offering is already linked to a Shopify product',
        code: 'ALREADY_LINKED',
        details: { shopifyProductId: offering.shopifyProductId },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate price
    if (!offering.price || offering.price <= 0) {
      const errorResponse: ErrorResponse = {
        error: 'Offering must have a valid price greater than 0 before creating a Shopify product',
        code: 'INVALID_PRICE',
        details: { price: offering.price },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get format and flavours for product details
    const formats = await getFormats() as Format[];
    const format = formats.find(f => f.id === offering.formatId);
    
    if (!format) {
      const errorResponse: ErrorResponse = {
        error: 'Format not found for this offering',
        code: 'FORMAT_NOT_FOUND',
        details: { formatId: offering.formatId },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const flavours = await getFlavours() as Flavour[];
    const primaryFlavours = flavours.filter(f => 
      offering.primaryFlavourIds.includes(f.id)
    );

    if (primaryFlavours.length === 0) {
      const errorResponse: ErrorResponse = {
        error: 'No flavours found for this offering',
        code: 'NO_FLAVOURS',
        details: { primaryFlavourIds: offering.primaryFlavourIds },
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Build product title
    const flavourNames = primaryFlavours.map(f => f.name).join(' & ');
    const productTitle = `${flavourNames} - ${format?.name || 'Ice Cream'}`;

    // Build description HTML
    const descriptionParts = [
      `<h2>${offering.publicName}</h2>`,
      `<p>${offering.description}</p>`,
    ];

    if (primaryFlavours.length > 0) {
      descriptionParts.push('<h3>Flavours</h3>');
      descriptionParts.push('<ul>');
      primaryFlavours.forEach(f => {
        descriptionParts.push(`<li><strong>${f.name}</strong>: ${f.shortDescription}</li>`);
      });
      descriptionParts.push('</ul>');
    }

    const descriptionHtml = descriptionParts.join('\n');

    // Build tags
    const tags = [
      ...offering.tags,
      format?.name || '',
      ...primaryFlavours.map(f => f.type),
    ].filter(Boolean);

    // Create Shopify product
    const shopifyProduct = await createProduct({
      title: productTitle,
      descriptionHtml,
      productType: format?.category || 'frozen',
      vendor: 'Janine',
      tags,
      status: offering.status === 'active' ? 'ACTIVE' : 'DRAFT',
      variants: [{
        price: (offering.price / 100).toFixed(2),
        sku: offering.shopifySKU || `${offering.slug}-${Date.now()}`,
        ...(offering.inventoryTracked && offering.inventoryQuantity ? {
          inventoryQuantities: [{
            availableQuantity: offering.inventoryQuantity,
            locationId: process.env.SHOPIFY_LOCATION_ID || '',
          }]
        } : {})
      }],
      ...(offering.image ? {
        images: [{
          src: offering.image,
          altText: productTitle
        }]
      } : {}),
      metafields: [
        {
          namespace: 'janine',
          key: 'offering_id',
          value: offering.id,
          type: 'single_line_text_field'
        },
        {
          namespace: 'janine',
          key: 'format_id',
          value: offering.formatId,
          type: 'single_line_text_field'
        },
        {
          namespace: 'janine',
          key: 'flavour_ids',
          value: JSON.stringify(offering.primaryFlavourIds),
          type: 'json'
        }
      ]
    });

    // Update offering with Shopify product info
    const updatedOffering = {
      ...offering,
      shopifyProductId: shopifyProduct.id,
      shopifyProductHandle: shopifyProduct.handle,
      syncStatus: 'synced' as const,
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedOfferings = offerings.map(o => 
      o.id === params.id ? updatedOffering : o
    );
    
    await saveOfferings(updatedOfferings);

    return NextResponse.json({
      success: true,
      offering: updatedOffering,
      shopifyProduct: {
        id: shopifyProduct.id,
        handle: shopifyProduct.handle,
        title: shopifyProduct.title,
        status: shopifyProduct.status,
      },
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Error creating Shopify product:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      offering: params.id
    });
    const errorResponse: ErrorResponse = {
      error: 'Failed to create Shopify product',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
