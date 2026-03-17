'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Badge, BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import { Select } from '@/src/app/admin/components/ui/base/select/select';
import { Button } from '@/app/admin/components/ui/buttons/button';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Edit01, Trash01 } from '@untitledui/icons';

interface Launch {
  id: string;
  title: string;
  slug: string;
  status: 'upcoming' | 'active' | 'ended' | 'archived';
  featured: boolean;
  activeStart?: string;
  activeEnd?: string;
  heroImage?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLOR: Record<string, 'blue' | 'success' | 'gray' | 'error'> = {
  upcoming: 'blue',
  active: 'success',
  ended: 'gray',
  archived: 'error',
};

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not set';

// Sortable row for upcoming launches
function SortableRow({
  launch,
  onEdit,
  onDelete,
}: {
  launch: Launch;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: launch.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-100 ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
        aria-label="Drag to reorder"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="4" r="1.5" />
          <circle cx="11" cy="4" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="11" cy="12" r="1.5" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{launch.title}</p>
        <p className="text-xs text-gray-400">{launch.slug}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <BadgeWithDot color="blue">upcoming</BadgeWithDot>
        <div className="text-right">
          <p className="text-sm text-gray-600">{formatDate(launch.activeStart)}</p>
          <p className="text-xs text-gray-400">to {formatDate(launch.activeEnd)}</p>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit" onClick={onEdit}>
            <Edit01 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded" title="Delete" onClick={onDelete}>
            <Trash01 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LaunchesPage() {
  const router = useRouter();
  const toast = useToast();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [upcoming, setUpcoming] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', title: '' });
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchLaunches(); }, [statusFilter]);

  const fetchLaunches = async () => {
    setLoading(true);
    try {
      const [allRes, upcomingRes] = await Promise.all([
        fetch(`/api/launches${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`),
        fetch('/api/launches?status=upcoming'),
      ]);
      if (allRes.ok) setLaunches(await allRes.json());
      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcoming(data.sort((a: Launch, b: Launch) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      }
    } catch (error) {
      console.error('Error fetching launches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setUpcoming((prev) => {
      const oldIdx = prev.findIndex((l) => l.id === active.id);
      const newIdx = prev.findIndex((l) => l.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      await fetch('/api/launches/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: upcoming.map((l) => l.id) }),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const response = await fetch(`/api/launches/${deleteConfirm.id}`, { method: 'DELETE' });
    if (response.ok) {
      setLaunches((prev) => prev.filter((l) => l.id !== deleteConfirm.id));
      setUpcoming((prev) => prev.filter((l) => l.id !== deleteConfirm.id));
      toast.success('Launch deleted', `"${deleteConfirm.title}" has been removed`);
      setDeleteConfirm({ show: false, id: '', title: '' });
    } else {
      toast.error('Delete failed', 'Failed to delete launch');
      setDeleteConfirm({ show: false, id: '', title: '' });
    }
  };

  // Upcoming drag-and-drop section
  const upcomingSection = upcoming.length > 0 && (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Upcoming order</h2>
          <p className="text-sm text-gray-500">Drag to set the display order for upcoming launches</p>
        </div>
        <Button color="primary" size="sm" isLoading={saving} onClick={saveOrder}>
          Save order
        </Button>
      </div>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={upcoming.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {upcoming.map((launch) => (
              <SortableRow
                key={launch.id}
                launch={launch}
                onEdit={() => router.push(`/admin/launches/${launch.id}`)}
                onDelete={() => setDeleteConfirm({ show: true, id: launch.id, title: launch.title })}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );

  return (
    <>
      {!loading && upcomingSection}

      <TableCard.Root>
        <TableCard.Header
          title="All Launches"
          badge={launches.length}
          description="Manage seasonal launches and featured product collections"
          contentTrailing={
            <div className="flex items-center gap-3">
              <Select
                placeholder="All statuses"
                selectedKey={statusFilter}
                onSelectionChange={(key) => setStatusFilter(key as string)}
                items={[
                  { id: 'all', label: 'All statuses' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'active', label: 'Active' },
                  { id: 'ended', label: 'Ended' },
                  { id: 'archived', label: 'Archived' },
                ]}
              >
                {(item) => <Select.Item id={item.id} label={item.label} />}
              </Select>
              <Link href="/admin/launches/new">
                <Button color="primary" size="sm">Create launch</Button>
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
            <p className="text-sm text-tertiary">No launches found</p>
            <Link href="/admin/launches/new">
              <Button color="secondary" size="sm">Create your first launch</Button>
            </Link>
          </div>
        ) : (
          <Table aria-label="Launches">
            <Table.Header>
              <Table.Head isRowHeader label="Title" />
              <Table.Head label="Status" />
              <Table.Head label="Active period" />
              <Table.Head label="Featured" />
              <Table.Head label="" />
            </Table.Header>
            <Table.Body items={launches}>
              {(launch) => (
                <Table.Row
                  key={launch.id}
                  id={launch.id}
                  onAction={() => router.push(`/admin/launches/${launch.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {launch.heroImage && (
                        <img src={launch.heroImage} alt={launch.title} className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary">{launch.title}</p>
                        <p className="text-xs text-tertiary">{launch.slug}</p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <BadgeWithDot color={STATUS_COLOR[launch.status] ?? 'gray'}>
                      {launch.status}
                    </BadgeWithDot>
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <p className="text-sm text-secondary">{formatDate(launch.activeStart)}</p>
                      <p className="text-xs text-tertiary">to {formatDate(launch.activeEnd)}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {launch.featured ? (
                      <Badge color="warning">Featured</Badge>
                    ) : (
                      <span className="text-sm text-tertiary">—</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/launches/${launch.id}`}>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                          <Edit01 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                        title="Delete"
                        onClick={() => setDeleteConfirm({ show: true, id: launch.id, title: launch.title })}
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
        title="Delete Launch"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />
    </>
  );
}
