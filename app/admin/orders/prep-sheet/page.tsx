'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
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
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  specialInstructions: string | null;
  status: string;
  items: OrderItem[];
}

interface PrepEntry {
  productName: string;
  totalQuantity: number;
  notes: string[];
}

export default function PrepSheetPage() {
  const toast = useToast();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedLaunch, setSelectedLaunch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLaunches, setLoadingLaunches] = useState(true);

  useEffect(() => {
    fetch('/api/launches')
      .then((r) => r.json())
      .then(setLaunches)
      .catch(() => toast.error('Error', 'Failed to load menus'))
      .finally(() => setLoadingLaunches(false));
  }, []);

  useEffect(() => {
    if (!selectedLaunch) return;
    setLoading(true);
    fetch(`/api/orders/by-launch/${selectedLaunch}`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => toast.error('Error', 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, [selectedLaunch]);

  // Aggregate items across all orders
  const prepEntries: PrepEntry[] = (() => {
    const map = new Map<string, PrepEntry>();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = map.get(item.productName);
        if (existing) {
          existing.totalQuantity += item.quantity;
          if (order.specialInstructions) existing.notes.push(`${order.orderNumber}: ${order.specialInstructions}`);
        } else {
          map.set(item.productName, {
            productName: item.productName,
            totalQuantity: item.quantity,
            notes: order.specialInstructions ? [`${order.orderNumber}: ${order.specialInstructions}`] : [],
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  })();

  const selectedLaunchData = launches.find((l) => l.id === selectedLaunch);

  function handleExportCsv() {
    const header = 'Product,Total Qty,Notes';
    const rows = prepEntries.map((e) =>
      `"${e.productName}",${e.totalQuantity},"${e.notes.join('; ').replace(/"/g, '""')}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prep-sheet-${selectedLaunchData?.title.en || 'menu'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Prep Sheet</h1>

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
          {/* Summary table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Production Summary — {prepEntries.length} product{prepEntries.length !== 1 ? 's' : ''}, {orders.length} order{orders.length !== 1 ? 's' : ''}
              </h2>
              <div className="flex gap-2">
                <Button color="secondary" size="sm" onClick={handleExportCsv} disabled={prepEntries.length === 0}>
                  Export CSV
                </Button>
                <Button color="secondary" size="sm" onClick={() => window.print()} disabled={prepEntries.length === 0}>
                  Print
                </Button>
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
                    <th className="px-5 py-3 text-left font-medium text-gray-600">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prepEntries.map((e) => (
                    <tr key={e.productName}>
                      <td className="px-5 py-3 font-medium text-gray-900">{e.productName}</td>
                      <td className="px-5 py-3 text-right font-mono text-lg font-bold text-gray-900">{e.totalQuantity}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{e.notes.length ? e.notes.join('; ') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
