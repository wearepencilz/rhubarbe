'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/button';
import { Select } from '@/app/admin/components/ui/select';
import { useToast } from '@/app/admin/components/ToastContainer';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  pickupDate: string | null;
  pickupLocationName: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  specialInstructions: string | null;
  allergenNotes: string | null;
  fulfillmentDate: string | null;
  orderType: string;
  status: string;
  paymentStatus: string;
  total: number;
  launchTitle: string | null;
  items: OrderItem[];
}

interface PrepEntry {
  productName: string;
  totalQuantity: number;
  orders: { orderNumber: string; quantity: number }[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function aggregateItems(orders: Order[]): PrepEntry[] {
  const map = new Map<string, PrepEntry>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = map.get(item.productName);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.orders.push({ orderNumber: order.orderNumber, quantity: item.quantity });
      } else {
        map.set(item.productName, {
          productName: item.productName,
          totalQuantity: item.quantity,
          orders: [{ orderNumber: order.orderNumber, quantity: item.quantity }],
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName));
}

const PAYMENT_OPTIONS = [
  { id: '', label: 'All statuses' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending / Draft' },
  { id: 'refunded', label: 'Refunded' },
];

const ORDER_TYPE_OPTIONS = [
  { id: '', label: 'All types' },
  { id: 'launch', label: 'Menu' },
  { id: 'volume', label: 'Catering' },
  { id: 'cake', label: 'Cake' },
];

function paymentBadge(status: string) {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    refunded: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    fulfilled: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

export default function PrepFulfillmentPage() {
  const toast = useToast();
  const [dateFrom, setDateFrom] = useState(getToday());
  const [dateTo, setDateTo] = useState(getToday());
  const [paymentStatus, setPaymentStatus] = useState('');
  const [orderType, setOrderType] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'summary' | 'orders'>('summary');

  function fetchOrders() {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (orderType) params.set('orderType', orderType);

    fetch(`/api/orders/prep?${params}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setOrders)
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchOrders(); }, []);

  const prepEntries = useMemo(() => aggregateItems(orders), [orders]);
  const totalItems = useMemo(() => orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0), [orders]);

  function handleExportCsv() {
    const lines = ['Product,Total Qty,Orders'];
    for (const e of prepEntries) {
      const orderList = e.orders.map((o) => `${o.orderNumber}(${o.quantity})`).join(' ');
      lines.push(`"${e.productName}",${e.totalQuantity},"${orderList}"`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `prep-${dateFrom}-to-${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl">
      <Link href="/admin/orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Orders
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Prep & Fulfillment</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div className="w-40">
            <Select label="Payment" value={paymentStatus} onChange={setPaymentStatus} options={PAYMENT_OPTIONS} size="sm" />
          </div>
          <div className="w-36">
            <Select label="Type" value={orderType} onChange={setOrderType} options={ORDER_TYPE_OPTIONS} size="sm" />
          </div>
          <Button variant="primary" size="sm" onClick={fetchOrders} isLoading={loading}>Search</Button>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && orders.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {orders.length} order{orders.length !== 1 ? 's' : ''} · {totalItems} items
          </p>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button type="button" onClick={() => setView('summary')}
                className={`px-3 py-1.5 text-xs font-medium ${view === 'summary' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                Summary
              </button>
              <button type="button" onClick={() => setView('orders')}
                className={`px-3 py-1.5 text-xs font-medium border-l border-gray-200 ${view === 'orders' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                Orders
              </button>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>Export CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>Print</Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-16">No orders found for this period.</p>
      )}

      {/* Summary view — aggregated product quantities */}
      {!loading && orders.length > 0 && view === 'summary' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Product</th>
                <th className="px-5 py-3 text-right font-medium text-gray-600">Total Qty</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prepEntries.map((e) => (
                <tr key={e.productName}>
                  <td className="px-5 py-3 font-medium text-gray-900">{e.productName}</td>
                  <td className="px-5 py-3 text-right font-mono text-lg font-bold text-gray-900">{e.totalQuantity}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {e.orders.map((o) => `${o.orderNumber} (×${o.quantity})`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders view — individual order details */}
      {!loading && orders.length > 0 && view === 'orders' && (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600">
                  {order.orderNumber}
                </Link>
                <span className="text-sm text-gray-600">{order.customerName}</span>
                {statusBadge(order.status)}
                {paymentBadge(order.paymentStatus)}
                <span className="text-xs text-gray-400 ml-auto">
                  {order.fulfillmentDate ? formatDate(order.fulfillmentDate) : order.items[0]?.pickupDate ? formatDate(order.items[0].pickupDate) : '—'}
                </span>
                {order.orderType !== 'launch' && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{order.orderType}</span>
                )}
              </div>
              <div className="px-5 py-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-gray-700">{item.productName}</span>
                    <span className="font-mono text-gray-900">×{item.quantity}</span>
                  </div>
                ))}
                {order.specialInstructions && (
                  <p className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded mt-1 mb-1">{order.specialInstructions}</p>
                )}
                {order.allergenNotes && (
                  <p className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded mt-1 mb-1">⚠️ {order.allergenNotes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
