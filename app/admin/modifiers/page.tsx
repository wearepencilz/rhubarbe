'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge } from '@/src/app/admin/components/ui/base/badges/badges';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { Button } from '@/app/admin/components/ui/buttons/button';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Edit01, Trash01 } from '@untitledui/icons';

interface Modifier {
  id: string;
  name: string;
  slug: string;
  type: string;
  price: number;
  status: string;
  availableForFormatIds: string[];
  allergens: string[];
  dietaryFlags: string[];
  image?: string;
}

const TYPE_COLORS: Record<string, 'purple' | 'blue' | 'orange' | 'success' | 'gray'> = {
  topping: 'purple',
  sauce: 'orange',
  crunch: 'orange',
  drizzle: 'blue',
  'premium-addon': 'blue',
  'pack-in': 'success',
};

export default function ModifiersPage() {
  const router = useRouter();
  const toast = useToast();
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', name: '' });

  useEffect(() => {
    fetchModifiers();
  }, [typeFilter, statusFilter]);

  const fetchModifiers = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await fetch(`/api/modifiers?${params}`);
      if (res.ok) setModifiers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/modifiers/${deleteConfirm.id}`, { method: 'DELETE' });
    if (res.ok) {
      setModifiers(modifiers.filter((m) => m.id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', name: '' });
      toast.success('Modifier deleted');
    } else {
      toast.error('Failed to delete modifier');
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const filtered = modifiers.filter((m) => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="Modifiers"
          badge={filtered.length}
          description="Manage toppings, sauces, and add-ons for products"
          contentTrailing={
            <div className="flex items-center gap-3">
              <Select
                placeholder="All types"
                selectedKey={typeFilter}
                onSelectionChange={(key) => setTypeFilter(key as string)}
                items={[
                  { id: 'all', label: 'All types' },
                  { id: 'topping', label: 'Topping' },
                  { id: 'sauce', label: 'Sauce' },
                  { id: 'crunch', label: 'Crunch' },
                  { id: 'drizzle', label: 'Drizzle' },
                  { id: 'premium-addon', label: 'Premium Add-on' },
                  { id: 'pack-in', label: 'Pack-in' },
                ]}
              >
                {(item) => <Select.Item id={item.id} label={item.label} />}
              </Select>
              <Select
                placeholder="All statuses"
                selectedKey={statusFilter}
                onSelectionChange={(key) => setStatusFilter(key as string)}
                items={[
                  { id: 'all', label: 'All statuses' },
                  { id: 'active', label: 'Active' },
                  { id: 'archived', label: 'Archived' },
                ]}
              >
                {(item) => <Select.Item id={item.id} label={item.label} />}
              </Select>
              <Link href="/admin/modifiers/new">
                <Button color="primary" size="sm">Create modifier</Button>
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-tertiary">No modifiers found</p>
            <Link href="/admin/modifiers/new">
              <Button color="secondary" size="sm">Create your first modifier</Button>
            </Link>
          </div>
        ) : (
          <Table aria-label="Modifiers">
            <Table.Header>
              <Table.Head isRowHeader label="Name" />
              <Table.Head label="Type" />
              <Table.Head label="Price" />
              <Table.Head label="Status" />
              <Table.Head label="Formats" />
              <Table.Head label="" />
            </Table.Header>
            <Table.Body items={filtered}>
              {(modifier) => (
                <Table.Row
                  key={modifier.id}
                  id={modifier.id}
                  onAction={() => router.push(`/admin/modifiers/${modifier.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {modifier.image && (
                        <img src={modifier.image} alt={modifier.name} className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary">{modifier.name}</p>
                        <p className="text-xs text-tertiary">{modifier.slug}</p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={TYPE_COLORS[modifier.type] ?? 'gray'}>{modifier.type}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm font-medium text-primary">{formatPrice(modifier.price)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={modifier.status === 'active' ? 'success' : 'gray'}>
                      {modifier.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-tertiary">{modifier.availableForFormatIds.length} format{modifier.availableForFormatIds.length !== 1 ? 's' : ''}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/modifiers/${modifier.id}`}>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                          <Edit01 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                        title="Delete"
                        onClick={() => setDeleteConfirm({ show: true, id: modifier.id, name: modifier.name })}
                      >
                        <Trash01 className="w-4 h-4" />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        )}
      </TableCard.Root>

      <ConfirmModal
        isOpen={deleteConfirm.show}
        variant="danger"
        title="Delete Modifier"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
      />
    </>
  );
}
