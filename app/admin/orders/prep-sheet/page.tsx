'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Input } from '@/app/admin/components/ui/input';
import { Button } from '@/app/admin/components/ui/button';
import { generatePrepSheet, prepSheetToCsv, type Order } from '@/lib/preorder/order-operations';
import { useToast } from '@/app/admin/components/ToastContainer';

export default function PrepSheetPage() {
  const router = useRouter();
  const toast = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [entries, setEntries] = useState<ReturnType<typeof generatePrepSheet>>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (locationFilter) params.append('location', locationFilter);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const orders: Order[] = await res.json();

      const sheet = generatePrepSheet(orders, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        locationId: locationFilter || undefined,
      });
      setEntries(sheet);
      setGenerated(true);
    } catch {
      toast.error('Generation failed', 'Could not generate prep sheet');
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    const csv = prepSheetToCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prep-sheet-${startDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <EditPageLayout
      title="Prep Sheet"
      backHref="/admin/orders"
      backLabel="Back to Orders"
      onSave={handleGenerate}
      onCancel={() => router.push('/admin/orders')}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Date Range</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Start date" type="date" value={startDate} onChange={setStartDate} />
            <Input label="End date" type="date" value={endDate} onChange={setEndDate} />
            <Input label="Location ID (optional)" value={locationFilter} onChange={setLocationFilter} placeholder="e.g. loc-1" />
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
                Results ({entries.length} product{entries.length !== 1 ? 's' : ''})
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
              <p className="px-6 py-8 text-sm text-gray-500 text-center">No orders found for the selected range.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((e, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3 font-medium text-gray-900">{e.productName}</td>
                      <td className="px-6 py-3 text-gray-500">{e.category}</td>
                      <td className="px-6 py-3 text-right font-mono text-gray-900">{e.totalQuantity}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{e.specialInstructions.join('; ') || '—'}</td>
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
