'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Table, TableCard } from '@/src/app/admin/components/ui/application/table/table';
import { Button } from '@/app/admin/components/ui/buttons/button';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Edit01, Trash01 } from '@untitledui/icons';

interface RecipeItem {
  id: string;
  title: { en: string; fr: string } | string | null;
  slug: string | null;
  content: unknown;
  category: string | null;
  coverImage: string | null;
  status: string | null;
  updatedAt: string | null;
}

function getTitle(t: RecipeItem['title']): string {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return t.fr || t.en || '';
}

export default function RecipesPage() {
  const router = useRouter();
  const toast = useToast();
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', title: '' });

  useEffect(() => {
    fetch('/api/recipes')
      .then((r) => r.json())
      .then(setRecipes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    const response = await fetch(`/api/recipes/${deleteConfirm.id}`, { method: 'DELETE' });
    if (response.ok) {
      setRecipes(recipes.filter((n) => n.id !== deleteConfirm.id));
      toast.success('Recipe deleted', `"${deleteConfirm.title}" has been removed`);
    } else {
      toast.error('Delete failed', 'Failed to delete article');
    }
    setDeleteConfirm({ show: false, id: '', title: '' });
  };

  return (
    <>
      <TableCard.Root>
        <TableCard.Header
          title="Recipes"
          badge={recipes.length}
          description="Manage recipes and culinary content"
          contentTrailing={
            <Link href="/admin/recipes/new">
              <Button color="primary" size="sm">New recipe</Button>
            </Link>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-tertiary">No recipes yet</p>
            <Link href="/admin/recipes/new">
              <Button color="secondary" size="sm">Create your first recipe</Button>
            </Link>
          </div>
        ) : (
          <Table aria-label="Recipes">
            <Table.Header>
              <Table.Head isRowHeader label="Recipe" />
              <Table.Head label="Date" />
              <Table.Head label="" />
            </Table.Header>
            <Table.Body items={recipes}>
              {(item) => (
                <Table.Row
                  key={item.id}
                  id={String(item.id)}
                  onAction={() => router.push(`/admin/recipes/${item.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {item.coverImage && (
                        <img src={item.coverImage} alt={getTitle(item.title)} className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary">{getTitle(item.title)}</p>
                        <p className="text-xs text-tertiary line-clamp-1">{item.category || 'No category'} · {(item.content as any)?.sections?.length || 0} sections</p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-secondary">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {item.slug && (
                        <a href={`/fr/recipes/${item.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Preview">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </a>
                      )}
                      <Link href={`/admin/recipes/${item.id}`}>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                          <Edit01 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                        title="Delete"
                        onClick={() => setDeleteConfirm({ show: true, id: item.id, title: getTitle(item.title) })}
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
        title="Delete Recipe"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', title: '' })}
      />
    </>
  );
}
