import { NextRequest, NextResponse } from 'next/server';
import * as ordersQuery from '@/lib/db/queries/orders';

/**
 * POST /api/orders/sync
 *
 * Pulls recent orders from Shopify Admin API and inserts any that
 * don't already exist in our DB. Useful for backfilling orders placed
 * before the webhook was set up.
 */
export async function POST(request: NextRequest) {
  try {
    const { shopifyAdminFetch } = await import('@/lib/shopify/admin');

    // Fetch last 50 orders from Shopify
    const query = `
      {
        orders(first: 50, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              legacyResourceId
              name
              email
              phone
              note
              createdAt
              subtotalPriceSet { shopMoney { amount } }
              totalTaxSet { shopMoney { amount } }
              totalPriceSet { shopMoney { amount } }
              displayFinancialStatus
              displayFulfillmentStatus
              customer {
                firstName
                lastName
                email
                phone
              }
              customAttributes {
                key
                value
              }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    variantTitle
                    quantity
                    originalUnitPriceSet { shopMoney { amount } }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyAdminFetch(query);
    const shopifyOrders = data.orders.edges.map((e: any) => e.node);

    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const so of shopifyOrders) {
      const shopifyOrderId = so.legacyResourceId || so.id;

      // Check if already imported
      const existing = await ordersQuery.getByShopifyOrderId(String(shopifyOrderId));

      // Extract cart attributes
      const attrs = new Map<string, string>();
      for (const attr of so.customAttributes || []) {
        attrs.set(attr.key, attr.value);
      }

      const pickupDate = attrs.get('Pickup Date');
      const pickupLocation = attrs.get('Pickup Location');
      const pickupAddress = attrs.get('Pickup Address');
      const pickupSlotRaw = attrs.get('Pickup Slot');
      const launchId = attrs.get('Menu ID') || null;
      const launchTitle = attrs.get('Menu') || null;

      // If already imported, backfill launchId if missing, then skip
      if (existing) {
        if (!existing.launchId && launchId) {
          await ordersQuery.update(existing.id, { launchId, launchTitle });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      let pickupSlot: { startTime: string; endTime: string } | undefined;
      if (pickupSlotRaw) {
        const parts = pickupSlotRaw.split(/\s*[–-]\s*/);
        if (parts.length === 2) {
          pickupSlot = { startTime: parts[0].trim(), endTime: parts[1].trim() };
        }
      }

      const customer = so.customer || {};
      const toCents = (val: string | undefined) => Math.round(parseFloat(val || '0') * 100);

      const isPaid = so.displayFinancialStatus === 'PAID' || so.displayFinancialStatus === 'PARTIALLY_PAID';
      const isFulfilled = so.displayFulfillmentStatus === 'FULFILLED';

      const orderData = {
        orderNumber: so.name || String(so.orderNumber),
        shopifyOrderId: String(shopifyOrderId),
        launchId,
        launchTitle,
        customerName: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Unknown',
        customerEmail: customer.email || so.email || '',
        customerPhone: customer.phone || so.phone || '',
        specialInstructions: so.note || null,
        subtotal: toCents(so.subtotalPriceSet?.shopMoney?.amount),
        tax: toCents(so.totalTaxSet?.shopMoney?.amount),
        total: toCents(so.totalPriceSet?.shopMoney?.amount),
        status: (isFulfilled ? 'fulfilled' : isPaid ? 'confirmed' : 'pending') as any,
        paymentStatus: (isPaid ? 'paid' : 'pending') as any,
        orderDate: new Date(so.createdAt),
      };

      const lineItems = (so.lineItems?.edges || []).map((e: any) => e.node);
      const itemsData = lineItems.map((li: any) => ({
        orderId: '',
        productId: '00000000-0000-0000-0000-000000000000',
        productName: li.title + (li.variantTitle ? ` — ${li.variantTitle}` : ''),
        quantity: li.quantity,
        unitPrice: toCents(li.originalUnitPriceSet?.shopMoney?.amount),
        subtotal: toCents(li.originalUnitPriceSet?.shopMoney?.amount) * li.quantity,
        pickupDate: pickupDate ? new Date(pickupDate) : new Date(),
        pickupLocationId: '00000000-0000-0000-0000-000000000000',
        pickupLocationName: pickupLocation ? `${pickupLocation}${pickupAddress ? ' — ' + pickupAddress : ''}` : 'TBD',
        pickupSlot: pickupSlot || null,
      }));

      await ordersQuery.create(orderData, itemsData);
      created++;
    }

    return NextResponse.json({
      message: `Sync complete: ${created} imported, ${updated} updated, ${skipped} unchanged`,
      created,
      updated,
      skipped,
    });
  } catch (error: any) {
    console.error('[Orders Sync] Failed:', error?.message, error);
    return NextResponse.json({ error: error?.message || 'Sync failed' }, { status: 500 });
  }
}
