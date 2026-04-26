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
import { getCakePricingGrid, getCakeLeadTimeTiers } from '@/lib/db/queries/cake-products';
import { resolvePricingGridPrice } from '@/lib/utils/order-helpers';
import { db } from '@/lib/db/client';
import { orders } from '@/lib/db/schema';
import { sql, and } from 'drizzle-orm';
import * as settingsQueries from '@/lib/db/queries/settings';

function parseCollections(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface CakeCheckoutItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantLabel?: string;
  shopifyVariantId?: string;
  shopifyProductId?: string;
  // Grid-based resolution fields
  sizeValue?: string;
  flavourHandle?: string;
  quantity: number;
  price: number;
  isAddon?: boolean;
}

interface CakeCheckoutRequest {
  items: CakeCheckoutItem[];
  pickupDate: string;
  numberOfPeople: number;
  eventType: string;
  specialInstructions: string | null;
  fulfillmentType?: 'pickup' | 'delivery';
  locale: string;
  calculatedPrice?: number;
  selectedFlavours?: string[];
  deliveryAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

function formatPickupDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export async function POST(request: NextRequest) {
  try {
    const body: CakeCheckoutRequest = await request.json();
    const { items, pickupDate, numberOfPeople, eventType, specialInstructions, fulfillmentType, locale, calculatedPrice } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }
    if (!pickupDate) {
      return NextResponse.json({ error: 'Pickup date is required' }, { status: 400 });
    }

    // Server-side date validations (spec §7)
    const pickupDateObj = new Date(pickupDate.slice(0, 10) + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // §7.5 — Sunday blocking
    if (pickupDateObj.getDay() === 0) {
      return NextResponse.json({ error: 'Sunday pickup is not available.' }, { status: 400 });
    }

    // Resolve lead time for validation
    const validationTiers = await getCakeLeadTimeTiers(items[0].productId);
    const validationApplicable = validationTiers
      .filter((t) => t.minPeople <= numberOfPeople)
      .sort((a, b) => b.minPeople - a.minPeople);
    const validationLeadDays = validationApplicable[0]?.leadTimeDays ?? 7;

    // §7.1 — Lead time minimum
    const earliest = new Date(today); earliest.setDate(earliest.getDate() + validationLeadDays);
    if (pickupDateObj < earliest) {
      return NextResponse.json({ error: `This product requires at least ${validationLeadDays} days lead time.` }, { status: 400 });
    }

    // §7.2 — Max advance days
    const productRows = await import('@/lib/db/queries/cake-products').then((m) => m.getCakeProductById(items[0].productId));
    const maxAdvanceDays = productRows?.maxAdvanceDays;
    if (maxAdvanceDays) {
      const latest = new Date(today); latest.setDate(latest.getDate() + maxAdvanceDays);
      if (pickupDateObj > latest) {
        return NextResponse.json({ error: `Orders cannot be placed more than ${maxAdvanceDays} days in advance.` }, { status: 400 });
      }
    }

    // Server-side capacity check
    const capRaw = await settingsQueries.getByKey('cakeCapacity');
    const capVal = (capRaw?.value ?? {}) as Record<string, unknown>;
    const maxCakes = typeof capVal.maxCakes === 'number' ? capVal.maxCakes : 7;
    const deliveryDateStr = pickupDate.slice(0, 10);

    // Resolve lead time for this order from product tiers
    const checkLeadTimeTiers = await getCakeLeadTimeTiers(items[0].productId);
    const checkApplicable = checkLeadTimeTiers
      .filter((t) => t.minPeople <= numberOfPeople)
      .sort((a, b) => b.minPeople - a.minPeople);
    const checkLeadDays = checkApplicable[0]?.leadTimeDays ?? 7;

    const [capRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          sql`${orders.orderType} = 'cake'`,
          sql`${orders.status} IN ('pending', 'confirmed')`,
          sql`${orders.fulfillmentDate} IS NOT NULL`,
          sql`${orders.fulfillmentDate}::date >= (${deliveryDateStr}::date - ${checkLeadDays} * interval '1 day')::date`,
          sql`(${orders.fulfillmentDate}::date - COALESCE(${orders.leadTimeDays}, ${checkLeadDays}) * interval '1 day')::date <= ${deliveryDateStr}::date`,
        ),
      );
    if ((capRow?.count ?? 0) >= maxCakes) {
      return NextResponse.json(
        { error: 'This delivery date is fully booked. Please choose a different date.' },
        { status: 409 },
      );
    }

    // Resolve Shopify variant IDs
    // 1. Grid-based resolution: items with sizeValue + flavourHandle but no shopifyVariantId
    const gridCacheByProduct = new Map<string, Awaited<ReturnType<typeof getCakePricingGrid>>>();
    for (const item of items) {
      if (!item.shopifyVariantId && item.sizeValue && item.flavourHandle) {
        let grid = gridCacheByProduct.get(item.productId);
        if (!grid) {
          grid = await getCakePricingGrid(item.productId);
          gridCacheByProduct.set(item.productId, grid);
        }
        const match = resolvePricingGridPrice(grid, item.sizeValue, item.flavourHandle);
        if (match?.shopifyVariantId) {
          item.shopifyVariantId = match.shopifyVariantId;
        }
      }
    }

    // 2. Legacy resolution: items with shopifyProductId but no shopifyVariantId
    for (const item of items) {
      if (!item.shopifyVariantId && item.shopifyProductId) {
        const variantId = await getProductVariantId(item.shopifyProductId);
        if (variantId) item.shopifyVariantId = variantId;
      }
    }

    const unresolvableItems = items.filter((item) => !item.shopifyVariantId);
    if (unresolvableItems.length > 0) {
      const labels = unresolvableItems.map((i) => {
        if (i.sizeValue && i.flavourHandle) {
          return `${i.productName} (${i.sizeValue} / ${i.flavourHandle})`;
        }
        return `${i.productName}${i.variantLabel ? ` \u2014 ${i.variantLabel}` : ''}`;
      });
      return NextResponse.json(
        { error: `The following variant(s) cannot be resolved: ${labels.join(', ')}. Please contact us.`, unresolvableVariants: labels },
        { status: 422 },
      );
    }

    const lines: Array<{ merchandiseId: string; quantity: number }> = items.map((item) => ({
      merchandiseId: item.shopifyVariantId!,
      quantity: item.quantity,
    }));

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
          taxUnitCount: item.variantId ? getVariantTaxUnitCount(taxConfigs.get(item.productId)!, item.variantId) : 1,
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
      console.error('[Cake Checkout] Category resolution failed, falling back to per-product:', err);
    }

