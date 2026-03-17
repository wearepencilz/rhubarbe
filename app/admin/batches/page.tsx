'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column, Action } from '@/app/admin/components/DataTable';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';

interface Batch {
  id: string;
  flavourId: string;
  flavourName?: string;
  batchNumber: string;
  date: string;
  notes: string;
  status: 'testing' | 'approved' | 'rejected';
}

export default function BatchesPage() {
  const router = useRouter();
  const toast = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; name: string }>({
    show: false,
    id: '',
    name: '',
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
      const data = await res.json();
      setBatches(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (batch: Batch) => {
    setDeleteConfirm({ show: true, id: batch.id, name: batch.batchNumber });
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/batches/${deleteConfirm.id}`, { method: 'DELETE' });
      setBatches(batches.filter((b) => b.id !== deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', name: '' });
      toast.success('Batch deleted');
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Failed to delete batch');
    }
  };

  const columns: Column<Batch>[] = [
    {
      key: 'batchNumber',
      label: 'Batch #',
      render: (batch) => (
        <div className="text-sm font-medium text-gray-900">{batch.batchNumber}</div>
      ),
    },
    {
      key: 'flavourName',
      label: 'Flavour',
      render: (batch) => (
        <div className="text-sm text-gray-900">{batch.flavourName || 'Unknown'}</div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (batch) => (
        <div className="text-sm text-gray-500">
          {new Date(batch.date).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (batch) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            batch.status === 'approved'
              ? 'bg-green-100 text-green-800'
              : batch.status === 'testing'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {batch.status}
        </span>
      ),
    },
  ];

  const actions: Action<Batch>[] = [
    {
      label: 'Edit',
      icon: 'edit',
      href: (batch) => `/admin/batches/${batch.id}`,
      stopPropagation: true,
    },
    {
      label: 'Delete',
      icon: 'delete',
      onClick: handleDeleteClick,
      stopPropagation: true,
    },
  ];

  return (
    <>
      <DataTable
        title="Test Kitchen Batches"
        description="Track and manage test kitchen batch iterations"
        createButton={{ label: 'Add Batch', href: '/admin/batches/create' }}
        data={batches}
        columns={columns}
        actions={actions}
        keyExtractor={(batch) => batch.id}
        onRowClick={(batch) => router.push(`/admin/batches/${batch.id}`)}
        emptyMessage="No batches yet"
        emptyAction={{ label: 'Create your first batch', href: '/admin/batches/create' }}
        loading={loading}
      />

      <ConfirmModal
        isOpen={deleteConfirm.show}
        variant="danger"
        title="Delete Batch"
        message={`Are you sure you want to delete batch "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
      />
    </>
  );
}
