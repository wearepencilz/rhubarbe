import { db } from '@/lib/db/client';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { parseCakeMetadata } from '@/lib/utils/parse-cake-metadata';

/** Infer all catering types present in an order from item names or specialInstructions */
/** Infer all catering types present in an order from item names or specialInstructions */
function inferCateringTypes(items: Array<{ productName: string; quantity: number }>, specialInstructions: string | null): string[] {
  return Object.keys(inferCateringTypeQuantities(items, specialInstructions));
}

/** Infer per-type quantities from item names */
function inferCateringTypeQuantities(items: Array<{ productName: string; quantity: number }>, specialInstructions: string | null): Record<string, number> {
  const qtys: Record<string, number> = {};

  // Parse line items from specialInstructions: "4× Product name"
  const lines = (specialInstructions ?? '').split('\n');
  const lineItems: Array<{ name: string; qty: number }> = [];
  for (const line of lines) {
    const m = line.match(/^(\d+)[×x]\s+(.+)/);
    if (m) lineItems.push({ qty: parseInt(m[1]), name: m[2].toLowerCase() });
  }

  // Use parsed lines if available, otherwise fall back to items array
  const source = lineItems.length > 0
    ? lineItems
    : items.map((i) => ({ name: i.productName.toLowerCase(), qty: i.quantity }));

  for (const { name, qty } of source) {
    let type: string | null = null;
    if (name.includes('petit-déjeuner') || name.includes('breakfast') || name.includes('brunch') || name.includes('buffet')) type = 'brunch';
    else if (name.includes('lunch box') || name.includes('lunch')) type = 'lunch';
    else type = 'dinatoire'; // default for cocktail/finger food items
    qtys[type] = (qtys[type] ?? 0) + qty;
  }
  return qtys;
}

type OrderStatus = 'pending' | 'confirmed' | 'fulfilled' | 'cancelled';

/**
 * List orders with optional status and orderType filters.
 * Returns the shape the admin orders page expects.
 */
export async function list(filters?: { status?: string; orderType?: string }) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status as OrderStatus));
  }
  if (filters?.orderType) {
    conditions.push(eq(orders.orderType, filters.orderType));
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
    const items = itemsByOrder.get(row.id) || [];
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const cakeMetadata = row.orderType === 'cake'
      ? parseCakeMetadata(row.specialInstructions)
      : { numberOfPeople: null, eventType: null };
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      orderDate: row.orderDate.toISOString(),
      pickupDate: firstItem?.pickupDate?.toISOString() ?? null,
      pickupLocation: firstItem?.pickupLocationName ?? null,
      status: row.status,
      totalAmount: row.total,
      orderType: row.orderType,
      fulfillmentDate: row.fulfillmentDate?.toISOString() ?? null,
      allergenNotes: row.allergenNotes ?? null,
      launchTitle: row.launchTitle ?? null,
      totalQuantity,
      numberOfPeople: cakeMetadata.numberOfPeople,
      eventType: cakeMetadata.eventType,
      leadTimeDays: row.leadTimeDays ?? null,
      cateringType: row.cateringType ?? inferCateringTypes(itemsByOrder.get(row.id) || [], row.specialInstructions)[0] ?? null,
      cateringTypes: row.orderType === 'volume'
        ? (row.cateringType
            ? [row.cateringType]
            : inferCateringTypes(itemsByOrder.get(row.id) || [], row.specialInstructions))
        : [],
      cateringTypeQuantities: row.orderType === 'volume'
        ? inferCateringTypeQuantities(itemsByOrder.get(row.id) || [], row.specialInstructions)
        : {},
    };
  });
}

// Re-export parseCakeMetadata for external consumers
export { parseCakeMetadata } from '@/lib/utils/parse-cake-metadata';

/**
 * Get a single order by ID with its items.
 * Returns orderType, fulfillmentDate, allergenNotes, launchTitle, and
 * for cake orders: parsed numberOfPeople and eventType from specialInstructions.
 */
export async function getById(id: string) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id));
  if (!row) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  const cakeMetadata = row.orderType === 'cake'
    ? parseCakeMetadata(row.specialInstructions)
    : { numberOfPeople: null, eventType: null };

  return {
    ...row,
    items,
    numberOfPeople: cakeMetadata.numberOfPeople,
    eventType: cakeMetadata.eventType,
  };
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
    .where(
      and(
        eq(orders.launchId, launchId),
        sql`${orders.status} NOT IN ('cancelled', 'fulfilled')`,
      ),
    )
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
 * List orders for a specific fulfillment date and order type, with their items.
 * Used by catering/cake prep sheet and pickup list (date-based workflows).
 * Same return shape as listByLaunch.
 */
export async function listByDate(date: string, orderType: string) {
  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        sql`${orders.fulfillmentDate}::date = ${date}::date`,
        eq(orders.orderType, orderType),
        sql`${orders.status} NOT IN ('cancelled', 'fulfilled')`,
      ),
    )
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
 * List upcoming orders for a given order type (fulfillmentDate >= today).
 * Returns orders with items, grouped by date on the client side.
 */
export async function listUpcoming(orderType: string) {
  const rows = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderType, orderType),
        sql`(${orders.fulfillmentDate}::date >= CURRENT_DATE OR ${orders.fulfillmentDate} IS NULL)`,
        sql`${orders.status} NOT IN ('cancelled', 'fulfilled')`,
      ),
    )
    .orderBy(sql`${orders.fulfillmentDate}::date ASC NULLS LAST`, desc(orders.orderDate));

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


/**
 * List orders for the prep/fulfillment view with date range and payment status filters.
 * Unlike listUpcoming, this includes ALL statuses (paid, pending, refunded) and
 * allows filtering by fulfillment/pickup date range.
 */
export async function listForPrep(filters: {
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: string;
  orderType?: string;
}) {
  const conditions = [];

  if (filters.dateFrom) {
    conditions.push(sql`COALESCE(${orders.fulfillmentDate}::date, ${orders.orderDate}::date) >= ${filters.dateFrom}::date`);
  }
  if (filters.dateTo) {
    conditions.push(sql`COALESCE(${orders.fulfillmentDate}::date, ${orders.orderDate}::date) <= ${filters.dateTo}::date`);
  }
  if (filters.paymentStatus) {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus as 'pending' | 'paid' | 'refunded'));
  }
  if (filters.orderType) {
    conditions.push(eq(orders.orderType, filters.orderType));
  }

  // Exclude cancelled
  conditions.push(sql`${orders.status} != 'cancelled'`);

  const rows = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(sql`COALESCE(${orders.fulfillmentDate}, ${orders.orderDate})::date ASC`, desc(orders.orderDate));

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
