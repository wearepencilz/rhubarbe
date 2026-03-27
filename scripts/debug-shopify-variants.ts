/**
 * Debug: Check what Shopify returns for a product's variants.
 * Usage: npx tsx scripts/debug-shopify-variants.ts <cms-product-id>
 * 
 * Pass the CMS product UUID (from the URL) to look up the linked Shopify product.
 */
import { db } from '../lib/db/client';
import { products } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { shopifyAdminFetch } from '../lib/shopify/admin';

async function main() {
  const cmsId = process.argv[2];
  if (!cmsId) {
    // If no ID, list all volume-enabled products with their Shopify IDs
    const all = await db
      .select({ id: products.id, name: products.name, shopifyProductId: products.shopifyProductId, volumeEnabled: products.volumeEnabled })
      .from(products)
      .where(eq(products.volumeEnabled, true));
    console.log('Volume-enabled products:');
    for (const p of all) {
      console.log(`  ${p.name} | CMS: ${p.id} | Shopify: ${p.shopifyProductId || 'NOT LINKED'}`);
    }
    process.exit(0);
  }

  const [product] = await db.select().from(products).where(eq(products.id, cmsId));
  if (!product) { console.error('Product not found in CMS'); process.exit(1); }

  console.log(`CMS Product: ${product.name}`);
  console.log(`Shopify Product ID: ${product.shopifyProductId}`);
  console.log(`CMS variants JSONB:`, JSON.stringify(product.variants, null, 2));

  if (!product.shopifyProductId) { console.log('No Shopify link'); process.exit(0); }

  const data = await shopifyAdminFetch(
    `query ($id: ID!) {
      product(id: $id) {
        title
        handle
        variants(first: 100) {
          edges {
            node {
              id
              title
              price
              selectedOptions { name value }
            }
          }
        }
      }
    }`,
    { id: product.shopifyProductId },
  );

  if (!data.product) {
    console.error('Shopify product NOT FOUND — link is broken');
    process.exit(1);
  }

  console.log(`\nShopify Product: ${data.product.title} (${data.product.handle})`);
  console.log(`Variants (${data.product.variants.edges.length}):`);
  for (const edge of data.product.variants.edges) {
    const v = edge.node;
    const opts = v.selectedOptions.map((o: any) => `${o.name}=${o.value}`).join(', ');
    console.log(`  ${v.title} | $${v.price} | ${opts} | ${v.id}`);
  }

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
