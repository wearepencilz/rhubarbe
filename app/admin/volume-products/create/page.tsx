'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Input } from '@/app/admin/components/ui/input';
import { Select } from '@/app/admin/components/ui/select';
import { useToast } from '@/app/admin/components/ToastContainer';
import { DatePicker } from '@/app/admin/components/ui/date-picker/date-picker';
import { parseDate } from '@internationalized/date';
import { useAllergenOptions } from '@/app/admin/hooks/useAllergenOptions';
import { useTaxonomyOptions } from '@/app/admin/hooks/useTaxonomyOptions';

const CATERING_TYPE_OPTIONS = [
  { id: 'brunch', label: 'Buffet' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinatoire', label: 'Dînatoire' },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function CreateCateringProductPage() {
  const router = useRouter();
  const toast = useToast();
  const allergenOptions = useAllergenOptions();
  const temperatureOptions = useTaxonomyOptions('cateringTemperature');
  const dietaryOptions = useTaxonomyOptions('cateringDietary');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [cateringType, setCateringType] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [temperatureTags, setTemperatureTags] = useState<string[]>([]);
  const [cateringEndDate, setCateringEndDate] = useState('');

  const isDirty = !!(name || cateringType);

  function handleNameChange(v: string) {
    setName(v);
    if (!slug || slug === slugify(name)) setSlug(slugify(v));
  }

  function toggleTag(list: string[], setList: (v: string[]) => void, tag: string) {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  }

  async function handleSave() {
    if (!name.trim() || !cateringType) {
      setError('Name and catering type are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/volume-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          cateringType,
          allergens,
          dietaryTags,
          temperatureTags,
          cateringEndDate: cateringEndDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create product');
      }
      const product = await res.json();
      toast.success('Created', 'Catering product created successfully');
      router.push(`/admin/volume-products/${product.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditPageLayout
      title="Create Catering Product"
      backHref="/admin/volume-products"
      backLabel="Back to Catering Products"
      onSave={handleSave}
      onCancel={() => router.push('/admin/volume-products')}
      saving={saving}
      error={error}
      isDirty={isDirty}
    >
      <div className="space-y-6">
        {/* Basics */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Basics</h2>
          <Input label="Product Name" value={name} onChange={handleNameChange} isRequired placeholder="e.g. Croissant aux amandes" />
          <Input label="Slug" value={slug} onChange={setSlug} placeholder="auto-generated" />
          <Select
            label="Catering Type"
            value={cateringType}
            onChange={setCateringType}
            options={CATERING_TYPE_OPTIONS}
            placeholder="Select type…"
            isRequired
          />
          <div>
            <DatePicker
              aria-label="End Date"
              allowClear
              value={cateringEndDate ? parseDate(cateringEndDate) : null}
              onChange={(date) => setCateringEndDate(date ? date.toString() : '')}
              onClear={() => setCateringEndDate('')}
            />
            <p className="text-xs text-gray-400 mt-1">Optional. Leave empty if no end date.</p>
          </div>
        </div>

        {/* Allergens */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Allergens</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergens</label>
            <div className="flex flex-wrap gap-2">
              {allergenOptions.map((a) => (
                <button key={a} type="button" onClick={() => toggleTag(allergens, setAllergens, a)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${allergens.includes(a) ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
            <div className="flex flex-wrap gap-2">
              {temperatureOptions.map((t) => (
                <button key={t} type="button" onClick={() => toggleTag(temperatureTags, setTemperatureTags, t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${temperatureTags.includes(t) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dietary</label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((d) => (
                <button key={d} type="button" onClick={() => toggleTag(dietaryTags, setDietaryTags, d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${dietaryTags.includes(d) ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EditPageLayout>
  );
}
