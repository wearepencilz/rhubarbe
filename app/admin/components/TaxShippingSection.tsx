'use client';

import { Input } from '@/app/admin/components/ui/input';
import { Select } from '@/app/admin/components/ui/select';

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
}

const TAX_BEHAVIOR_OPTIONS = [
  { id: 'always_taxable', label: 'Always taxable' },
  { id: 'always_exempt', label: 'Always exempt' },
  { id: 'quantity_threshold', label: 'Quantity threshold' },
];

export default function TaxShippingSection({ data, onChange }: Props) {
  const isThreshold = data.taxBehavior === 'quantity_threshold';

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax-exempt variant</label>
              {data.shopifyTaxExemptVariantId ? (
                <p className="text-sm text-gray-900 font-mono">{data.shopifyTaxExemptVariantId}</p>
              ) : (
                <p className="text-sm text-gray-400">Not linked</p>
              )}
            </div>
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
