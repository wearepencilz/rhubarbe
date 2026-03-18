import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProducts, saveProducts, getFormats, getFlavours } from '@/lib/db';
import { createProduct, type CreateProductInput } from '@/lib/shopify/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get the product
    const products = await getProducts();
    const product = products.find((p: any) => p.id === params.id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if already linked
    if (product.shopifyProductId) {
      return NextResponse.json(
        { 
          error: 'Product is already linked to a Shopify product',
          details: { shopifyProductId: product.shopifyProductId }
        },
        { status: 400 }
      );
    }

    // Validate price
    if (!product.price || product.price <= 0) {
      return NextResponse.json(
        { 
          error: 'Product must have a valid price greater than 0',
          details: { price: product.price }
        },
        { status: 400 }
      );
    }

    // Get format and flavours for product details
    const formats = await getFormats();
    const flavours = await getFlavours();
    
    const format = formats.find((f: any) => f.id === product.formatId);
    
    if (!format) {
      return NextResponse.json(
        { 
          error: 'Format not found for this product',
          details: { formatId: product.formatId }
        },
        { status: 400 }
      );
    }
    
    const primaryFlavours = flavours.filter((f: any) => 
      product.primaryFlavourIds?.includes(f.id)
    );

    if (primaryFlavours.length === 0) {
      return NextResponse.json(
        { 
          error: 'No flavours found for this product',
          details: { primaryFlavourIds: product.primaryFlavourIds }
        },
        { status: 400 }
      );
    }

    // Build product title — use CMS title directly, fall back to flavour+format combo
    const flavourNames = primaryFlavours.map((f: any) => f.name).join(' & ');
    const productTitle = product.title || `${flavourNames} - ${format.name}`;

    // Build description HTML
    const descriptionParts = [
      `<h2>${product.title || ''}</h2>`,
      `<p>${product.description || ''}</p>`,
    ];

    if (primaryFlavours.length > 0) {
      descriptionParts.push('<h3>Flavours</h3>');
      descriptionParts.push('<ul>');
      primaryFlavours.forEach((f: any) => {
        descriptionParts.push(`<li><strong>${f.name}</strong>${f.shortDescription ? `: ${f.shortDescription}` : ''}</li>`);
      });
      descriptionParts.push('</ul>');
    }

    const descriptionHtml = descriptionParts.join('\n');

    // Build tags
    const tags = [
      ...(product.tags || []),
      format.name,
      ...primaryFlavours.map((f: any) => f.type),
    ].filter(Boolean);

    // Prepare Shopify product input
    const shopifyInput: CreateProductInput = {
      title: productTitle,
      descriptionHtml,
      productType: format.category || format.name,
      vendor: 'Janine',
      tags,
      status: product.status === 'active' ? 'ACTIVE' : 'DRAFT',
      variants: [{
        price: (product.price / 100).toFixed(2),
        sku: product.slug || product.id,
        ...(product.inventoryTracked && product.inventoryQuantity ? {
          inventoryQuantities: [{
            availableQuantity: product.inventoryQuantity,
            locationId: process.env.SHOPIFY_LOCATION_ID || '',
          }]
        } : {})
      }],
      ...(product.image ? {
        images: [{
          src: product.image,
          altText: productTitle
        }]
      } : {}),
      metafields: [
        {
          namespace: 'janine',
          key: 'product_id',
          value: product.id,
          type: 'single_line_text_field'
        },
        {
          namespace: 'janine',
          key: 'format_id',
          value: product.formatId,
          type: 'single_line_text_field'
        },
        {
          namespace: 'janine',
          key: 'flavour_ids',
          value: JSON.stringify(product.primaryFlavourIds),
          type: 'json'
        }
      ]
    };

    // Create product in Shopify
    console.log('Creating Shopify product with input:', JSON.stringify(shopifyInput, null, 2));
    const shopifyProduct = await createProduct(shopifyInput);
    
    // Update local product with Shopify IDs
    const productIndex = products.findIndex((p: any) => p.id === params.id);
    products[productIndex] = {
      ...products[productIndex],
      shopifyProductId: shopifyProduct.id,
      shopifyProductHandle: shopifyProduct.handle,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveProducts(products);

    return NextResponse.json({
      success: true,
      shopifyProduct: {
        id: shopifyProduct.id,
        handle: shopifyProduct.handle,
        title: shopifyProduct.title,
        status: shopifyProduct.status,
      },
      offering: products[productIndex],
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error creating Shopify product:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      product: params.id
    });
    return NextResponse.json(
      { 
        error: 'Failed to create Shopify product',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
