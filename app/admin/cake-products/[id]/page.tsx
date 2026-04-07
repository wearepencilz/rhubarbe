'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import TranslationFields from '@/app/admin/components/TranslationFields';
import AdminLocaleSwitcher from '@/app/admin/components/AdminLocaleSwitcher';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { Input } from '@/app/admin/components/ui/input';
import { Button } from '@/app/admin/components/ui/button';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Plus, Trash01, ChevronDown, ChevronUp } from '@untitledui/icons';
import type { ContentTranslations } from '@/types';

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
}

interface CakeTierDetailEntry {
  sizeValue: string;
  layers: number;
  diameters: string;
  label: { en: string; fr: string } | null;
}

interface PricingGridRow {
  sizeValue: string;
  flavourHandle: string;
  priceInCents: number;
  shopifyVariantId: string | null;
}

interface AddonLink {
  addonProductId: string;
  sortOrder: number;
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
  cakeProductType: string | null;
  cakeFlavourConfig: CakeFlavourEntry[] | null;
  cakeTierDetailConfig: CakeTierDetailEntry[] | null;
  cakeMaxFlavours: number | null;
  pricingGrid: PricingGridRow[];
  addonLinks: AddonLink[];
}

type ProductType = '' | 'cake-xxl' | 'croquembouche' | 'wedding-cake-tiered' | 'wedding-cake-tasting';

