'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    internalName: '',
    publicName: '',
    description: '',
    shortCardCopy: '',
    price: '',
    compareAtPrice: '',
    status: 'draft',
    inventoryTracked: false,
    inventoryQuantity: '',
    onlineOrderable: true,
    pickupOnly: false,
  });

  function validate() {
    const errs: string[] = [];
    if (!formData.internalName.trim()) errs.push('Internal name is required');
    if (!formData.publicName.trim()) errs.push('Public name is required');
    if (!formData.description.trim()) errs.push('Description is required');
    setErrors(errs);
    return errs.length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const price = formData.price ? Math.round(parseFloat(formData.price) * 100) : 0;
      const compareAtPrice = formData.compareAtPrice ? Math.round(parseFloat(formData.compareAtPrice) * 100) : undefined;
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalName: formData.internalName,
          publicName: formData.publicName,
          description: formData.description,
          shortCardCopy: formData.shortCardCopy,
          price,
          compareAtPrice,
          status: formData.status,
          inventoryTracked: formData.inventoryTracked,
          inventoryQuantity: formData.inventoryQuantity ? parseInt(formData.inventoryQuantity) : undefined,
          onlineOrderable: formData.onlineOrderable,
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name *</label>
            <input type="text" value={formData.internalName}
              onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Admin reference name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Public Name *</label>
            <input type="text" value={formData.publicName}
              onChange={(e) => setFormData({ ...formData, publicName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Customer-facing name" />
          </div>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input type="number" step="0.01" value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compare At Price ($)</label>
            <input type="number" step="0.01" value={formData.compareAtPrice}
              onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00" />
          </div>
        </div>
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
          <Checkbox isSelected={formData.inventoryTracked}
            onChange={(v) => setFormData({ ...formData, inventoryTracked: v })}
            label="Track Inventory" />
          <Checkbox isSelected={formData.onlineOrderable}
            onChange={(v) => setFormData({ ...formData, onlineOrderable: v })}
            label="Online Orderable" />
          <Checkbox isSelected={formData.pickupOnly}
            onChange={(v) => setFormData({ ...formData, pickupOnly: v })}
            label="Pickup Only" />
        </div>
        {formData.inventoryTracked && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Quantity</label>
            <input type="number" value={formData.inventoryQuantity}
              onChange={(e) => setFormData({ ...formData, inventoryQuantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0" />
          </div>
        )}
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
