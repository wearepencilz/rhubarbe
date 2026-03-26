import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminFetch } from '@/lib/shopify/admin';

/**
 * POST /api/shopify/products/create-tax-option
 * Creates the "Tax" option with true/false values on a Shopify product.
 * Idempotent — skips if the option already exists.
 */
export async function POST(request: NextRequest) {
  try {
    const { shopifyProductId } = await request.json();

    if (!shopifyProductId) {
      return NextResponse.json({ error: 'shopifyProductId is required' }, { status: 400 });
    }

    // Check if "Tax" option already exists
    const product = await shopifyAdminFetch(
      `query getProduct($id: ID!) {
        product(id: $id) {
          id
          options { id name values }
          variants(first: 100) {
            edges {
              node { id title price taxable selectedOptions { name value } }
            }
          }
        }
      }`,
      { id: shopifyProductId },
    );

    if (!product.product) {
      return NextResponse.json({ error: 'Product not found in Shopify' }, { status: 404 });
    }

    const hasTaxOption = product.product.options.some(
      (opt: { name: string }) => opt.name === 'Tax',
    );

    if (hasTaxOption) {
      return NextResponse.json({
        message: 'Tax option already exists',
        alreadyExists: true,
      });
    }

    // Get current price from first variant
    const firstVariant = product.product.variants.edges[0]?.node;
    const currentPrice = firstVariant?.price || '0.00';

    // Add "Tax" option with LEAVE_AS_IS strategy
    // Existing variants get assigned to "true" (taxable)
    const optionData = await shopifyAdminFetch(
      `mutation productOptionsCreate(
        $productId: ID!,
        $options: [OptionCreateInput!]!,
        $variantStrategy: ProductOptionCreateVariantStrategy
      ) {
        productOptionsCreate(
          productId: $productId,
          options: $options,
          variantStrategy: $variantStrategy
        ) {
          product {
            id
            options { id name values }
            variants(first: 100) {
              edges { node { id title price taxable selectedOptions { name value } } }
            }
          }
          userErrors { field message }
        }
      }`,
      {
        productId: shopifyProductId,
        variantStrategy: 'LEAVE_AS_IS',
        options: [
          {
            name: 'Tax',
            values: [{ name: 'true' }, { name: 'false' }],
          },
        ],
      },
    );

    if (optionData.productOptionsCreate.userErrors.length > 0) {
      return NextResponse.json(
        { error: `Shopify error: ${JSON.stringify(optionData.productOptionsCreate.userErrors)}` },
        { status: 422 },
      );
    }

    // Create "false" (exempt) variant for each existing variant
    // Get the current variants after option creation
    const existingVariants = optionData.productOptionsCreate.product.variants.edges.map(
      (e: any) => e.node,
    );

    // Create exempt copies — one per existing variant, with Tax=false and taxable=false
    const exemptVariants = existingVariants.map((v: any) => {
      // Get all option values except "Tax", then add Tax=false
      const otherOptions = (v.selectedOptions || [])
        .filter((o: any) => o.name !== 'Tax')
        .map((o: any) => ({ optionName: o.name, name: o.value }));

      return {
        price: v.price,
        taxable: false,
        optionValues: [
          ...otherOptions,
          { optionName: 'Tax', name: 'false' },
        ],
      };
    });

    const bulkCreateData = await shopifyAdminFetch(
      `mutation productVariantsBulkCreate(
        $productId: ID!,
        $variants: [ProductVariantsBulkInput!]!
      ) {
        productVariantsBulkCreate(
          productId: $productId,
          variants: $variants
        ) {
          productVariants {
            id title price taxable
            selectedOptions { name value }
          }
          userErrors { field message }
        }
      }`,
      {
        productId: shopifyProductId,
        variants: exemptVariants,
      },
    );

    if (bulkCreateData.productVariantsBulkCreate.userErrors.length > 0) {
      return NextResponse.json(
        { error: `Failed to create exempt variants: ${JSON.stringify(bulkCreateData.productVariantsBulkCreate.userErrors)}` },
        { status: 422 },
      );
    }

    return NextResponse.json({
      message: 'Tax option created with exempt variants',
      createdVariants: bulkCreateData.productVariantsBulkCreate.productVariants,
    });
  } catch (error) {
    console.error('[Tax Option] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Tax option' },
      { status: 500 },
    );
  }
}
