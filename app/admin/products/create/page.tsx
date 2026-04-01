'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    publicName: '',
    description: '',
    shortCardCopy: '',
    category: '',
    status: 'draft',
    pickupOnly: false,
  });

  function validate() {
    const errs: string[] = [];
    if (!formData.publicName.trim()) errs.push('Product name is required');
    if (!formData.description.trim()) errs.push('Description is required');
    setErrors(errs);
    return errs.length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.publicName,
          title: formData.publicName,
          description: formData.description,
          shortCardCopy: formData.shortCardCopy,
          category: formData.category || undefined,
          status: formData.status,
          pickupOnly: formData.pickupOnly,
        }),
      });
      if (response.ok) {
        const created = await response.json();
        router.push(`/admin/products/${created.id}`);
      } else {
        const error = await response.json();
        setErrors([error.error || 'Failed to create product']);
      }
    } catch {
      setErrors(['Failed to create product']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create Product</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new sellable menu item.</p>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input type="text" value={formData.publicName}
            onChange={(e) => setFormData({ ...formData, publicName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Customer-facing name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Full description" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Card Copy</label>
          <input type="text" value={formData.shortCardCopy}
            onChange={(e) => setFormData({ ...formData, shortCardCopy: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief card text" />
        </div>
        <TaxonomySelect
          category="productCategories"
          value={formData.category}
          onChange={(v) => setFormData({ ...formData, category: v })}
          label="Category"
          description="Used to group products on the order page"
          placeholder="Select a category"
        />
        <Select
          label="Status"
          value={formData.status}
          onChange={(v) => setFormData({ ...formData, status: v })}
          options={[
            { id: 'draft', label: 'Draft' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'active', label: 'Active' },
            { id: 'sold-out', label: 'Sold Out' },
            { id: 'archived', label: 'Archived' },
          ]}
        />
        <div className="flex items-center gap-6 pt-1">
          <Checkbox isSelected={formData.pickupOnly}
            onChange={(v) => setFormData({ ...formData, pickupOnly: v })}
            label="Pickup Only" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.push('/admin/products')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
