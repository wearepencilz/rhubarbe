'use client';

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';
import { parseCakeMetadata } from '@/lib/utils/parse-cake-metadata';

interface OrderItem { productName: string; quantity: number; }
interface Order {
  id: string; orderNumber: string; customerName: string;
  specialInstructions: string | null; fulfillmentDate?: string | null;
  status: string; items: OrderItem[];
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function statusBadge(s: string) {
  const color = s === 'fulfilled' ? 'success' as const : s === 'pending' ? 'warning' as const : s === 'cancelled' ? 'error' as const : s === 'confirmed' ? 'success' as const : 'gray' as const;
  return <Badge color={color}>{s}</Badge>;
}

function summariseItems(items: OrderItem[]): string {
  return items.map((i) => `${i.quantity}× ${i.productName}`).join(', ');
}

export default function CakePickupListPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders/upcoming?orderType=cake')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setOrders)
      .catch(() => toast.error('Error', 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  async function fulfillOrder(orderId: string) {
    setFulfilling(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'fulfilled' }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'fulfilled' } : o)));
        toast.success('Done', 'Order fulfilled');
      } else toast.error('Error', 'Failed to update');
    } catch { toast.error('Error', 'Failed to update'); }
    finally { setFulfilling(null); }
  }

  const dateGrouped = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of orders) {
      const dateKey = order.fulfillmentDate?.split('T')[0] ?? 'unknown';
      (map.get(dateKey) || (map.set(dateKey, []), map.get(dateKey)!)).push(order);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [orders]);

  const fulfilled = orders.filter((o) => o.status === 'fulfilled').length;

  if (loading) return <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" /></div>;
  if (orders.length === 0) return <p className="text-sm text-gray-500 text-center py-16">No upcoming cake orders.</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">{fulfilled}/{orders.length} fulfilled</span>
        <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(fulfilled / orders.length) * 100}%` }} />
        </div>
      </div>

      {dateGrouped.map(([dateKey, dateOrders]) => (
        <div key={dateKey} className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{formatDate(dateKey)} — {dateOrders.length} order{dateOrders.length !== 1 ? 's' : ''}</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Order</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Items</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Details</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dateOrders.map((order) => {
                  const meta = parseCakeMetadata(order.specialInstructions);
                  const details = [meta.eventType, meta.numberOfPeople ? `${meta.numberOfPeople} ppl` : null].filter(Boolean).join(' · ');
                  return (
                    <tr key={order.id} className={order.status === 'fulfilled' ? 'bg-green-50/50' : order.status === 'cancelled' ? 'opacity-50' : ''}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{order.orderNumber}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{order.customerName}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{summariseItems(order.items)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{details || '—'}</td>
                      <td className="px-4 py-3">{statusBadge(order.status)}</td>
                      <td className="px-4 py-3 text-right">
                        {order.status !== 'fulfilled' && order.status !== 'cancelled' && (
                          <Button color="primary" size="sm" onClick={() => fulfillOrder(order.id)} disabled={fulfilling === order.id}>
                            {fulfilling === order.id ? '…' : 'Fulfill'}
                          </Button>
                        )}
                        {order.status === 'fulfilled' && (
                          <svg className="w-5 h-5 text-green-500 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
