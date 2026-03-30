'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { useToast } from '@/app/admin/components/ToastContainer';

interface Launch { id: string; title: { en: string; fr: string }; pickupDate: string; status: string; }
interface OrderItem { productName: string; quantity: number; }
interface Order { id: string; orderNumber: string; customerName: string; specialInstructions: string | null; items: OrderItem[]; }
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

export default function MenuPrepSheetPage() {
  const toast = useToast();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedLaunch, setSelectedLaunch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingLaunches, setLoadingLaunches] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetch('/api/launches').then((r) => r.json()).then(setLaunches)
      .catch(() => toast.error('Error', 'Failed to load menus'))
      .finally(() => setLoadingLaunches(false));
  }, []);

  useEffect(() => {
    if (!selectedLaunch) return;
    setLoadingOrders(true);
    fetch(`/api/orders/by-launch/${selectedLaunch}`).then((r) => r.json()).then(setOrders)
      .catch(() => toast.error('Error', 'Failed to load orders'))
      .finally(() => setLoadingOrders(false));
  }, [selectedLaunch]);

  const prepEntries = useMemo(() => aggregateProducts(orders), [orders]);
  const ordersWithNotes = useMemo(() => orders.filter((o) => o.specialInstructions), [orders]);

  return (
    <div>
      {/* Menu selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Menu</label>
        {loadingLaunches ? (
          <div className="h-10 w-64 bg-gray-100 animate-pulse rounded-lg" />
        ) : (
          <Select placeholder="Choose a menu…" selectedKey={selectedLaunch}
            onSelectionChange={(key) => setSelectedLaunch(key as string)}
            items={launches.map((l) => ({ id: l.id, label: `${l.title.en} — ${new Date(l.pickupDate).toLocaleDateString()}` }))}>
            {(item) => <Select.Item id={item.id} label={item.label} />}
          </Select>
        )}
      </div>

      {loadingOrders && <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" /></div>}

      {selectedLaunch && !loadingOrders && (
        <>
          {/* Production summary */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-900">
                {prepEntries.length} products, {orders.length} orders
              </span>
              <div className="flex gap-2">
                <Button color="secondary" size="sm" onClick={() => window.print()} disabled={prepEntries.length === 0}>Print</Button>
              </div>
            </div>
            {prepEntries.length === 0 ? (
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
                  {prepEntries.map((e) => (
                    <tr key={e.productName}>
                      <td className="px-5 py-3 font-medium text-gray-900">{e.productName}</td>
                      <td className="px-5 py-3 text-right font-mono text-lg font-bold text-gray-900">{e.totalQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Order notes — only orders with special instructions */}
          {ordersWithNotes.length > 0 && (
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
                  {ordersWithNotes.map((o) => (
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
        </>
      )}
    </div>
  );
}
