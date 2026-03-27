'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';
import OrderTypeSelector from '@/app/admin/components/OrderTypeSelector';
import OrderTypeBadge from '@/app/admin/components/OrderTypeBadge';
import { parseCakeMetadata } from '@/lib/utils/parse-cake-metadata';

type OrderType = 'launch' | 'volume' | 'cake';

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
  allergenNotes?: string | null;
  orderType?: string;
  fulfillmentType?: string | null;
  fulfillmentDate?: string | null;
  status: string;
  items: OrderItem[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

export default function PickupListPage() {
  const toast = useToast();
  const [orderTypeMode, setOrderTypeMode] = useState<OrderType>('launch');

  // Launch mode state
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedLaunch, setSelectedLaunch] = useState('');
  const [launchOrders, setLaunchOrders] = useState<Order[]>([]);
  const [loadingLaunches, setLoadingLaunches] = useState(true);
  const [loadingLaunchOrders, setLoadingLaunchOrders] = useState(false);

  // Upcoming mode state (catering / cake)
  const [upcomingOrders, setUpcomingOrders] = useState<Order[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  // Shared state
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  // Load launches on mount
  useEffect(() => {
    fetch('/api/launches')
      .then((r) => r.json())
      .then(setLaunches)
      .catch(() => toast.error('Error', 'Failed to load menus'))
      .finally(() => setLoadingLaunches(false));
  }, []);

  // Fetch launch orders when a launch is selected
  const fetchLaunchOrders = useCallback(() => {
    if (!selectedLaunch) return;
    setLoadingLaunchOrders(true);
    fetch(`/api/orders/by-launch/${selectedLaunch}`)
      .then((r) => r.json())
      .then(setLaunchOrders)
      .catch(() => toast.error('Error', 'Failed to load orders'))
      .finally(() => setLoadingLaunchOrders(false));
  }, [selectedLaunch]);

  useEffect(() => { fetchLaunchOrders(); }, [fetchLaunchOrders]);

  // Auto-fetch upcoming orders when switching to catering/cake
  useEffect(() => {
    if (orderTypeMode === 'launch') { setUpcomingOrders([]); return; }
    setLoadingUpcoming(true);
    fetch(`/api/orders/upcoming?orderType=${orderTypeMode}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setUpcomingOrders)
      .catch(() => toast.error('Error', 'Failed to load upcoming orders'))
      .finally(() => setLoadingUpcoming(false));
  }, [orderTypeMode]);

  // Reset when switching modes
  useEffect(() => {
    setUpcomingOrders([]);
    setScanMode(false);
    setScanInput('');
  }, [orderTypeMode]);

  // Focus scan input when scan mode is activated
  useEffect(() => {
    if (scanMode && scanRef.current) scanRef.current.focus();
  }, [scanMode]);

  const isLaunchMode = orderTypeMode === 'launch';
  const activeOrders = isLaunchMode ? launchOrders : upcomingOrders;
  const isLoading = isLaunchMode ? loadingLaunchOrders : loadingUpcoming;
  const hasContent = isLaunchMode ? !!selectedLaunch : upcomingOrders.length > 0 || loadingUpcoming;

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
        const setter = isLaunchMode ? setLaunchOrders : setUpcomingOrders;
        setter((prev) =>
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

    const urlMatch = trimmed.match(/\/orders\/([a-f0-9-]{36})/i);
    if (urlMatch) {
      const order = activeOrders.find((o) => o.id === urlMatch[1]);
      if (order) return processScannedOrder(order);
    }

    const numberMatch = trimmed.match(/#?(\d+)/);
    if (numberMatch) {
      const needle = `#${numberMatch[1]}`;
      const order = activeOrders.find((o) => o.orderNumber === needle);
      if (order) return processScannedOrder(order);
    }

    const order = activeOrders.find((o) => o.id === trimmed);
    if (order) return processScannedOrder(order);

    toast.error('Not found', `No order matching "${trimmed}" in this list`);
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

  // Group launch orders by pickup slot
  const launchGrouped = useMemo(() => {
    if (!isLaunchMode) return [];
    const map = new Map<string, Order[]>();
    for (const order of activeOrders) {
      const slot = order.items[0]?.pickupSlot;
      const key = slot ? `${slot.startTime} – ${slot.endTime}` : 'No slot';
      const arr = map.get(key) || [];
      arr.push(order);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activeOrders, isLaunchMode]);

  // Group upcoming orders by fulfillment date
  const dateGrouped = useMemo(() => {
    if (isLaunchMode) return [];
    const map = new Map<string, Order[]>();
    for (const order of activeOrders) {
      const dateKey = order.fulfillmentDate?.split('T')[0] ?? 'unknown';
      const arr = map.get(dateKey) || [];
      arr.push(order);
      map.set(dateKey, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activeOrders, isLaunchMode]);

  const fulfilled = activeOrders.filter((o) => o.status === 'fulfilled');

  const statusColor = (s: string): 'success' | 'warning' | 'blue' | 'error' | 'gray' => {
    switch (s) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'fulfilled': return 'blue';
      case 'cancelled': return 'error';
      default: return 'gray';
    }
  };

  /** Extract type-specific metadata line for an order */
  function getOrderMeta(order: Order): string | null {
    if (orderTypeMode === 'volume') {
      return order.fulfillmentType ? `Fulfillment: ${order.fulfillmentType}` : null;
    }
    if (orderTypeMode === 'cake') {
      const parsed = parseCakeMetadata(order.specialInstructions);
      const parts = [];
      if (parsed.eventType) parts.push(parsed.eventType);
      if (parsed.numberOfPeople) parts.push(`${parsed.numberOfPeople} people`);
      return parts.length ? parts.join(' · ') : null;
    }
    return null;
  }

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
        {hasContent && !isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{fulfilled.length}/{activeOrders.length} picked up</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: activeOrders.length ? `${(fulfilled.length / activeOrders.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Order type selector */}
      <div className="mb-4">
        <OrderTypeSelector value={orderTypeMode} onChange={setOrderTypeMode} />
      </div>

      {/* Launch mode: menu selector */}
      {isLaunchMode && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
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
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      )}

      {hasContent && !isLoading && (
        <>
          {/* QR Scanner — launch mode only */}
          {isLaunchMode && (
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
          )}

          {/* Orders list */}
          {isLaunchMode ? (
            /* Launch mode */
            launchOrders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">No orders for this menu yet.</p>
            ) : (
              <div className="space-y-6">
                {launchGrouped.map(([slot, slotOrders]) => {
                  const slotFulfilled = slotOrders.filter((o) => o.status === 'fulfilled').length;
                  return (
                    <div key={slot}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{slot}</h3>
                        <span className="text-xs text-gray-500">{slotFulfilled}/{slotOrders.length} picked up</span>
                      </div>
                      <div className="space-y-2">
                        {slotOrders.map((order) => (
                          <OrderCard key={order.id} order={order} statusColor={statusColor}
                            fulfilling={fulfilling} onFulfill={fulfillOrder} meta={null} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Upcoming catering/cake mode: grouped by date */
            upcomingOrders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">
                No upcoming {orderTypeMode === 'volume' ? 'catering' : 'cake'} orders.
              </p>
            ) : (
              <div className="space-y-6">
                {dateGrouped.map(([dateKey, dateOrders]) => {
                  const dateFulfilled = dateOrders.filter((o) => o.status === 'fulfilled').length;
                  return (
                    <div key={dateKey}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{formatDate(dateKey)}</h3>
                        <span className="text-xs text-gray-500">{dateFulfilled}/{dateOrders.length} fulfilled</span>
                      </div>
                      <div className="space-y-2">
                        {dateOrders.map((order) => (
                          <OrderCard key={order.id} order={order} statusColor={statusColor}
                            fulfilling={fulfilling} onFulfill={fulfillOrder} meta={getOrderMeta(order)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

/** Reusable order card for both launch and date-based modes */
function OrderCard({
  order,
  statusColor,
  fulfilling,
  onFulfill,
  meta,
}: {
  order: Order;
  statusColor: (s: string) => 'success' | 'warning' | 'blue' | 'error' | 'gray';
  fulfilling: string | null;
  onFulfill: (id: string) => void;
  meta: string | null;
}) {
  return (
    <div
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
        {meta && (
          <p className="text-xs text-purple-700 bg-purple-50 inline-block px-2 py-0.5 rounded mt-1">{meta}</p>
        )}
        {order.allergenNotes && (
          <p className="text-xs text-red-700 bg-red-50 inline-block px-2 py-0.5 rounded mt-1">{order.allergenNotes}</p>
        )}
        {order.specialInstructions && order.orderType !== 'cake' && (
          <p className="text-xs text-amber-700 mt-1">{order.specialInstructions}</p>
        )}
      </div>

      {/* Action */}
      {order.status !== 'fulfilled' && order.status !== 'cancelled' && (
        <Button
          color="primary"
          size="sm"
          onClick={() => onFulfill(order.id)}
          disabled={fulfilling === order.id}
        >
          {fulfilling === order.id ? 'Updating…' : 'Mark Fulfilled'}
        </Button>
      )}
      {order.status === 'fulfilled' && (
        <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}
