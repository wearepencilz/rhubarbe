import { NextRequest, NextResponse } from 'next/server';
import { createCart } from '@/lib/shopify/cart';
import { getTaxConfigByIds } from '@/lib/db/queries/products';
import { findExemptVariant } from '@/lib/tax/find-exempt-variant';

interface CheckoutItem {
  productId: string;
  productName: string;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  quantity: number;
  price: number;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  launchId: string;
  launchTitle: string;
  pickupDate: string;
  pickupLocationName: string;
  pickupLocationAddress: string;
  pickupSlot?: { startTime: string; endTime: string };
  locale: string;
}

async function getAdminVariantId(shopifyProductId: string): Promise<string | null> {
  try {
    const { getProductVariantId } = await import('@/lib/shopify/admin');
    return await getProductVariantId(shopifyProductId);
  } catch (err) {
    console.error('[Checkout] Variant lookup failed for', shopifyProductId, err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const {
      items, launchId, launchTitle, pickupDate,
      pickupLocationName, pickupLocationAddress, pickupSlot, locale,
    } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Resolve Shopify variant IDs for each item
    const lines: Array<{ merchandiseId: string; quantity: number }> = [];
    const skippedItems: string[] = [];
    const lineItems: CheckoutItem[] = [];

    for (const item of items) {
      if (!item.shopifyProductId) {
        skippedItems.push(item.productName);
        continue;
      }
      let variantId = item.shopifyVariantId || null;
      if (!variantId) {
        variantId = await getAdminVariantId(item.shopifyProductId);
      }
      if (!variantId) {
        skippedItems.push(item.productName);
        continue;
      }
      lines.push({ merchandiseId: variantId, quantity: item.quantity });
      lineItems.push(item);
    }

    // Convention-based tax variant resolution (clear cache to ensure fresh data)
    const { clearVariantCache } = await import('@/lib/tax/find-exempt-variant');
    clearVariantCache();
    const productIds = lineItems.map((item) => item.productId);
    console.log(`[Checkout Tax] Product IDs for tax lookup: ${JSON.stringify(productIds)}`);
    const taxConfigs = await getTaxConfigByIds(productIds);
    console.log(`[Checkout Tax] Tax configs found: ${taxConfigs.size} of ${productIds.length}`);

    for (let i = 0; i < lines.length; i++) {
      const item = lineItems[i];
      const taxConfig = taxConfigs.get(item.productId);
      if (!taxConfig) {
        console.log(`[Checkout Tax] No tax config for product ${item.productName} (${item.productId})`);
        continue;
      }
      if (!item.shopifyProductId) continue;

      if (taxConfig.taxBehavior === 'quantity_threshold') {
        const effectiveUnits = item.quantity * taxConfig.taxUnitCount;
        console.log(`[Checkout Tax] ${item.productName}: qty=${item.quantity}, unitCount=${taxConfig.taxUnitCount}, effective=${effectiveUnits}, threshold=${taxConfig.taxThreshold}, variantId=${lines[i].merchandiseId}`);
        if (effectiveUnits >= taxConfig.taxThreshold) {
          // Find the exempt twin variant via convention
          const exemptId = await findExemptVariant(
            item.shopifyProductId,
            lines[i].merchandiseId,
          );
          console.log(`[Checkout Tax] ${item.productName}: exempt variant found: ${exemptId}`);
          if (exemptId) {
            lines[i].merchandiseId = exemptId;
          } else {
            console.warn(
              `[Checkout] No exempt variant found for ${item.productName} — using taxable variant`,
            );
          }
        }
      } else if (taxConfig.taxBehavior === 'always_exempt') {
        // For always_exempt, find any non-taxable variant
        const exemptId = await findExemptVariant(
          item.shopifyProductId,
          lines[i].merchandiseId,
        );
        if (exemptId) {
          lines[i].merchandiseId = exemptId;
        }
      }
      // always_taxable: keep the default variant (no change)
    }

    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'None of the selected products are linked to Shopify. Please contact us to place your order.' },
        { status: 422 },
      );
    }

    // Cart attributes
    const attributes: Array<{ key: string; value: string }> = [
      { key: 'Menu', value: launchTitle },
      { key: 'Menu ID', value: launchId },
      { key: 'Pickup Date', value: pickupDate },
      { key: 'Pickup Location', value: pickupLocationName },
      { key: 'Pickup Address', value: pickupLocationAddress },
    ];
    if (pickupSlot) {
      attributes.push({ key: 'Pickup Slot', value: `${pickupSlot.startTime} – ${pickupSlot.endTime}` });
    }

    const isFr = locale === 'fr';
    const noteLines = [
      `Menu: ${launchTitle}`,
      `${isFr ? 'Cueillette' : 'Pickup'}: ${pickupDate}`,
      `${isFr ? 'Lieu' : 'Location'}: ${pickupLocationName} — ${pickupLocationAddress}`,
    ];
    if (pickupSlot) {
      noteLines.push(`${isFr ? 'Créneau' : 'Slot'}: ${pickupSlot.startTime} – ${pickupSlot.endTime}`);
    }
    noteLines.push('');
    for (const item of items) {
      noteLines.push(`${item.quantity}× ${item.productName}`);
    }
    if (skippedItems.length > 0) {
      noteLines.push('');
      noteLines.push(`${isFr ? 'Non liés à Shopify' : 'Not linked to Shopify'}: ${skippedItems.join(', ')}`);
    }
    const note = noteLines.join('\n');

    const cart = await createCart({ lines, attributes, note });

    return NextResponse.json({
      checkoutUrl: cart.checkoutUrl,
      cartId: cart.id,
      skippedItems,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Checkout error:', errMsg, error);

    if (errMsg.includes('does not exist') || errMsg.includes('not be published')) {
      return NextResponse.json(
        { error: 'One or more products are not published to the Storefront sales channel. Please publish them in Shopify Admin → Products → [Product] → Publishing.' },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: `Checkout failed: ${errMsg}` },
      { status: 500 },
    );
  }
}
