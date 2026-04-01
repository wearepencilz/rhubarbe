'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';
import OrderTypeSelector from '@/app/admin/components/OrderTypeSelector';
import { parseCakeMetadata } from '@/lib/utils/parse-cake-metadata';

type OrderType = 'launch' | 'volume' | 'cake';

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
  allergenNotes: string | null;
  fulfillmentDate: string | null;
  orderType: string;
  status: string;
  launchTitle: string | null;
  items: OrderItem[];
}

interface PrepEntry {
  productName: string;
  totalQuantity: number;
  notes: string[];
}

interface CateringMeta {
  orderNumber: string;
  allergenNotes: string;
}

interface CakeMeta {
  orderNumber: string;
  eventType: string | null;
  numberOfPeople: number | null;
}

interface DateGroup {
  date: string;
  dateLabel: string;
  orders: Order[];
  prepEntries: PrepEntry[];
  cateringMeta: CateringMeta[];
  cakeMeta: CakeMeta[];
  totalQty: number;
}

/** Aggregate items across orders into prep entries */
function aggregatePrepEntries(orders: Order[]): PrepEntry[] {
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
}

function extractCateringMeta(orders: Order[]): CateringMeta[] {
  return orders
    .filter((o) => o.allergenNotes)
    .map((o) => ({ orderNumber: o.orderNumber, allergenNotes: o.allergenNotes! }));
}

function extractCakeMeta(orders: Order[]): CakeMeta[] {
  return orders.map((o) => {
    const parsed = parseCakeMetadata(o.specialInstructions);
    return { orderNumber: o.orderNumber, eventType: parsed.eventType, numberOfPeople: parsed.numberOfPeople };
  });
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

function groupByDate(orders: Order[], mode: OrderType): DateGroup[] {
  if (mode === 'launch') return groupByLaunch(orders);
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    const dateKey = order.fulfillmentDate?.split('T')[0] ?? 'unknown';
    const arr = map.get(dateKey) || [];
    arr.push(order);
    map.set(dateKey, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dateOrders]) => ({
      date,
      dateLabel: formatDate(date),
      orders: dateOrders,
      prepEntries: aggregatePrepEntries(dateOrders),
      cateringMeta: extractCateringMeta(dateOrders),
      cakeMeta: extractCakeMeta(dateOrders),
      totalQty: dateOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0),
    }));
}

function groupByLaunch(orders: Order[]): DateGroup[] {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    const key = order.launchTitle || 'No menu';
    const arr = map.get(key) || [];
    arr.push(order);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .map(([title, launchOrders]) => {
      const date = launchOrders[0]?.fulfillmentDate?.split('T')[0] ?? '';
      return {
        date,
        dateLabel: `${title}${date ? ` — ${formatDate(date)}` : ''}`,
        orders: launchOrders,
        prepEntries: aggregatePrepEntries(launchOrders),
        cateringMeta: [],
        cakeMeta: [],
        totalQty: launchOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function generateCsv(groups: DateGroup[], mode: OrderType): string {
  const lines: string[] = [];
  for (const g of groups) {
    lines.push(`Date: ${g.dateLabel}`);
    lines.push('Product,Total Qty,Notes');
    for (const e of g.prepEntries) {
      lines.push(`"${e.productName}",${e.totalQuantity},"${e.notes.join('; ').replace(/"/g, '""')}"`);
    }
    if (mode === 'volume' && g.cateringMeta.length) {
      lines.push('');
      lines.push('Order,Allergen Notes');
      for (const m of g.cateringMeta) lines.push(`"${m.orderNumber}","${m.allergenNotes.replace(/"/g, '""')}"`);
    }
    if (mode === 'cake' && g.cakeMeta.length) {
      lines.push('');
      lines.push('Order,Event Type,# People');
      for (const m of g.cakeMeta) lines.push(`"${m.orderNumber}","${m.eventType || ''}",${m.numberOfPeople ?? ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export default function PrepSheetPage() {
  const toast = useToast();
  const [orderTypeMode, setOrderTypeMode] = useState<OrderType>('launch');

  // Upcoming orders state (all modes)
  const [upcomingOrders, setUpcomingOrders] = useState<Order[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  // Auto-fetch upcoming orders for the selected mode
  useEffect(() => {
    setLoadingUpcoming(true);
    fetch(`/api/orders/upcoming?orderType=${orderTypeMode}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setUpcomingOrders)
      .catch(() => toast.error('Error', 'Failed to load upcoming orders'))
      .finally(() => setLoadingUpcoming(false));
  }, [orderTypeMode]);

  const dateGroups = useMemo(() => groupByDate(upcomingOrders, orderTypeMode), [upcomingOrders, orderTypeMode]);

  function handleExportCsv() {
    const csv = generateCsv(dateGroups, orderTypeMode);
    const label = orderTypeMode === 'volume' ? 'catering' : orderTypeMode === 'cake' ? 'cake' : 'menu';
    const filename = `prep-sheet-${label}-upcoming.csv`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl">
      <Link href="/admin/orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Orders
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Prep Sheet</h1>

      <div className="flex items-center justify-between mb-4">
        <OrderTypeSelector value={orderTypeMode} onChange={setOrderTypeMode} />
        {dateGroups.length > 0 && (
          <div className="flex gap-2">
            <Button color="secondary" size="sm" onClick={handleExportCsv}>Export CSV</Button>
            <Button color="secondary" size="sm" onClick={() => window.print()}>Print</Button>
          </div>
        )}
      </div>

      {loadingUpcoming && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      )}
      {!loadingUpcoming && dateGroups.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-16">
          No upcoming {orderTypeMode === 'volume' ? 'catering' : orderTypeMode === 'cake' ? 'cake' : 'menu'} orders.
        </p>
      )}
      {!loadingUpcoming && dateGroups.map((group) => (
        <div key={group.date} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {group.dateLabel} — {group.orders.length} order{group.orders.length !== 1 ? 's' : ''}, {group.totalQty} items
            </h2>
          </div>

          {/* Prep table for this date */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Product</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-600">Total Qty</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.prepEntries.map((e) => (
                  <tr key={e.productName}>
                    <td className="px-5 py-3 font-medium text-gray-900">{e.productName}</td>
                    <td className="px-5 py-3 text-right font-mono text-lg font-bold text-gray-900">{e.totalQuantity}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{e.notes.length ? e.notes.join('; ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Catering: allergen notes for this date */}
          {orderTypeMode === 'volume' && group.cateringMeta.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700">Allergen Notes</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {group.cateringMeta.map((m) => (
                  <div key={m.orderNumber} className="px-5 py-2 flex items-start gap-3">
                    <span className="text-sm font-medium text-gray-700 shrink-0">{m.orderNumber}</span>
                    <span className="text-sm text-red-700 bg-red-50 px-2 py-0.5 rounded">{m.allergenNotes}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cake: order details for this date */}
          {orderTypeMode === 'cake' && group.cakeMeta.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700">Cake Order Details</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-2 text-left font-medium text-gray-600">Order</th>
                    <th className="px-5 py-2 text-left font-medium text-gray-600">Event</th>
                    <th className="px-5 py-2 text-right font-medium text-gray-600"># People</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {group.cakeMeta.map((m) => (
                    <tr key={m.orderNumber}>
                      <td className="px-5 py-2 font-medium text-gray-700">{m.orderNumber}</td>
                      <td className="px-5 py-2 text-gray-600">{m.eventType || '—'}</td>
                      <td className="px-5 py-2 text-right font-mono text-gray-900">{m.numberOfPeople ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
