'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { FormatCategory, ServingStyle } from '@/types';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';
import TaxonomyTagPicker from '@/app/admin/components/TaxonomyTagPicker';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import { useToast } from '@/app/admin/components/ToastContainer';

export default function CreateFormatPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'frozen' as FormatCategory,
    description: '',
    requiresFlavours: true,
    minFlavours: 1,
    maxFlavours: 1,
    canIncludeAddOns: false,
    defaultSizes: [] as string[],
    servingStyles: [] as ServingStyle[],
    menuSection: '',
    image: '',
    icon: '',
  });

  const categories: FormatCategory[] = ['frozen', 'food', 'experience', 'bundle'];

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/formats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/formats');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create format');
      }
    } catch (error) {
      console.error('Error creating format:', error);
      toast.error('Failed to create format');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/formats"
          className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
        >
          ← Back to Formats
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Add Format</h1>
        <p className="text-gray-600 mt-1">Create a new product format template</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Soft Serve, Twist, Pint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="soft-serve"
            />
            <p className="text-sm text-gray-500 mt-1">URL-friendly identifier (auto-generated from name)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TaxonomySelect
              category="formatCategories"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value as FormatCategory })}
              label="Category"
              required
            />
            <TaxonomyTagPicker
              category="servingStyles"
              values={formData.servingStyles}
              onChange={(values) => setFormData({ ...formData, servingStyles: values as ServingStyle[] })}
              label="Serving Style"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe this format..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Menu Section
            </label>
            <input
              type="text"
              value={formData.menuSection}
              onChange={(e) => setFormData({ ...formData, menuSection: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Frozen Treats, Sandwiches"
            />
          </div>

          {/* Flavour Requirements */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Flavour Requirements</h3>
            
            <div className="mb-4">
              <Checkbox
                isSelected={formData.requiresFlavours}
                onChange={(v) => setFormData({ ...formData, requiresFlavours: v })}
                label="Requires Flavours"
              />
            </div>

            {formData.requiresFlavours && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Flavours *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.minFlavours}
                      onChange={(e) => setFormData({ ...formData, minFlavours: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Flavours *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.maxFlavours}
                      onChange={(e) => setFormData({ ...formData, maxFlavours: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Additional Options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Options</h3>
            
            <Checkbox
              isSelected={formData.canIncludeAddOns}
              onChange={(v) => setFormData({ ...formData, canIncludeAddOns: v })}
              label="Can Include Add-ons (toppings, sauces)"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Format'}
          </button>
          <Link
            href="/admin/formats"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
