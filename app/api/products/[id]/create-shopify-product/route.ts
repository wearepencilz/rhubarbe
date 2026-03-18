import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProducts, saveProducts } from '@/lib/db';
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

    // Build product title from CMS data directly
    const productTitle = product.title || product.slug || product.id;
    const productTitleFr = product.translations?.fr?.title || productTitle;
    const descriptionHtml = [
      product.title ? `<h2>${product.title}</h2>` : '',
      product.description ? `<p>${product.description}</p>` : '',
    ].filter(Boolean).join('\n');

    const tags = [...(product.tags || [])].filter(Boolean);

    // Prepare Shopify product input
    const shopifyInput: CreateProductInput = {
      title: productTitle,
      descriptionHtml,
      productType: 'Product',
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
        images: [{ src: product.image, altText: productTitle }]
      } : {}),
      metafields: [
        {
          namespace: 'janine',
          key: 'product_id',
          value: product.id,
          type: 'single_line_text_field'
        },
        {
          namespace: 'translations',
          key: 'title_fr',
          value: productTitleFr,
          type: 'single_line_text_field'
        },
        {
          namespace: 'translations',
          key: 'description_fr',
          value: product.translations?.fr?.description || product.description || '',
          type: 'multi_line_text_field'
        },
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
