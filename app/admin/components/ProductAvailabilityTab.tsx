'use client';

import { Input } from '@/app/admin/components/ui/input';

interface AvailabilityData {
  pickupOnly: boolean;
  defaultMinQuantity: number;
  defaultQuantityStep: number;
  defaultMaxQuantity: number | null;
}

interface Props {
  productId: string;
  data: AvailabilityData;
  onChange: (data: Partial<AvailabilityData>) => void;
}

export default function ProductAvailabilityTab({ productId, data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={data.pickupOnly}
            onChange={(e) => onChange({ pickupOnly: e.target.checked })}
            className="rounded border-gray-300"
          />
          Pickup only
        </label>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Order rules</h3>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Min qty"
            type="number"
            value={String(data.defaultMinQuantity)}
            onChange={(v) => onChange({ defaultMinQuantity: parseInt(v, 10) || 1 })}
          />
          <Input
            label="Step"
            type="number"
            value={String(data.defaultQuantityStep)}
            onChange={(v) => onChange({ defaultQuantityStep: parseInt(v, 10) || 1 })}
          />
          <Input
            label="Max qty"
            type="number"
            value={data.defaultMaxQuantity != null ? String(data.defaultMaxQuantity) : ''}
            onChange={(v) => onChange({ defaultMaxQuantity: v ? parseInt(v, 10) : null })}
            placeholder="—"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Per-menu overrides can be set in the Menu editor.</p>
      </div>
    </div>
  );
}
