import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { db } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Shopify Webhook: products/update
 *
 * Fires whenever a product is updated in Shopify (title, image, status, etc.).
 * We match by shopifyProductId and sync the featured image back to the CMS.
 *
 * Setup in Shopify Admin → Settings → Notifications → Webhooks:
 *   Event: Product update
 *   URL:   https://your-domain.com/api/shopify/webhooks/products-update
 *   Format: JSON
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify HMAC signature
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (secret && hmacHeader) {
    const digest = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (digest !== hmacHeader) {
      console.error('[Webhook products/update] HMAC verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (secret) {
    console.error('[Webhook products/update] Missing HMAC header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const shopifyProduct = JSON.parse(rawBody);
    await syncProductImage(shopifyProduct);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Webhook products/update] Processing failed:', error?.message);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

/**
 * Sync the featured image from a Shopify product webhook payload
 * back to the CMS products table.
 *
 * Shopify webhook payload includes:
 *   - id: numeric Shopify product ID (e.g. 123456789)
 *   - image: { src: "https://cdn.shopify.com/..." } or null
 *   - images: [{ src: "..." }, ...]
 *
 * Our DB stores the GID format: "gid://shopify/Product/123456789"
 */
async function syncProductImage(shopifyProduct: any) {
  const shopifyId = shopifyProduct.id;
  if (!shopifyId) {
    console.log('[Webhook products/update] No product ID in payload, skipping');
    return;
  }

  // Shopify webhooks send numeric IDs; our DB stores GID format
  const gid = `gid://shopify/Product/${shopifyId}`;

  // Find the CMS product linked to this Shopify product
  const [cmsProduct] = await db
    .select({ id: products.id, image: products.image })
    .from(products)
    .where(eq(products.shopifyProductId, gid));

  if (!cmsProduct) {
    console.log(`[Webhook products/update] No CMS product linked to ${gid}, skipping`);
    return;
  }

  // Extract the featured image URL from the webhook payload
  const newImageUrl =
    shopifyProduct.image?.src ||
    shopifyProduct.images?.[0]?.src ||
    null;

  // Only update if the image actually changed
  if (newImageUrl === cmsProduct.image) {
    console.log(`[Webhook products/update] Image unchanged for product ${cmsProduct.id}, skipping`);
    return;
  }

  await db
    .update(products)
    .set({ image: newImageUrl, updatedAt: new Date() })
    .where(eq(products.id, cmsProduct.id));

  console.log(
    `[Webhook products/update] Updated image for product ${cmsProduct.id}: ${newImageUrl ? 'new image' : 'image removed'}`,
  );
}
