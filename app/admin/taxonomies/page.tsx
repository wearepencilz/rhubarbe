'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Edit01, Trash01, Archive } from '@untitledui/icons';

interface TaxonomyValue {
  id: string;
  label: string;
  value: string;
  description?: string;
  sortOrder: number;
  archived: boolean;
}

interface TaxonomyCategory {
  key: string;
  label: string;
  description: string;
  group: string;
}

const TAXONOMY_CATEGORIES: TaxonomyCategory[] = [
  // Ingredients
  { key: 'ingredientCategories', label: 'Categories', description: 'Categories for ingredient classification', group: 'Ingredients' },
  { key: 'ingredientRoles', label: 'Roles', description: 'How an ingredient contributes to a recipe (primary, supporting, accent)', group: 'Ingredients' },
  { key: 'ingredientTextures', label: 'Textures', description: 'Mouthfeel and texture descriptors', group: 'Ingredients' },
  { key: 'ingredientProcesses', label: 'Process / Preparation', description: 'How ingredients are transformed before use', group: 'Ingredients' },
  { key: 'ingredientAttributes', label: 'Attributes', description: 'Provenance and dietary characteristics', group: 'Ingredients' },
  { key: 'ingredientUsedAs', label: 'Used As', description: 'How an ingredient is used in a recipe', group: 'Ingredients' },
  { key: 'allergens', label: 'Allergens', description: 'Common allergen tags', group: 'Ingredients' },
  // Products
  { key: 'productCategories', label: 'Categories', description: 'Product categories for menu grouping (e.g. Gelato, Sorbet, Pastry)', group: 'Products' },
  { key: 'tastingNotes', label: 'Tasting Notes', description: 'Common tasting note descriptors', group: 'Products' },
  // Catering
  { key: 'cateringTemperature', label: 'Temperature', description: 'Serving temperature filters (e.g. Hot, Cold)', group: 'Catering' },
  { key: 'cateringDietary', label: 'Dietary', description: 'Dietary filters for catering products (e.g. Vegetarian, Vegan, Meat, Fish)', group: 'Catering' },
  // Stories
  { key: 'storyCategories', label: 'Categories', description: 'Story sections — The Lab, Flavour Notes, Core Idea, etc.', group: 'Stories' },
  { key: 'storyTags', label: 'Tags', description: 'Ingredient, place, theme, and season tags for stories', group: 'Stories' },
];

const GROUPS = ['Ingredients', 'Products', 'Catering', 'Stories'];

export default function TaxonomiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams?.get('tab') || 'ingredientCategories';

  const [taxonomies, setTaxonomies] = useState<Record<string, TaxonomyValue[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ label: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTaxonomies(); }, []);

  const setActiveTab = (key: string) => {
    router.push(`/admin/taxonomies?tab=${key}`);
    setEditingId(null);
    setShowAddForm(false);
  };

  const fetchTaxonomies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/taxonomies');
      if (!response.ok) throw new Error('Failed to fetch taxonomies');
      const data = await response.json();
      setTaxonomies(data.taxonomies || {});
    } catch (error) {
      console.error('Error fetching taxonomies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.label.trim()) return;
    setSaving(true);
    try {
      const generatedValue = addForm.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const response = await fetch(`/api/settings/taxonomies/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, value: generatedValue }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to add');
      await fetchTaxonomies();
      setAddForm({ label: '', description: '' });
      setShowAddForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add value');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.label.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/settings/taxonomies/${activeTab}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to update');
      await fetchTaxonomies();
      setEditingId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update value');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async (id: string, currentArchived: boolean) => {
    setSaving(true);
    try {
      await fetch(`/api/settings/taxonomies/${activeTab}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !currentArchived }),
      });
      await fetchTaxonomies();
    } catch (error) {
      alert('Failed to update value');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this value? This cannot be undone.')) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/settings/taxonomies/${activeTab}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete');
      await fetchTaxonomies();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete value');
    } finally {
      setSaving(false);
    }
  };

  const currentCat = TAXONOMY_CATEGORIES.find(c => c.key === activeTab);
  const currentValues = taxonomies[activeTab] || [];
  const sorted = [...currentValues].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeValues = sorted.filter(v => !v.archived);
  const archivedValues = sorted.filter(v => v.archived);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Taxonomies</h1>
        <p className="text-sm text-gray-500 mt-1">Manage category and type lists used throughout the CMS.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <aside className="w-52 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {GROUPS.map((group, gi) => (
              <div key={group}>
                {gi > 0 && <div className="border-t border-gray-100" />}
                <div className="px-4 py-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{group}</p>
                </div>
                {TAXONOMY_CATEGORIES.filter(c => c.group === group).map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveTab(cat.key)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      activeTab === cat.key
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{currentCat?.label}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{currentCat?.description}</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
                  Add value
                </Button>
              </div>

              {/* Add form */}
              {showAddForm && (
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                  <p className="text-sm font-medium text-gray-900 mb-3">New value</p>
                  <div className="space-y-3">
                    <Input placeholder="Label *" value={addForm.label} onChange={(v) => setAddForm({ ...addForm, label: v })} />
                    <Input placeholder="Description (optional)" value={addForm.description} onChange={(v) => setAddForm({ ...addForm, description: v })} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddForm(false); setAddForm({ label: '', description: '' }); }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <Button variant="primary" size="sm" onClick={handleAdd} isLoading={saving} isDisabled={saving || !addForm.label.trim()}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active values */}
              <div className="divide-y divide-gray-100">
                {activeValues.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-gray-400 text-center">No active values. Add one above.</p>
                ) : (
                  activeValues.map((value) => (
                    <div key={value.id} className="px-6 py-4">
                      {editingId === value.id ? (
                        <div className="space-y-3">
                          <Input value={editForm.label} onChange={(v) => setEditForm({ ...editForm, label: v })} />
                          <Input value={editForm.description} onChange={(v) => setEditForm({ ...editForm, description: v })} placeholder="Description (optional)" />
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                            <Button variant="primary" size="sm" onClick={() => handleUpdate(value.id)} isLoading={saving} isDisabled={saving}>
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{value.label}</p>
                            {value.description && <p className="text-xs text-gray-500 mt-0.5">{value.description}</p>}
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{value.value}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => { setEditingId(value.id); setEditForm({ label: value.label, description: value.description || '' }); }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
                              title="Edit"
                            >
                              <Edit01 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleArchive(value.id, value.archived)}
                              disabled={saving}
                              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40 rounded"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(value.id)}
                              disabled={saving}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 rounded"
                              title="Delete"
                            >
                              <Trash01 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Archived */}
              {archivedValues.length > 0 && (
                <div className="border-t border-gray-200">
                  <div className="px-6 py-3 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Archived ({archivedValues.length})</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {archivedValues.map((value) => (
                      <div key={value.id} className="px-6 py-3 flex items-center justify-between gap-4 bg-gray-50">
                        <div>
                          <p className="text-sm text-gray-500">{value.label}</p>
                          <p className="text-xs text-gray-400 font-mono">{value.value}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(value.id, value.archived)}
                          disabled={saving}
                          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
