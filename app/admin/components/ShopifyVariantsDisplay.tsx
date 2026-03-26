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
        // Silently fail — informational only
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Shopify variants</h2>
          <p className="text-sm text-gray-500 mt-0.5">Synced from Shopify. Manage in Shopify Admin.</p>
        </div>
        <div className="px-6 py-4 flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400" />
          <p className="text-xs text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (displayVariants.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Shopify variants</h2>
        <p className="text-sm text-gray-500 mt-0.5">Synced from Shopify. Manage in Shopify Admin.</p>
      </div>
      <div className="divide-y divide-gray-100">
        {displayVariants.map((v) => {
          const options = (v.selectedOptions || [])
            .filter((o) => o.name !== 'Tax' && o.name !== 'Title')
            .map((o) => o.value)
            .join(' / ');

          const price = parseFloat(v.price).toFixed(2);
          const compareAt = v.compareAtPrice ? parseFloat(v.compareAtPrice).toFixed(2) : null;

          return (
            <div key={v.id} className="px-6 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 truncate">{options || v.title}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${price}</p>
                  {compareAt && (
                    <p className="text-xs text-gray-400 line-through">${compareAt}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${v.taxable ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>
                  {v.taxable ? 'Taxable' : 'Exempt'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
