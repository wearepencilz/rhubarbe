'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FlavourIngredientSelector from '@/app/admin/components/FlavourIngredientSelector';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';
import TaxonomyTagSelect from '@/app/admin/components/TaxonomyTagSelect';
import TaxonomyTagPicker from '@/app/admin/components/TaxonomyTagPicker';
import type { FlavourIngredient, FlavourType, BaseStyle, Status } from '@/types';
import { Button } from '@/app/admin/components/ui/button';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';

export default function CreateFlavourPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    ingredients: [] as FlavourIngredient[],
    tastingNotes: '',
    story: '',
    
    // New Phase 3 fields
    type: 'gelato' as FlavourType,
    baseStyle: 'dairy' as BaseStyle,
    keyNotes: [] as string[],
    colour: '#FFFFFF',
    status: 'active' as Status,
    
    // Admin fields
    sortOrder: 0,
    featured: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/flavours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/flavours');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create flavour');
      }
    } catch (error) {
      console.error('Error creating flavour:', error);
      toast.error('Failed to create flavour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/flavours"
          className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
        >
          ← Back to Flavours
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Add Flavour</h1>
        <p className="text-gray-600 mt-1">Create a new flavour with ingredients</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          
          <div>
            <Input
              label="Name *"
              type="text"
              isRequired
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="e.g., Salted Caramel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TaxonomySelect
              category="flavourTypes"
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value as FlavourType })}
              label="Type"
              required
              description="Determines which formats this flavour can be used in"
            />

            <div>
              <Select
                label="Status *"
                isRequired
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value as Status })}
                options={[
                  { id: 'active', label: 'Active' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'archived', label: 'Archived' },
                ]}
              />
            </div>
          </div>

          <div>
            <Input
              label="Short Notes *"
              type="text"
              isRequired
              value={formData.shortDescription}
              onChange={(value) => setFormData({ ...formData, shortDescription: value })}
              placeholder="Brief, merchandisable descriptor (e.g., Browned butter, grilled corn, honey)"
            />
          </div>

          <div>
            <Textarea
              label="Description *"
              isRequired
              rows={4}
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Longer editorial description (e.g., A sweet, savoury gelato built around grilled corn, browned butter, and honey)"
            />
          </div>

          {/* Base - Only show for gelato or special types */}
          {(formData.type === 'gelato' || formData.type === 'special') && (
            <div>
              <Select
                label="Base *"
                isRequired
                value={formData.baseStyle}
                onChange={(value) => setFormData({ ...formData, baseStyle: value as BaseStyle })}
                options={[
                  { id: 'dairy', label: 'Dairy' },
                  { id: 'non-dairy', label: 'Non-Dairy' },
                  { id: 'cheese', label: 'Cheese' },
                  { id: 'other', label: 'Other' },
                ]}
              />
            </div>
          )}

          {/* Flavour Tags - Connected to taxonomy */}
          <TaxonomyTagPicker
            category="keyNotes"
            values={formData.keyNotes}
            onChange={(values) => setFormData({ ...formData, keyNotes: values })}
            label="Flavour Tags"
            description="Select tags that describe this flavour (e.g., smoky, sweet, summer)"
          />

          <div>
            <Textarea
              label="Tasting Notes"
              rows={3}
              value={formData.tastingNotes}
              onChange={(value) => setFormData({ ...formData, tastingNotes: value })}
              placeholder="Sweet, creamy, hints of vanilla..."
            />
          </div>
        </div>

        {/* Advanced Options - Collapsible */}
        <details className="bg-white rounded-lg border border-gray-200">
          <summary className="cursor-pointer p-6 font-medium text-gray-900 hover:bg-gray-50">
            Advanced Options
          </summary>
          <div className="px-6 pb-6 space-y-6 border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colour
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.colour}
                    onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.colour}
                    onChange={(value) => setFormData({ ...formData, colour: value })}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Textarea
                label="Archive Note"
                rows={4}
                value={formData.story}
                onChange={(value) => setFormData({ ...formData, story: value })}
                placeholder="Context about this flavour (e.g., Served alongside Wild Tomatoes)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Sort Order"
                  type="number"
                  value={String(formData.sortOrder)}
                  onChange={(value) => setFormData({ ...formData, sortOrder: parseInt(value) || 0 })}
                />
              </div>

              <div className="flex items-end">
                <Checkbox
                  isSelected={formData.featured}
                  onChange={(v) => setFormData({ ...formData, featured: v })}
                  label="Featured"
                />
              </div>
            </div>
          </div>
        </details>

        {/* Ingredients Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h2>
          <FlavourIngredientSelector
            selectedIngredients={formData.ingredients}
            onChange={(ingredients) => setFormData({ ...formData, ingredients })}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            isDisabled={loading}
            className="flex-1"
          >
            Create Flavour
          </Button>
          <Link
            href="/admin/flavours"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
