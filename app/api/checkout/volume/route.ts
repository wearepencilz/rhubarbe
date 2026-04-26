import { NextRequest, NextResponse } from 'next/server';
import { createCart } from '@/lib/shopify/cart';
import { getProductVariantId } from '@/lib/shopify/admin';
import { getTaxConfigByIds } from '@/lib/db/queries/products';
import { findExemptVariant } from '@/lib/tax/find-exempt-variant';
import { fetchTaxSettings } from '@/lib/tax/tax-settings';
import { fetchProductCategories } from '@/lib/shopify/queries/product-categories';
import { resolveCategoryVariants } from '@/lib/tax/resolve-category-variants';
import type { CategoryCartItem } from '@/lib/tax/resolve-category-variants';
import { getVariantTaxUnitCount } from '@/lib/tax/resolve-variant';
import { getLeadTimeTiers } from '@/lib/db/queries/volume-products';

function parseCollections(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface VolumeCheckoutItem {
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  shopifyVariantId: string;
  shopifyProductId?: string;
  quantity: number;
  price: number;
}

interface VolumeCheckoutRequest {
  items: VolumeCheckoutItem[];
  fulfillmentDate: string;
  fulfillmentType?: 'pickup' | 'delivery';
  allergenNote: string | null;
  locale: string;
  deliveryAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

function formatFulfillmentDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dateStr} at ${timeStr}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: VolumeCheckoutRequest = await request.json();
    const { items, fulfillmentDate, fulfillmentType, allergenNote, locale } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }
    if (!fulfillmentDate) {
      return NextResponse.json({ error: 'Fulfillment date is required' }, { status: 400 });
    }

    // Server-side lead time validation
    const fulfillmentDateObj = new Date(fulfillmentDate.slice(0, 10) + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // Check lead time for each product based on its quantity
    for (const item of items) {
      const tiers = await getLeadTimeTiers(item.productId);
      if (tiers.length) {
        const applicable = tiers.filter((t) => t.minQuantity <= item.quantity).sort((a, b) => b.minQuantity - a.minQuantity);
        const leadDays = applicable[0]?.leadTimeDays ?? tiers[0].leadTimeDays;
        const earliest = new Date(today); earliest.setDate(earliest.getDate() + leadDays);
        if (fulfillmentDateObj < earliest) {
          return NextResponse.json({ error: `${item.productName} requires at least ${leadDays} days lead time for qty ${item.quantity}.` }, { status: 400 });
        }
      }
    }

    // Resolve Shopify variant IDs
    for (const item of items) {
      if (!item.shopifyVariantId && item.shopifyProductId) {
        const variantId = await getProductVariantId(item.shopifyProductId);
        if (variantId) item.shopifyVariantId = variantId;
      }
    }

    const unresolvableItems = items.filter((item) => !item.shopifyVariantId);
    if (unresolvableItems.length > 0) {
      const labels = unresolvableItems.map((i) => `${i.productName} — ${i.variantLabel}`);
      return NextResponse.json(
        { error: `The following variant(s) cannot be resolved: ${labels.join(', ')}. Please contact us.`, unresolvableVariants: labels },
        { status: 422 },
      );
    }

    const lines: Array<{ merchandiseId: string; quantity: number }> = items.map((item) => ({
      merchandiseId: item.shopifyVariantId,
      quantity: item.quantity,
    }));

    console.log('[Volume Checkout] Lines to create cart:', JSON.stringify(lines));

    // Convention-based tax variant resolution
    const productIds = items.map((item) => item.productId);
    const taxConfigs = await getTaxConfigByIds(productIds);

    // --- Category-based tax resolution ---
    const categoryResolvedIds = new Set<string>();
    try {
      const taxSettings = await fetchTaxSettings();
      if (taxSettings && taxSettings.thresholdCategories.length > 0) {
        const shopifyIds = items
          .map((item) => item.shopifyProductId)
          .filter((id): id is string => !!id);
        const productCategories = await fetchProductCategories(shopifyIds);

        const categoryItems: CategoryCartItem[] = items.map((item, i) => ({
          productId: item.productId,
          shopifyProductId: item.shopifyProductId || '',
          defaultVariantId: lines[i].merchandiseId,
          exemptVariantId: taxConfigs.get(item.productId)?.shopifyTaxExemptVariantId ?? null,
          quantity: item.quantity,
          taxUnitCount: getVariantTaxUnitCount(taxConfigs.get(item.productId)!, item.variantId),
          shopifyCollections: item.shopifyProductId
            ? parseCollections(productCategories.get(item.shopifyProductId))
            : [],
        }));

        const categoryResolutions = resolveCategoryVariants(categoryItems, taxSettings);
        for (const resolution of categoryResolutions) {
          const lineIndex = items.findIndex((item) => item.productId === resolution.productId);
          if (lineIndex >= 0) {
            lines[lineIndex].merchandiseId = resolution.variantId;
            categoryResolvedIds.add(resolution.productId);
          }
        }
      }
    } catch (err) {
      console.error('[Volume Checkout] Category resolution failed, falling back to per-product:', err);
    }

    for (let i = 0; i < lines.length; i++) {
      const item = items[i];
      const taxConfig = taxConfigs.get(item.productId);
      if (!taxConfig || !item.shopifyProductId) continue;

      // Skip items already resolved by category threshold
      if (categoryResolvedIds.has(item.productId)) continue;

      if (taxConfig.taxBehavior === 'quantity_threshold') {
        const effectiveUnits = item.quantity * getVariantTaxUnitCount(taxConfig, item.variantId);
        if (effectiveUnits >= taxConfig.taxThreshold) {
          const exemptId = await findExemptVariant(item.shopifyProductId, lines[i].merchandiseId);
          if (exemptId) {
            lines[i].merchandiseId = exemptId;
          } else {
            console.warn(`[Volume Checkout] No exempt variant found for ${item.productName}`);
          }
        }
      } else if (taxConfig.taxBehavior === 'always_exempt') {
        const exemptId = await findExemptVariant(item.shopifyProductId, lines[i].merchandiseId);
        if (exemptId) lines[i].merchandiseId = exemptId;
      }
    }

    const volumeProductId = items[0].productId;
    const cateringTypes: string[] = (body as any).cateringTypes || [];
    const attributes: Array<{ key: string; value: string }> = [
      { key: 'Order Type', value: 'volume' },
      { key: 'Volume Product', value: volumeProductId },
      { key: 'Fulfillment Date', value: fulfillmentDate },
      { key: 'Fulfillment Type', value: fulfillmentType || 'pickup' },
    ];
    if (cateringTypes.length) attributes.push({ key: 'Catering Types', value: cateringTypes.join(',') });
    if (allergenNote) attributes.push({ key: 'Allergen Note', value: allergenNote });
    if (fulfillmentType === 'delivery' && body.deliveryAddress) {
      const addr = body.deliveryAddress;
      attributes.push(
        { key: 'Delivery Street', value: addr.street },
        { key: 'Delivery City', value: addr.city },
        { key: 'Delivery Province', value: addr.province },
        { key: 'Delivery Postal Code', value: addr.postalCode },
      );
    }

    const isFr = locale === 'fr';
    const noteLines: string[] = [
      `Type: ${isFr ? 'Commande en volume' : 'Volume Order'}`,
      `${isFr ? 'Livraison' : 'Fulfillment'}: ${formatFulfillmentDateTime(fulfillmentDate)}`,
      `${isFr ? 'Mode' : 'Method'}: ${(fulfillmentType || 'pickup') === 'delivery' ? (isFr ? 'Livraison' : 'Delivery') : (isFr ? 'Cueillette' : 'Pickup')}`,
    ];
    for (const item of items) {
      noteLines.push(`${item.quantity}× ${item.productName} — ${item.variantLabel}`);
    }
    if (allergenNote) noteLines.push(`${isFr ? 'Préoccupations allergènes' : 'Allergen concerns'}: ${allergenNote}`);
    if (fulfillmentType === 'delivery' && body.deliveryAddress) {
      const addr = body.deliveryAddress;
      noteLines.push(`${isFr ? 'Adresse de livraison' : 'Delivery address'}: ${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}`);
    }
    const note = noteLines.join('\n');

    const cart = await createCart({ lines, attributes, note });

    return NextResponse.json({ checkoutUrl: cart.checkoutUrl, cartId: cart.id });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Volume Checkout] Error:', errMsg, error);

    if (errMsg.includes('does not exist') || errMsg.includes('not be published')) {
      return NextResponse.json(
        { error: 'One or more variants are not published to the Storefront sales channel.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: 'Failed to create checkout. Please try again.' }, { status: 500 });
  }
}