    for (let i = 0; i < lines.length; i++) {
      const item = items[i];
      const taxConfig = taxConfigs.get(item.productId);
      if (!taxConfig || !item.shopifyProductId) continue;

      // Skip items already resolved by category threshold
      if (categoryResolvedIds.has(item.productId)) continue;

      if (taxConfig.taxBehavior === 'quantity_threshold') {
        const effectiveUnits = item.quantity * (item.variantId ? getVariantTaxUnitCount(taxConfig, item.variantId) : 1);
        if (effectiveUnits >= taxConfig.taxThreshold) {
          const exemptId = await findExemptVariant(item.shopifyProductId, lines[i].merchandiseId);
          if (exemptId) {
            lines[i].merchandiseId = exemptId;
          } else {
            console.warn(`[Cake Checkout] No exempt variant found for ${item.productName}`);
          }
        }
      } else if (taxConfig.taxBehavior === 'always_exempt') {
        const exemptId = await findExemptVariant(item.shopifyProductId, lines[i].merchandiseId);
        if (exemptId) lines[i].merchandiseId = exemptId;
      }
    }

    const cakeProductId = items[0].productId;
    const resolvedFulfillmentType = fulfillmentType || 'pickup';
    const isDelivery = resolvedFulfillmentType === 'delivery';

