'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from '@untitledui/icons';
import { Modal } from '@/app/admin/components/ui/modal';
import { Input } from '@/app/admin/components/ui/input';
import { Button } from '@/app/admin/components/ui/button';
import type { TaxonomyCategory } from '@/app/admin/components/TaxonomySelect';

interface TaxonomyValue {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
  archived: boolean;
}

interface TaxonomyTagPickerProps {
  category: TaxonomyCategory;
  label: string;
  description?: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export default function TaxonomyTagPicker({
  category,
  label,
  description,
  values,
  onChange,
}: TaxonomyTagPickerProps) {
  const [options, setOptions] = useState<TaxonomyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadOptions = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings/taxonomies/${category}`);
      if (!res.ok) return;
      const data = await res.json();
      setOptions((data.values || []).filter((v: TaxonomyValue) => !v.archived));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const toggle = (val: string) =>
    onChange(values.includes(val) ? values.filter((v) => v !== val) : [...values, val]);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    setError('');
    try {
      const slug = newLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const res = await fetch(`/api/settings/taxonomies/${category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim(), value: slug }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create');
        return;
      }
      const created: TaxonomyValue = await res.json();
      setOptions((prev) => [...prev, created]);
      onChange([...values, created.value]);
      setNewLabel('');
      setShowModal(false);
    } catch {
      setError('Something went wrong');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Label row */}
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <button
          type="button"
          onClick={() => { setShowModal(true); setNewLabel(''); setError(''); }}
          className="flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={`Add new ${label.toLowerCase()}`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}

      {/* Tag pills */}
      {loading ? (
        <div className="text-xs text-gray-400">Loading...</div>
      ) : options.length === 0 ? (
        <p className="text-xs text-gray-400">No options yet — add one with +</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const selected = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  selected
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`New ${label}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              isLoading={creating}
              isDisabled={creating || !newLabel.trim()}
            >
              Add
            </Button>
          </div>
        }
      >
        <Input
          label="Label"
          value={newLabel}
          onChange={(v) => { setNewLabel(v); setError(''); }}
          placeholder={`e.g., ${label === 'Tasting Notes' ? 'Umami' : 'New value'}`}
          isRequired
          autoFocus
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </Modal>
    </div>
  );
}
