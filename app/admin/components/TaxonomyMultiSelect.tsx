'use client';

import { useState, useEffect, useCallback } from 'react';
import { MultiSelect, type MultiSelectOption } from '@/app/admin/components/ui/multi-select';
import { Button } from '@/app/admin/components/ui/button';
import type { TaxonomyCategory } from './TaxonomySelect';

interface TaxonomyValue {
  id: string;
  label: string;
  value: string;
  description?: string;
  sortOrder: number;
  archived: boolean;
}

interface TaxonomyMultiSelectProps {
  category: TaxonomyCategory;
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  description?: string;
  showArchived?: boolean;
  className?: string;
  allowCreate?: boolean;
}

export default function TaxonomyMultiSelect({
  category,
  values,
  onChange,
  label,
  description,
  showArchived = false,
  className = '',
  allowCreate = true,
}: TaxonomyMultiSelectProps) {
  const [taxonomyValues, setTaxonomyValues] = useState<TaxonomyValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  const handleCreateNew = useCallback(async () => {
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

      setTaxonomyValues((prev) => [...prev, created]);
      onChange([...selectedValues, created.value]);
      setNewLabel('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating taxonomy value:', error);
      alert(error instanceof Error ? error.message : 'Failed to create taxonomy value');
    } finally {
      setIsCreating(false);
    }
  }, [newLabel, category, selectedValues, onChange]);

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
        placeholder="Search..."
        value={selectedValues}
        onChange={handleChange}
        options={options}
        helperText={description}
      />

      {allowCreate && (
        <div className="mt-2">
          {showCreateForm ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateNew();
                  }
                }}
                placeholder="New value name..."
                className="flex-1 px-3 py-1.5 text-sm border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-solid focus:border-brand-solid"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={handleCreateNew}
                isDisabled={isCreating || !newLabel.trim()}
              >
                {isCreating ? 'Adding...' : 'Add'}
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewLabel('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="text-sm text-fg-brand-primary hover:text-fg-brand-primary-hover font-medium"
            >
              + Add new value
            </button>
          )}
        </div>
      )}
    </div>
  );
}
