'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { useToast } from '@/app/admin/components/ToastContainer';
import OrderTypeBadge from '@/app/admin/components/OrderTypeBadge';
import { SearchLg } from '@untitledui/icons';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  pickupDate: string | null;
  pickupLocation: string | null;
  status: string;
  totalAmount: number;
  orderType: string;
  fulfillmentDate: string | null;
  allergenNotes: string | null;
  totalQuantity: number;
  numberOfPeople: number | null;
  eventType: string | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchData(); }, [statusFilter, orderTypeFilter]);

  async function fetchData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (orderTypeFilter !== 'all') params.append('orderType', orderTypeFilter);
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) setOrders(await res.json());
    } catch {
      toast.error('Fetch failed', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColor = (s: string) => {
    switch (s) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'fulfilled': return 'blue';
      case 'cancelled': return 'error';
      default: return 'gray';
    }
  };

  async function syncFromShopify() {
    try {
      setSyncing(true);
      const res = await fetch('/api/orders/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Sync complete', data.message);
        fetchData();
      } else {
        toast.error('Sync failed', data.error || 'Unknown error');
      }
    } catch {
      toast.error('Sync failed', 'Could not reach sync endpoint');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <TableCard.Root>
      <TableCard.Header
        title="Order Operations"
        badge={filtered.length}
        description="Manage preorders, generate prep sheets, and track pickups"
        contentTrailing={
          <div className="flex items-center gap-3">
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
            <Select
              placeholder="All statuses"
              selectedKey={statusFilter}
              onSelectionChange={(key) => setStatusFilter(key as string)}
              items={[
                { id: 'all', label: 'All statuses' },
                { id: 'pending', label: 'Pending' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'fulfilled', label: 'Fulfilled' },
                { id: 'cancelled', label: 'Cancelled' },
              ]}
            >
              {(item) => <Select.Item id={item.id} label={item.label} />}
            </Select>
            <Select
              placeholder="All types"
              selectedKey={orderTypeFilter}
              onSelectionChange={(key) => setOrderTypeFilter(key as string)}
              items={[
                { id: 'all', label: 'All types' },
                { id: 'launch', label: 'Menu' },
                { id: 'volume', label: 'Catering' },
                { id: 'cake', label: 'Cake' },
              ]}
            >
              {(item) => <Select.Item id={item.id} label={item.label} />}
            </Select>
            <Button color="secondary" size="sm" onClick={() => router.push('/admin/orders/prep-sheet')}>
              Prep Sheet
            </Button>
            <Button color="secondary" size="sm" onClick={() => router.push('/admin/orders/pickup-list')}>
              Pickup List
            </Button>
            <Button color="secondary" size="sm" onClick={syncFromShopify} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync Shopify'}
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-tertiary">
            {searchTerm ? 'No orders match your search' : 'No orders found'}
          </p>
        </div>
      ) : (
        <Table aria-label="Orders">
          <Table.Header>
            <Table.Head isRowHeader label="Order #" />
            <Table.Head label="Customer" />
            <Table.Head label="Date" />
            <Table.Head label="Type" />
            {orderTypeFilter === 'volume' ? (
              <>
                <Table.Head label="Fulfillment Date" />
                <Table.Head label="Total Qty" />
                <Table.Head label="Allergen Notes" />
              </>
            ) : orderTypeFilter === 'cake' ? (
              <>
                <Table.Head label="Pickup Date" />
                <Table.Head label="# People" />
                <Table.Head label="Event Type" />
                <Table.Head label="Total Qty" />
              </>
            ) : (
              <>
                <Table.Head label="Pickup Date" />
                <Table.Head label="Pickup Location" />
              </>
            )}
            <Table.Head label="Status" />
            <Table.Head label="Total" />
          </Table.Header>
          <Table.Body items={filtered}>
            {(order) => (
              <Table.Row key={order.id} id={order.id} onAction={() => router.push(`/admin/orders/${order.id}`)}>
                <Table.Cell>
                  <p className="text-sm font-medium text-primary font-mono">{order.orderNumber}</p>
                </Table.Cell>
                <Table.Cell>
                  <p className="text-sm text-primary">{order.customerName}</p>
                </Table.Cell>
                <Table.Cell>
                  <p className="text-sm text-primary">{order.orderDate}</p>
                </Table.Cell>
                <Table.Cell>
                  <OrderTypeBadge orderType={order.orderType} />
                </Table.Cell>
                {orderTypeFilter === 'volume' ? (
                  <>
                    <Table.Cell>
                      <p className="text-sm text-primary">{order.fulfillmentDate || '—'}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-primary">{order.totalQuantity}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-primary truncate max-w-[200px]" title={order.allergenNotes || ''}>
                        {order.allergenNotes || '—'}
                      </p>
                    </Table.Cell>
                  </>
                ) : orderTypeFilter === 'cake' ? (
                  <>
                    <Table.Cell>
                      <p className="text-sm text-primary">{order.pickupDate || '—'}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-primary">{order.numberOfPeople ?? '—'}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-primary">{order.eventType || '—'}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-primary">{order.totalQuantity}</p>
                    </Table.Cell>
                  </>
                ) : (
                  <>
                    <Table.Cell>
                      <p className="text-sm text-primary">{order.pickupDate || '—'}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-primary">{order.pickupLocation || '—'}</p>
                    </Table.Cell>
                  </>
                )}
                <Table.Cell>
                  <Badge color={statusColor(order.status)}>{order.status}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <p className="text-sm text-primary font-mono">${(order.totalAmount / 100).toFixed(2)}</p>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      )}
    </TableCard.Root>
  );
}
