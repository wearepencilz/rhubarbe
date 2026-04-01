'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';

interface OrderItem { productName: string; quantity: number; }
interface Order {
  id: string; orderNumber: string; customerName: string;
  specialInstructions: string | null; launchTitle: string | null;
  fulfillmentDate: string | null; items: OrderItem[];
}
interface PrepEntry { productName: string; totalQuantity: number; }

function aggregateProducts(orders: Order[]): PrepEntry[] {
  const map = new Map<string, number>();
  for (const order of orders)
    for (const item of order.items)
      map.set(item.productName, (map.get(item.productName) ?? 0) + item.quantity);
  return Array.from(map.entries())
    .map(([productName, totalQuantity]) => ({ productName, totalQuantity }))
    .sort((a, b) => a.productName.localeCompare(b.productName));
}

function summariseItems(items: OrderItem[]): string {
  return items.map((i) => `${i.quantity}× ${i.productName}`).join(', ');
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

interface MenuGroup {
  menuTitle: string;
  dateLabel: string;
  orders: Order[];
  prepEntries: PrepEntry[];
  ordersWithNotes: Order[];
}

function groupByMenu(orders: Order[]): MenuGroup[] {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    const key = order.launchTitle || 'No menu';
    const arr = map.get(key) || [];
    arr.push(order);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .map(([menuTitle, menuOrders]) => {
      const date = menuOrders[0]?.fulfillmentDate?.split('T')[0] ?? '';
      return {
        menuTitle,
        dateLabel: date ? formatDate(date) : '',
        orders: menuOrders,
        prepEntries: aggregateProducts(menuOrders),
        ordersWithNotes: menuOrders.filter((o) => o.specialInstructions),
      };
    })
    .sort((a, b) => {
      const dateA = a.orders[0]?.fulfillmentDate ?? '';
      const dateB = b.orders[0]?.fulfillmentDate ?? '';
      return dateA.localeCompare(dateB);
    });
}

export default function MenuPrepSheetPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders/upcoming?orderType=launch')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setOrders)
      .catch(() => toast.error('Error', 'Failed to load upcoming menu orders'))
      .finally(() => setLoading(false));
  }, []);

  const menuGroups = useMemo(() => groupByMenu(orders), [orders]);

  return (
    <div>
      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      )}

      {!loading && menuGroups.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-16">No upcoming menu orders.</p>
      )}

      {!loading && menuGroups.map((group) => (
        <div key={group.menuTitle} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {group.menuTitle}{group.dateLabel ? ` — ${group.dateLabel}` : ''}
              {' · '}{group.orders.length} order{group.orders.length !== 1 ? 's' : ''}
            </h2>
            <Button color="secondary" size="sm" onClick={() => window.print()} disabled={group.prepEntries.length === 0}>Print</Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
            {group.prepEntries.length === 0 ? (
              <p className="px-5 py-10 text-sm text-gray-500 text-center">No orders for this menu yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Product</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-600">Total Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {group.prepEntries.map((e) => (
                    <tr key={e.productName}>
                      <td className="px-5 py-3 font-medium text-gray-900">{e.productName}</td>
                      <td className="px-5 py-3 text-right font-mono text-lg font-bold text-gray-900">{e.totalQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {group.ordersWithNotes.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700">Order Notes</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-2 text-left font-medium text-gray-600">Order</th>
                    <th className="px-5 py-2 text-left font-medium text-gray-600">Customer</th>
                    <th className="px-5 py-2 text-left font-medium text-gray-600">Items</th>
                    <th className="px-5 py-2 text-left font-medium text-gray-600">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {group.ordersWithNotes.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{o.orderNumber}</td>
                      <td className="px-5 py-2 text-gray-900 whitespace-nowrap">{o.customerName}</td>
                      <td className="px-5 py-2 text-xs text-gray-600">{summariseItems(o.items)}</td>
                      <td className="px-5 py-2 text-xs text-gray-500">{o.specialInstructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
