'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';

interface Launch { id: string; title: { en: string; fr: string }; pickupDate: string; status: string; }
interface OrderItem { productName: string; quantity: number; pickupSlot: { startTime: string; endTime: string } | null; }
interface Order {
  id: string; orderNumber: string; customerName: string;
  specialInstructions: string | null; status: string; items: OrderItem[];
}

function statusBadge(s: string) {
  const color = s === 'fulfilled' ? 'success' as const : s === 'pending' ? 'warning' as const : s === 'cancelled' ? 'error' as const : s === 'confirmed' ? 'success' as const : 'gray' as const;
  return <Badge color={color}>{s}</Badge>;
}

/** Summarise items as "2× Croissant, 1× Tart" */
function summariseItems(items: OrderItem[]): string {
  return items.map((i) => `${i.quantity}× ${i.productName}`).join(', ');
}

export default function MenuPickupListPage() {
  const toast = useToast();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedLaunch, setSelectedLaunch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingLaunches, setLoadingLaunches] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/launches').then((r) => r.json()).then(setLaunches)
      .catch(() => toast.error('Error', 'Failed to load menus'))
      .finally(() => setLoadingLaunches(false));
  }, []);

  const fetchOrders = useCallback(() => {
    if (!selectedLaunch) return;
    setLoadingOrders(true);
    fetch(`/api/orders/by-launch/${selectedLaunch}`).then((r) => r.json()).then(setOrders)
      .catch(() => toast.error('Error', 'Failed to load orders'))
      .finally(() => setLoadingOrders(false));
  }, [selectedLaunch]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { if (scanMode && scanRef.current) scanRef.current.focus(); }, [scanMode]);

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

  function handleScan(value: string) {
    const trimmed = value.trim();
    const urlMatch = trimmed.match(/\/orders\/([a-f0-9-]{36})/i);
    if (urlMatch) { const o = orders.find((o) => o.id === urlMatch[1]); if (o) return processScanned(o); }
    const numMatch = trimmed.match(/#?(\d+)/);
    if (numMatch) { const o = orders.find((o) => o.orderNumber === `#${numMatch[1]}`); if (o) return processScanned(o); }
    const o = orders.find((o) => o.id === trimmed);
    if (o) return processScanned(o);
    toast.error('Not found', `No order matching "${trimmed}"`);
    setScanInput('');
  }

  function processScanned(order: Order) {
    if (order.status === 'fulfilled') toast.error('Already fulfilled', `${order.orderNumber} — ${order.customerName}`);
    else fulfillOrder(order.id);
    setScanInput('');
  }

  const slotGrouped = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of orders) {
      const slot = order.items[0]?.pickupSlot;
      const key = slot ? `${slot.startTime} – ${slot.endTime}` : 'No slot';
      (map.get(key) || (map.set(key, []), map.get(key)!)).push(order);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [orders]);

  const fulfilled = orders.filter((o) => o.status === 'fulfilled').length;

  return (
    <div>
      {/* Menu selector — same pattern as prep sheet */}
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

      {selectedLaunch && orders.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-gray-500">{fulfilled}/{orders.length} fulfilled</span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${orders.length ? (fulfilled / orders.length) * 100 : 0}%` }} />
          </div>
          <Button color={scanMode ? 'primary' : 'secondary'} size="sm" onClick={() => setScanMode(!scanMode)}>
            {scanMode ? 'Stop Scan' : 'Scan QR'}
          </Button>
        </div>
      )}

      {scanMode && (
        <div className="mb-6">
          <input ref={scanRef} type="text" value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && scanInput.trim()) handleScan(scanInput); }}
            placeholder="Waiting for scan…"
            className="w-full max-w-md px-4 py-3 text-lg border-2 border-brand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono bg-brand-50"
            autoFocus />
        </div>
      )}

      {loadingOrders && <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" /></div>}

      {selectedLaunch && !loadingOrders && orders.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-16">No orders for this menu yet.</p>
      )}

      {selectedLaunch && !loadingOrders && slotGrouped.map(([slot, slotOrders]) => (
        <div key={slot} className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{slot} — {slotOrders.length} order{slotOrders.length !== 1 ? 's' : ''}</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Order</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Items</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {slotOrders.map((order) => (
                  <tr key={order.id} className={order.status === 'fulfilled' ? 'bg-green-50/50' : order.status === 'cancelled' ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{order.orderNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{order.customerName}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{summariseItems(order.items)}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
