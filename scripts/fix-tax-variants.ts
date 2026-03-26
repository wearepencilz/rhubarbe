/**
 * One-off script to set taxable=false on all Shopify variants
 * that have the Tax option set to "false".
 *
 * Usage: npx tsx scripts/fix-tax-variants.ts
 */

import { shopifyAdminFetch } from '../lib/shopify/admin';
import { isTaxOption } from '../lib/tax/constants';

async function main() {
  // Find all products with a "Tax" option
  const productsData = await shopifyAdminFetch(`
    query {
      products(first: 50, query: "tag:*") {
        edges {
          node {
            id
            title
            options { name values }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  taxable
                  selectedOptions { name value }
                }
              }
            }
          }
        }
      }
    }
  `);

  const products = productsData.products.edges.map((e: any) => e.node);

  for (const product of products) {
    const hasTaxOption = product.options.some((o: any) => isTaxOption(o.name));
    if (!hasTaxOption) continue;

    const variants = product.variants.edges.map((e: any) => e.node);
    const toFix = variants.filter((v: any) => {
      const taxOpt = v.selectedOptions.find((o: any) => isTaxOption(o.name));
      return taxOpt?.value === 'false' && v.taxable === true;
    });

    if (toFix.length === 0) {
      console.log(`${product.title}: all Tax=false variants already have taxable=false`);
      continue;
    }

    console.log(`${product.title}: fixing ${toFix.length} variants...`);

    const updates = toFix.map((v: any) => ({ id: v.id, taxable: false }));

    const result = await shopifyAdminFetch(`
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id taxable }
          userErrors { field message }
        }
      }
    `, { productId: product.id, variants: updates });

    if (result.productVariantsBulkUpdate.userErrors.length > 0) {
      console.error(`  Errors:`, result.productVariantsBulkUpdate.userErrors);
    } else {
      const fixed = result.productVariantsBulkUpdate.productVariants;
      for (const v of fixed) {
        console.log(`  ${v.id} → taxable=${v.taxable}`);
      }
    }
  }

  console.log('Done.');
}

main().catch(console.error);
