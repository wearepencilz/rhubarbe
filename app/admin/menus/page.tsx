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
import { Edit01, Trash01, Copy01 } from '@untitledui/icons';

interface Launch {
  id: string;
  title: { en: string; fr: string };
  status: 'draft' | 'active' | 'archived';
  orderOpens: string;
  orderCloses: string;
  pickupDate: string;
  pickupWindowStart: string | null;
  pickupWindowEnd: string | null;
  productCount: number;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function fmtDatetime(iso: string) {
  try { return new Date(iso).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return iso; }
}

function pickupLabel(l: Launch): string {
  if (l.pickupWindowStart && l.pickupWindowEnd) {
    return `${fmtDate(l.pickupWindowStart)} – ${fmtDate(l.pickupWindowEnd)}`;
  }
  return fmtDate(l.pickupDate);
}

const STATUS_COLOR: Record<string, 'success' | 'gray' | 'warning' | 'blue'> = {
  active: 'success',
  draft: 'warning',
  archived: 'gray',
};

export default function MenusPage() {
  const router = useRouter();
  const toast = useToast();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', title: '' });

  useEffect(() => { fetchData(); }, [statusFilter]);

  async function fetchData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await fetch(`/api/launches?${params}`);
      if (res.ok) setLaunches(await res.json());
    } catch {
      toast.error('Fetch failed', 'Failed to load menus');
    } finally {
      setLoading(false);
    }
  }

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/launches/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok) {
        setLaunches(launches.filter((l) => l.id !== deleteConfirm.id));
        toast.success('Archived', `"${deleteConfirm.title}" has been archived`);
      } else {
        toast.error('Archive failed', 'Failed to archive menu');
      }
    } catch {
      toast.error('Archive failed', 'An unexpected error occurred');
    } finally {
      setDeleteConfirm({ show: false, id: '', title: '' });
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/launches/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const created = await res.json();
        toast.success('Duplicated', `"${title}" has been duplicated as draft`);
        router.push(`/admin/menus/${created.id}`);
      } else {
        toast.error('Duplicate failed', 'Failed to duplicate menu');
      }
    } catch {
      toast.error('Duplicate failed', 'An unexpected error occurred');
    }
  };

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="Menus"
          badge={launches.length}
          description="Weekly preorder menus"
          contentTrailing={
            <div className="flex items-center gap-3">
              <Select
                placeholder="All statuses"
                selectedKey={statusFilter}
                onSelectionChange={(key) => setStatusFilter(key as string)}
                items={[
                  { id: 'all', label: 'All statuses' },
                  { id: 'draft', label: 'Draft' },
                  { id: 'active', label: 'Active' },
                  { id: 'archived', label: 'Archived' },
                ]}
              >
                {(item) => <Select.Item id={item.id} label={item.label} />}
              </Select>
              <Link href="/admin/menus/create">
                <Button color="primary" size="sm">New Menu</Button>
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
          </div>
        ) : launches.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-tertiary">No menus yet</p>
            <Link href="/admin/menus/create">
              <Button color="secondary" size="sm">Create your first menu</Button>
            </Link>
          </div>
        ) : (
          <Table aria-label="Menus">
            <Table.Header>
              <Table.Head isRowHeader label="Title" />
              <Table.Head label="Status" />
              <Table.Head label="Order Window" />
              <Table.Head label="Pickup" />
              <Table.Head label="Products" />
              <Table.Head label="" />
            </Table.Header>
            <Table.Body items={launches}>
              {(launch) => (
                <Table.Row key={launch.id} id={launch.id} onAction={() => router.push(`/admin/menus/${launch.id}`)}>
                  <Table.Cell>
                    <div>
                      <p className="text-sm font-medium text-primary">{launch.title.en}</p>
                      <p className="text-xs text-tertiary">{launch.title.fr}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={STATUS_COLOR[launch.status] ?? 'gray'}>{launch.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-xs text-secondary space-y-0.5">
                      <p>Opens {fmtDatetime(launch.orderOpens)}</p>
                      <p>Closes {fmtDatetime(launch.orderCloses)}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-secondary">{pickupLabel(launch)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-secondary">{Number(launch.productCount) || 0}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/menus/${launch.id}`}>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                          <Edit01 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Duplicate"
                        onClick={() => handleDuplicate(launch.id, launch.title.en)}>
                        <Copy01 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded" title="Archive"
                        onClick={() => setDeleteConfirm({ show: true, id: launch.id, title: launch.title.en })}>
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
        title="Archive Menu"
        message={`Are you sure you want to archive "${deleteConfirm.title}"?`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={handleArchive}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />
    </>
  );
}
