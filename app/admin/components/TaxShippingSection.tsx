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
        setTaxOptionStatus(result.error || 'Failed');
      } else if (result.alreadyExists) {
        setTaxOptionStatus('Already exists');
      } else {
        setTaxOptionStatus('Created');
      }
    } catch {
      setTaxOptionStatus('Failed');
    } finally {
      setCreatingTaxOption(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Tax rules</h2>
      </div>
      <div className="px-6 py-4 space-y-3">
        <Select
          label="Behavior"
          value={data.taxBehavior}
          onChange={(v) => onChange({ taxBehavior: v })}
          options={TAX_BEHAVIOR_OPTIONS}
        />

        {isThreshold && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Threshold"
                type="number"
                value={String(data.taxThreshold)}
                onChange={(v) => onChange({ taxThreshold: parseInt(v, 10) || 6 })}
              />
              <Input
                label="Units/item"
                type="number"
                value={String(data.taxUnitCount)}
                onChange={(v) => onChange({ taxUnitCount: parseInt(v, 10) || 1 })}
              />
            </div>
            {shopifyProductId && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCreateTaxOption}
                  isLoading={creatingTaxOption}
                  isDisabled={creatingTaxOption}
                >
                  Create tax variants
                </Button>
                {taxOptionStatus && (
                  <span className={`text-xs ${taxOptionStatus === 'Failed' ? 'text-red-600' : 'text-green-600'}`}>
                    {taxOptionStatus}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
