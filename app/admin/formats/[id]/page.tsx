'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Format, FormatCategory, ServingStyle } from '@/types';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';
import TaxonomyTagSelect from '@/app/admin/components/TaxonomyTagSelect';
import TaxonomyTagPicker from '@/app/admin/components/TaxonomyTagPicker';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { useToast } from '@/app/admin/components/ToastContainer';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import { Badge, BadgeWithDot } from '@/app/admin/components/ui/nav/badges';

const CATEGORY_COLOR: Record<string, 'blue' | 'orange' | 'purple' | 'success' | 'gray'> = {
  frozen: 'blue',
  food: 'orange',
  experience: 'purple',
  bundle: 'success',
};

export default function EditFormatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [format, setFormat] = useState<Format | null>(null);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    fetchFormat();
    checkUsage();
  }, [params.id]);

  const fetchFormat = async () => {
    try {
      const response = await fetch(`/api/formats/${params.id}`);
      if (response.ok) {
        setFormat(await response.json());
      } else {
        toast.error('Format not found', '');
        router.push('/admin/formats');
      }
    } catch {
      toast.error('Failed to load format', '');
    } finally {
      setLoading(false);
    }
  };

  const checkUsage = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const products = await response.json();
        setUsageCount(products.filter((p: any) => p.formatId === params.id).length);
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!format) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/formats/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(format),
      });
      if (response.ok) {
        setFormat(await response.json());
        toast.success('Format updated', 'Your changes have been saved');
      } else {
        const error = await response.json();
        toast.error('Update failed', error.error || 'Failed to update format');
      }
    } catch {
      toast.error('Update failed', 'Unable to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/formats/${params.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Format deleted', `${format?.name} has been removed`);
        router.push('/admin/formats');
      } else {
        const error = await response.json();
        toast.error('Delete failed', error.details?.message || error.error || 'Failed to delete format');
      }
    } catch {
      toast.error('Delete failed', 'Unable to delete format');
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (loading || !format) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <EditPageLayout
        title="Edit Format"
        backHref="/admin/formats"
        backLabel="Back to Formats"
        onSave={handleSave}
        onDelete={() => setShowDeleteModal(true)}
        onCancel={() => router.push('/admin/formats')}
        saving={saving}
        deleteDisabled={usageCount > 0}
        deleteDisabledReason={`Used in ${usageCount} product${usageCount !== 1 ? 's' : ''}`}
        maxWidth="7xl"
      >
        <div className="grid grid-cols-3 gap-6">

          {/* Left column */}
          <div className="col-span-2 space-y-6">

            {/* Basic info */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Format details</h2>
                <p className="text-sm text-gray-500 mt-0.5">Name, slug and description.</p>
              </div>
              <div className="px-6 py-6 space-y-5">
                <Input
                  label="Name"
                  isRequired
                  value={format.name}
                  onChange={(v) => setFormat({ ...format, name: v })}
                />
                <Input
                  label="Slug"
                  isRequired
                  value={format.slug}
                  onChange={(v) => setFormat({ ...format, slug: v })}
                />
                <Textarea
                  label="Description"
                  isRequired
                  rows={3}
                  value={format.description}
                  onChange={(v) => setFormat({ ...format, description: v })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <TaxonomySelect
                    category="formatCategories"
                    value={format.category}
                    onChange={(v) => setFormat({ ...format, category: v as FormatCategory })}
                    label="Category"
                    required
                  />
                  <TaxonomyTagPicker
                    category="servingStyles"
                    values={format.servingStyles || []}
                    onChange={(v) => setFormat({ ...format, servingStyles: v as ServingStyle[] })}
                    label="Serving style"
                  />
                </div>
              </div>
            </div>

            {/* Flavour requirements */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Flavour requirements</h2>
                <p className="text-sm text-gray-500 mt-0.5">How many flavours this format needs and which types are eligible.</p>
              </div>
              <div className="px-6 py-6 space-y-5">
                <Checkbox
                  isSelected={format.requiresFlavours}
                  onChange={(v) => setFormat({ ...format, requiresFlavours: v })}
                  label="Requires flavours"
                  hint="Products using this format must include flavours"
                />
                {format.requiresFlavours && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Min flavours"
                        type="number"
                        isRequired
                        value={String(format.minFlavours)}
                        onChange={(v) => setFormat({ ...format, minFlavours: parseInt(v) })}
                      />
                      <Input
                        label="Max flavours"
                        type="number"
                        isRequired
                        value={String(format.maxFlavours)}
                        onChange={(v) => setFormat({ ...format, maxFlavours: parseInt(v) })}
                      />
                    </div>
                    <TaxonomyTagPicker
                      category="flavourTypes"
                      values={format.eligibleFlavourTypes || []}
                      onChange={(values) => setFormat({ ...format, eligibleFlavourTypes: values })}
                      label="Eligible flavour types"
                      description="Leave empty to accept all types."
                    />
                    {(!format.eligibleFlavourTypes || format.eligibleFlavourTypes.length === 0) && (
                      <div className="rounded-lg bg-warning-50 border border-warning-200 px-4 py-3">
                        <p className="text-sm text-warning-700">No type restrictions — this format accepts all flavour types.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className="col-span-1 space-y-6">

            {/* Classification */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Classification</h2>
                <Badge color={CATEGORY_COLOR[format.category] ?? 'gray'} size="sm">{format.category}</Badge>
              </div>
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Serving style</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {(format.servingStyles || []).map((s) => (
                      <Badge key={s} color="gray" size="sm">{s}</Badge>
                    ))}
                  </div>
                </div>
                {format.requiresFlavours && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Flavours</span>
                    <Badge color="purple" size="sm">
                      {format.minFlavours === format.maxFlavours
                        ? `${format.minFlavours} required`
                        : `${format.minFlavours}–${format.maxFlavours}`}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Options</h2>
              </div>
              <div className="px-6 py-5">
                <Checkbox
                  isSelected={format.canIncludeAddOns}
                  onChange={(v) => setFormat({ ...format, canIncludeAddOns: v })}
                  label="Allow add-ons"
                  hint="Toppings, sauces, and modifiers"
                />
              </div>
            </div>

            {/* Usage */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Usage</h2>
                <Badge color={usageCount > 0 ? 'blue' : 'gray'} size="sm">{usageCount} product{usageCount !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="px-6 py-4">
                {usageCount === 0 ? (
                  <p className="text-sm text-gray-500">Not used in any products yet.</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Used in {usageCount} product{usageCount !== 1 ? 's' : ''}. Deletion is disabled.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </EditPageLayout>

      <ConfirmModal
        isOpen={showDeleteModal}
        variant="danger"
        title="Delete Format"
        message={`Are you sure you want to delete "${format?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
