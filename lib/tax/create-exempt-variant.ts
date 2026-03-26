/**
 * Creates a tax-exempt Shopify variant for Quebec tax law compliance.
 *
 * Adds a "Tax Mode" option with "Standard" / "Exempt" values, creates the
 * exempt variant at the same price, and disables tax collection on it.
 */

import { shopifyAdminFetch } from '@/lib/shopify/admin';

export interface CreateExemptVariantResult {
  storefrontVariantId: string; // Storefront API GID for cart operations
  adminVariantId: string; // Admin API GID for future updates
}

/**
 * Creates a tax-exempt variant on an existing Shopify product.
 *
 * Steps:
 * 1. Fetch the product to get its current price and check for existing "Tax Mode" option
 * 2. Add "Tax Mode" option with values ["Standard", "Exempt"] via productOptionsCreate
 * 3. Create "Exempt" variant at the same price via productVariantsBulkCreate
 * 4. Set taxable: false on the new variant via productVariantUpdate
 * 5. Convert Admin GID → Storefront GID (base64-encoded)
 */
export async function createTaxExemptVariant(
  shopifyProductId: string,
  currentPrice: string,
): Promise<CreateExemptVariantResult> {
  // Step 1: Fetch product to verify state and check for existing "Tax Mode" option
  const product = await shopifyAdminFetch(
    `query getProduct($id: ID!) {
      product(id: $id) {
        id
        options {
          id
          name
          values
        }
        variants(first: 1) {
          edges {
            node {
              id
              price
            }
          }
        }
      }
    }`,
    { id: shopifyProductId },
  );

  if (!product.product) {
    throw new Error(`Product not found: ${shopifyProductId}`);
  }

  const hasTaxModeOption = product.product.options.some(
    (opt: { name: string }) => opt.name === 'Tax Mode',
  );

  if (hasTaxModeOption) {
    throw new Error(
      `Product ${shopifyProductId} already has a "Tax Mode" option`,
    );
  }

  // Step 2: Add "Tax Mode" option with LEAVE_AS_IS strategy
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
        }
        userErrors { field message }
      }
    }`,
    {
      productId: shopifyProductId,
      variantStrategy: 'LEAVE_AS_IS',
      options: [
        {
          name: 'Tax Mode',
          values: [{ name: 'Standard' }, { name: 'Exempt' }],
        },
      ],
    },
  );

  if (optionData.productOptionsCreate.userErrors.length > 0) {
    throw new Error(
      `Failed to create Tax Mode option: ${JSON.stringify(optionData.productOptionsCreate.userErrors)}`,
    );
  }

  // Step 3: Create "Exempt" variant at the same price
  const bulkCreateData = await shopifyAdminFetch(
    `mutation productVariantsBulkCreate(
      $productId: ID!,
      $variants: [ProductVariantsBulkInput!]!,
      $strategy: ProductVariantsBulkCreateStrategy
    ) {
      productVariantsBulkCreate(
        productId: $productId,
        variants: $variants,
        strategy: $strategy
      ) {
        productVariants {
          id
          title
          price
          selectedOptions { name value }
        }
        userErrors { field message }
      }
    }`,
    {
      productId: shopifyProductId,
      strategy: 'REMOVE_STANDALONE_VARIANT',
      variants: [
        {
          price: currentPrice,
          optionValues: [{ optionName: 'Tax Mode', name: 'Exempt' }],
        },
      ],
    },
  );

  if (bulkCreateData.productVariantsBulkCreate.userErrors.length > 0) {
    throw new Error(
      `Failed to create Exempt variant: ${JSON.stringify(bulkCreateData.productVariantsBulkCreate.userErrors)}`,
    );
  }

  const createdVariants =
    bulkCreateData.productVariantsBulkCreate.productVariants;
  if (!createdVariants || createdVariants.length === 0) {
    throw new Error('No variant returned from productVariantsBulkCreate');
  }

  const adminVariantId = createdVariants[0].id;

  // Step 4: Set taxable: false on the new variant
  const updateData = await shopifyAdminFetch(
    `mutation productVariantUpdate($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
        productVariant {
          id
          taxable
        }
        userErrors { field message }
      }
    }`,
    {
      input: {
        id: adminVariantId,
        taxable: false,
      },
    },
  );

  if (updateData.productVariantUpdate.userErrors.length > 0) {
    throw new Error(
      `Failed to set taxable=false: ${JSON.stringify(updateData.productVariantUpdate.userErrors)}`,
    );
  }

  // Step 5: Convert Admin GID to Storefront GID
  // Admin GID format: gid://shopify/ProductVariant/12345
  // Storefront GID: base64 encode the same string
  const storefrontVariantId = Buffer.from(adminVariantId).toString('base64');

  return {
    storefrontVariantId,
    adminVariantId,
  };
}
