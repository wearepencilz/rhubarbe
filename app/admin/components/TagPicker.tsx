'use client';

import { useState, useEffect, useRef } from 'react';

interface TaxonomyValue {
  id: string;
  label: string;
  value: string;
}

interface TagPickerProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  taxonomyCategory: string;
  placeholder?: string;
}

export default function TagPicker({ selected, onChange, taxonomyCategory, placeholder = 'Search tags…' }: TagPickerProps) {
  const [allTags, setAllTags] = useState<TaxonomyValue[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/settings/taxonomies/${taxonomyCategory}`)
      .then(r => r.ok ? r.json() : { values: [] })
      .then(data => {
        const vals = data.values || data;
        setAllTags(Array.isArray(vals) ? vals : []);
      })
      .catch(() => {});
  }, [taxonomyCategory]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedSet = new Set(selected);
  const available = allTags.filter(
    t => !selectedSet.has(t.value) && (!search || t.label.toLowerCase().includes(search.toLowerCase()))
  );

  const add = (value: string) => {
    if (!selectedSet.has(value)) onChange([...selected, value]);
  };

  const remove = (value: string) => {
    onChange(selected.filter(v => v !== value));
  };

  return (
    <div className="space-y-2">
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(value => {
            const tag = allTags.find(t => t.value === value);
            return (
              <span key={value} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                {tag?.label || value}
                <button
                  type="button"
                  onClick={() => remove(value)}
                  className="rounded-full p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                  aria-label={`Remove ${tag?.label || value}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            );
          })}
          <button type="button" onClick={() => { onChange([]); }} className="text-xs text-red-500 hover:text-red-700 ml-1">
            Clear all
          </button>
        </div>
      )}

      {/* Search + dropdown */}
      <div ref={wrapperRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`${placeholder} (${available.length} available)`}
              value={search}
              onChange={e => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              aria-label="Search tags to add"
            />
          </div>
          {available.length > 0 && (
            <button
              type="button"
              onClick={() => { available.forEach(t => add(t.value)); }}
              className="shrink-0 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add all ({available.length})
            </button>
          )}
        </div>

        {open && available.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {available.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => add(tag.value)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center justify-between group"
              >
                <span>{tag.label}</span>
                <span className="text-xs text-gray-400 group-hover:text-brand-500">+ Add</span>
              </button>
            ))}
          </div>
        )}

        {open && search && available.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <p className="text-sm text-gray-500 text-center">No matching tags found</p>
          </div>
        )}
      </div>
    </div>
  );
}
