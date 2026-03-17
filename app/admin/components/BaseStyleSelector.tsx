'use client';

import type { BaseStyle } from '@/types';

interface BaseStyleSelectorProps {
  value: BaseStyle;
  onChange: (value: BaseStyle) => void;
}

const baseStyles: { value: BaseStyle; label: string; description: string }[] = [
  { value: 'dairy', label: 'Dairy', description: 'Milk or cream base' },
  { value: 'non-dairy', label: 'Non-Dairy', description: 'Alternative milk base' },
  { value: 'fruit', label: 'Fruit', description: 'Fruit-based sorbet' },
  { value: 'cheese', label: 'Cheese', description: 'Cheese-based gelato' },
  { value: 'other', label: 'Other', description: 'Unique or experimental base' }
];

export default function BaseStyleSelector({ value, onChange }: BaseStyleSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Base Style *
      </label>
      
      <div className="space-y-2">
        {baseStyles.map((style) => (
          <label
            key={style.value}
            className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="radio"
              name="baseStyle"
              value={style.value}
              checked={value === style.value}
              onChange={(e) => onChange(e.target.value as BaseStyle)}
              className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">{style.label}</div>
              <div className="text-xs text-gray-500">{style.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
