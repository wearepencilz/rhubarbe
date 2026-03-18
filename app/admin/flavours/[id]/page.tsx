'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import FlavourUsagePanel from '@/app/admin/components/FlavourUsagePanel';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import TranslationFields from '@/app/admin/components/TranslationFields';
import type { Flavour, FlavourType, BaseStyle, Status } from '@/types';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import { BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import { useToast } from '@/app/admin/components/ToastContainer';

const STATUS_COLOR: Record<string, 'success' | 'blue' | 'gray' | 'error'> = {
  active: 'success',
  upcoming: 'blue',
  archived: 'error',
};

export default function EditFlavourPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Flavour | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (id) fetchFlavour();
  }, [id]);

  const fetchFlavour = async () => {
    try {
      const response = await fetch(`/api/flavours/${id}`);
      if (response.ok) {
        setFormData(await response.json());
      } else {
        router.push('/admin/flavours');
      }
    } catch (error) {
      console.error('Error fetching flavour:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/flavours/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success('Flavour saved', `"${formData.name}" has been updated`);
      } else {
        const error = await response.json();
        toast.error('Save failed', error.error || 'Error updating flavour');
      }
    } catch (error) {
      console.error('Error updating flavour:', error);
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <EditPageLayout
      title="Edit Flavour"
      backHref="/admin/flavours"
      backLabel="Back to Flavours"
      onSave={() => handleSubmit(new Event('submit') as any)}
      onCancel={() => router.push('/admin/flavours')}
      saving={saving}
      maxWidth="7xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">

          {/* Left column */}
          <div className="col-span-2 space-y-6">

            {/* Flavour details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Flavour details</h2>
                <p className="text-sm text-gray-500 mt-0.5">Name, type, description and tasting notes.</p>
              </div>
              <div className="px-6 py-6 space-y-5">
                <Input
                  label="Name"
                  isRequired
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <TaxonomySelect
                    category="flavourTypes"
                    value={formData.type || 'gelato'}
                    onChange={(v) => setFormData({ ...formData, type: v as FlavourType })}
                    label="Type"
                    required
                    description="Determines which formats this flavour can be used in"
                  />
                  {(formData.type === 'gelato' || formData.type === 'special') && (
                    <Select
                      label="Base"
                      isRequired
                      value={formData.baseStyle || 'dairy'}
                      onChange={(v) => setFormData({ ...formData, baseStyle: v as BaseStyle })}
                      options={[
                        { id: 'dairy', label: 'Dairy' },
                        { id: 'non-dairy', label: 'Non-Dairy' },
                        { id: 'cheese', label: 'Cheese' },
                        { id: 'other', label: 'Other' },
                      ]}
                    />
                  )}
                </div>
                <Input
                  label="Short notes"
                  isRequired
                  value={formData.shortDescription || ''}
                  onChange={(v) => setFormData({ ...formData, shortDescription: v })}
                  placeholder="e.g. Browned butter, grilled corn, honey"
                />
                <Textarea
                  label="Description"
                  isRequired
                  rows={4}
                  value={formData.description}
                  onChange={(v) => setFormData({ ...formData, description: v })}
                  placeholder="Longer editorial description..."
                />
                {/* French translations */}
                <div className="border border-blue-100 rounded-lg p-4 bg-blue-50/40">
                  <TranslationFields
                    base={{
                      name: formData?.name || '',
                      shortDescription: (formData as any)?.shortDescription || '',
                      description: formData?.description || '',
                      story: (formData as any)?.story || '',
                    }}
                    translations={formData.translations}
                    onChange={(tr) => setFormData({ ...formData, translations: tr })}
                    onBaseChange={(field, value) => setFormData({ ...formData, [field]: value } as Flavour)}
                    fields={[
                      { key: 'name', label: 'Name' },
                      { key: 'shortDescription', label: 'Short description' },
                      { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
                      { key: 'story', label: 'Archive note', type: 'textarea', rows: 3 },
                    ]}
                  />
                </div>

              </div>
            </div>

            {/* Tasting notes — moved to Products */}

            {/* Ingredients — moved to Products */}

          </div>

          {/* Right column */}
          <div className="col-span-1 space-y-6">

            {/* Status */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Status</h2>
                <BadgeWithDot color={STATUS_COLOR[formData.status] ?? 'gray'}>
                  {formData.status}
                </BadgeWithDot>
              </div>
              <div className="px-6 py-5 space-y-4">
                <Select
                  label="Status"
                  isRequired
                  value={formData.status || 'active'}
                  onChange={(v) => setFormData({ ...formData, status: v as Status })}
                  options={[
                    { id: 'active', label: 'Active' },
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'archived', label: 'Archived' },
                  ]}
                />
                <div className="flex items-center gap-4">
                  <Checkbox
                    isSelected={formData.featured ?? false}
                    onChange={(v) => setFormData({ ...formData, featured: v })}
                    label="Featured"
                  />
                </div>
                <Input
                  label="Sort order"
                  type="number"
                  value={String(formData.sortOrder ?? 0)}
                  onChange={(v) => setFormData({ ...formData, sortOrder: parseInt(v) || 0 })}
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>
                <p className="text-sm text-gray-500 mt-0.5">Display colour for this flavour.</p>
              </div>
              <div className="px-6 py-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Colour</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={formData.colour || '#FFFFFF'}
                    onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer p-0.5"
                  />
                  <Input
                    type="text"
                    value={formData.colour || '#FFFFFF'}
                    onChange={(v) => setFormData({ ...formData, colour: v })}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>

            {/* Archive note */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Archive note</h2>
                <p className="text-sm text-gray-500 mt-0.5">Context for the flavour archive.</p>
              </div>
              <div className="px-6 py-5">
                <Textarea
                  label=""
                  rows={4}
                  value={formData.story || ''}
                  onChange={(v) => setFormData({ ...formData, story: v })}
                  placeholder="e.g. Served alongside Wild Tomatoes, summer 2024"
                />
              </div>
            </div>

            {/* Usage tracking */}
            <FlavourUsagePanel flavourId={formData.id} />

          </div>
        </div>
      </form>
    </EditPageLayout>
  );
}
