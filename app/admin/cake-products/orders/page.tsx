'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { SearchLg } from '@untitledui/icons';

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

export default function CakeOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/orders?orderType=cake')
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TableCard.Root>
      <TableCard.Header
        title="Cake Orders"
        badge={filtered.length}
        description="Orders placed through the cake order flow"
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
          <p className="text-sm text-tertiary">No cake orders found</p>
        </div>
      ) : (
        <Table aria-label="Cake Orders">
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
  );
}
