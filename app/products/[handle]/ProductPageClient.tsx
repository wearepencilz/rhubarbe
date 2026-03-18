'use client';

import { useT } from '@/lib/i18n/useT';
import { t } from '@/lib/i18n';
import AddToCartButton from '@/components/AddToCartButton';

export function ShopifyProductView({ product }: { product: any }) {
  const { T } = useT();

  return (
    <main className="min-h-screen pt-32 pb-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            {product.images.length > 0 ? (
              <>
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  <img src={product.images[0].url} alt={product.images[0].altText || product.title} className="w-full h-full object-cover" />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.slice(1, 5).map((image: any, i: number) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden">
                        <img src={image.url} alt={image.altText || product.title} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">{T.product.noImage}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
                {product.title}
              </h1>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
                </span>
                {product.compareAtPriceRange && (
                  <span className="text-lg text-gray-400 line-through" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    ${parseFloat(product.compareAtPriceRange.minVariantPrice.amount).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <AvailabilityBadge availability={product.availability} preorderDate={product.preorderDate} preorderDisclaimer={product.preorderDisclaimer} T={T} />

            {product.description && <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>}

            {product.options.length > 0 && product.options[0].name !== 'Title' && (
              <div className="space-y-4">
                {product.options.map((option: any) => (
                  <div key={option.name}>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      {option.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value: string) => (
                        <button key={value} className="px-4 py-2 border rounded hover:border-black transition-colors text-sm">
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <AddToCartButton variantId={product.variants[0].id} availability={product.availability} showQuantity />
          </div>
        </div>
      </div>
    </main>
  );
}

export function DbProductView({ product }: { product: any }) {
  const { T, locale } = useT();
  const displayName = t(product, 'title', locale as any) || product.name || '';
  const description = t(product, 'description', locale as any);

  return (
    <main className="min-h-screen pt-32 pb-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            {product.image ? (
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                <img src={product.image} alt={displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">{T.product.noImage}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
                {displayName}
              </h1>
              {product.price != null && product.price > 0 && (
                <span className="text-2xl" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                  ${(product.price / 100).toFixed(2)}
                </span>
              )}
            </div>

            {description && <p className="text-sm text-gray-600 leading-relaxed">{description}</p>}

            <div className="flex flex-wrap gap-4 text-xs text-gray-400 uppercase tracking-widest" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {product.serves && <span>{T.product.serves(product.serves)}</span>}
              {product.allergens?.length > 0 && <span>{product.allergens.join(', ')}</span>}
            </div>

            <p className="text-sm text-gray-500 italic">{T.product.orderComingSoon}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function AvailabilityBadge({ availability, preorderDate, preorderDisclaimer, T }: {
  availability: string;
  preorderDate?: string;
  preorderDisclaimer?: string;
  T: any;
}) {
  const { locale } = useT();

  if (availability === 'in_stock') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        {T.availability.inStock}
      </div>
    );
  }
  if (availability === 'preorder') {
    return (
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          {T.availability.preorder}
        </div>
        {preorderDate && (
          <p className="text-xs text-gray-500">
            {T.availability.ships(new Date(preorderDate).toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' }))}
          </p>
        )}
        {preorderDisclaimer && <p className="text-xs text-gray-500 italic">{preorderDisclaimer}</p>}
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
      {T.availability.soldOut}
    </div>
  );
}
