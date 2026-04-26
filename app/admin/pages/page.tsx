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
const LEGACY_PAGES: Record<string, { label: string; description: string }> = {
  home: { label: 'Home', description: 'Homepage — hero, about, editorial sections' },
  about: { label: 'About', description: '/about — story, team, address' },
  journal: { label: 'Journal', description: '/journal — listing page, compose with sections' },
  recipes: { label: 'Recipes', description: '/recipes — recipes page, compose with sections' },
  contact: { label: 'Contact', description: '/contact — catering & cake inquiry forms' },
  visit: { label: 'Visit / Come See Us', description: '/visit — hours, address, photo' },
  flavours: { label: 'Flavours / Archive', description: '/flavours — flavour archive listing' },
  archive: { label: 'Archive', description: '/archive — full flavour archive' },
  'thank-you': { label: 'Thank You', description: '/thank-you — post-checkout confirmation' },
  traiteur: { label: 'Catering (FR)', description: 'Catering tab content — heading, intro (FR & EN)' },
  gateaux: { label: 'Signature Cakes (FR)', description: 'Signature Cakes tab content (FR & EN)' },
  translations: { label: 'Translations', description: 'All UI labels and text per locale' },
};

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
  const sectionPages = pages.filter((p) => p.content?.sections && !LEGACY_PAGES[p.pageName]);

  const handleCreate = async () => {
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) { toast.error('Enter a valid page name'); return; }
    if (LEGACY_PAGES[slug] || pages.find((p) => p.pageName === slug)) { toast.error('Page already exists'); return; }
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage content for each page of the site</p>
        </div>
        <Button color="primary" size="sm" onClick={() => setShowCreate(true)}>New page</Button>
      </div>

      {/* Section-based pages (page builder) */}
      {sectionPages.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Composed Pages</p>
          <div className="space-y-2 max-w-2xl">
            {sectionPages.map((page) => (
              <div key={page.pageName} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-5 py-4 hover:border-gray-300 transition-all group">
                <Link href={`/admin/pages/${page.pageName}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{page.pageName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{page.content?.sections?.length || 0} sections · /p/{page.pageName}</p>
                </Link>
                <div className="flex items-center gap-1">
                  <a href={`/p/${page.pageName}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-gray-600"><Edit01 className="w-4 h-4" /></a>
                  <button onClick={() => setDeleteConfirm({ show: true, name: page.pageName })} className="p-1.5 text-gray-400 hover:text-red-500"><Trash01 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy pages */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Site Pages</p>
        <div className="space-y-2 max-w-2xl">
          {Object.entries(LEGACY_PAGES).map(([key, { label, description }]) => (
            <Link
              key={key}
              href={`/admin/pages/${key}`}
              className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          ))}
        </div>
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
