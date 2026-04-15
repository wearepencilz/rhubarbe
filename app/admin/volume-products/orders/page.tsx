'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { SearchLg } from '@untitledui/icons';
import CateringProductionTimeline from '@/app/admin/components/CateringProductionTimeline';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  fulfillmentDate: string | null;
  status: string;
  totalAmount: number;
  totalQuantity: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusColor(s: string) {
  switch (s) {
    case 'confirmed': return 'success' as const;
    case 'pending': return 'warning' as const;
    case 'fulfilled': return 'blue' as const;
    case 'cancelled': return 'error' as const;
    default: return 'gray' as const;
  }
}

export default function CateringOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/orders?orderType=volume')
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || o.fulfillmentDate?.slice(0, 10) === dateFilter;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      <CateringProductionTimeline onDateFilter={setDateFilter} />
      <TableCard.Root>
        <TableCard.Header
          title="Catering Orders"
          badge={filtered.length}
          description={dateFilter ? `Filtered to ${formatDate(dateFilter + 'T00:00:00')}` : 'Orders placed through the catering flow'}
          contentTrailing={
            <div className="relative">
              <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 w-52"
              />
            </div>
          }
        />
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-tertiary">No catering orders found</p>
          </div>
        ) : (
          <Table aria-label="Catering Orders">
            <Table.Header>
              <Table.Head isRowHeader label="Order #" />
              <Table.Head label="Customer" />
              <Table.Head label="Date" />
              <Table.Head label="Fulfillment" />
              <Table.Head label="Qty" />
              <Table.Head label="Total" />
              <Table.Head label="Status" />
            </Table.Header>
            <Table.Body items={filtered}>
              {(order) => (
                <Table.Row key={order.id} id={order.id} onAction={() => router.push(`/admin/orders/${order.id}`)}>
                  <Table.Cell><span className="text-sm font-medium text-primary">{order.orderNumber}</span></Table.Cell>
                  <Table.Cell><span className="text-sm text-secondary">{order.customerName}</span></Table.Cell>
                  <Table.Cell><span className="text-sm text-secondary">{formatDate(order.orderDate)}</span></Table.Cell>
                  <Table.Cell><span className="text-sm text-secondary">{order.fulfillmentDate ? formatDate(order.fulfillmentDate) : '—'}</span></Table.Cell>
                  <Table.Cell><span className="text-sm text-secondary">{order.totalQuantity}</span></Table.Cell>
                  <Table.Cell><span className="text-sm text-secondary">${(order.totalAmount / 100).toFixed(2)}</span></Table.Cell>
                  <Table.Cell><Badge color={statusColor(order.status)}>{order.status}</Badge></Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        )}
      </TableCard.Root>
    </div>
  );
}
