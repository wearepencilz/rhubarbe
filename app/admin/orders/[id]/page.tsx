'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  pickupDate: string;
  pickupLocationName: string;
  pickupSlot: { startTime: string; endTime: string } | null;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  shopifyOrderId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialInstructions: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  orderDate: string;
  items: OrderItem[];
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setOrder(data))
      .catch(() => toast.error('Error', 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function updateStatus(newStatus: string) {
    if (!order) return;
    try {
      setUpdating(true);
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder((prev) => prev ? { ...prev, status: updated.status } : prev);
        toast.success('Updated', `Status changed to ${newStatus}`);
      } else {
        toast.error('Error', 'Failed to update status');
      }
    } catch {
      toast.error('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const statusColor = (s: string) => {
    switch (s) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'fulfilled': return 'blue';
      case 'cancelled': return 'error';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-tertiary">Order not found</p>
        <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline mt-2 inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  const firstItem = order.items[0];

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link href="/admin/orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Orders
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">{new Date(order.orderDate).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color={statusColor(order.status)}>{order.status}</Badge>
          <Select
            placeholder="Update status"
            selectedKey=""
            onSelectionChange={(key) => updateStatus(key as string)}
            items={[
              { id: 'pending', label: 'Pending' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'fulfilled', label: 'Fulfilled' },
              { id: 'cancelled', label: 'Cancelled' },
            ]}
          >
            {(item) => <Select.Item id={item.id} label={item.label} />}
          </Select>
        </div>
      </div>

      {/* Customer & Pickup info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Customer</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Name</dt><dd className="text-gray-900">{order.customerName}</dd></div>
            <div><dt className="text-gray-500">Email</dt><dd className="text-gray-900">{order.customerEmail || '—'}</dd></div>
            <div><dt className="text-gray-500">Phone</dt><dd className="text-gray-900">{order.customerPhone || '—'}</dd></div>
          </dl>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Pickup</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Date</dt><dd className="text-gray-900">{firstItem?.pickupDate ? new Date(firstItem.pickupDate).toLocaleDateString() : '—'}</dd></div>
            <div><dt className="text-gray-500">Location</dt><dd className="text-gray-900">{firstItem?.pickupLocationName || '—'}</dd></div>
            {firstItem?.pickupSlot && (
              <div><dt className="text-gray-500">Slot</dt><dd className="text-gray-900">{firstItem.pickupSlot.startTime} – {firstItem.pickupSlot.endTime}</dd></div>
            )}
          </dl>
        </div>
      </div>

      {/* Special instructions */}
      {order.specialInstructions && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-amber-800 mb-1">Special Instructions</p>
          <p className="text-sm text-amber-700 whitespace-pre-wrap">{order.specialInstructions}</p>
        </div>
      )}

      {/* Line items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Unit Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 text-gray-900">{item.productName}</td>
                <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-700 font-mono">{fmt(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono">{fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-200 px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span className="font-mono">{fmt(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span><span className="font-mono">{fmt(order.tax)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-100">
            <span>Total</span><span className="font-mono">{fmt(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Payment:</span>
        <Badge color={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'refunded' ? 'error' : 'warning'}>
          {order.paymentStatus}
        </Badge>
        {order.shopifyOrderId && (
          <span className="ml-2 text-gray-400">Shopify #{order.shopifyOrderId}</span>
        )}
      </div>
    </div>
  );
}
