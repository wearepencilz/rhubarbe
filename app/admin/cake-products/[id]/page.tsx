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
import { Plus } from '@untitledui/icons';
import type { ContentTranslations } from '@/types';

interface LeadTimeTier {
  minPeople: number;
  leadTimeDays: number;
}

interface CakeProduct {
  id: string;
  name: string;
  image: string | null;
  cakeEnabled: boolean;
  cakeDescription: { en: string; fr: string } | null;
  cakeInstructions: { en: string; fr: string } | null;
  cakeMinPeople: number | null;
  cakeFlavourNotes: { en: string; fr: string } | null;
  cakeDeliveryAvailable: boolean;
  shopifyProductId: string | null;
  shopifyProductHandle: string | null;
  leadTimeTiers: LeadTimeTier[];
  cakeVariants: Array<{ id?: string; label?: { en: string; fr: string }; shopifyVariantId?: string; [key: string]: unknown }>;
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

export default function EditCakeProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<CakeProduct | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);

  // Form state
  const [cakeEnabled, setCakeEnabled] = useState(false);
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [instructionsEn, setInstructionsEn] = useState('');
  const [instructionsFr, setInstructionsFr] = useState('');
  const [tiers, setTiers] = useState<LeadTimeTier[]>([]);
  const [tierErrors, setTierErrors] = useState<string | null>(null);
  const [flavourNotesEn, setFlavourNotesEn] = useState('');
  const [flavourNotesFr, setFlavourNotesFr] = useState('');
  const [cakeDeliveryAvailable, setCakeDeliveryAvailable] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  async function fetchProduct() {
    try {
      setLoading(true);
      const res = await fetch(`/api/cake-products/${params.id}`);
      if (!res.ok) {
        setError('Cake product not found');
        return;
      }
      const data: CakeProduct = await res.json();
      setProduct(data);
      setCakeEnabled(data.cakeEnabled);
      setDescriptionEn(data.cakeDescription?.en ?? '');
      setDescriptionFr(data.cakeDescription?.fr ?? '');
      setInstructionsEn(data.cakeInstructions?.en ?? '');
      setInstructionsFr(data.cakeInstructions?.fr ?? '');
      setTiers(data.leadTimeTiers.map((t) => ({ minPeople: t.minPeople, leadTimeDays: t.leadTimeDays })));
      setFlavourNotesEn(data.cakeFlavourNotes?.en ?? '');
      setFlavourNotesFr(data.cakeFlavourNotes?.fr ?? '');
      setCakeDeliveryAvailable(data.cakeDeliveryAvailable ?? true);
    } catch {
      setError('Failed to load cake product');
    } finally {
      setLoading(false);
    }
  }

  const markDirty = useCallback(() => setIsDirty(true), []);

  // --- Cake toggle ---
  function handleToggleCake(checked: boolean) {
    if (!checked && cakeEnabled) {
      setDisableConfirmOpen(true);
      return;
    }
    setCakeEnabled(checked);
    markDirty();
  }

  function confirmDisable() {
    setCakeEnabled(false);
    setDisableConfirmOpen(false);
    markDirty();
  }

  // --- Translation fields helpers ---
  const descriptionTranslations: ContentTranslations = { fr: { description: descriptionFr || undefined } };
  const instructionsTranslations: ContentTranslations = { fr: { instructions: instructionsFr || undefined } };

  // --- Lead time tiers ---
  function addTier() {
    const lastMin = tiers.length > 0 ? tiers[tiers.length - 1].minPeople : 0;
    setTiers([...tiers, { minPeople: lastMin + 1, leadTimeDays: 1 }]);
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
      if (tiersToValidate[i].minPeople <= tiersToValidate[i - 1].minPeople) {
        return `Tier ${i + 1} minPeople (${tiersToValidate[i].minPeople}) must be greater than tier ${i} (${tiersToValidate[i - 1].minPeople}).`;
      }
    }
    for (const t of tiersToValidate) {
      if (t.minPeople < 1) return 'Min people must be at least 1.';
      if (t.leadTimeDays < 0) return 'Lead time days cannot be negative.';
    }
    return null;
  }

  // --- Save ---
  async function handleSave() {
    setError(undefined);

    // Validate lead time tiers
    const tierError = validateTiers(tiers);
    if (tierError) {
      setTierErrors(tierError);
      toast.error('Validation error', tierError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cakeEnabled,
        cakeDescription: descriptionEn || descriptionFr
          ? { en: descriptionEn, fr: descriptionFr }
          : null,
        cakeInstructions: instructionsEn || instructionsFr
          ? { en: instructionsEn, fr: instructionsFr }
          : null,
        cakeMinPeople: tiers.length > 0 ? tiers[0].minPeople : null,
        leadTimeTiers: tiers,
        cakeFlavourNotes: flavourNotesEn || flavourNotesFr
          ? { en: flavourNotesEn, fr: flavourNotesFr }
          : null,
        cakeDeliveryAvailable,
      };

      const res = await fetch(`/api/cake-products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setProduct(updated);
        setIsDirty(false);
        toast.success('Saved', 'Cake product configuration updated');
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
    router.push('/admin/cake-products');
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
        title="Cake Product"
        backHref="/admin/cake-products"
        backLabel="Back to Cake Products"
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
      backHref="/admin/cake-products"
      backLabel="Back to Cake Products"
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

        {/* Order rules: min people + lead time tiers */}
        <SectionCard
          title="Order Rules"
          description="Lead time tiers determine both the minimum number of people and the required notice period."
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Lead Time Tiers</label>
              <Button variant="secondary" size="sm" onClick={addTier} iconLeading={Plus}>
                Add Tier
              </Button>
            </div>
            {tiers.length === 0 ? (
              <p className="text-sm text-gray-500">No tiers configured. Add at least one tier for cake ordering to work.</p>
            ) : (
              <div className="space-y-1.5">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 rounded-lg text-sm">
                    <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                    <span className="text-xs text-gray-500">Min people</span>
                    <input
                      type="number"
                      value={tier.minPeople.toString()}
                      onChange={(e) => updateTier(index, 'minPeople', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      aria-label={`Tier ${index + 1} minimum people`}
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
        <SectionCard title="Description & Instructions" description="Customer-facing content for cake orders.">
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
              { key: 'description', label: 'Cake Description', type: 'textarea', rows: 3, placeholder: 'Describe this product for cake orders...' },
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
              { key: 'instructions', label: 'Cake Instructions', type: 'textarea', rows: 3, placeholder: 'e.g., Minimum 48h notice for orders over 20 people...' },
            ]}
          />
        </SectionCard>

        {/* Flavour Notes */}
        <SectionCard title="Flavour Notes" description="Bilingual flavour teaser shown on cake cards.">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Flavour Notes (EN)"
              value={flavourNotesEn}
              onChange={(v) => { setFlavourNotesEn(v); markDirty(); }}
              placeholder="e.g. Rich chocolate with hazelnut praline"
            />
            <Input
              label="Notes de saveur (FR)"
              value={flavourNotesFr}
              onChange={(v) => { setFlavourNotesFr(v); markDirty(); }}
              placeholder="ex. Chocolat riche avec praliné noisette"
            />
          </div>
        </SectionCard>

        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-6">

          {/* Cake toggle */}
          <SectionCard title="Cake Sales" description="Enable or disable cake ordering for this product.">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={cakeEnabled}
                onClick={() => handleToggleCake(!cakeEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  cakeEnabled ? 'bg-brand-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    cakeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {cakeEnabled ? 'Cake ordering enabled' : 'Cake ordering disabled'}
              </span>
            </label>
            {cakeEnabled && tiers.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-warning-secondary border border-warning-200">
                <span className="text-xs text-warning-700">
                  ⚠ No lead time tiers configured. This product won't appear on the cake ordering page until at least one tier is added.
                </span>
              </div>
            )}
          </SectionCard>

          {/* Delivery */}
          <SectionCard title="Delivery" description="Whether delivery is available for this cake.">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={cakeDeliveryAvailable}
                onClick={() => { setCakeDeliveryAvailable(!cakeDeliveryAvailable); markDirty(); }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  cakeDeliveryAvailable ? 'bg-brand-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    cakeDeliveryAvailable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {cakeDeliveryAvailable ? 'Delivery available' : 'Pickup only'}
              </span>
            </label>
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
        title="Disable Cake Ordering?"
        message="This product will no longer appear on the cake ordering page. Existing orders will not be affected."
        confirmLabel="Disable"
        cancelLabel="Cancel"
        onConfirm={confirmDisable}
        onCancel={() => setDisableConfirmOpen(false)}
      />
    </EditPageLayout>
  );
}
