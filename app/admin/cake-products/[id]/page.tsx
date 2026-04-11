'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import TranslationFields from '@/app/admin/components/TranslationFields';
import AdminLocaleSwitcher from '@/app/admin/components/AdminLocaleSwitcher';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Button } from '@/app/admin/components/ui/button';
import { Badge } from '@/app/admin/components/ui/nav/badges';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Plus, Trash01, ChevronDown, ChevronUp } from '@untitledui/icons';
import ShopifyProductPicker from '@/app/admin/components/ShopifyProductPicker';
import ShopifyVariantsDisplay from '@/app/admin/components/ShopifyVariantsDisplay';
import ImageUploader from '@/app/admin/components/ImageUploader';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';
import TaxShippingSection from '@/app/admin/components/TaxShippingSection';
import type { ContentTranslations } from '@/types';
import { useAllergenOptions } from '@/app/admin/hooks/useAllergenOptions';

// ─── Types ───────────────────────────────────────────────────────────

interface LeadTimeTier {
  minPeople: number;
  leadTimeDays: number;
  deliveryOnly: boolean;
}

interface CakeFlavourEntry {
  handle: string;
  label: { en: string; fr: string };
  description: { en: string; fr: string } | null;
  pricingTierGroup: string | null;
  sortOrder: number;
  active: boolean;
  endDate: string | null;
  allergens?: string[];
}

interface CakeTierDetailEntry {
  sizeValue: string;
  layers: number;
  diameters: string;
  label: { en: string; fr: string } | null;
}

interface AddonLink {
  addonProductId: string;
  sortOrder: number;
}

interface CakeProduct {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  image: string | null;
  description: string | null;
  shortCardCopy: string | null;
  category: string | null;
  status: string | null;
  price: number | null;
  allergens: string[] | null;
  tags: string[] | null;
  translations: Record<string, Record<string, string>> | null;
  taxBehavior: string;
  taxThreshold: number;
  taxUnitCount: number;
  shopifyTaxExemptVariantId: string | null;
  pickupOnly: boolean;
  cakeEnabled: boolean;
  cakeDescription: { en: string; fr: string } | null;
  cakeInstructions: { en: string; fr: string } | null;
  cakeMinPeople: number | null;
  cakeMaxPeople: number | null;
  cakeFlavourNotes: { en: string; fr: string } | null;
  cakeDeliveryAvailable: boolean;
  shopifyProductId: string | null;
  shopifyProductHandle: string | null;
  leadTimeTiers: LeadTimeTier[];
  cakeVariants: Array<{ id?: string; label?: { en: string; fr: string }; shopifyVariantId?: string; [key: string]: unknown }>;
  cakeProductType: string | null;
  cakeFlavourConfig: CakeFlavourEntry[] | null;
  cakeTierDetailConfig: CakeTierDetailEntry[] | null;
  cakeMaxFlavours: number | null;
  maxAdvanceDays: number | null;
  pricingGrid: any[];
  addonLinks: AddonLink[];
}

type ProductType = '' | 'cake-xxl' | 'sheet-cake' | 'croquembouche' | 'wedding-cake-tiered' | 'wedding-cake-tasting' | 'cake-addon';

const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: 'cake-xxl', label: 'Large Format (XXL)' },
  { value: 'sheet-cake', label: 'Sheet Cake' },
  { value: 'croquembouche', label: 'Croquembouche' },
  { value: 'wedding-cake-tiered', label: 'Tiered Wedding Cake' },
  { value: 'wedding-cake-tasting', label: 'Wedding Cake Tasting' },
  { value: 'cake-addon', label: 'Add-On' },
];

// ─── Section Card ────────────────────────────────────────────────────

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

// ─── Collapsible Section Card ────────────────────────────────────────