const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string }[] = [
  { value: '', label: 'Legacy (no type)' },
  { value: 'cake-xxl', label: 'Large Format (XXL)' },
  { value: 'croquembouche', label: 'Croquembouche' },
  { value: 'wedding-cake-tiered', label: 'Tiered Wedding Cake' },
  { value: 'wedding-cake-tasting', label: 'Wedding Cake Tasting' },
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

// ─── Flavour Config Editor ───────────────────────────────────────────

function FlavourConfigEditor({
  flavours,
  onChange,
}: {
  flavours: CakeFlavourEntry[];
  onChange: (flavours: CakeFlavourEntry[]) => void;
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

// ─── Pricing Grid Editor ─────────────────────────────────────────────

function PricingGridEditor({
  grid,
  flavours,
  tierDetails,
  onChange,
}: {
  grid: PricingGridRow[];
  flavours: CakeFlavourEntry[];
  tierDetails: CakeTierDetailEntry[];
  onChange: (grid: PricingGridRow[]) => void;
}) {
  const activeFlavours = flavours.filter((f) => f.active);

  // Derive sizes from tier details first, then from existing grid
  const sizes = useMemo(() => {
    const fromTiers = tierDetails.map((t) => t.sizeValue).filter(Boolean);
    const fromGrid = grid.map((r) => r.sizeValue);
    const all = [...new Set([...fromTiers, ...fromGrid])];
    // Sort numerically if possible
    return all.sort((a, b) => {
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [tierDetails, grid]);

  const [newSize, setNewSize] = useState('');

  // Build a lookup map for quick access
  const gridMap = useMemo(() => {
    const map = new Map<string, PricingGridRow>();
    for (const row of grid) {
      map.set(`${row.sizeValue}|${row.flavourHandle}`, row);
    }
    return map;
  }, [grid]);

  function getCell(sizeValue: string, flavourHandle: string): PricingGridRow {
    return gridMap.get(`${sizeValue}|${flavourHandle}`) ?? {
      sizeValue,
      flavourHandle,
      priceInCents: 0,
      shopifyVariantId: null,
    };
  }

  function updateCell(sizeValue: string, flavourHandle: string, patch: Partial<PricingGridRow>) {
    const key = `${sizeValue}|${flavourHandle}`;
    const existing = gridMap.get(key);
    const updated = existing
      ? { ...existing, ...patch }
      : { sizeValue, flavourHandle, priceInCents: 0, shopifyVariantId: null, ...patch };

    const newGrid = grid.filter((r) => !(r.sizeValue === sizeValue && r.flavourHandle === flavourHandle));
    newGrid.push(updated);
    onChange(newGrid);
  }

  function addSize() {
    const trimmed = newSize.trim();
    if (!trimmed || sizes.includes(trimmed)) return;
    // Add empty rows for all active flavours at this size
    const newRows = activeFlavours.map((f) => ({
      sizeValue: trimmed,
      flavourHandle: f.handle,
      priceInCents: 0,
      shopifyVariantId: null,
    }));
    onChange([...grid, ...newRows]);
    setNewSize('');
  }

  function removeSize(sizeValue: string) {
    onChange(grid.filter((r) => r.sizeValue !== sizeValue));
  }

  // Validation: find missing cells
  const missingCells = useMemo(() => {
    if (activeFlavours.length === 0 || sizes.length === 0) return [];
    return findMissingGridCells(
      grid,
      sizes,
      activeFlavours.map((f) => f.handle),
    );
  }, [grid, sizes, activeFlavours]);

  if (activeFlavours.length === 0) {
    return <p className="text-sm text-gray-500">Add active flavours first to configure the pricing grid.</p>;
  }

  return (
    <div className="space-y-3">
      {missingCells.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-warning-secondary border border-warning-200">
          <span className="text-xs text-warning-700">
            ⚠ {missingCells.length} cell(s) missing prices. All active (size, flavour) combinations need a price.
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left px-2 py-1.5 bg-gray-100 border border-gray-200 font-medium text-gray-600 sticky left-0">
                Flavour / Size →
              </th>
              {sizes.map((size) => (
                <th key={size} className="px-2 py-1.5 bg-gray-100 border border-gray-200 font-medium text-gray-600 min-w-[140px]">
                  <div className="flex items-center justify-between gap-1">
                    <span>{size}</span>
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label={`Remove size ${size}`}
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeFlavours.map((flavour) => (
              <tr key={flavour.handle}>
                <td className="px-2 py-1.5 border border-gray-200 bg-gray-50 font-medium text-gray-700 sticky left-0 whitespace-nowrap">
                  {flavour.label.en || flavour.handle}
                </td>
                {sizes.map((size) => {
                  const cell = getCell(size, flavour.handle);
                  const isMissing = cell.priceInCents === 0 && !gridMap.has(`${size}|${flavour.handle}`);
                  return (
                    <td
                      key={size}
                      className={`px-1 py-1 border border-gray-200 ${isMissing ? 'bg-yellow-50' : 'bg-white'}`}
                    >
                      <div className="space-y-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={cell.priceInCents ? (cell.priceInCents / 100).toFixed(2) : ''}
                          onChange={(e) => {
                            const dollars = parseFloat(e.target.value);
                            updateCell(size, flavour.handle, {
                              priceInCents: isNaN(dollars) ? 0 : Math.round(dollars * 100),
                            });
                          }}
                          placeholder="$0.00"
                          className="w-full px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                          aria-label={`Price for ${flavour.label.en || flavour.handle} at size ${size}`}
                        />
                        <input
                          type="text"
                          value={cell.shopifyVariantId ?? ''}
                          onChange={(e) =>
                            updateCell(size, flavour.handle, {
                              shopifyVariantId: e.target.value || null,
                            })
                          }
                          placeholder="Variant ID"
                          className="w-full px-1.5 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-500"
                          aria-label={`Shopify variant ID for ${flavour.label.en || flavour.handle} at size ${size}`}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
          placeholder="New size value"
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 w-40"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSize();
            }
          }}
        />
        <Button variant="secondary" size="sm" onClick={addSize} iconLeading={Plus}>
          Add Size
        </Button>
      </div>
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
  const [pricingGrid, setPricingGrid] = useState<PricingGridRow[]>([]);
  const [addonLinks, setAddonLinks] = useState<AddonLink[]>([]);

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
      setPricingGrid(data.pricingGrid ?? []);
      setAddonLinks(data.addonLinks ?? []);
    } catch {
      setError('Failed to load cake product');
    } finally {
      setLoading(false);
    }
  }

  const markDirty = useCallback(() => setIsDirty(true), []);

  // Derived visibility flags
  const hasProductType = cakeProductType !== '';
  const showFlavourConfig = hasProductType && cakeProductType !== 'wedding-cake-tasting';
  const showTierDetails = cakeProductType === 'cake-xxl' || cakeProductType === 'wedding-cake-tiered';
  const showAddonLinks = cakeProductType === 'cake-xxl' || cakeProductType === 'wedding-cake-tiered';

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
        cakeMaxFlavours: cakeProductType === 'croquembouche' ? cakeMaxFlavours : null,
        addonLinks: showAddonLinks ? addonLinks : undefined,
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
        setPricingGrid(updated.pricingGrid ?? []);
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

        {/* 6.2 — Flavour Config Editor */}
        {showFlavourConfig && (
          <SectionCard
            title="Flavour Configuration"
            description="Define available flavours for this product. Each flavour maps to a column in the pricing grid."
          >
            <FlavourConfigEditor
              flavours={flavourConfig}
              onChange={(f) => { setFlavourConfig(f); markDirty(); }}
            />
          </SectionCard>
        )}

        {/* 6.3 — Tier Detail Editor */}
        {showTierDetails && (
          <SectionCard
            title="Tier Details"
            description="Define layers and diameters for each size. Used for the visual tier diagram on the storefront."
          >
            <TierDetailEditor
              tiers={tierDetailConfig}
              onChange={(t) => { setTierDetailConfig(t); markDirty(); }}
            />
          </SectionCard>
        )}

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
            {cakeProductType === 'croquembouche' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Flavours</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cakeMaxFlavours}
                  onChange={(e) => {
                    setCakeMaxFlavours(parseInt(e.target.value) || 2);
                    markDirty();
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum number of flavours a customer can select for croquembouche.
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

          {/* Links */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Links</h2>
            </div>
            <div className="px-6 py-4 flex flex-col gap-3">
              {product.shopifyProductId && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      const res = await fetch(`/api/cake-products/${params.id}/sync-from-shopify`, { method: 'POST' });
                      const data = await res.json();
                      if (!res.ok) {
                        toast.error('Sync failed', data.error || 'Failed to sync from Shopify');
                        return;
                      }
                      toast.success('Synced from Shopify', `Detected ${data.summary.flavoursDetected} flavours, ${data.summary.sizesDetected} sizes, ${data.summary.gridCells} price cells`);
                      // Refresh the page data
                      await fetchProduct();
                      setIsDirty(false);
                    } catch {
                      toast.error('Sync failed', 'An unexpected error occurred');
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  isLoading={syncing}
                  isDisabled={syncing}
                >
                  {syncing ? 'Syncing…' : 'Sync from Shopify'}
                </Button>
              )}
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
