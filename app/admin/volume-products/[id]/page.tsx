'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import TranslationFields from '@/app/admin/components/TranslationFields';
import AdminLocaleSwitcher from '@/app/admin/components/AdminLocaleSwitcher';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { Input } from '@/app/admin/components/ui/input';
import { Button } from '@/app/admin/components/ui/button';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Plus, Trash01 } from '@untitledui/icons';
import type { ContentTranslations } from '@/types';

interface LeadTimeTier {
  minQuantity: number;
  leadTimeDays: number;
}

interface VolumeProduct {
  id: string;
  name: string;
  image: string | null;
  volumeEnabled: boolean;
  volumeDescription: { en: string; fr: string } | null;
  volumeInstructions: { en: string; fr: string } | null;
  volumeMinOrderQuantity: number | null;
  shopifyProductId: string | null;
  shopifyProductHandle: string | null;
  leadTimeTiers: LeadTimeTier[];
  variants: Array<{ id?: string; name?: string; label?: string; shopifyVariantId?: string; [key: string]: unknown }>;
}

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

export default function EditVolumeProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<VolumeProduct | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);

  // Form state
  const [volumeEnabled, setVolumeEnabled] = useState(false);
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [instructionsEn, setInstructionsEn] = useState('');
  const [instructionsFr, setInstructionsFr] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('');
  const [tiers, setTiers] = useState<LeadTimeTier[]>([]);
  const [tierErrors, setTierErrors] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  async function fetchProduct() {
    try {
      setLoading(true);
      const res = await fetch(`/api/volume-products/${params.id}`);
      if (!res.ok) {
        setError('Volume product not found');
        return;
      }
      const data: VolumeProduct = await res.json();
      setProduct(data);
      setVolumeEnabled(data.volumeEnabled);
      setDescriptionEn(data.volumeDescription?.en ?? '');
      setDescriptionFr(data.volumeDescription?.fr ?? '');
      setInstructionsEn(data.volumeInstructions?.en ?? '');
      setInstructionsFr(data.volumeInstructions?.fr ?? '');
      setMinOrderQuantity(data.volumeMinOrderQuantity?.toString() ?? '');
      setTiers(data.leadTimeTiers.map((t) => ({ minQuantity: t.minQuantity, leadTimeDays: t.leadTimeDays })));
    } catch {
      setError('Failed to load volume product');
    } finally {
      setLoading(false);
    }
  }

  const markDirty = useCallback(() => setIsDirty(true), []);

  // --- Volume toggle ---
  function handleToggleVolume(checked: boolean) {
    if (!checked && volumeEnabled) {
      setDisableConfirmOpen(true);
      return;
    }
    setVolumeEnabled(checked);
    markDirty();
  }

  function confirmDisable() {
    setVolumeEnabled(false);
    setDisableConfirmOpen(false);
    markDirty();
  }

  // --- Translation fields helpers ---
  const descriptionTranslations: ContentTranslations = { fr: { description: descriptionFr || undefined } };
  const instructionsTranslations: ContentTranslations = { fr: { instructions: instructionsFr || undefined } };

  // --- Lead time tiers ---
  function addTier() {
    const lastMin = tiers.length > 0 ? tiers[tiers.length - 1].minQuantity : 0;
    setTiers([...tiers, { minQuantity: lastMin + 1, leadTimeDays: 1 }]);
    setTierErrors(null);
    markDirty();
  }

  function updateTier(index: number, field: keyof LeadTimeTier, value: string) {
    const num = parseInt(value) || 0;
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: num } : t)));
    setTierErrors(null);
    markDirty();
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
    setTierErrors(null);
    markDirty();
  }

  function validateTiers(tiersToValidate: LeadTimeTier[]): string | null {
    for (let i = 1; i < tiersToValidate.length; i++) {
      if (tiersToValidate[i].minQuantity <= tiersToValidate[i - 1].minQuantity) {
        return `Tier ${i + 1} minQuantity (${tiersToValidate[i].minQuantity}) must be greater than tier ${i} (${tiersToValidate[i - 1].minQuantity}).`;
      }
    }
    for (const t of tiersToValidate) {
      if (t.minQuantity < 1) return 'Min quantity must be at least 1.';
      if (t.leadTimeDays < 0) return 'Lead time days cannot be negative.';
    }
    return null;
  }

  // --- Variants ---
  // Variant state is managed via the product's existing variants
  // The variants state holds volume variant mappings (active toggle + shopify ID)

  // --- Save ---
  async function handleSave() {
    setError(undefined);

    // Validate tiers
    const tierError = validateTiers(tiers);
    if (tierError) {
      setTierErrors(tierError);
      toast.error('Validation error', tierError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        volumeEnabled,
        volumeDescription: descriptionEn || descriptionFr
          ? { en: descriptionEn, fr: descriptionFr }
          : null,
        volumeInstructions: instructionsEn || instructionsFr
          ? { en: instructionsEn, fr: instructionsFr }
          : null,
        volumeMinOrderQuantity: minOrderQuantity ? parseInt(minOrderQuantity) : null,
        leadTimeTiers: tiers,
      };

      const res = await fetch(`/api/volume-products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setProduct(updated);
        setIsDirty(false);
        toast.success('Saved', 'Volume product configuration updated');
      } else {
        const err = await res.json();
        const msg = err.details || err.error || 'Failed to save';
        setError(msg);
        toast.error('Save failed', msg);
      }
    } catch {
      setError('An unexpected error occurred');
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push('/admin/volume-products');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <EditPageLayout
        title="Volume Product"
        backHref="/admin/volume-products"
        backLabel="Back to Volume Products"
        onSave={() => {}}
        onCancel={handleCancel}
        error={error || 'Product not found'}
      >
        <div />
      </EditPageLayout>
    );
  }

  const shopifyAdminUrl = product.shopifyProductId
    ? `https://admin.shopify.com/store/${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.replace('.myshopify.com', '')}/products/${product.shopifyProductId.replace('gid://shopify/Product/', '')}`
    : null;

  return (
    <EditPageLayout
      title={product.name}
      backHref="/admin/volume-products"
      backLabel="Back to Volume Products"
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
      error={error}
      isDirty={isDirty}
      maxWidth="7xl"
    >
      <div className="flex justify-end mb-6">
        <AdminLocaleSwitcher />
      </div>

      <div className="grid grid-cols-3 gap-6 items-start">

        {/* Left column */}
        <div className="col-span-2 space-y-6">

        {/* Order rules: min quantity + lead time tiers */}
        <SectionCard
          title="Order Rules"
          description="Minimum order quantity and lead time tiers."
          action={
            <Button variant="secondary" size="sm" onClick={addTier} iconLeading={Plus}>
              Add Tier
            </Button>
          }
        >
          <Input
            label="Minimum Order Quantity"
            type="number"
            value={minOrderQuantity}
            onChange={(v) => {
              setMinOrderQuantity(v);
              markDirty();
            }}
            placeholder="e.g., 6"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Lead Time Tiers</label>
            {tiers.length === 0 ? (
              <p className="text-sm text-gray-500">No tiers configured. Add at least one tier for volume ordering to work.</p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{tiers.length} tier{tiers.length !== 1 ? 's' : ''}</p>
                </div>
                {tiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 rounded-lg text-sm">
                    <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                    <span className="text-xs text-gray-500">Min qty</span>
                    <input
                      type="number"
                      value={tier.minQuantity.toString()}
                      onChange={(e) => updateTier(index, 'minQuantity', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      aria-label={`Tier ${index + 1} minimum quantity`}
                    />
                    <span className="text-xs text-gray-500">Lead time</span>
                    <input
                      type="number"
                      value={tier.leadTimeDays.toString()}
                      onChange={(e) => updateTier(index, 'leadTimeDays', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      aria-label={`Tier ${index + 1} lead time days`}
                    />
                    <span className="text-xs text-gray-500">days</span>
                    <button
                      type="button"
                      onClick={() => removeTier(index)}
                      className="ml-auto text-gray-400 hover:text-red-500 text-xs"
                      aria-label={`Remove tier ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {tierErrors && (
              <p className="text-sm text-red-600 mt-2">{tierErrors}</p>
            )}
          </div>
        </SectionCard>

        {/* Description & instructions */}
        <SectionCard title="Description & Instructions" description="Customer-facing content for volume orders.">
          <TranslationFields
            base={{ description: descriptionEn }}
            translations={descriptionTranslations}
            onBaseChange={(_field, value) => {
              setDescriptionEn(value);
              markDirty();
            }}
            onChange={(t) => {
              setDescriptionFr(t?.fr?.description ?? '');
              markDirty();
            }}
            fields={[
              { key: 'description', label: 'Volume Description', type: 'textarea', rows: 3, placeholder: 'Describe this product for volume orders...' },
            ]}
          />
          <TranslationFields
            base={{ instructions: instructionsEn }}
            translations={instructionsTranslations}
            onBaseChange={(_field, value) => {
              setInstructionsEn(value);
              markDirty();
            }}
            onChange={(t) => {
              setInstructionsFr(t?.fr?.instructions ?? '');
              markDirty();
            }}
            fields={[
              { key: 'instructions', label: 'Ordering Instructions', type: 'textarea', rows: 3, placeholder: 'e.g., Minimum 48h notice for orders over 20 units...' },
            ]}
          />
        </SectionCard>

        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-6">

          {/* Volume toggle */}
          <SectionCard title="Volume Sales" description="Enable or disable volume ordering for this product.">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={volumeEnabled}
                onClick={() => handleToggleVolume(!volumeEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  volumeEnabled ? 'bg-brand-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    volumeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {volumeEnabled ? 'Volume ordering enabled' : 'Volume ordering disabled'}
              </span>
            </label>
            {volumeEnabled && tiers.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-warning-secondary border border-warning-200">
                <span className="text-xs text-warning-700">
                  ⚠ No lead time tiers configured. This product won't appear on the volume ordering page until at least one tier is added.
                </span>
              </div>
            )}
          </SectionCard>

          {/* Links */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Links</h2>
            </div>
            <div className="px-6 py-4 flex flex-col gap-3">
              <a href={`/admin/products/${params.id}`} className="block">
                <Button variant="secondary" size="sm" className="w-full">View product page</Button>
              </a>
              {shopifyAdminUrl && (
                <a href={shopifyAdminUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="secondary" size="sm" className="w-full">View in Shopify</Button>
                </a>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Disable confirmation modal */}
      <ConfirmModal
        isOpen={disableConfirmOpen}
        variant="warning"
        title="Disable Volume Ordering?"
        message="This product will no longer appear on the volume ordering page. Existing orders will not be affected."
        confirmLabel="Disable"
        cancelLabel="Cancel"
        onConfirm={confirmDisable}
        onCancel={() => setDisableConfirmOpen(false)}
      />
    </EditPageLayout>
  );
}
