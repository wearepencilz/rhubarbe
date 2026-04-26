'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchMd, Upload01 } from '@untitledui/icons';

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  alt: { en: string; fr: string } | null;
  size: number | null;
}

interface MediaPickerProps {
  mode?: 'single' | 'multi';
  currentUrls?: string[];
  onSelect: (urls: string[]) => void;
  onClose: () => void;
}

export default function MediaPicker({ mode = 'single', currentUrls, onSelect, onClose }: MediaPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(currentUrls?.filter(Boolean) || []));
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/media${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const upload = async (files: FileList | File[]) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/media', { method: 'POST', body: fd });
      if (res.ok) {
        const item = await res.json();
        setItems((prev) => [item, ...prev]);
        if (mode === 'single') {
          onSelect([item.url]);
          onClose();
          return;
        }
      }
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  };

  const toggleSelect = (url: string) => {
    if (mode === 'single') {
      onSelect([url]);
      onClose();
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  };

  const confirmMulti = () => {
    onSelect([...selected]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{mode === 'multi' ? 'Select Images' : 'Choose Image'}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1.5 border border-blue-200 rounded-lg">
              <Upload01 className="w-3.5 h-3.5" /> Upload
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple={mode === 'multi'} hidden onChange={(e) => e.target.files && upload(e.target.files)} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-2 border-b border-gray-100 shrink-0">
          <div className="relative">
            <SearchMd className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {search ? 'No results' : 'No media yet — upload or drag images here'}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleSelect(item.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selected.has(item.url) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'}`}
                >
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover" loading="lazy" />
                  {selected.has(item.url) && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer for multi mode */}
        {mode === 'multi' && selected.size > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 shrink-0">
            <span className="text-sm text-gray-500">{selected.size} selected</span>
            <button onClick={confirmMulti} className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg">
              Add {selected.size} image{selected.size > 1 ? 's' : ''}
            </button>
          </div>
        )}

        {uploading && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">Uploading…</div>}
      </div>
    </div>
  );
}
