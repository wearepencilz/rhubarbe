'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/app/admin/components/ToastContainer';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { Input } from '@/app/admin/components/ui/input';
import { Trash01, Upload01, SearchMd } from '@untitledui/icons';

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  alt: { en: string; fr: string } | null;
  width: number | null;
  height: number | null;
  size: number | null;
  mimeType: string | null;
  tags: string[] | null;
  createdAt: string;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; ids: string[] }>({ show: false, ids: [] });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fetchMedia = useCallback(async () => {
    const res = await fetch(`/api/media${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const upload = async (files: FileList | File[]) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/media', { method: 'POST', body: fd });
      if (res.ok) {
        const item = await res.json();
        setItems((prev) => [item, ...prev]);
      } else {
        toast.error('Upload failed', file.name);
      }
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    for (const id of deleteConfirm.ids) {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
    }
    setItems((prev) => prev.filter((i) => !deleteConfirm.ids.includes(i.id)));
    setSelected(new Set());
    toast.success('Deleted', `${deleteConfirm.ids.length} item(s) removed`);
    setDeleteConfirm({ show: false, ids: [] });
  };

  const handleEditSave = async () => {
    if (!editing) return;
    const res = await fetch(`/api/media/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt: editing.alt, tags: editing.tags }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.success('Saved');
    }
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500">{items.length} files</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={() => setDeleteConfirm({ show: true, ids: [...selected] })} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg">
              <Trash01 className="w-4 h-4" /> Delete {selected.size}
            </button>
          )}
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg">
            <Upload01 className="w-4 h-4" /> Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename or tag…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Drop zone + Grid */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`min-h-[200px] rounded-lg border-2 border-dashed transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-transparent'}`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Upload01 className="w-8 h-8 mb-2" />
            <p className="text-sm">Drop images here or click Upload</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selected.has(item.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => setEditing(item)}
              >
                <div className="aspect-square bg-gray-100">
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-1.5">
                  <p className="text-[11px] text-gray-700 truncate">{item.filename}</p>
                  <p className="text-[10px] text-gray-400">{formatSize(item.size)}</p>
                </div>
                {/* Checkbox */}
                <div className="absolute top-1.5 left-1.5" onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected.has(item.id) ? 'bg-blue-600 border-blue-600' : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'}`}>
                    {selected.has(item.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploading && <div className="fixed bottom-4 right-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">Uploading…</div>}

      {/* Edit panel */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold text-gray-900">Edit Media</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <img src={editing.url} alt="" className="w-full max-h-64 object-contain rounded bg-gray-50" />
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <span>{editing.filename}</span>
              <span className="text-right">{formatSize(editing.size)}</span>
              {editing.width && <span>{editing.width} × {editing.height}px</span>}
              <span className="text-right">{editing.mimeType}</span>
            </div>
            <Input label="Alt text (EN)" value={editing.alt?.en || ''} onChange={(v) => setEditing({ ...editing, alt: { en: v, fr: editing.alt?.fr || '' } })} />
            <Input label="Alt text (FR)" value={editing.alt?.fr || ''} onChange={(v) => setEditing({ ...editing, alt: { en: editing.alt?.en || '', fr: v } })} />
            <Input label="Tags (comma-separated)" value={(editing.tags || []).join(', ')} onChange={(v) => setEditing({ ...editing, tags: v.split(',').map((t) => t.trim()).filter(Boolean) })} />
            <div className="flex justify-between pt-2">
              <button onClick={() => { setEditing(null); setDeleteConfirm({ show: true, ids: [editing.id] }); }} className="text-sm text-red-500 hover:text-red-700">Delete</button>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(editing.url); toast.success('URL copied'); }} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">Copy URL</button>
                <button onClick={handleEditSave} className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={deleteConfirm.show} variant="danger" title="Delete Media" message={`Delete ${deleteConfirm.ids.length} file(s)? This cannot be undone.`} confirmLabel="Delete" cancelLabel="Cancel" onConfirm={handleDelete} onCancel={() => setDeleteConfirm({ show: false, ids: [] })} />
    </div>
  );
}
