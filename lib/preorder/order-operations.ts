/**
 * Order operations — prep sheets and pickup lists.
 * Stub implementation; will be fleshed out when order management is built.
 */

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialInstructions?: string;
  pickupDate: string;
  pickupLocationId: string;
  pickupSlotId?: string;
  items: OrderItem[];
  status: string;
  createdAt: string;
}

export interface PrepSheetEntry {
  productId: string;
  productName: string;
  category: string;
  totalQuantity: number;
  specialInstructions: string[];
}

export interface PickupListEntry {
  customerName: string;
  orderNumber: string;
  slot: string;
  pickupSlot: string;
  items: { productName: string; quantity: number }[];
  specialInstructions?: string;
}

export function generatePrepSheet(orders: Order[], _options?: { startDate?: string; endDate?: string; locationId?: string }): PrepSheetEntry[] {
  const map = new Map<string, PrepSheetEntry>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = map.get(item.productId);
      if (existing) {
        existing.totalQuantity += item.quantity;
        if (order.specialInstructions) existing.specialInstructions.push(order.specialInstructions);
      } else {
        map.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          category: '',
          totalQuantity: item.quantity,
          specialInstructions: order.specialInstructions ? [order.specialInstructions] : [],
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName));
}

export function generatePickupList(orders: Order[], _date?: string, _locationId?: string): PickupListEntry[] {
  return orders.map((o) => ({
    customerName: o.customerName,
    orderNumber: o.orderNumber,
    slot: o.pickupSlotId || '',
    pickupSlot: o.pickupSlotId || '',
    items: o.items.map((i) => ({ productName: i.productName, quantity: i.quantity })),
    specialInstructions: o.specialInstructions,
  }));
}

export function prepSheetToCsv(entries: PrepSheetEntry[]): string {
  const header = 'Product,Quantity';
  const rows = entries.map((e) => `"${e.productName}",${e.totalQuantity}`);
  return [header, ...rows].join('\n');
}

export function pickupListToCsv(entries: PickupListEntry[]): string {
  const header = 'Customer,Order #,Slot,Items,Notes';
  const rows = entries.map((e) => {
    const items = e.items.map((i) => `${i.productName} x${i.quantity}`).join('; ');
    return `"${e.customerName}","${e.orderNumber}","${e.pickupSlot}","${items}","${e.specialInstructions || ''}"`;
  });
  return [header, ...rows].join('\n');
}
