'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/app/admin/components/ui/input';
import { Select } from '@/app/admin/components/ui/select';
import { Button } from '@/app/admin/components/ui/button';

interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  taxable: boolean;
}

interface TaxShippingData {
  taxBehavior: string;
  taxThreshold: number;
  taxUnitCount: number;
  shopifyTaxExemptVariantId: string | null;
  pickupOnly: boolean;
}

interface Props {
  data: TaxShippingData;
  onChange: (data: Partial<TaxShippingData>) => void;
  shopifyProductId?: string;
}

const TAX_BEHAVIOR_OPTIONS = [
  { id: 'always_taxable', label: 'Always taxable' },
  { id: 'always_exempt', label: 'Always exempt' },
  { id: 'quantity_threshold', label: 'Quantity threshold' },
];

export default function TaxShippingSection({ data, onChange, shopifyProductId }: Props) {
  const isThreshold = data.taxBehavior === 'quantity_threshold';
  const [variants, setVariants] = useState<ShopifyVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [creatingExempt, setCreatingExempt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shopifyProductId || !isThreshold) {
      setVariants([]);
      return;
    }
    fetchVariants();
  }, [shopifyProductId, isThreshold]);

  async function fetchVariants() {
    if (!shopifyProductId) return;
    setLoadingVariants(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/shopify/products/${encodeURIComponent(shopifyProductId)}/variants`,
      );
      if (res.ok) {
        const json = await res.json();
        setVariants(json.variants || []);
      } else {
        setError('Failed to load variants');
      }
    } catch {
      setError('Failed to load variants');
    } finally {
      setLoadingVariants(false);
    }
  }

  async function handleCreateTaxOption() {
    if (!shopifyProductId) return;
    setCreatingExempt(true);
    setError(null);
    try {
      const res = await fetch('/api/shopify/products/create-tax-option', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopifyProductId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Failed to create Tax option');
        return;
      }
      await fetchVariants();
    } catch {
      setError('Failed to create Tax option');
    } finally {
      setCreatingExempt(false);
    }
  }

  const hasTaxFalseVariant = variants.some((v) => !v.taxable);

  const linkOptions = [
    { id: '', label: 'Not linked' },
    ...variants.map((v) => ({
      id: v.id,
      label: `${v.title} — $${v.price} ${v.taxable ? '(taxable)' : '(exempt)'}`,
    })),
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Tax &amp; shipping</h2>
        <p className="text-sm text-gray-500 mt-0.5">Quebec tax behavior and shipping rules.</p>
      </div>
      <div className="px-6 py-6 space-y-4">
        <Select
          label="Tax behavior"
          value={data.taxBehavior}
          onChange={(v) => onChange({ taxBehavior: v })}
          options={TAX_BEHAVIOR_OPTIONS}
        />

        {isThreshold && (
          <>
            <Input
              label="Tax threshold"
              type="number"
              value={String(data.taxThreshold)}
              onChange={(v) => onChange({ taxThreshold: parseInt(v, 10) || 6 })}
              helperText="Minimum units for tax exemption (default: 6)"
            />
            <Input
              label="Units per item"
              type="number"
              value={String(data.taxUnitCount)}
              onChange={(v) => onChange({ taxUnitCount: parseInt(v, 10) || 1 })}
              helperText="How many units does 1 cart item represent? A box of 6 = 6"
            />

            {shopifyProductId ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Tax-exempt variant
                </label>

                {loadingVariants ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400" />
                    <p className="text-xs text-gray-500">Loading variants…</p>
                  </div>
                ) : variants.length > 0 ? (
                  <>
                    <Select
                      label=""
                      value={data.shopifyTaxExemptVariantId || ''}
                      onChange={(v) => onChange({ shopifyTaxExemptVariantId: v || null })}
                      options={linkOptions}
                    />
                    {!hasTaxFalseVariant && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCreateTaxOption}
                        isLoading={creatingExempt}
                        isDisabled={creatingExempt}
                      >
                        Create Tax true/false option
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">No variants found</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCreateTaxOption}
                      isLoading={creatingExempt}
                      isDisabled={creatingExempt}
                    >
                      Create Tax true/false option
                    </Button>
                  </div>
                )}

                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax-exempt variant
                </label>
                <p className="text-sm text-gray-400">Link a Shopify product first</p>
              </div>
            )}
          </>
        )}

        <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={data.pickupOnly}
            onChange={(e) => onChange({ pickupOnly: e.target.checked })}
            className="rounded border-gray-300"
          />
          Pickup only
        </label>
      </div>
    </div>
  );
}
