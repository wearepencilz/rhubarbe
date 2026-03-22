'use client';

import { useState } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import type { ProductVariant } from '@/types';

interface VariantEditorProps {
  variantType: 'none' | 'flavour' | 'size';
  variants: ProductVariant[];
  basePrice: string;
  onVariantTypeChange: (type: 'none' | 'flavour' | 'size') => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
}

const VARIANT_TYPE_OPTIONS = [
  { id: 'none', label: 'No variants' },
  { id: 'flavour', label: 'Flavour (saveurs)' },
  { id: 'size', label: 'Size (taille)' },
];

export default function VariantEditor({
  variantType,
  variants,
  basePrice,
  onVariantTypeChange,
  onVariantsChange,
}: VariantEditorProps) {
  const [newLabelEn, setNewLabelEn] = useState('');
  const [newLabelFr, setNewLabelFr] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Local price strings keyed by variant id so the input doesn't reformat while typing
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  function getPriceDisplay(variant: ProductVariant): string {
    if (priceInputs[variant.id] !== undefined) return priceInputs[variant.id];
    if (variant.price != null) return (variant.price / 100).toString();
    return '';
  }

  function handlePriceChange(id: string, raw: string) {
    setPriceInputs(prev => ({ ...prev, [id]: raw }));
  }

  function commitPrice(id: string) {
    const raw = priceInputs[id];
    if (raw === undefined) return;
    const parsed = parseFloat(raw);
    const cents = !raw || isNaN(parsed) ? undefined : Math.round(parsed * 100);
    onVariantsChange(variants.map(v => v.id === id ? { ...v, price: cents } : v));
    // Clear local override so it reads from the variant again
    setPriceInputs(prev => { const next = { ...prev }; delete next[id]; return next; });
  }

  function addVariant() {
    const label = newLabelFr.trim() || newLabelEn.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ]+/g, '-').replace(/-+$/, '');
    const parsed = parseFloat(newPrice);
    const priceCents = newPrice && !isNaN(parsed) ? Math.round(parsed * 100) : undefined;
    const variant: ProductVariant = {
      id,
      label: newLabelEn.trim() || label,
      labelFr: newLabelFr.trim() || undefined,
      price: priceCents,
      available: true,
      sortOrder: variants.length,
    };
    onVariantsChange([...variants, variant]);
    setNewLabelEn('');
    setNewLabelFr('');
    setNewPrice('');
  }

  function removeVariant(id: string) {
    onVariantsChange(variants.filter(v => v.id !== id).map((v, i) => ({ ...v, sortOrder: i })));
    setPriceInputs(prev => { const next = { ...prev }; delete next[id]; return next; });
  }

  function updateVariant(id: string, updates: Partial<ProductVariant>) {
    onVariantsChange(variants.map(v => v.id === id ? { ...v, ...updates } : v));
  }

  function moveVariant(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= variants.length) return;
    const reordered = [...variants];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    onVariantsChange(reordered.map((v, i) => ({ ...v, sortOrder: i })));
  }

  const placeholder = variantType === 'flavour' ? 'e.g. airelles' : 'e.g. 500ml';

  return (
    <div className="space-y-4">
      <Select
        label="Variant type"
        value={variantType}
        onChange={(v) => onVariantTypeChange(v as 'none' | 'flavour' | 'size')}
        options={VARIANT_TYPE_OPTIONS}
      />

      {variantType !== 'none' && (
        <>
          <p className="text-xs text-gray-500">
            {variantType === 'flavour'
              ? 'Each flavour becomes a Shopify variant customers can choose.'
              : 'Each size becomes a Shopify variant with optional price override.'}
          </p>

          {/* Existing variants */}
          {variants.length > 0 && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {/* Header */}
              <div className="px-4 py-2 bg-gray-50 grid grid-cols-[28px_1fr_1fr_80px_32px_28px] gap-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <span />
                <span>🇫🇷 Français</span>
                <span>🇬🇧 English</span>
                <span className="text-right">Prix ($)</span>
                <span className="text-center">Actif</span>
                <span />
              </div>

              {variants.map((variant, index) => (
                <div key={variant.id} className="px-4 py-3 grid grid-cols-[28px_1fr_1fr_80px_32px_28px] gap-3 items-center">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveVariant(index, -1)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                      aria-label="Move up"
                    >▲</button>
                    <button
                      type="button"
                      onClick={() => moveVariant(index, 1)}
                      disabled={index === variants.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none"
                      aria-label="Move down"
                    >▼</button>
                  </div>

                  {/* FR label (primary) */}
                  <div>
                    <input
                      type="text"
                      value={variant.labelFr || ''}
                      onChange={(e) => updateVariant(variant.id, { labelFr: e.target.value || undefined })}
                      placeholder={variant.label || placeholder}
                      className="w-full text-sm text-gray-900 border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* EN label */}
                  <div>
                    <input
                      type="text"
                      value={variant.label}
                      onChange={(e) => updateVariant(variant.id, { label: e.target.value })}
                      placeholder={variant.labelFr || placeholder}
                      className="w-full text-sm text-gray-600 border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Price override — plain text input, convert on blur */}
                  <div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getPriceDisplay(variant)}
                      onChange={(e) => handlePriceChange(variant.id, e.target.value)}
                      onBlur={() => commitPrice(variant.id)}
                      placeholder={basePrice || '—'}
                      className="w-full text-sm text-right border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tabular-nums"
                    />
                  </div>

                  {/* Available toggle */}
                  <div className="flex justify-center">
                    <Checkbox
                      isSelected={variant.available}
                      onChange={(v) => updateVariant(variant.id, { available: v })}
                      label=""
                    />
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove variant"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new variant */}
          <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4">
            <p className="text-xs font-medium text-gray-600 mb-3">Add variant</p>
            <div className="grid grid-cols-[1fr_1fr_80px] gap-3 items-end">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">🇫🇷 Français</label>
                <input
                  type="text"
                  value={newLabelFr}
                  onChange={(e) => setNewLabelFr(e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant())}
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">🇬🇧 English</label>
                <input
                  type="text"
                  value={newLabelEn}
                  onChange={(e) => setNewLabelEn(e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant())}
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Prix ($)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder={basePrice || '—'}
                  className="w-full text-sm text-right border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tabular-nums"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant())}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={addVariant}
                isDisabled={!newLabelFr.trim() && !newLabelEn.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {variants.length > 0 && (
            <p className="text-xs text-gray-400">
              {variants.length} variant{variants.length !== 1 ? 's' : ''} · 
              Price overrides base ({basePrice ? `$${basePrice}` : 'not set'}). Leave blank to use base.
            </p>
          )}
        </>
      )}
    </div>
  );
}
