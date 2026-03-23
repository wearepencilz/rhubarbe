'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';

interface Launch {
  id: string;
  title: { en: string; fr: string };
  pickupDate: string;
  status: string;
}

interface OrderItem {
  productName: string;
  quantity: number;
  pickupLocationName: string;
  pickupSlot: { startTime: string; endTime: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  specialInstructions: string | null;
  status: string;
  items: OrderItem[];
}

export default function PickupListPage() {
  const toast = useToast();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedLaunch, setSelectedLaunch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLaunches, setLoadingLaunches] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  // Load launches
  useEffect(() => {
    fetch('/api/launches')
      .then((r) => r.json())
      .then(setLaunches)
      .catch(() => toast.error('Error', 'Failed to load menus'))
      .finally(() => setLoadingLaunches(false));
  }, []);

  // Load orders for selected launch
  const fetchOrders = useCallback(() => {
    if (!selectedLaunch) return;
    setLoading(true);
    fetch(`/api/orders/by-launch/${selectedLaunch}`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => toast.error('Error', 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [selectedLaunch]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Focus scan input when scan mode is activated
  useEffect(() => {
    if (scanMode && scanRef.current) scanRef.current.focus();
  }, [scanMode]);

  // Mark an order as fulfilled
  async function fulfillOrder(orderId: string) {
    setFulfilling(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'fulfilled' }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'fulfilled' } : o))
        );
        toast.success('Picked up', 'Order marked as fulfilled');
      } else {
        toast.error('Error', 'Failed to update order');
      }
    } catch {
      toast.error('Error', 'Failed to update order');
    } finally {
      setFulfilling(null);
    }
  }

  // Handle QR scan — accepts order UUID, URL containing UUID, or order number like #1001
  function handleScan(value: string) {
    const trimmed = value.trim();

    // Try to match a UUID from a URL like .../admin/orders/uuid
    const urlMatch = trimmed.match(/\/orders\/([a-f0-9-]{36})/i);
    if (urlMatch) {
      const order = orders.find((o) => o.id === urlMatch[1]);
      if (order) return processScannedOrder(order);
    }

    // Try to match by order number (e.g. "#1001" or "1001")
    const numberMatch = trimmed.match(/#?(\d+)/);
    if (numberMatch) {
      const needle = `#${numberMatch[1]}`;
      const order = orders.find((o) => o.orderNumber === needle);
      if (order) return processScannedOrder(order);
    }

    // Try raw UUID
    const order = orders.find((o) => o.id === trimmed);
    if (order) return processScannedOrder(order);

    toast.error('Not found', `No order matching "${trimmed}" in this menu`);
    setScanInput('');
  }

  function processScannedOrder(order: Order) {
    if (order.status === 'fulfilled') {
      toast.error('Already picked up', `${order.orderNumber} — ${order.customerName} was already fulfilled`);
    } else {
      fulfillOrder(order.id);
    }
    setScanInput('');
  }

  // Group orders by pickup slot
  const grouped = (() => {
    const map = new Map<string, Order[]>();
    for (const order of orders) {
      const slot = order.items[0]?.pickupSlot;
      const key = slot ? `${slot.startTime} – ${slot.endTime}` : 'No slot';
      const arr = map.get(key) || [];
      arr.push(order);
      map.set(key, arr);
    }
    // Sort slots chronologically
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  })();

  const pending = orders.filter((o) => o.status !== 'fulfilled' && o.status !== 'cancelled');
  const fulfilled = orders.filter((o) => o.status === 'fulfilled');

  const statusColor = (s: string) => {
    switch (s) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'fulfilled': return 'blue';
      case 'cancelled': return 'error';
      default: return 'gray';
    }
  };

  return (
    <div className="max-w-5xl">
      {/* Back link */}
      <Link href="/admin/orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pickup List</h1>
        {selectedLaunch && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{fulfilled.length}/{orders.length} picked up</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: orders.length ? `${(fulfilled.length / orders.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Menu selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Menu</label>
        {loadingLaunches ? (
          <div className="h-10 w-64 bg-gray-100 animate-pulse rounded-lg" />
        ) : (
          <Select
            placeholder="Choose a menu…"
            selectedKey={selectedLaunch}
            onSelectionChange={(key) => setSelectedLaunch(key as string)}
            items={launches.map((l) => ({
              id: l.id,
              label: `${l.title.en} — ${new Date(l.pickupDate).toLocaleDateString()}`,
            }))}
          >
            {(item) => <Select.Item id={item.id} label={item.label} />}
          </Select>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      )}

      {selectedLaunch && !loading && (
        <>
          {/* Scan mode */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">QR Scanner</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {scanMode
                    ? 'Scan a customer QR code or paste an order URL…'
                    : 'Activate to scan customer QR codes at pickup'}
                </p>
              </div>
              <Button
                color={scanMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setScanMode(!scanMode)}
              >
                {scanMode ? 'Stop Scanning' : 'Start Scanning'}
              </Button>
            </div>

            {scanMode && (
              <div className="mt-4">
                <input
                  ref={scanRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && scanInput.trim()) {
                      handleScan(scanInput);
                    }
                  }}
                  placeholder="Waiting for scan…"
                  className="w-full px-4 py-3 text-lg border-2 border-brand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono bg-brand-50"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  QR scanners act as keyboard input — just scan and it auto-submits
                </p>
              </div>
            )}
          </div>

          {/* Orders grouped by slot */}
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">No orders for this menu yet.</p>
          ) : (
            <div className="space-y-6">
              {grouped.map(([slot, slotOrders]) => {
                const slotFulfilled = slotOrders.filter((o) => o.status === 'fulfilled').length;
                return (
                  <div key={slot}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">{slot}</h3>
                      <span className="text-xs text-gray-500">
                        {slotFulfilled}/{slotOrders.length} picked up
                      </span>
                    </div>
                    <div className="space-y-2">
                      {slotOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`bg-white border rounded-lg p-4 flex items-center gap-4 transition-colors ${
                            order.status === 'fulfilled'
                              ? 'border-green-200 bg-green-50/50'
                              : order.status === 'cancelled'
                              ? 'border-gray-200 opacity-50'
                              : 'border-gray-200'
                          }`}
                        >
                          {/* Status indicator */}
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            order.status === 'fulfilled' ? 'bg-green-500' :
                            order.status === 'cancelled' ? 'bg-gray-300' : 'bg-amber-400'
                          }`} />

                          {/* Order info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{order.customerName}</span>
                              <span className="text-xs font-mono text-gray-400">{order.orderNumber}</span>
                              <Badge color={statusColor(order.status)}>{order.status}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-3 mt-1">
                              {order.items.map((item, i) => (
                                <span key={i} className="text-xs text-gray-600">
                                  {item.quantity}× {item.productName}
                                </span>
                              ))}
                            </div>
                            {order.specialInstructions && (
                              <p className="text-xs text-amber-700 mt-1">{order.specialInstructions}</p>
                            )}
                          </div>

                          {/* Action */}
                          {order.status !== 'fulfilled' && order.status !== 'cancelled' && (
                            <Button
                              color="primary"
                              size="sm"
                              onClick={() => fulfillOrder(order.id)}
                              disabled={fulfilling === order.id}
                            >
                              {fulfilling === order.id ? 'Updating…' : 'Mark Picked Up'}
                            </Button>
                          )}
                          {order.status === 'fulfilled' && (
                            <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
