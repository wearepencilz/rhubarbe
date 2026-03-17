'use client';

import { useState, useEffect } from 'react';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Button } from '@/app/admin/components/ui/buttons/button';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Trash01 } from '@untitledui/icons';

interface Request {
  id: number;
  type: 'traiteur' | 'gateaux';
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: string;
  eventType: string;
  delivery: string;
  address: string;
  notes: string;
  status: 'new' | 'read' | 'archived';
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'new',
  read: 'read',
  archived: 'archived',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  read: 'bg-gray-100 text-gray-600',
  archived: 'bg-gray-50 text-gray-400',
};

export default function RequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Request | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number; name: string }>({ show: false, id: 0, name: '' });

  useEffect(() => {
    fetch('/api/requests')
      .then((r) => r.json())
      .then((data) => setRequests([...data].reverse()))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: status as any } : r));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: status as any } : s);  };

  const handleDelete = async () => {
    await fetch(`/api/requests/${deleteConfirm.id}`, { method: 'DELETE' });
    setRequests((prev) => prev.filter((r) => r.id !== deleteConfirm.id));
    if (selected?.id === deleteConfirm.id) setSelected(null);
    toast.success('Request deleted');
    setDeleteConfirm({ show: false, id: 0, name: '' });
  };

  return (
    <>
      <div className="flex gap-6 h-full">
        {/* List */}
        <div className="flex-1 min-w-0">
          <TableCard.Root>
            <TableCard.Header
              title="Requests"
              badge={requests.filter((r) => r.status === 'new').length}
              description="Catering and signature cake enquiries"
            />
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-sm text-tertiary">No requests yet</p>
              </div>
            ) : (
              <Table aria-label="Requests">
                <Table.Header>
                  <Table.Head isRowHeader label="Name" />
                  <Table.Head label="Type" />
                  <Table.Head label="Event date" />
                  <Table.Head label="Statut" />
                  <Table.Head label="" />
                </Table.Header>
                <Table.Body items={requests}>
                  {(item) => (
                    <Table.Row key={item.id} id={String(item.id)} onAction={() => setSelected(item)}>
                      <Table.Cell>
                        <div>
                          <p className="text-sm font-medium text-primary">{item.name}</p>
                          <p className="text-xs text-tertiary">{item.email}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs text-secondary capitalize">{item.type}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-secondary">{item.date || '—'}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                            onClick={() => setDeleteConfirm({ show: true, id: item.id, name: item.name })}
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
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0 border border-gray-200 rounded-xl bg-white p-6 space-y-4 self-start sticky top-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{selected.name}</p>
                <p className="text-xs text-gray-500 capitalize">{selected.type}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            <dl className="space-y-2 text-sm">
              {([
                ['Email', selected.email],
                ['Phone', selected.phone],
                ['Date', selected.date],
                ['Time', selected.time],
                ['Guests', selected.guests],
                ['Event type', selected.eventType],
                ['Delivery', selected.delivery],
                ...(selected.delivery === 'yes' ? [['Address', selected.address]] : []),
                ['Notes', selected.notes],
              ] as [string, string][]).map(([k, v]) => v ? (
                <div key={k}>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">{k}</dt>
                  <dd className="text-gray-700">{v}</dd>
                </div>
              ) : null)}
            </dl>

            <div className="pt-2 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Statut</p>
              <div className="flex gap-2 flex-wrap">
                {(['new', 'read', 'archived'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${selected.status === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Reçu le {new Date(selected.createdAt).toLocaleDateString('fr-CA', { dateStyle: 'long' })}
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.show}
        variant="danger"
        title="Delete request"
        message={`Delete request from "${deleteConfirm.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: 0, name: '' })}
      />
    </>
  );
}
