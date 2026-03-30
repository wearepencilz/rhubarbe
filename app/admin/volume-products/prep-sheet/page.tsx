'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';

interface OrderItem { productName: string; quantity: number; }
interface Order {
  id: string; orderNumber: string; customerName: string;
  specialInstructions: string | null; allergenNotes: string | null;
  fulfillmentDate: string | null; status: string; items: OrderItem[];
}
interface PrepEntry { productName: string; totalQuantity: number; }
interface DateGroup {
  date: string; dateLabel: string; orders: Order[];
  prepEntries: PrepEntry[]; totalQty: number;
}

function aggregateProducts(orders: Order[]): PrepEntry[] {
  const map = new Map<string, number>();
  for (const order of orders)
    for (const item of order.items)
      map.set(item.productName, (map.get(item.productName) ?? 0) + item.quantity);
  return Array.from(map.entries())
    .map(([productName, totalQuantity]) => ({ productName, totalQuantity }))
    .sort((a, b) => a.productName.localeCompare(b.productName));
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
}

function summariseItems(items: OrderItem[]): string {
  return items.map((i) => `${i.quantity}× ${i.productName}`).join(', ');
}

function groupByDate(orders: Order[]): DateGroup[] {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    const dateKey = order.fulfillmentDate?.split('T')[0] ?? 'unknown';
    (map.get(dateKey) || (map.set(dateKey, []), map.get(dateKey)!)).push(order);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dateOrders]) => ({
      date, dateLabel: formatDate(date), orders: dateOrders,
      prepEntries: aggregateProducts(dateOrders),
      totalQty: dateOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0),
    }));
}

export default function CateringPrepSheetPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders/upcoming?orderType=volume')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setOrders)
      .catch(() => toast.error('Error', 'Failed to load upcoming catering orders'))
      .finally(() => setLoading(false));
  }, []);

  const dateGroups = useMemo(() => groupByDate(orders), [orders]);

  if (loading) return <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" /></div>;
  if (dateGroups.length === 0) return <p className="text-sm text-gray-500 text-center py-16">No upcoming catering orders.</p>;

  return (
    <div>
      <div className="flex justify-end gap-2 mb-6">
        <Button color="secondary" size="sm" onClick={() => window.print()}>Print</Button>
      </div>

      {dateGroups.map((group) => {
        const ordersWithNotes = group.orders.filter((o) => o.specialInstructions || o.allergenNotes);
        return (
          <div key={group.date} className="mb-10">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              {group.dateLabel} — {group.orders.length} order{group.orders.length !== 1 ? 's' : ''}, {group.totalQty} items
            </h2>

            {/* Production summary */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
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
            </div>

            {/* Order details — only orders with notes or allergens */}
            {ordersWithNotes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-700">Order Notes & Allergens</h3>
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
                    {ordersWithNotes.map((o) => (
                      <tr key={o.id}>
                        <td className="px-5 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{o.orderNumber}</td>
                        <td className="px-5 py-2 text-gray-900 whitespace-nowrap">{o.customerName}</td>
                        <td className="px-5 py-2 text-xs text-gray-600">{summariseItems(o.items)}</td>
                        <td className="px-5 py-2">
                          {o.allergenNotes && <span className="text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded mr-2">{o.allergenNotes}</span>}
                          {o.specialInstructions && <span className="text-xs text-gray-500">{o.specialInstructions}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
