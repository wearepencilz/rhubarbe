'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import TranslationFields from '@/app/admin/components/TranslationFields';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import { useToast } from '@/app/admin/components/ToastContainer';
import type { ContentTranslations } from '@/types';

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

interface FormData {
  internalName: string;
  publicLabelEn: string;
  address: string;
  pickupInstructionsEn: string;
  contactDetails: string;
  active: boolean;
  sortOrder: number;
  mapOrDirectionsLink: string;
  operationalNotesForStaff: string;
  translations: ContentTranslations;
}

const EMPTY_FORM: FormData = {
  internalName: '',
  publicLabelEn: '',
  address: '',
  pickupInstructionsEn: '',
  contactDetails: '',
  active: true,
  sortOrder: 0,
  mapOrDirectionsLink: '',
  operationalNotesForStaff: '',
  translations: {},
};

function toApiPayload(form: FormData) {
  return {
    internalName: form.internalName,
    publicLabel: {
      en: form.publicLabelEn,
      fr: form.translations?.fr?.publicLabel || form.publicLabelEn,
    },
    address: form.address,
    pickupInstructions: {
      en: form.pickupInstructionsEn,
      fr: form.translations?.fr?.pickupInstructions || form.pickupInstructionsEn,
    },
    contactDetails: form.contactDetails,
    active: form.active,
    sortOrder: form.sortOrder,
    mapOrDirectionsLink: form.mapOrDirectionsLink || null,
    operationalNotesForStaff: form.operationalNotesForStaff || null,
  };
}

export default function EditPickupLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = params.id === 'create';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (patch: Partial<FormData>) => setForm((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (!isNew) loadLocation();
  }, [params.id]);

  const loadLocation = async () => {
    try {
      const res = await fetch(`/api/pickup-locations/${params.id}`);
      if (!res.ok) { router.push('/admin/pickup-locations'); return; }
      const d = await res.json();
      setForm({
        internalName: d.internalName || '',
        publicLabelEn: d.publicLabel?.en || '',
        address: d.address || '',
        pickupInstructionsEn: d.pickupInstructions?.en || '',
        contactDetails: d.contactDetails || '',
        active: d.active ?? true,
        sortOrder: d.sortOrder ?? 0,
        mapOrDirectionsLink: d.mapOrDirectionsLink || '',
        operationalNotesForStaff: d.operationalNotesForStaff || '',
        translations: {
          fr: {
            publicLabel: d.publicLabel?.fr || '',
            pickupInstructions: d.pickupInstructions?.fr || '',
          },
        },
      });
    } catch { router.push('/admin/pickup-locations'); }
    finally { setLoading(false); }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.internalName.trim()) e.internalName = 'Internal name is required';
    if (!form.publicLabelEn.trim()) e.publicLabelEn = 'Public label (EN) is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.pickupInstructionsEn.trim()) e.pickupInstructionsEn = 'Pickup instructions (EN) are required';
    if (!form.contactDetails.trim()) e.contactDetails = 'Contact details are required';
    if (form.mapOrDirectionsLink && !/^https?:\/\/.+/.test(form.mapOrDirectionsLink)) {
      e.mapOrDirectionsLink = 'Must be a valid URL (https://...)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = toApiPayload(form);
      const url = isNew ? '/api/pickup-locations' : `/api/pickup-locations/${params.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        toast.success(
          isNew ? 'Location created' : 'Location saved',
          `"${form.internalName}" has been ${isNew ? 'created' : 'updated'}`,
        );
        if (isNew) router.push(`/admin/pickup-locations/${saved.id}`);
      } else {
        const err = await res.json();
        toast.error('Save failed', err.error || 'Failed to save location');
      }
    } catch {
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <EditPageLayout
      title={isNew ? 'New Pickup Location' : 'Edit Pickup Location'}
      backHref="/admin/pickup-locations"
      backLabel="Back to Locations"
      onSave={handleSave}
      onCancel={() => router.push('/admin/pickup-locations')}
      saving={saving}
      maxWidth="3xl"
    >
      <div className="space-y-5">

        {/* Basic Info */}
        <SectionCard title="Basic Info" description="Internal name and identification.">
          <Input
            label="Internal Name"
            isRequired
            value={form.internalName}
            onChange={(v) => set({ internalName: v })}
            placeholder="e.g., Rhubarbe Shop – Mile End"
            validationState={errors.internalName ? 'error' : 'default'}
            errorMessage={errors.internalName}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              value={String(form.sortOrder)}
              onChange={(v) => set({ sortOrder: Number(v) || 0 })}
              helperText="Lower numbers appear first"
            />
            <div className="flex items-end pb-1">
              <Checkbox
                label="Active"
                hint="Inactive locations won't appear in pickers"
                isSelected={form.active}
                onChange={(v) => set({ active: v })}
              />
            </div>
          </div>
        </SectionCard>

        {/* Public Label & Instructions (bilingual) */}
        <SectionCard title="Customer-Facing Content" description="Bilingual labels and instructions shown to customers. Switch language with the locale toggle.">
          <TranslationFields
            base={{
              publicLabel: form.publicLabelEn,
              pickupInstructions: form.pickupInstructionsEn,
            }}
            translations={form.translations}
            onChange={(t) => set({ translations: t })}
            onBaseChange={(field, value) => {
              if (field === 'publicLabel') set({ publicLabelEn: value });
              if (field === 'pickupInstructions') set({ pickupInstructionsEn: value });
            }}
            fields={[
              { key: 'publicLabel', label: 'Public Label', placeholder: 'e.g., Rhubarbe – Mile End' },
              { key: 'pickupInstructions', label: 'Pickup Instructions', type: 'textarea', rows: 3, placeholder: 'e.g., Enter through the side door, ring the bell' },
            ]}
          />
          {errors.publicLabelEn && <p className="text-xs text-red-600">{errors.publicLabelEn}</p>}
          {errors.pickupInstructionsEn && <p className="text-xs text-red-600">{errors.pickupInstructionsEn}</p>}
        </SectionCard>

        {/* Location Details */}
        <SectionCard title="Location Details" description="Address, contact, and directions.">
          <Textarea
            label="Address"
            isRequired
            value={form.address}
            onChange={(v) => set({ address: v })}
            rows={2}
            placeholder="e.g., 1234 Rue Saint-Laurent, Montréal, QC H2W 1Z4"
            validationState={errors.address ? 'error' : 'default'}
            errorMessage={errors.address}
          />
          <Input
            label="Contact Details"
            isRequired
            value={form.contactDetails}
            onChange={(v) => set({ contactDetails: v })}
            placeholder="e.g., 514-555-0123 or info@rhubarbe.ca"
            validationState={errors.contactDetails ? 'error' : 'default'}
            errorMessage={errors.contactDetails}
          />
          <Input
            label="Map / Directions Link"
            value={form.mapOrDirectionsLink}
            onChange={(v) => set({ mapOrDirectionsLink: v })}
            placeholder="https://maps.google.com/..."
            helperText="Optional Google Maps or directions URL"
            validationState={errors.mapOrDirectionsLink ? 'error' : 'default'}
            errorMessage={errors.mapOrDirectionsLink}
          />
        </SectionCard>

        {/* Staff Notes */}
        <SectionCard title="Staff Notes" description="Internal notes visible only to staff.">
          <Textarea
            label="Operational Notes for Staff"
            value={form.operationalNotesForStaff}
            onChange={(v) => set({ operationalNotesForStaff: v })}
            rows={3}
            placeholder="e.g., Key is under the mat, parking in back lot"
          />
        </SectionCard>

      </div>
    </EditPageLayout>
  );
}
