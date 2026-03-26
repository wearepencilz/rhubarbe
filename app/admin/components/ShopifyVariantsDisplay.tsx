'use client';

import { useState, useEffect } from 'react';

interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string | null;
  taxable: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface Props {
  shopifyProductId: string;
}

export default function ShopifyVariantsDisplay({ shopifyProductId }: Props) {
  const [variants, setVariants] = useState<ShopifyVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/shopify/products/${encodeURIComponent(shopifyProductId)}/variants`,
        );
        if (res.ok) {
          const data = await res.json();
          setVariants(data.variants || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shopifyProductId]);

  // Show only "real" variants — filter out Tax=false duplicates
  const displayVariants = variants.filter((v) => {
    const taxOption = v.selectedOptions?.find((o) => o.name === 'Tax');
    return !taxOption || taxOption.value === 'true';
  });

  if (loading) {
    return (
      <div className="px-6 py-2 flex items-center gap-2 border-t border-gray-100">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400" />
        <p className="text-xs text-gray-500">Loading variants…</p>
      </div>
    );
  }

  if (displayVariants.length === 0) return null;

  return (
    <div className="border-t border-gray-100">
      <div className="px-6 py-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</p>
      </div>
      <div className="divide-y divide-gray-50">
        {displayVariants.map((v) => {
          const options = (v.selectedOptions || [])
            .filter((o) => o.name !== 'Tax' && o.name !== 'Title')
            .map((o) => o.value)
            .join(' / ');

          const price = parseFloat(v.price).toFixed(2);
          const compareAt = v.compareAtPrice ? parseFloat(v.compareAtPrice).toFixed(2) : null;

          return (
            <div key={v.id} className="px-6 py-1.5 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-700 truncate flex-1">{options || v.title}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-900">${price}</span>
                {compareAt && (
                  <span className="text-xs text-gray-400 line-through">${compareAt}</span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${v.taxable ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>
                  {v.taxable ? 'Tax' : 'No tax'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
