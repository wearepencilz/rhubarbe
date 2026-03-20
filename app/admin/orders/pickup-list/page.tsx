'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Input } from '@/app/admin/components/ui/input';
import { Button } from '@/app/admin/components/ui/button';
import { generatePickupList, pickupListToCsv, type Order } from '@/lib/preorder/order-operations';
import { useToast } from '@/app/admin/components/ToastContainer';

export default function PickupListPage() {
  const router = useRouter();
  const toast = useToast();
  const [date, setDate] = useState('');
  const [locationId, setLocationId] = useState('');
  const [entries, setEntries] = useState<ReturnType<typeof generatePickupList>>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    if (!date || !locationId) {
      toast.error('Missing fields', 'Both date and location are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const orders: Order[] = await res.json();

      const list = generatePickupList(orders, date, locationId);
      setEntries(list);
      setGenerated(true);
    } catch {
      toast.error('Generation failed', 'Could not generate pickup list');
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    const csv = pickupListToCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pickup-list-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <EditPageLayout
      title="Pickup List"
      backHref="/admin/orders"
      backLabel="Back to Orders"
      onSave={handleGenerate}
      onCancel={() => router.push('/admin/orders')}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Pickup Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Pickup date" type="date" value={date} onChange={setDate} isRequired />
            <Input label="Location ID" value={locationId} onChange={setLocationId} placeholder="e.g. loc-1" isRequired />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        )}

        {generated && !loading && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Pickups ({entries.length} order{entries.length !== 1 ? 's' : ''})
              </h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleExportCsv} isDisabled={entries.length === 0}>
                  Export CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.print()} isDisabled={entries.length === 0}>
                  Print
                </Button>
              </div>
            </div>
            {entries.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-500 text-center">No pickups found for this date and location.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((e, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3 font-mono text-gray-900">{e.slot || '—'}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{e.customerName}</td>
                      <td className="px-6 py-3 font-mono text-gray-500">{e.orderNumber}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {e.items.map(it => `${it.quantity}× ${it.productName}`).join(', ')}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{e.specialInstructions || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </EditPageLayout>
  );
}
