'use client';

import { useState, useEffect } from 'react';

interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
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
        // Silently fail — variants display is informational
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shopifyProductId]);

  // Filter out Tax-related variants for display — show only "real" product variants
  const displayVariants = variants.filter((v) => {
    const taxOption = v.selectedOptions?.find((o) => o.name === 'Tax');
    // Show variants where Tax is "true" or there's no Tax option at all
    return !taxOption || taxOption.value === 'true';
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Shopify variants</h2>
          <p className="text-sm text-gray-500 mt-0.5">Synced from Shopify. Manage variants in Shopify Admin.</p>
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
        <p className="text-sm text-gray-500 mt-0.5">Synced from Shopify. Manage variants in Shopify Admin.</p>
      </div>
      <div className="divide-y divide-gray-100">
        {displayVariants.map((v) => {
          const options = (v.selectedOptions || [])
            .filter((o) => o.name !== 'Tax' && o.name !== 'Title')
            .map((o) => o.value)
            .join(' / ');

          return (
            <div key={v.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">{options || v.title}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  ${parseFloat(v.price).toFixed(2)}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${v.taxable ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>
                {v.taxable ? 'Taxable' : 'Exempt'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
