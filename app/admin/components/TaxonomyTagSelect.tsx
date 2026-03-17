'use client';

import { useState, useEffect, useCallback } from 'react';
import { MultiSelect, type MultiSelectOption } from '@/app/admin/components/ui/multi-select';
import type { TaxonomyCategory } from './TaxonomySelect';

interface TaxonomyValue {
  id: string;
  label: string;
  value: string;
  description?: string;
  sortOrder: number;
  archived: boolean;
}

interface TaxonomyTagSelectProps {
  category: TaxonomyCategory;
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  showArchived?: boolean;
  className?: string;
  allowCreate?: boolean;
}

export default function TaxonomyTagSelect({
  category,
  values,
  onChange,
  label,
  description,
  placeholder = 'Type to search or add...',
  showArchived = false,
  className = '',
  allowCreate = true,
}: TaxonomyTagSelectProps) {
  const [taxonomyValues, setTaxonomyValues] = useState<TaxonomyValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Ensure values is always an array
  const selectedValues = Array.isArray(values) ? values : [];

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/settings/taxonomies/${category}`);

        if (!response.ok) {
          console.error('Failed to fetch taxonomy values');
          if (mounted) {
            setTaxonomyValues([]);
            setIsLoading(false);
          }
          return;
        }

        const data = await response.json();

        if (mounted) {
          setTaxonomyValues(Array.isArray(data.values) ? data.values : []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading taxonomy values:', error);
        if (mounted) {
          setTaxonomyValues([]);
          setIsLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [category]);

  // Convert taxonomy values to MultiSelectOption format
  // The MultiSelect uses `id` as the value key, so we map taxonomy `value` → option `id`
  const options: MultiSelectOption[] = taxonomyValues
    .filter((opt) => showArchived || !opt.archived)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((opt) => ({
      id: opt.value,
      label: opt.label,
      supportingText: opt.description,
    }));

  const handleChange = useCallback(
    (newValues: string[]) => {
      onChange(newValues);
    },
    [onChange],
  );

  if (isLoading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-fg-secondary mb-2">
            {label}
          </label>
        )}
        <div className="px-3 py-2 border border-border-primary rounded-lg text-fg-quaternary">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MultiSelect
        label={label}
        placeholder={placeholder}
        value={selectedValues}
        onChange={handleChange}
        options={options}
        helperText={description}
      />

      {/* Inline create: the MultiSelect search doubles as the create input.
          When allowCreate is true and the user types a term that doesn't match
          any existing option, we show a create button below the select. */}
      {allowCreate && (
        <CreateInline
          category={category}
          selectedValues={selectedValues}
          options={taxonomyValues}
          onChange={onChange}
          onCreated={(created) => {
            setTaxonomyValues((prev) => [...prev, created]);
          }}
        />
      )}
    </div>
  );
}

/**
 * Inline create component — renders a small "Add new value" affordance
 * below the multi-select. Keeps the main component clean.
 */
function CreateInline({
  category,
  selectedValues,
  options,
  onChange,
  onCreated,
}: {
  category: TaxonomyCategory;
  selectedValues: string[];
  options: TaxonomyValue[];
  onChange: (values: string[]) => void;
  onCreated: (created: TaxonomyValue) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;

    setIsCreating(true);
    try {
      const generatedValue = newLabel
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const response = await fetch(`/api/settings/taxonomies/${category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newLabel.trim(),
          value: generatedValue,
          description: '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create taxonomy value');
      }

      const created = await response.json();

      onCreated(created);
      onChange([...selectedValues, created.value]);
      setNewLabel('');
      setShowForm(false);
    } catch (error) {
      console.error('Error creating taxonomy value:', error);
      alert(error instanceof Error ? error.message : 'Failed to create taxonomy value');
    } finally {
      setIsCreating(false);
    }
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="mt-2 text-sm text-fg-brand-primary hover:text-fg-brand-primary-hover font-medium"
      >
        + Add new value
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="text"
        value={newLabel}
        onChange={(e) => setNewLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleCreate();
          }
          if (e.key === 'Escape') {
            setShowForm(false);
            setNewLabel('');
          }
        }}
        placeholder="New value name..."
        className="flex-1 px-3 py-1.5 text-sm border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-solid focus:border-brand-solid"
        autoFocus
      />
      <button
        type="button"
        onClick={handleCreate}
        disabled={isCreating || !newLabel.trim()}
        className="px-3 py-1.5 text-sm font-medium text-white bg-brand-solid rounded-lg hover:bg-brand-solid-hover disabled:opacity-50"
      >
        {isCreating ? 'Adding...' : 'Add'}
      </button>
      <button
        type="button"
        onClick={() => {
          setShowForm(false);
          setNewLabel('');
        }}
        className="px-3 py-1.5 text-sm font-medium text-fg-secondary hover:text-fg-primary"
      >
        Cancel
      </button>
    </div>
  );
}
