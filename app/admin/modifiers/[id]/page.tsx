'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import { Badge, BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import { useToast } from '@/app/admin/components/ToastContainer';

interface Modifier {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  image?: string;
  price: number;
  priceDisplay: string; // dollars for input
  allergens: string[];
  dietaryFlags: string[];
  availableForFormatIds: string[];
  status: string;
}

interface Format {
  id: string;
  name: string;
}

const TYPE_COLOR: Record<string, 'blue' | 'purple' | 'orange' | 'pink' | 'indigo' | 'gray'> = {
  topping: 'blue',
  sauce: 'orange',
  crunch: 'indigo',
  drizzle: 'pink',
  'premium-addon': 'purple',
  'pack-in': 'gray',
};

export default function EditModifierPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [modifier, setModifier] = useState<Modifier | null>(null);
  const [formats, setFormats] = useState<Format[]>([]);

  useEffect(() => { fetchData(); }, [params.id]);

  const fetchData = async () => {
    try {
      const [modifierRes, formatsRes] = await Promise.all([
        fetch(`/api/modifiers/${params.id}`),
        fetch('/api/formats'),
      ]);
      if (modifierRes.ok) {
        const data = await modifierRes.json();
        setModifier({ ...data, priceDisplay: data.price ? (data.price / 100).toFixed(2) : '' });
      } else {
        setError('Modifier not found');
      }
      if (formatsRes.ok) {
        const data = await formatsRes.json();
        setFormats(data.data || data);
      }
    } catch {
      setError('Failed to load modifier');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifier) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/modifiers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...modifier,
          price: modifier.priceDisplay ? Math.round(parseFloat(modifier.priceDisplay) * 100) : 0,
        }),
      });
      if (response.ok) {
        toast.success('Modifier saved', `"${modifier.name}" has been updated`);
        router.push('/admin/modifiers');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update modifier');
      }
    } catch {
      setError('An error occurred while updating the modifier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this modifier?')) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/modifiers/${params.id}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/admin/modifiers');
      } else {
        const data = await response.json();
        setError(data.usedIn
          ? `Cannot delete: used in ${data.usedIn.length} product(s)`
          : data.error || 'Failed to delete modifier');
      }
    } catch {
      setError('An error occurred while deleting the modifier');
    } finally {
      setDeleting(false);
    }
  };

  const toggleFormat = (formatId: string) => {
    if (!modifier) return;
    setModifier({
      ...modifier,
      availableForFormatIds: modifier.availableForFormatIds.includes(formatId)
        ? modifier.availableForFormatIds.filter(id => id !== formatId)
        : [...modifier.availableForFormatIds, formatId],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!modifier) {
    return (
      <EditPageLayout title="Edit Modifier" backHref="/admin/modifiers" backLabel="Back to Modifiers"
        onSave={() => {}} onCancel={() => router.push('/admin/modifiers')} error={error || 'Modifier not found'}>
        <div />
      </EditPageLayout>
    );
  }

  return (
    <EditPageLayout
      title="Edit Modifier"
      backHref="/admin/modifiers"
      backLabel="Back to Modifiers"
      onSave={() => handleSubmit(new Event('submit') as any)}
      onDelete={handleDelete}
      onCancel={() => router.push('/admin/modifiers')}
      saving={saving}
      deleting={deleting}
      error={error}
      maxWidth="7xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">

          {/* Left column */}
          <div className="col-span-2 space-y-6">

            {/* Modifier details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Modifier details</h2>
                <p className="text-sm text-gray-500 mt-0.5">Name, type and description.</p>
              </div>
              <div className="px-6 py-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    isRequired
                    value={modifier.name}
                    onChange={(v) => setModifier({ ...modifier, name: v })}
                  />
                  <Input
                    label="Slug"
                    value={modifier.slug}
                    onChange={(v) => setModifier({ ...modifier, slug: v })}
                  />
                </div>
                <Select
                  label="Type"
                  isRequired
                  value={modifier.type}
                  onChange={(v) => setModifier({ ...modifier, type: v })}
                  options={[
                    { id: 'topping', label: 'Topping' },
                    { id: 'sauce', label: 'Sauce' },
                    { id: 'crunch', label: 'Crunch' },
                    { id: 'drizzle', label: 'Drizzle' },
                    { id: 'premium-addon', label: 'Premium Add-on' },
                    { id: 'pack-in', label: 'Pack-in' },
                  ]}
                />
                <Textarea
                  label="Description"
                  rows={3}
                  value={modifier.description || ''}
                  onChange={(v) => setModifier({ ...modifier, description: v })}
                />
              </div>
            </div>

            {/* Available formats */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Available for formats</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {modifier.availableForFormatIds.length === 0
                    ? 'Not available for any formats'
                    : `${modifier.availableForFormatIds.length} format${modifier.availableForFormatIds.length !== 1 ? 's' : ''} selected`}
                </p>
              </div>
              <div className="px-6 py-4 grid grid-cols-2 gap-2">
                {formats.map((format) => (
                  <Checkbox
                    key={format.id}
                    isSelected={modifier.availableForFormatIds.includes(format.id)}
                    onChange={() => toggleFormat(format.id)}
                    label={format.name}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className="col-span-1 space-y-6">

            {/* Status */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Status</h2>
                <BadgeWithDot color={modifier.status === 'active' ? 'success' : 'gray'}>
                  {modifier.status}
                </BadgeWithDot>
              </div>
              <div className="px-6 py-5 space-y-4">
                <Select
                  label="Status"
                  value={modifier.status}
                  onChange={(v) => setModifier({ ...modifier, status: v })}
                  options={[
                    { id: 'active', label: 'Active' },
                    { id: 'archived', label: 'Archived' },
                  ]}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <Badge color={TYPE_COLOR[modifier.type] ?? 'gray'} size="sm">{modifier.type}</Badge>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Pricing</h2>
              </div>
              <div className="px-6 py-5 space-y-2">
                <Input
                  label="Price ($)"
                  type="number"
                  isRequired
                  value={modifier.priceDisplay}
                  onChange={(v) => setModifier({ ...modifier, priceDisplay: v })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Image */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Image</h2>
              </div>
              <div className="px-6 py-5 space-y-3">
                <Input
                  label="Image URL"
                  type="text"
                  value={modifier.image || ''}
                  onChange={(v) => setModifier({ ...modifier, image: v })}
                />
                {modifier.image && (
                  <img src={modifier.image} alt="Preview" className="h-24 w-auto rounded-lg object-cover" />
                )}
              </div>
            </div>

          </div>
        </div>
      </form>
    </EditPageLayout>
  );
}
