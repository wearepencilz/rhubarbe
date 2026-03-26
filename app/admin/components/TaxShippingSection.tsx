'use client';

import { useState } from 'react';
import { Input } from '@/app/admin/components/ui/input';
import { Select } from '@/app/admin/components/ui/select';
import { Button } from '@/app/admin/components/ui/button';

interface TaxShippingData {
  taxBehavior: string;
  taxThreshold: number;
  taxUnitCount: number;
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
  const [creatingTaxOption, setCreatingTaxOption] = useState(false);
  const [taxOptionStatus, setTaxOptionStatus] = useState<string | null>(null);

  async function handleCreateTaxOption() {
    if (!shopifyProductId) return;
    setCreatingTaxOption(true);
    setTaxOptionStatus(null);
    try {
      const res = await fetch('/api/shopify/products/create-tax-option', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopifyProductId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setTaxOptionStatus(result.error || 'Failed to create Tax option');
      } else if (result.alreadyExists) {
        setTaxOptionStatus('Tax option already exists on this product');
      } else {
        setTaxOptionStatus('Tax true/false variants created');
      }
    } catch {
      setTaxOptionStatus('Failed to create Tax option');
    } finally {
      setCreatingTaxOption(false);
    }
  }

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
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  The checkout will automatically use the Tax=false variant when the threshold is met.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCreateTaxOption}
                  isLoading={creatingTaxOption}
                  isDisabled={creatingTaxOption}
                >
                  Create Tax true/false variants
                </Button>
                {taxOptionStatus && (
                  <p className={`text-xs ${taxOptionStatus.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                    {taxOptionStatus}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Link a Shopify product first to set up tax variants.</p>
            )}
          </>
        )}

      </div>
    </div>
  );
}
