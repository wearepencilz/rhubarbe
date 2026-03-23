import { db } from '@/lib/db/client';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';

type OrderStatus = 'pending' | 'confirmed' | 'fulfilled' | 'cancelled';

/**
 * List orders with optional status filter.
 * Returns the shape the admin orders page expects.
 */
export async function list(filters?: { status?: string }) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status as OrderStatus));
  }

  const rows = await db
    .select()
    .from(orders)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(orders.orderDate));

  const orderIds = rows.map((r) => r.id);

  const allItems = orderIds.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
    : [];

  const itemsByOrder = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const arr = itemsByOrder.get(item.orderId) || [];
    arr.push(item);
    itemsByOrder.set(item.orderId, arr);
  }

  return rows.map((row) => {
    const firstItem = itemsByOrder.get(row.id)?.[0];
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      orderDate: row.orderDate.toISOString(),
      pickupDate: firstItem?.pickupDate?.toISOString() ?? null,
      pickupLocation: firstItem?.pickupLocationName ?? null,
      status: row.status,
      totalAmount: row.total,
    };
  });
}

/**
 * Get a single order by ID with its items.
 */
export async function getById(id: string) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id));
  if (!row) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...row, items };
}

/**
 * Find an order by its Shopify order ID (for dedup on webhook).
 */
export async function getByShopifyOrderId(shopifyOrderId: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.shopifyOrderId, shopifyOrderId));
  return row ?? null;
}

/**
 * Create an order with its items. Used by the webhook handler.
 */
export async function create(
  orderData: typeof orders.$inferInsert,
  itemsData: (typeof orderItems.$inferInsert)[],
) {
  const [created] = await db.insert(orders).values(orderData).returning();
  if (itemsData.length) {
    const itemsWithOrderId = itemsData.map((item) => ({
      ...item,
      orderId: created.id,
    }));
    await db.insert(orderItems).values(itemsWithOrderId);
  }
  return created;
}

/**
 * Update order status.
 */
export async function updateStatus(id: string, status: string) {
  const [updated] = await db
    .update(orders)
    .set({ status: status as OrderStatus, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return updated ?? null;
}


/**
 * List orders for a specific launch/menu, with their items.
 * Used by prep sheet and pickup list.
 */
export async function listByLaunch(launchId: string) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.launchId, launchId))
    .orderBy(desc(orders.orderDate));

  const orderIds = rows.map((r) => r.id);
  const allItems = orderIds.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
    : [];

  const itemsByOrder = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const arr = itemsByOrder.get(item.orderId) || [];
    arr.push(item);
    itemsByOrder.set(item.orderId, arr);
  }

  return rows.map((row) => ({
    ...row,
    items: itemsByOrder.get(row.id) || [],
  }));
}


/**
 * Generic partial update on an order.
 */
export async function update(id: string, data: Partial<typeof orders.$inferInsert>) {
  const [updated] = await db
    .update(orders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return updated ?? null;
}


/**
 * Find an order by order number (e.g. "#1001").
 */
export async function getByOrderNumber(orderNumber: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber));
  return row ?? null;
}
