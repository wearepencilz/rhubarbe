import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as productQueries from '@/lib/db/queries/products';
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
    // Get the product from Postgres
    const productResult = await productQueries.getById(params.id);
    const product = productResult as any;
    
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

    // Use CMS price if set, otherwise default to $10.00
    const DEFAULT_PRICE_CENTS = 1000; // $10.00
    const productPrice = (product.price && product.price > 0) ? product.price : DEFAULT_PRICE_CENTS;

    // Build product title from CMS data directly
    const productTitle = product.title || product.slug || product.id;
    const productTitleFr = product.translations?.fr?.title || productTitle;
    const descriptionHtml = [
      product.title ? `<h2>${product.title}</h2>` : '',
      product.description ? `<p>${product.description}</p>` : '',
    ].filter(Boolean).join('\n');

    const tags = [...(product.tags || [])].filter(Boolean);

    // Prepare Shopify product input
    const hasVariants = product.variantType && product.variantType !== 'none' && product.variants && product.variants.length > 0;
    const optionName = product.variantType === 'flavour' ? 'Saveur' : product.variantType === 'size' ? 'Taille' : undefined;

    const shopifyInput: CreateProductInput = {
      title: productTitle,
      descriptionHtml,
      productType: 'Product',
      vendor: 'Janine',
      tags,
      status: product.status === 'active' ? 'ACTIVE' : 'DRAFT',
      ...(hasVariants && optionName ? {
        options: [optionName],
        variants: product.variants.map((v: any) => ({
          price: ((v.price || productPrice) / 100).toFixed(2),
          sku: v.sku || `${product.slug || product.id}-${v.id}`,
          optionValues: [{ optionName, name: v.labelFr || v.label }],
        })),
      } : {
        variants: [{
          price: (productPrice / 100).toFixed(2),
          sku: product.slug || product.id,
          ...(product.inventoryTracked && product.inventoryQuantity ? {
            inventoryQuantities: [{
              availableQuantity: product.inventoryQuantity,
              locationId: process.env.SHOPIFY_LOCATION_ID || '',
            }]
          } : {})
        }],
      }),
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

    // Create product in Shopify (also publishes to Headless channel)
    console.log('Creating Shopify product with input:', JSON.stringify(shopifyInput, null, 2));
    const shopifyProduct = await createProduct(shopifyInput);

    // Verify storefront visibility (small delay to allow propagation)
    let storefrontPublished = false;
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const sfRes = await fetch(`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
        },
        body: JSON.stringify({
          query: `query { product(id: "${shopifyProduct.id}") { id } }`,
        }),
      });
      const sfData = await sfRes.json();
      storefrontPublished = !!sfData?.data?.product;
    } catch { /* ignore */ }
    
    // Update local product with Shopify IDs
    // Map Shopify variant IDs back to CMS variants by matching option values
    let updatedVariants = product.variants;
    if (hasVariants && shopifyProduct.variants?.edges) {
      const shopifyVariants = shopifyProduct.variants.edges.map((e: any) => e.node);
      updatedVariants = (product.variants as any[]).map((v: any) => {
        const variantLabel = v.labelFr || v.label;
        const match = shopifyVariants.find((sv: any) =>
          sv.selectedOptions?.some((opt: any) => opt.value === variantLabel)
        );
        return {
          ...v,
          shopifyVariantId: match?.id || undefined,
        };
      });
    }

    const updatedProduct = await productQueries.update(params.id, {
      shopifyProductId: shopifyProduct.id,
      shopifyProductHandle: shopifyProduct.handle,
      ...(updatedVariants ? { variants: updatedVariants } : {}),
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      shopifyProduct: {
        id: shopifyProduct.id,
        handle: shopifyProduct.handle,
        title: shopifyProduct.title,
        status: shopifyProduct.status,
      },
      offering: updatedProduct,
      storefrontPublished,
      ...(!storefrontPublished ? {
        warning: 'Product was created but is NOT published to the Storefront/Headless sales channel. Checkout will fail until you publish it in Shopify Admin → Products → [Product] → Publishing → Manage → check "Headless".',
      } : {}),
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
