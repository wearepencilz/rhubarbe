'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/buttons/button';
import { Input } from '@/app/admin/components/ui/input';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Trash01, Edit01 } from '@untitledui/icons';

// Legacy pages with their own dedicated editors — not deletable
interface PageRecord {
  id: string;
  pageName: string;
  content: any;
  updatedAt: string;
}

export default function PagesIndex() {
  const router = useRouter();
  const toast = useToast();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, name: '' });

  useEffect(() => {
    fetch('/api/pages').then((r) => r.json()).then(setPages).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Section-based pages (have sections array in content)
  const sectionPages = pages.filter((p) => p.content?.sections);

  const handleCreate = async () => {
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) { toast.error('Enter a valid page name'); return; }
    if (pages.find((p) => p.pageName === slug)) { toast.error('Page already exists'); return; }
    setCreating(true);
    try {
      await fetch(`/api/pages/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: [] }),
      });
      toast.success('Page created');
      router.push(`/admin/pages/${slug}`);
    } catch {
      toast.error('Failed to create page');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/pages/${deleteConfirm.name}`, { method: 'DELETE' });
    if (res.ok) {
      setPages(pages.filter((p) => p.pageName !== deleteConfirm.name));
      toast.success('Page deleted');
    } else {
      toast.error('Failed to delete');
    }
    setDeleteConfirm({ show: false, name: '' });
  };

  return (
    <div className="admin-narrow">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage content for each page of the site</p>
        </div>
        <Button color="primary" size="sm" onClick={() => setShowCreate(true)}>New page</Button>
      </div>

      <div className="space-y-2">
        {sectionPages.map((page) => (
          <div key={page.pageName} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-5 py-4 hover:border-gray-300 transition-all group">
            <Link href={`/admin/pages/${page.pageName}`} className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{(page as any).title?.en || page.pageName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(page.content as any)?.sections?.length || 0} sections · 
                <span className="text-gray-400"> /en/</span>{(page as any).slugEn || page.pageName}
                <span className="text-gray-400"> · /fr/</span>{(page as any).slugFr || page.pageName}
              </p>
            </Link>
            <div className="flex items-center gap-1">
              <Link href={`/admin/pages/${page.pageName}`} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit sections"><Edit01 className="w-4 h-4" /></Link>
              <a href={`/p/${page.pageName}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-gray-600" title="View on site">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </a>
              <button onClick={() => setDeleteConfirm({ show: true, name: page.pageName })} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete"><Trash01 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {sectionPages.length === 0 && !loading && <p className="text-sm text-gray-400 text-center py-8">No pages yet. Create one to get started.</p>}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Page</h2>
            <Input
              label="Page name (kebab-case)"
              value={newName}
              onChange={setNewName}
              placeholder="my-new-page"
              helperText={newName ? `URL: /p/${newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}` : undefined}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button color="secondary" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button color="primary" size="sm" onClick={handleCreate} isDisabled={creating || !newName.trim()}>{creating ? 'Creating...' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.show}
        variant="danger"
        title="Delete Page"
        message={`Delete "${deleteConfirm.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, name: '' })}
      />

      {loading && <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" /></div>}
    </div>
  );
}
