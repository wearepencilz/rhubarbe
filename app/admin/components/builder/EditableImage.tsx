'use client';

import { useRef, useState } from 'react';
import type { SectionImage } from '@/lib/types/sections';
import MediaPicker from '@/app/admin/components/MediaPicker';

interface EditableImageProps {
  value: SectionImage;
  onChange: (value: SectionImage) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

export default function EditableImage({ value, onChange, className = '', style, placeholder = 'Click to add image' }: EditableImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/media', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) onChange({ ...value, url: data.url });
    } catch { /* silent */ }
    setUploading(false);
    e.target.value = '';
  };

  const handlePickerSelect = ([url]: string[]) => {
    if (url) onChange({ ...value, url });
    setShowPicker(false);
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {value.url ? (
        <div className={`relative group cursor-pointer ${className}`} style={style}>
          <img src={value.url} alt={value.alt?.en || ''} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
            <button onClick={() => inputRef.current?.click()} className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full transition-opacity">
              {uploading ? 'Uploading...' : 'Upload new'}
            </button>
            <button onClick={() => setShowPicker(true)} className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full transition-opacity">
              Library
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors bg-gray-50 ${className}`}
          style={style}
          onClick={() => setShowPicker(true)}
        >
          <span className="text-sm text-gray-400">{uploading ? 'Uploading...' : placeholder}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="text-xs text-blue-500 hover:text-blue-600">or upload file</button>
        </div>
      )}
      {showPicker && <MediaPicker mode="single" currentUrls={value.url ? [value.url] : []} onSelect={handlePickerSelect} onClose={() => setShowPicker(false)} />}
    </>
  );
}
