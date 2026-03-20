'use client';

import { Input } from '@/app/admin/components/ui/input';

interface AvailabilityData {
  onlineOrderable: boolean;
  pickupOnly: boolean;
  defaultMinQuantity: number;
  defaultQuantityStep: number;
  defaultMaxQuantity: number | null;
  defaultPickupRequired: boolean;
}

interface Props {
  productId: string;
  data: AvailabilityData;
  onChange: (data: Partial<AvailabilityData>) => void;
}

export default function ProductAvailabilityTab({ productId, data, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Selling Mode */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Selling Mode</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={data.onlineOrderable}
              onChange={(e) => onChange({ onlineOrderable: e.target.checked })}
              className="rounded border-gray-300"
            />
            Online orderable
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={data.pickupOnly}
              onChange={(e) => onChange({ pickupOnly: e.target.checked })}
              className="rounded border-gray-300"
            />
            Pickup only
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={data.defaultPickupRequired}
              onChange={(e) => onChange({ defaultPickupRequired: e.target.checked })}
              className="rounded border-gray-300"
            />
            Pickup required
          </label>
        </div>
      </div>

      {/* Order Rules */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Order Rules</h3>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Min Quantity"
            type="number"
            value={String(data.defaultMinQuantity)}
            onChange={(v) => onChange({ defaultMinQuantity: parseInt(v, 10) || 1 })}
          />
          <Input
            label="Quantity Step"
            type="number"
            value={String(data.defaultQuantityStep)}
            onChange={(v) => onChange({ defaultQuantityStep: parseInt(v, 10) || 1 })}
          />
          <Input
            label="Max Quantity"
            type="number"
            value={data.defaultMaxQuantity != null ? String(data.defaultMaxQuantity) : ''}
            onChange={(v) => onChange({ defaultMaxQuantity: v ? parseInt(v, 10) : null })}
            placeholder="No limit"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Products are made orderable by adding them to a Menu. Per-menu overrides can be set in the Menu editor.
      </p>
    </div>
  );
}
