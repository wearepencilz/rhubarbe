'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Edit01, Trash01, Link01 } from '@untitledui/icons';

interface JournalEntry {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  category?: string;
  coverImage?: string;
  intro?: string;
  updatedAt?: string;
}

export default function JournalPage() {
  const router = useRouter();
  const toast = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', title: '' });

  useEffect(() => {
    fetch('/api/journal')
      .then((r) => r.json())
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    const res = await fetch(`/api/journal/${deleteConfirm.id}`, { method: 'DELETE' });
    if (res.ok) {
      setEntries(entries.filter((s) => s.id !== deleteConfirm.id));
      toast.success('Entry deleted', `"${deleteConfirm.title}" has been removed`);
    } else {
      toast.error('Delete failed');
    }
    setDeleteConfirm({ show: false, id: '', title: '' });
  };

  const sorted = [...entries].sort((a, b) =>
    new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="Journal"
          badge={entries.length}
          description="Editorial journal entries, ingredient deep-dives, and seasonal moments"
          contentTrailing={
            <Link href="/admin/journal/new">
              <Button color="primary" size="sm">New entry</Button>
            </Link>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-tertiary">No entries yet</p>
            <Link href="/admin/journal/new">
              <Button color="secondary" size="sm">Write your first entry</Button>
            </Link>
          </div>
        ) : (
          <Table aria-label="Journal">
            <Table.Header>
              <Table.Head isRowHeader label="Entry" />
              <Table.Head label="Category" />
              <Table.Head label="Status" />
              <Table.Head label="Updated" />
              <Table.Head label="" />
            </Table.Header>
            <Table.Body items={sorted}>
              {(item) => (
                <Table.Row
                  key={item.id}
                  id={item.id}
                  onAction={() => router.push(`/admin/journal/${item.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {item.coverImage && (
                        <img src={item.coverImage} alt={item.title} className="h-10 w-16 rounded object-cover flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary">{item.title}</p>
                        {item.intro && <p className="text-xs text-tertiary line-clamp-1 max-w-xs">{item.intro}</p>}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-secondary capitalize">{item.category?.replace(/-/g, ' ') || '—'}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <BadgeWithDot color={item.status === 'published' ? 'success' : 'gray'}>
                      {item.status}
                    </BadgeWithDot>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-secondary">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {item.status === 'published' && (
                        <a href={`/journal/${item.slug}`} target="_blank" rel="noopener noreferrer">
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="View">
                            <Link01 className="w-4 h-4" />
                          </button>
                        </a>
                      )}
                      <Link href={`/admin/journal/${item.id}`}>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                          <Edit01 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                        title="Delete"
                        onClick={() => setDeleteConfirm({ show: true, id: item.id, title: item.title })}
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
        title="Delete Entry"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />
    </>
  );
}
