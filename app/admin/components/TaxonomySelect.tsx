'use client';

import { useState, useEffect } from 'react';
import { Select, type SelectOption } from '@/app/admin/components/ui/select';
import { Button } from '@/app/admin/components/ui/button';

export type TaxonomyCategory =
  | 'flavourTypes'
  | 'keyNotes'
  | 'ingredientCategories'
  | 'ingredientRoles'
  | 'tastingNotes'
  | 'ingredientTextures'
  | 'ingredientProcesses'
  | 'ingredientAttributes'
  | 'ingredientUsedAs'
  | 'formatCategories'
  | 'servingStyles'
  | 'modifierTypes'
  | 'allergens'
  | 'storyCategories'
  | 'storyTags';

interface TaxonomyValue {
  id: string;
  label: string;
  value: string;
  description?: string;
  sortOrder: number;
  archived: boolean;
}

interface TaxonomySelectProps {
  category: TaxonomyCategory;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  showArchived?: boolean;
  className?: string;
  label?: string;
  description?: string;
  allowCreate?: boolean;
}

export default function TaxonomySelect({
  category,
  value,
  onChange,
  required = false,
  placeholder = 'Select an option',
  showArchived = false,
  className = '',
  label,
  description,
  allowCreate = true,
}: TaxonomySelectProps) {
  const [options, setOptions] = useState<TaxonomyValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/settings/taxonomies/${category}`);

        if (!response.ok) {
          console.error('Failed to fetch taxonomy values');
          if (mounted) {
            setOptions([]);
            setIsLoading(false);
          }
          return;
        }

        const data = await response.json();

        if (mounted) {
          setOptions(Array.isArray(data.values) ? data.values : []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading taxonomy values:', error);
        if (mounted) {
          setOptions([]);
          setIsLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [category]);

  const handleCreateNew = async () => {
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

      setOptions((prev) => [...prev, created]);
      onChange(created.value);
      setNewLabel('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating taxonomy value:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to create taxonomy value'
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Filter and sort options, then convert to SelectOption format
  const visibleOptions = options
    .filter((opt) => showArchived || !opt.archived)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const selectOptions: SelectOption[] = visibleOptions.map((opt) => ({
    id: opt.value,
    label: opt.label,
    supportingText: opt.description,
  }));

  if (isLoading) {
    return (
      <div className={className}>
        <Select
          label={label}
          placeholder="Loading..."
          isDisabled
          isRequired={required}
          helperText={description}
          options={[]}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <Select
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        options={selectOptions}
        isRequired={required}
        helperText={description}
      />

      {allowCreate && (
        <div className="mt-2">
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="text-sm font-medium text-brand-primary hover:text-brand-primary-dark"
            >
              + Create new
            </button>
          ) : (
            <div className="rounded-lg border border-secondary p-3 space-y-2 bg-primary">
              <input
                type="text"
                placeholder="Enter label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateNew();
                  } else if (e.key === 'Escape') {
                    setShowCreateForm(false);
                    setNewLabel('');
                  }
                }}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary shadow-xs outline-none ring-inset focus:ring-2 focus:ring-brand"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateNew}
                  isDisabled={isCreating || !newLabel.trim()}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewLabel('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
