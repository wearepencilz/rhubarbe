/**
 * Creates a tax-exempt Shopify variant for Quebec tax law compliance.
 *
 * Adds a hidden "Tax" option, assigns the existing variant as "true" (taxable),
 * and creates a new "false" (non-taxable) variant with taxable: false at the same price.
 *
 * The "Tax" option is internal — customers never see it because the
 * headless checkout picks the correct variant silently.
 */

import { shopifyAdminFetch } from '@/lib/shopify/admin';
import { isTaxOption, TAX_OPTION_CREATE_NAME } from './constants';

export interface CreateExemptVariantResult {
  storefrontVariantId: string; // Storefront API GID for cart operations
  adminVariantId: string; // Admin API GID for future updates
}

/**
 * Creates a tax-exempt variant on an existing Shopify product.
 *
 * Steps:
 * 1. Fetch the product to get current variant and check for existing "Tax" option
 * 2. Add "Tax" option with values ["true", "false"] via productOptionsCreate
 *    using LEAVE_AS_IS strategy (preserves the existing variant as "true")
 * 3. Create the "false" variant at the same price with taxable: false
 *    using DEFAULT strategy (keeps existing variants intact)
 * 4. Convert Admin GID → Storefront GID (base64-encoded)
 */
export async function createTaxExemptVariant(
  shopifyProductId: string,
  currentPrice: string,
): Promise<CreateExemptVariantResult> {
  // Step 1: Fetch product to verify state
  const product = await shopifyAdminFetch(
    `query getProduct($id: ID!) {
      product(id: $id) {
        id
        options { id name values }
        variants(first: 10) {
          edges {
            node { id price taxable }
          }
        }
      }
    }`,
    { id: shopifyProductId },
  );

  if (!product.product) {
    throw new Error(`Product not found: ${shopifyProductId}`);
  }

  const hasTaxOption = product.product.options.some(
    (opt: { name: string }) => isTaxOption(opt.name),
  );

  if (hasTaxOption) {
    throw new Error(
      `Product ${shopifyProductId} already has a "Tax" option. Exempt variant may already exist.`,
    );
  }

  // Step 2: Add "Tax" option with LEAVE_AS_IS strategy
  // This assigns the existing variant(s) to the first value ("Taxable")
  // without creating any new variants
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
          variants(first: 10) {
            edges { node { id title selectedOptions { name value } } }
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
          name: TAX_OPTION_CREATE_NAME,
          values: [{ name: 'true' }, { name: 'false' }],
        },
      ],
    },
  );

  if (optionData.productOptionsCreate.userErrors.length > 0) {
    throw new Error(
      `Failed to create Tax option: ${JSON.stringify(optionData.productOptionsCreate.userErrors)}`,
    );
  }

  // Step 3: Create "Exempt" variant with taxable: false directly
  // Using DEFAULT strategy to keep existing variants intact
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
          id
          title
          price
          taxable
          selectedOptions { name value }
        }
        userErrors { field message }
      }
    }`,
    {
      productId: shopifyProductId,
      variants: [
        {
          price: currentPrice,
          taxable: false,
          optionValues: [{ optionName: TAX_OPTION_CREATE_NAME, name: 'false' }],
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

  // Step 4: Convert Admin GID to Storefront GID
  const storefrontVariantId = Buffer.from(adminVariantId).toString('base64');

  return {
    storefrontVariantId,
    adminVariantId,
  };
}
