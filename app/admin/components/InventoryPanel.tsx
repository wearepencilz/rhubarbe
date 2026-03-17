'use client';

import { parseDate } from '@internationalized/date';
import { DatePicker } from '@/app/admin/components/ui/date-picker/date-picker';
import { Checkbox } from '@/app/admin/components/ui/checkbox';

interface InventoryPanelProps {
  inventoryTracked: boolean;
  inventoryQuantity?: number;
  batchCode?: string;
  restockDate?: string;
  shelfLifeNotes?: string;
  onUpdate: (data: {
    inventoryTracked: boolean;
    inventoryQuantity?: number;
    batchCode?: string;
    restockDate?: string;
    shelfLifeNotes?: string;
  }) => void;
}

export default function InventoryPanel({
  inventoryTracked,
  inventoryQuantity,
  batchCode,
  restockDate,
  shelfLifeNotes,
  onUpdate,
}: InventoryPanelProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Management</h3>
      
      <div className="space-y-4">
        {/* Track Inventory Toggle */}
        <Checkbox
          isSelected={inventoryTracked}
          onChange={(v) => onUpdate({ inventoryTracked: v, inventoryQuantity, batchCode, restockDate, shelfLifeNotes })}
          label="Track inventory for this offering"
          hint="Enable for packaged products like pints. Disable for made-to-order items like soft serve."
        />

        {inventoryTracked && (
          <>
            {/* Inventory Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={inventoryQuantity || ''}
                onChange={(e) => onUpdate({
                  inventoryTracked,
                  inventoryQuantity: e.target.value ? parseInt(e.target.value) : undefined,
                  batchCode,
                  restockDate,
                  shelfLifeNotes,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Number of units currently in stock
              </p>
            </div>

            {/* Batch Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Code
              </label>
              <input
                type="text"
                value={batchCode || ''}
                onChange={(e) => onUpdate({
                  inventoryTracked,
                  inventoryQuantity,
                  batchCode: e.target.value,
                  restockDate,
                  shelfLifeNotes,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., BATCH-2024-001"
              />
              <p className="mt-1 text-xs text-gray-500">
                Internal batch identifier for tracking
              </p>
            </div>

            {/* Restock Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Restock Date
              </label>
              <DatePicker
                value={restockDate ? parseDate(restockDate) : null}
                onChange={(date) => onUpdate({
                  inventoryTracked,
                  inventoryQuantity,
                  batchCode,
                  restockDate: date ? date.toString() : undefined,
                  shelfLifeNotes,
                })}
              />
              <p className="mt-1 text-xs text-gray-500">
                When will this item be restocked?
              </p>
            </div>

            {/* Shelf Life Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shelf Life / Storage Notes
              </label>
              <textarea
                value={shelfLifeNotes || ''}
                onChange={(e) => onUpdate({
                  inventoryTracked,
                  inventoryQuantity,
                  batchCode,
                  restockDate,
                  shelfLifeNotes: e.target.value,
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Best within 3 months, store at -18°C"
              />
              <p className="mt-1 text-xs text-gray-500">
                Storage instructions and shelf life information
              </p>
            </div>

            {/* Stock Status Indicator */}
            <div className="p-3 bg-white border border-gray-300 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Stock Status:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  !inventoryQuantity || inventoryQuantity === 0
                    ? 'bg-red-100 text-red-800'
                    : inventoryQuantity < 10
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {!inventoryQuantity || inventoryQuantity === 0
                    ? 'Out of Stock'
                    : inventoryQuantity < 10
                    ? 'Low Stock'
                    : 'In Stock'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
