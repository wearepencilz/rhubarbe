'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/lib/i18n/useT';
import type { DietaryFlag } from '@/types';

interface Props {
  availableFlags: DietaryFlag[];
  productCounts?: Partial<Record<DietaryFlag, number>>;
  className?: string;
}

const dietaryIcons: Partial<Record<DietaryFlag, string>> = {
  vegan: '🌱',
  vegetarian: '🥬',
  'gluten-free': '🌾',
  'dairy-free': '🥛',
  'nut-free': '🌰',
};

export default function DietaryFilter({ availableFlags, productCounts = {}, className = '' }: Props) {
  const { T } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFlags, setSelectedFlags] = useState<Set<DietaryFlag>>(new Set());

  useEffect(() => {
    const dietary = searchParams?.get('dietary');
    if (dietary) setSelectedFlags(new Set(dietary.split(',') as DietaryFlag[]));
  }, [searchParams]);

  const handleToggle = (flag: DietaryFlag) => {
    const newSelected = new Set(selectedFlags);
    if (newSelected.has(flag)) newSelected.delete(flag);
    else newSelected.add(flag);
    setSelectedFlags(newSelected);
    updateURL(newSelected);
  };

  const handleClearAll = () => { setSelectedFlags(new Set()); updateURL(new Set()); };

  const updateURL = (flags: Set<DietaryFlag>) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (flags.size > 0) params.set('dietary', Array.from(flags).join(','));
    else params.delete('dietary');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  if (availableFlags.length === 0) return null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{T.dietary.title}</h3>
        {selectedFlags.size > 0 && (
          <button onClick={handleClearAll} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            {T.dietary.clearAll}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {availableFlags.map((flag) => {
          const isSelected = selectedFlags.has(flag);
          const count = productCounts[flag] || 0;
          const label = (T.dietary as any)[flag] ?? flag;
          return (
            <label key={flag} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isSelected} onChange={() => handleToggle(flag)} className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                <span className="text-sm" aria-hidden="true">{dietaryIcons[flag] || '🏷️'}</span>
                <span className="text-sm font-medium text-gray-900">{label}</span>
              </div>
              {count > 0 && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>}
            </label>
          );
        })}
      </div>
      {selectedFlags.size > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">{T.dietary.showing(selectedFlags.size)}</p>
        </div>
      )}
    </div>
  );
}
