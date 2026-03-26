/**
 * Syncs the tax-exempt variant's price to match the taxable variant.
 *
 * Called during product save when the price changes and the product
 * has a linked tax-exempt Shopify variant.
 */

import { shopifyAdminFetch } from '@/lib/shopify/admin';

export async function syncExemptVariantPrice(
  shopifyProductId: string,
  exemptVariantAdminId: string,
  newPrice: string,
): Promise<void> {
  const data = await shopifyAdminFetch(
    `mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      productId: shopifyProductId,
      variants: [{ id: exemptVariantAdminId, price: newPrice }],
    },
  );

  if (data.productVariantsBulkUpdate.userErrors.length > 0) {
    throw new Error(
      `Failed to sync exempt variant price: ${JSON.stringify(data.productVariantsBulkUpdate.userErrors)}`,
    );
  }
}