    // Resolve lead time from product tiers
    const leadTimeTiers = await getCakeLeadTimeTiers(cakeProductId);
    const applicableTiers = leadTimeTiers
      .filter((t) => t.minPeople <= numberOfPeople)
      .sort((a, b) => b.minPeople - a.minPeople);
    const resolvedLeadTimeDays = applicableTiers[0]?.leadTimeDays ?? 7;

    const attributes: Array<{ key: string; value: string }> = [
      { key: 'Order Type', value: 'cake' },
      { key: 'Cake Product', value: cakeProductId },
      { key: 'Pickup Date', value: pickupDate },
      { key: 'Fulfillment Type', value: resolvedFulfillmentType },
      { key: 'Number of People', value: String(numberOfPeople) },
      { key: 'Event Type', value: eventType },
      { key: 'Lead Time Days', value: String(resolvedLeadTimeDays) },
    ];
    if (calculatedPrice != null) attributes.push({ key: 'Calculated Price', value: String(calculatedPrice) });
    if (specialInstructions) attributes.push({ key: 'Special Instructions', value: specialInstructions });
    if (body.selectedFlavours?.length) {
      attributes.push({ key: 'Selected Flavours', value: body.selectedFlavours.join(', ') });
    }
    if (isDelivery && body.deliveryAddress) {
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
      `Type: ${isFr ? 'Commande de g\u00e2teau' : 'Cake Order'}`,
      `${isFr ? 'Mode' : 'Method'}: ${isDelivery ? (isFr ? 'Livraison' : 'Delivery') : (isFr ? 'Cueillette' : 'Pickup')}`,
      `${isFr ? 'Date' : 'Date'}: ${formatPickupDate(pickupDate)}`,
      `${isFr ? 'Personnes' : 'People'}: ${numberOfPeople}`,
      `${isFr ? '\u00c9v\u00e9nement' : 'Event'}: ${eventType}`,
    ];
    if (calculatedPrice != null) {
      noteLines.push(`${isFr ? 'Prix calcul\u00e9' : 'Calculated Price'}: ${(calculatedPrice / 100).toFixed(2)}`);
    }
    if (body.selectedFlavours?.length) {
      const flavourLabel = isFr ? 'Saveur(s)' : 'Flavour(s)';
      noteLines.push(`${flavourLabel}: ${body.selectedFlavours.join(', ')}`);
    }

    // Group items: main products with addons nested underneath
    const mainItems = items.filter((item) => !item.isAddon);
    const addonItems = items.filter((item) => item.isAddon);

    for (const item of mainItems) {
      const itemParts: string[] = [item.productName];
      if (item.sizeValue) itemParts.push(`${isFr ? 'Taille' : 'Size'}: ${item.sizeValue}`);
      if (item.variantLabel) itemParts.push(item.variantLabel);
      noteLines.push(`${item.quantity}\u00d7 ${itemParts.join(' \u2014 ')}`);

      // Group addons under this main product
      for (const addon of addonItems) {
        noteLines.push(`  + ${addon.quantity}\u00d7 ${addon.productName}`);
      }
    }

    // If there are only addon items (edge case), list them standalone
    if (mainItems.length === 0) {
      for (const addon of addonItems) {
        noteLines.push(`${addon.quantity}\u00d7 ${addon.productName}`);
      }
    }

    if (specialInstructions) noteLines.push(`${isFr ? 'Instructions sp\u00e9ciales' : 'Special instructions'}: ${specialInstructions}`);
    if (isDelivery && body.deliveryAddress) {
      const addr = body.deliveryAddress;
      noteLines.push(`${isFr ? 'Adresse de livraison' : 'Delivery address'}: ${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}`);
    }
    const note = noteLines.join('\n');

    const cart = await createCart({ lines, attributes, note });

    return NextResponse.json({ checkoutUrl: cart.checkoutUrl, cartId: cart.id });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Cake Checkout] Error:', errMsg, error);

    if (errMsg.includes('does not exist') || errMsg.includes('not be published')) {
      return NextResponse.json(
        { error: 'One or more variants are not published to the Storefront sales channel.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: 'Failed to create checkout. Please try again.' }, { status: 500 });
  }
}
