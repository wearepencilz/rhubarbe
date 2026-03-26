'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Button } from '@/app/admin/components/ui/button';
import { Edit01, Trash01 } from '@untitledui/icons';

interface Ingredient {
  id: string;
  name: string;
  latinName?: string;
  origin: string;
  category: string;
  taxonomyCategory?: string;
  image?: string;
  allergens: string[];
  seasonal: boolean;
  status?: string;
}

interface TaxonomyCategory {
  id: string;
  label: string;
  value: string;
}

const ALLERGEN_COLOR: Record<string, 'error' | 'warning' | 'orange'> = {
  dairy: 'error',
  egg: 'warning',
  gluten: 'warning',
  'tree-nuts': 'orange',
  peanuts: 'orange',
  sesame: 'warning',
  soy: 'warning',
};

const CATEGORY_COLOR: Record<string, 'blue' | 'purple' | 'success' | 'orange' | 'pink' | 'indigo' | 'gray'> = {
  Dairy: 'blue',
  Fruit: 'success',
  Herb: 'indigo',
  Spice: 'orange',
  Nut: 'orange',
  Seed: 'orange',
  Chocolate: 'purple',
  Floral: 'pink',
  Vegetable: 'success',
  Grain: 'gray',
  Sweetener: 'yellow' as any,
  Fat: 'gray',
};

export default function IngredientsPage() {
  const router = useRouter();
  const toast = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [taxonomyCategories, setTaxonomyCategories] = useState<TaxonomyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', name: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [ingredientsRes, settingsRes] = await Promise.all([
        fetch('/api/ingredients?pageSize=500'),
        fetch('/api/settings'),
      ]);
      if (ingredientsRes.ok) {
        const data = await ingredientsRes.json();
        setIngredients(data.data || data);
      }
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setTaxonomyCategories(settings.ingredientCategories || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const response = await fetch(`/api/ingredients/${deleteConfirm.id}`, { method: 'DELETE' });
    if (response.ok) {
      setIngredients(ingredients.filter((i) => i.id !== deleteConfirm.id));
      toast.success('Ingredient deleted', `"${deleteConfirm.name}" has been removed`);
      setDeleteConfirm({ show: false, id: '', name: '' });
    } else {
      const error = await response.json();
      toast.error('Delete failed', error.blockers ? `Cannot delete: ${error.blockers.join(', ')}` : error.error || 'Failed to delete');
      setDeleteConfirm({ show: false, id: '', name: '' });
    }
  };

  const getCategoryLabel = (ingredient: Ingredient) => {
    const categoryId = ingredient.taxonomyCategory || ingredient.category;
    const taxonomy = taxonomyCategories.find((t) => t.id === categoryId || t.value === categoryId);
    return taxonomy?.label || categoryId || 'Uncategorized';
  };

  const filtered = ingredients.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.latinName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.origin?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryId = i.taxonomyCategory || i.category;
    const matchesCategory = categoryFilter === 'all' || categoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || (i.status || 'active') === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Ingredients</h1>
            <p className="text-sm text-gray-500 mt-0.5">Ingredient library with provenance details</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search ingredients…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-52"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All categories</option>
              {taxonomyCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <Link href="/admin/ingredients/create">
              <Button variant="primary" size="sm">Add ingredient</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-gray-500">No ingredients found</p>
            <Link href="/admin/ingredients/create">
              <Button variant="secondary" size="sm">Add your first ingredient</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Origin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Allergens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((ingredient) => {
                const categoryLabel = getCategoryLabel(ingredient);
                return (
                  <tr
                    key={ingredient.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/ingredients/${ingredient.id}`)}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {ingredient.image && (
                          <img src={ingredient.image} alt={ingredient.name} className="h-8 w-8 rounded-lg object-cover shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{ingredient.name}</p>
                          {ingredient.latinName && (
                            <p className="text-xs text-gray-400 italic">{ingredient.latinName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge color={CATEGORY_COLOR[categoryLabel] ?? 'gray'} size="sm">{categoryLabel}</Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{ingredient.origin || '—'}</td>
                    <td className="px-6 py-3">
                      {!ingredient.allergens?.length ? (
                        <Badge color="success" size="sm">None</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {ingredient.allergens.slice(0, 3).map((a) => (
                            <Badge key={a} color={ALLERGEN_COLOR[a] ?? 'error'} size="sm">{a}</Badge>
                          ))}
                          {ingredient.allergens.length > 3 && (
                            <span className="text-xs text-gray-400">+{ingredient.allergens.length - 3}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        <BadgeWithDot color={ingredient.status === 'archived' ? 'gray' : 'success'} size="sm">
                          {ingredient.status || 'active'}
                        </BadgeWithDot>
                        {ingredient.seasonal && <Badge color="blue" size="sm">Seasonal</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/admin/ingredients/${ingredient.id}`}>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                            <Edit01 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                          title="Delete"
                          onClick={() => setDeleteConfirm({ show: true, id: ingredient.id, name: ingredient.name })}
                        >
                          <Trash01 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.show}
        variant="danger"
        title="Delete Ingredient"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This will check if the ingredient is used in any flavours.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
      />
    </>
  );
}