function CollapsibleSectionCard({
  title, description, count, countLabel, children,
}: {
  title: string; description?: string; count: number; countLabel: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && !open && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <span className="text-xs text-gray-400">{count} {countLabel} {open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-6 py-5 space-y-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ─── Flavour Config Editor ───────────────────────────────────────────

function FlavourConfigEditor({
  flavours,
  onChange,
  allergenOptions,
}: {
  flavours: CakeFlavourEntry[];
  onChange: (flavours: CakeFlavourEntry[]) => void;
  allergenOptions: string[];
}) {
  function addFlavour() {
    onChange([
      ...flavours,
      {
        handle: '',
        label: { en: '', fr: '' },
        description: { en: '', fr: '' },
        pricingTierGroup: null,
        sortOrder: flavours.length,
        active: true,
        endDate: null,
      },
    ]);
  }

  function updateFlavour(index: number, patch: Partial<CakeFlavourEntry>) {
    onChange(flavours.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeFlavour(index: number) {
    onChange(flavours.filter((_, i) => i !== index).map((f, i) => ({ ...f, sortOrder: i })));
  }

  function moveFlavour(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= flavours.length) return;
    const next = [...flavours];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((f, i) => ({ ...f, sortOrder: i })));
  }

  return (
    <div className="space-y-3">
      {flavours.length === 0 ? (
        <p className="text-sm text-gray-500">No flavours configured. Add at least one flavour.</p>
      ) : (
        flavours.map((flavour, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Flavour {index + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveFlavour(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  aria-label={`Move flavour ${index + 1} up`}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveFlavour(index, 1)}
                  disabled={index === flavours.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  aria-label={`Move flavour ${index + 1} down`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeFlavour(index)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  aria-label={`Remove flavour ${index + 1}`}
                >
                  <Trash01 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Handle</label>
                <input
                  type="text"
                  value={flavour.handle}
                  onChange={(e) => updateFlavour(index, { handle: e.target.value })}
                  placeholder="e.g. pistachio"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pricing Tier Group</label>
                <input
                  type="text"
                  value={flavour.pricingTierGroup ?? ''}
                  onChange={(e) => updateFlavour(index, { pricingTierGroup: e.target.value || null })}
                  placeholder="Optional"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label (EN)</label>
                <input
                  type="text"
                  value={flavour.label.en}
                  onChange={(e) => updateFlavour(index, { label: { ...flavour.label, en: e.target.value } })}
                  placeholder="English label"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label (FR)</label>
                <input
                  type="text"
                  value={flavour.label.fr}
                  onChange={(e) => updateFlavour(index, { label: { ...flavour.label, fr: e.target.value } })}
                  placeholder="French label"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description (EN)</label>
                <textarea
                  value={flavour.description?.en ?? ''}
                  onChange={(e) =>
                    updateFlavour(index, {
                      description: {
                        en: e.target.value,
                        fr: flavour.description?.fr ?? '',
                      },
                    })
                  }
                  placeholder="English description"
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description (FR)</label>
                <textarea
                  value={flavour.description?.fr ?? ''}
                  onChange={(e) =>
                    updateFlavour(index, {
                      description: {
                        en: flavour.description?.en ?? '',
                        fr: e.target.value,
                      },
                    })
                  }
                  placeholder="French description"
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Flavour End Date</label>
                <input
                  type="date"
                  value={flavour.endDate ?? ''}
                  onChange={(e) => updateFlavour(index, { endDate: e.target.value || null })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <p className="text-[11px] text-gray-400 mt-0.5">Last day this ingredient is available. Flavour is automatically hidden once lead time makes delivery by this date impossible.</p>
              </div>
            </div>

            {/* Per-variant allergens */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Allergens</label>
              <div className="flex flex-wrap gap-1.5">
                {allergenOptions.map((a) => {
                  const selected = flavour.allergens?.includes(a) ?? false;
                  return (
                    <button key={a} type="button"
                      onClick={() => {
                        const current = flavour.allergens ?? [];
                        updateFlavour(index, { allergens: selected ? current.filter((x) => x !== a) : [...current, a] });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${selected ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={flavour.active}
                onClick={() => updateFlavour(index, { active: !flavour.active })}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                  flavour.active ? 'bg-brand-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    flavour.active ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-xs text-gray-600">{flavour.active ? 'Active' : 'Inactive'}</span>
            </label>
          </div>
        ))
      )}
      <Button variant="secondary" size="sm" onClick={addFlavour} iconLeading={Plus}>
        Add Flavour
      </Button>
    </div>
  );
}

// ─── Tier Detail Editor ──────────────────────────────────────────────

function TierDetailEditor({
  tiers,
  onChange,
}: {
  tiers: CakeTierDetailEntry[];
  onChange: (tiers: CakeTierDetailEntry[]) => void;
}) {
  function addTier() {
    onChange([
      ...tiers,
      { sizeValue: '', layers: 2, diameters: '', label: null },
    ]);
  }

  function updateTier(index: number, patch: Partial<CakeTierDetailEntry>) {
    onChange(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeTier(index: number) {
    onChange(tiers.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {tiers.length === 0 ? (
        <p className="text-sm text-gray-500">No tier details configured.</p>
      ) : (
        tiers.map((tier, index) => (
          <div key={index} className="flex items-start gap-3 py-2 px-3 bg-gray-50 rounded-lg">
            <div className="flex-1 grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Size Value</label>
                <input
                  type="text"
                  value={tier.sizeValue}
                  onChange={(e) => updateTier(index, { sizeValue: e.target.value })}
                  placeholder="e.g. 30"
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Layers</label>
                <input
                  type="number"
                  value={tier.layers}
                  onChange={(e) => updateTier(index, { layers: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Diameters</label>
                <input
                  type="text"
                  value={tier.diameters}
                  onChange={(e) => updateTier(index, { diameters: e.target.value })}
                  placeholder="e.g. 10/8/6"
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label EN / FR</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={tier.label?.en ?? ''}
                    onChange={(e) =>
                      updateTier(index, {
                        label: e.target.value || tier.label?.fr
                          ? { en: e.target.value, fr: tier.label?.fr ?? '' }
                          : null,
                      })
                    }
                    placeholder="EN"
                    className="w-1/2 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={tier.label?.fr ?? ''}
                    onChange={(e) =>
                      updateTier(index, {
                        label: tier.label?.en || e.target.value
                          ? { en: tier.label?.en ?? '', fr: e.target.value }
                          : null,
                      })
                    }
                    placeholder="FR"
                    className="w-1/2 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeTier(index)}
              className="mt-5 p-1 text-gray-400 hover:text-red-500"
              aria-label={`Remove tier detail ${index + 1}`}
            >
              <Trash01 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))
      )}
      <Button variant="secondary" size="sm" onClick={addTier} iconLeading={Plus}>
        Add Tier Detail
      </Button>
    </div>
  );
}

// ─── Add-On Links Editor ─────────────────────────────────────────────

function AddonLinksEditor({
  links,
  currentProductId,
  onChange,
}: {
  links: AddonLink[];
  currentProductId: string;
  onChange: (links: AddonLink[]) => void;
}) {
  const [allProducts, setAllProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    setLoadingProducts(true);
    fetch('/api/cake-products')
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string }>) => {
        // Exclude the current product from the list
        setAllProducts(data.filter((p) => p.id !== currentProductId));
      })
      .catch(() => setAllProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [currentProductId]);

  const linkedIds = new Set(links.map((l) => l.addonProductId));

  function addLink(productId: string) {
    if (linkedIds.has(productId)) return;
    onChange([...links, { addonProductId: productId, sortOrder: links.length }]);
  }

  function removeLink(productId: string) {
    onChange(
      links
        .filter((l) => l.addonProductId !== productId)
        .map((l, i) => ({ ...l, sortOrder: i })),
    );
  }

  function moveLink(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((l, i) => ({ ...l, sortOrder: i })));
  }

  // Get product name by ID
  function getProductName(id: string): string {
    return allProducts.find((p) => p.id === id)?.name ?? id;
  }

  // Available products (not yet linked)
  const available = allProducts.filter((p) => !linkedIds.has(p.id));

  return (
    <div className="space-y-3">
      {links.length === 0 ? (
        <p className="text-sm text-gray-500">No add-on products linked.</p>
      ) : (
        <div className="space-y-1.5">
          {links.map((link, index) => (
            <div key={link.addonProductId} className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 rounded-lg text-sm">
              <span className="text-xs text-gray-400 w-4">{index + 1}</span>
              <span className="flex-1 text-sm text-gray-700 truncate">{getProductName(link.addonProductId)}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveLink(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  aria-label={`Move add-on ${index + 1} up`}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveLink(index, 1)}
                  disabled={index === links.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  aria-label={`Move add-on ${index + 1} down`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeLink(link.addonProductId)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  aria-label={`Remove add-on ${getProductName(link.addonProductId)}`}
                >
                  <Trash01 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loadingProducts ? (
        <p className="text-xs text-gray-400">Loading products…</p>
      ) : available.length > 0 ? (
        <div className="flex items-center gap-2">
          <select
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                addLink(e.target.value);
                e.target.value = '';
              }
            }}
          >
            <option value="" disabled>
              Select a product to link…
            </option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : links.length > 0 ? (
        <p className="text-xs text-gray-400">All available products are already linked.</p>
      ) : null}
    </div>
  );
}

// ─── Collapsible Shopify Variants ────────────────────────────────────

function CollapsibleCount({ label, shopifyProductId }: { label: string; shopifyProductId: string }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/shopify/products/${encodeURIComponent(shopifyProductId)}/variants`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.variants) setCount(data.variants.length); })
      .catch(() => {});
  }, [shopifyProductId]);

  return (
    <div className="border-t border-gray-100">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-6 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs text-gray-400">{count != null ? `${count} variants` : '…'} {open ? '▾' : '▸'}</span>
      </button>
      {open && <ShopifyVariantsDisplay shopifyProductId={shopifyProductId} />}
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────

export default function EditCakeProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [product, setProduct] = useState<CakeProduct | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);

  // Existing form state
  const [cakeEnabled, setCakeEnabled] = useState(false);
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [instructionsEn, setInstructionsEn] = useState('');
  const [instructionsFr, setInstructionsFr] = useState('');
  const [tiers, setTiers] = useState<LeadTimeTier[]>([]);
  const [tierErrors, setTierErrors] = useState<string | null>(null);
  const [flavourNotesEn, setFlavourNotesEn] = useState('');
  const [flavourNotesFr, setFlavourNotesFr] = useState('');

  // New form state (task 6)
  const [cakeProductType, setCakeProductType] = useState<ProductType>('');
  const [cakeMaxFlavours, setCakeMaxFlavours] = useState<number>(2);
  const [flavourConfig, setFlavourConfig] = useState<CakeFlavourEntry[]>([]);
  const [tierDetailConfig, setTierDetailConfig] = useState<CakeTierDetailEntry[]>([]);
  const [addonLinks, setAddonLinks] = useState<AddonLink[]>([]);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number | null>(null);
  const [cakeMaxPeople, setCakeMaxPeople] = useState<number | null>(null);

  // Core product fields (merged from product edit page)
  const [productName, setProductName] = useState('');
  const [productSlug, setProductSlug] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productShortCardCopy, setProductShortCardCopy] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productStatus, setProductStatus] = useState('draft');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [shopifyProductId, setShopifyProductId] = useState('');
  const [shopifyProductHandle, setShopifyProductHandle] = useState('');
  const [taxBehavior, setTaxBehavior] = useState('always_taxable');
  const [taxThreshold, setTaxThreshold] = useState(6);
  const [taxUnitCount, setTaxUnitCount] = useState(1);
  // Translations (product-level)
  const [titleFr, setTitleFr] = useState('');
  const [prodDescriptionFr, setProdDescriptionFr] = useState('');
  const [shortCardCopyFr, setShortCardCopyFr] = useState('');

  const shopifyPickerOpenRef = useRef<(() => void) | null>(null);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);

  const allergenOptions = useAllergenOptions();

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
      setTiers(data.leadTimeTiers.map((t) => ({ minPeople: t.minPeople, leadTimeDays: t.leadTimeDays, deliveryOnly: t.deliveryOnly ?? false })));
      setFlavourNotesEn(data.cakeFlavourNotes?.en ?? '');
      setFlavourNotesFr(data.cakeFlavourNotes?.fr ?? '');

      // New fields
      setCakeProductType((data.cakeProductType as ProductType) ?? '');
      setCakeMaxFlavours(data.cakeMaxFlavours ?? 2);
      setFlavourConfig(data.cakeFlavourConfig ?? []);
      setTierDetailConfig(data.cakeTierDetailConfig ?? []);
      setAddonLinks(data.addonLinks ?? []);
      setMaxAdvanceDays(data.maxAdvanceDays ?? null);
      setCakeMaxPeople(data.cakeMaxPeople ?? null);

      // Core product fields
      setProductName(data.name ?? '');
      setProductSlug(data.slug ?? '');
      setProductImage(data.image ?? '');
      setProductTitle(data.title ?? data.name ?? '');
      setProductDescription(data.description ?? '');
      setProductShortCardCopy(data.shortCardCopy ?? '');
      setProductCategory(data.category ?? '');
      setProductStatus(data.status ?? 'draft');
      setAllergens(data.allergens ?? []);
      setShopifyProductId(data.shopifyProductId ?? '');
      setShopifyProductHandle(data.shopifyProductHandle ?? '');
      setTaxBehavior(data.taxBehavior ?? 'always_taxable');
      setTaxThreshold(data.taxThreshold ?? 6);
      setTaxUnitCount(data.taxUnitCount ?? 1);
      setTitleFr(data.translations?.fr?.title ?? '');
      setProdDescriptionFr(data.translations?.fr?.description ?? '');
      setShortCardCopyFr(data.translations?.fr?.shortCardCopy ?? '');

      // Auto-sync status and image from Shopify if linked
      if (data.shopifyProductId) {
        fetch(`/api/products/${params.id}/sync-shopify-status`)
          .then((r) => r.ok ? r.json() : null)
          .then((synced) => {
            if (synced) {
              if (synced.status) setProductStatus(synced.status);
              if (synced.image) setProductImage(synced.image);
              if (synced.name) setProductName(synced.name);
              if (synced.slug) setProductSlug(synced.slug);
            }
          })
          .catch(() => {});
      }
    } catch {
      setError('Failed to load cake product');
    } finally {
      setLoading(false);
    }
  }

  const markDirty = useCallback(() => setIsDirty(true), []);

  // Derived visibility flags
  const hasProductType = cakeProductType !== '';
  const showFlavourConfig = hasProductType;
  const showTierDetails = cakeProductType === 'cake-xxl' || cakeProductType === 'sheet-cake' || cakeProductType === 'wedding-cake-tiered';
  const showAddonLinks = cakeProductType === 'cake-xxl' || cakeProductType === 'sheet-cake' || cakeProductType === 'wedding-cake-tiered';

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
    setTiers([...tiers, { minPeople: lastMin + 1, leadTimeDays: 1, deliveryOnly: false }]);
    setTierErrors(null);
    markDirty();
  }

  function updateTier(index: number, field: keyof LeadTimeTier, value: string | boolean) {
    if (field === 'deliveryOnly') {
      setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, deliveryOnly: value as boolean } : t)));
    } else {
      const num = parseInt(value as string) || 0;
      setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: num } : t)));
    }
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
      // Save core product fields
      await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName,
          title: productTitle,
          slug: productSlug,
          image: productImage || null,
          description: productDescription || null,
          shortCardCopy: productShortCardCopy || null,
          category: productCategory || null,
          status: productStatus,
          allergens,
          cakeMaxPeople: cakeMaxPeople && cakeMaxPeople > 0 ? cakeMaxPeople : null,
          taxBehavior,
          taxThreshold,
          taxUnitCount,
          translations: (titleFr || prodDescriptionFr || shortCardCopyFr)
            ? { fr: { title: titleFr || undefined, description: prodDescriptionFr || undefined, shortCardCopy: shortCardCopyFr || undefined } }
            : undefined,
        }),
      });

      // Save cake-specific fields
      const payload: Record<string, unknown> = {
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
        // New fields
        cakeProductType: cakeProductType || null,
        cakeFlavourConfig: showFlavourConfig ? flavourConfig : null,
        cakeTierDetailConfig: showTierDetails ? tierDetailConfig : null,
        cakeMaxFlavours: (cakeProductType === 'croquembouche' || cakeProductType === 'wedding-cake-tasting') ? cakeMaxFlavours : null,
        addonLinks: showAddonLinks ? addonLinks : undefined,
        maxAdvanceDays: maxAdvanceDays && maxAdvanceDays > 0 ? maxAdvanceDays : null,
      };

      const res = await fetch(`/api/cake-products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setProduct(updated);
        // Re-sync new fields from response
        setCakeProductType((updated.cakeProductType as ProductType) ?? '');
        setCakeMaxFlavours(updated.cakeMaxFlavours ?? 2);
        setFlavourConfig(updated.cakeFlavourConfig ?? []);
        setTierDetailConfig(updated.cakeTierDetailConfig ?? []);
        setAddonLinks(updated.addonLinks ?? []);
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

  async function handleDelete() {
    try {
      const res = await fetch(`/api/products/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/cake-products');
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to delete');
      }
    } catch {
      setError('Failed to delete product');
    }
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

  const shopifyAdminUrl = shopifyProductId
    ? `https://admin.shopify.com/store/${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.replace('.myshopify.com', '')}/products/${shopifyProductId.replace('gid://shopify/Product/', '')}`
    : null;

  return (
    <EditPageLayout
      title={product.name}
      backHref="/admin/cake-products"
      backLabel="Back to Cake Products"
      onSave={handleSave}
      onDelete={handleDelete}
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

        {/* Bilingual product content — side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* French */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <span className="text-base">🇫🇷</span>
              <h2 className="text-sm font-semibold text-gray-900">Français</h2>
              <div className="ml-auto">
                <AiTranslateButton
                  targetLocale="en"
                  fields={{ title: titleFr, description: prodDescriptionFr, shortCardCopy: shortCardCopyFr }}
                  onResult={(t) => { if (t.title) setProductTitle(t.title); if (t.description) setProductDescription(t.description); if (t.shortCardCopy) setProductShortCardCopy(t.shortCardCopy); markDirty(); }}
                />
              </div>
            </div>
            <div className="px-6 py-6 space-y-4">
              <Input label="Titre" value={titleFr} onChange={(v) => { setTitleFr(v); markDirty(); }} placeholder={productTitle || 'Titre du produit'} />
              <Textarea label="Description" value={prodDescriptionFr} onChange={(v) => { setProdDescriptionFr(v); markDirty(); }} rows={4} placeholder={productDescription || 'Description en français'} />
              <Input label="Texte carte" value={shortCardCopyFr} onChange={(v) => { setShortCardCopyFr(v); markDirty(); }} placeholder={productShortCardCopy || 'Texte court'} />
            </div>
          </div>
          {/* English */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <span className="text-base">🇬🇧</span>
              <h2 className="text-sm font-semibold text-gray-900">English</h2>
              <div className="ml-auto">
                <AiTranslateButton
                  targetLocale="fr"
                  fields={{ title: productTitle, description: productDescription, shortCardCopy: productShortCardCopy }}
                  onResult={(t) => { if (t.title) setTitleFr(t.title); if (t.description) setProdDescriptionFr(t.description); if (t.shortCardCopy) setShortCardCopyFr(t.shortCardCopy); markDirty(); }}
                />
              </div>
            </div>
            <div className="px-6 py-6 space-y-4">
              <Input label="Title" value={productTitle} onChange={(v) => { setProductTitle(v); markDirty(); }} isRequired />
              <Textarea label="Description" value={productDescription} onChange={(v) => { setProductDescription(v); markDirty(); }} rows={4} />
              <Input label="Short card copy" value={productShortCardCopy} onChange={(v) => { setProductShortCardCopy(v); markDirty(); }} />
            </div>
          </div>
        </div>

        {/* Product details */}
        <SectionCard title="Product Details" description="Name and slug sync from Shopify when linked.">
          <div className="grid grid-cols-2 gap-4">
            {shopifyProductId ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900 py-2">{productName} <span className="text-xs text-gray-400">(from Shopify)</span></p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <p className="text-sm text-gray-900 py-2 font-mono">{productSlug} <span className="text-xs text-gray-400">(from Shopify)</span></p>
                </div>
              </>
            ) : (
              <>
                <Input label="Name" value={productName} onChange={(v) => { setProductName(v); markDirty(); }} isRequired />
                <Input label="Slug" value={productSlug} onChange={(v) => { setProductSlug(v); markDirty(); }} isRequired />
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {shopifyProductId ? (
              <p className="text-sm text-gray-600 py-2">{productStatus} <span className="text-xs text-gray-400">(managed in Shopify)</span></p>
            ) : (
              <select value={productStatus} onChange={(e) => { setProductStatus(e.target.value); markDirty(); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="sold-out">Sold Out</option>
                <option value="archived">Archived</option>
              </select>
            )}
          </div>
        </SectionCard>

        {/* Allergens */}
        <SectionCard title="Allergens" description="Product-level allergens. Per-flavour allergens are set in the Flavour Configuration below.">
          <div className="flex flex-wrap gap-2">
            {allergenOptions.map((a) => (
              <button key={a} type="button" onClick={() => { setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]); markDirty(); }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${allergens.includes(a) ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {a}
              </button>
            ))}
          </div>
        </SectionCard>

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
                    <label className="inline-flex items-center gap-1.5 ml-2 cursor-pointer">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={tier.deliveryOnly}
                        aria-label={`Tier ${index + 1} delivery only`}
                        onClick={() => updateTier(index, 'deliveryOnly', !tier.deliveryOnly)}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                          tier.deliveryOnly ? 'bg-brand-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            tier.deliveryOnly ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">Delivery only</span>
                    </label>
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

          {/* Max advance booking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxAdvanceDays" className="block text-sm font-medium text-gray-700 mb-1">Max advance booking (days)</label>
              <input
                id="maxAdvanceDays"
                type="number"
                min={0}
                max={365}
                value={maxAdvanceDays ?? ''}
                onChange={(e) => { setMaxAdvanceDays(e.target.value ? parseInt(e.target.value) || null : null); markDirty(); }}
                placeholder="No limit"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">How far in advance customers can book.</p>
            </div>
            <div>
              <label htmlFor="cakeMaxPeople" className="block text-sm font-medium text-gray-700 mb-1">Maximum size (people)</label>
              <input
                id="cakeMaxPeople"
                type="number"
                min={1}
                max={1000}
                value={cakeMaxPeople ?? ''}
                onChange={(e) => { setCakeMaxPeople(e.target.value ? parseInt(e.target.value) || null : null); markDirty(); }}
                placeholder="No limit"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">Largest order size in people/guests.</p>
            </div>
          </div>
        </SectionCard>

        {/* Description */}
        <SectionCard title="Description" description="Customer-facing description shown on cake product cards.">
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
        </SectionCard>

        {/* 6.2 — Flavour Config Editor */}
        {showFlavourConfig && (
          <CollapsibleSectionCard
            title="Flavour Configuration"
            count={flavourConfig.length}
            countLabel="flavours"
            description="Define available flavours for this product. Each flavour maps to a column in the pricing grid."
          >
            <FlavourConfigEditor
              flavours={flavourConfig}
              onChange={(f) => { setFlavourConfig(f); markDirty(); }}
              allergenOptions={allergenOptions}
            />
          </CollapsibleSectionCard>
        )}

        {/* 6.3 — Tier Detail Editor */}
        {showTierDetails && (
          <CollapsibleSectionCard
            title="Tier Details"
            count={tierDetailConfig.length}
            countLabel="tiers"
            description="Define layers and diameters for each size. Used for the visual tier diagram on the storefront."
          >
            <TierDetailEditor
              tiers={tierDetailConfig}
              onChange={(t) => { setTierDetailConfig(t); markDirty(); }}
            />
          </CollapsibleSectionCard>
        )}

        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-6">

          {/* 6.1 — Product Type Selector */}
          <SectionCard title="Product Type" description="Determines pricing model and storefront UI.">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cake Product Type</label>
              <select
                value={cakeProductType}
                onChange={(e) => {
                  setCakeProductType(e.target.value as ProductType);
                  markDirty();
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
              >
                {PRODUCT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {(cakeProductType === 'croquembouche' || cakeProductType === 'wedding-cake-tasting') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Flavours</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cakeMaxFlavours}
                  onChange={(e) => {
                    setCakeMaxFlavours(parseInt(e.target.value) || 3);
                    markDirty();
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum number of flavours a customer can select.
                </p>
              </div>
            )}
          </SectionCard>

          {/* 6.5 — Add-On Links Editor */}
          {showAddonLinks && (
            <SectionCard title="Add-On Products" description="Link optional add-on products (e.g. Extra Fruits, Gold Flowers).">
              <AddonLinksEditor
                links={addonLinks}
                currentProductId={params.id}
                onChange={(l) => { setAddonLinks(l); markDirty(); }}
              />
            </SectionCard>
          )}

          {/* Image */}
          <SectionCard title="Image" description={shopifyProductId ? 'Managed by Shopify.' : 'Product photo.'}>
            {shopifyProductId ? (
              productImage ? (
                <img src={productImage} alt={productName} className="w-full aspect-square object-cover rounded-lg" />
              ) : (
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm text-gray-400">No image</span>
                </div>
              )
            ) : (
              <ImageUploader value={productImage} onChange={(url) => { setProductImage(url); markDirty(); }} aspectRatio="1:1" label="" />
            )}
          </SectionCard>

          {/* Shopify integration */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Shopify integration</h2>
              </div>
              {shopifyProductId ? <Badge color="success">Linked</Badge> : <Badge color="gray">Not linked</Badge>}
            </div>
            {shopifyProductId ? (
              <>
                <div className="px-6 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium font-mono text-gray-900 truncate">{shopifyProductHandle}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">ID: {shopifyProductId}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {shopifyAdminUrl && (
                      <a href={shopifyAdminUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm">View</Button>
                      </a>
                    )}
                    <Button variant="danger" size="sm" onClick={() => setUnlinkConfirmOpen(true)}>Unlink</Button>
                  </div>
                </div>
                <CollapsibleCount label="Variants" shopifyProductId={shopifyProductId} />
                <div className="px-6 py-3 border-t border-gray-200">
                  <Button
                    variant="primary" size="sm" className="w-full"
                    onClick={async () => {
                      setSyncing(true);
                      try {
                        const res = await fetch(`/api/cake-products/${params.id}/sync-from-shopify`, { method: 'POST' });
                        const data = await res.json();
                        if (!res.ok) { toast.error('Sync failed', data.error || 'Failed to sync'); return; }
                        toast.success('Synced', `${data.summary.flavoursDetected} flavours, ${data.summary.sizesDetected} sizes, ${data.summary.gridCells} price cells`);
                        await fetchProduct();
                        setIsDirty(false);
                      } catch { toast.error('Sync failed', 'An unexpected error occurred'); }
                      finally { setSyncing(false); }
                    }}
                    isLoading={syncing} isDisabled={syncing}
                  >
                    {syncing ? 'Syncing…' : 'Sync from Shopify'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Link existing</p>
                  <p className="text-xs text-gray-500 mt-0.5">Connect to an existing Shopify product.</p>
                </div>
                <ShopifyProductPicker
                  onSelect={(p) => {
                    if (p) {
                      setShopifyProductId(p.id);
                      setShopifyProductHandle(p.handle);
                      if (p.featuredImage?.url) setProductImage(p.featuredImage.url);
                      markDirty();
                    }
                  }}
                  onOpenRef={shopifyPickerOpenRef}
                />
                <Button variant="secondary" size="sm" onClick={() => shopifyPickerOpenRef.current?.()}>Link</Button>
              </div>
            )}
          </div>

          {/* Tax */}
          <TaxShippingSection
            data={{ taxBehavior, taxThreshold, taxUnitCount }}
            onChange={(tax) => { setTaxBehavior(tax.taxBehavior ?? taxBehavior); setTaxThreshold(tax.taxThreshold ?? taxThreshold); setTaxUnitCount(tax.taxUnitCount ?? taxUnitCount); markDirty(); }}
            shopifyProductId={shopifyProductId || undefined}
          />

        </div>
      </div>

      {/* Unlink Shopify confirmation */}
      <ConfirmModal
        isOpen={unlinkConfirmOpen}
        variant="warning"
        title="Unlink Shopify product"
        message="This will remove the Shopify connection. The product will not be deleted from Shopify."
        confirmLabel="Unlink"
        cancelLabel="Cancel"
        onConfirm={async () => {
          setUnlinkConfirmOpen(false);
          await fetch(`/api/products/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shopifyProductId: null, shopifyProductHandle: null }),
          });
          setShopifyProductId('');
          setShopifyProductHandle('');
          toast.success('Unlinked', 'Shopify connection removed');
          markDirty();
        }}
        onCancel={() => setUnlinkConfirmOpen(false)}
      />
    </EditPageLayout>
  );
}
