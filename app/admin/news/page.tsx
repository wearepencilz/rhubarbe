'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Button } from '@/app/admin/components/ui/buttons/button';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Edit01, Trash01 } from '@untitledui/icons';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  image?: string;
}

export default function NewsPage() {
  const router = useRouter();
  const toast = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: 0, title: '' });

  useEffect(() => {
    fetch('/api/news')
      .then((r) => r.json())
      .then(setNews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    const response = await fetch(`/api/news/${deleteConfirm.id}`, { method: 'DELETE' });
    if (response.ok) {
      setNews(news.filter((n) => n.id !== deleteConfirm.id));
      toast.success('Article deleted', `"${deleteConfirm.title}" has been removed`);
    } else {
      toast.error('Delete failed', 'Failed to delete article');
    }
    setDeleteConfirm({ show: false, id: 0, title: '' });
  };

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="News"
          badge={news.length}
          description="Manage news articles and updates"
          contentTrailing={
            <Link href="/admin/news/new">
              <Button color="primary" size="sm">New article</Button>
            </Link>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-tertiary">No news articles yet</p>
            <Link href="/admin/news/new">
              <Button color="secondary" size="sm">Create your first article</Button>
            </Link>
          </div>
        ) : (
          <Table aria-label="News">
            <Table.Header>
              <Table.Head isRowHeader label="Article" />
              <Table.Head label="Date" />
              <Table.Head label="" />
            </Table.Header>
            <Table.Body items={news}>
              {(item) => (
                <Table.Row
                  key={item.id}
                  id={String(item.id)}
                  onAction={() => router.push(`/admin/news/${item.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary">{item.title}</p>
                        <p className="text-xs text-tertiary line-clamp-1">{item.content}</p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-secondary">{new Date(item.date).toLocaleDateString()}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/news/${item.id}`}>
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
        title="Delete News Article"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: 0, title: '' })}
      />
    </>
  );
}
