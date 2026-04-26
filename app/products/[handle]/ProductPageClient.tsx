'use client';

import { useState, useMemo } from 'react';
import { useT } from '@/lib/i18n/useT';
import { t } from '@/lib/i18n';
import AddToCartButton from '@/components/AddToCartButton';
import ProductAvailabilityDisplay from '@/components/ProductAvailabilityDisplay';

export function ShopifyProductView({ product }: { product: any }) {
  const { T } = useT();

  // Build option state: { "Saveur": "airelles", "Taille": "500ml" }
  const hasOptions = product.options.length > 0 && product.options[0].name !== 'Title';
  const initialSelections: Record<string, string> = {};
  if (hasOptions) {
    for (const option of product.options) {
      initialSelections[option.name] = option.values[0];
    }
  }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialSelections);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Find the matching variant based on selected options
  const selectedVariant = useMemo(() => {
    if (!hasOptions) return product.variants[0];
    return product.variants.find((variant: any) =>
      variant.selectedOptions.every(
        (opt: any) => selectedOptions[opt.name] === opt.value
      )
    ) || product.variants[0];
  }, [selectedOptions, product.variants, hasOptions]);

  const hasMultiplePrices = product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const showPricePlus = hasMultiplePrices && !selectedVariant?.price?.amount;

  const displayPrice = selectedVariant?.price?.amount
    ? parseFloat(selectedVariant.price.amount).toFixed(2)
    : parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);

  const comparePrice = selectedVariant?.compareAtPrice?.amount
    ? parseFloat(selectedVariant.compareAtPrice.amount).toFixed(2)
    : product.compareAtPriceRange
      ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount).toFixed(2)
      : null;

  return (
    <main className="min-h-screen pt-20 pb-16 px-4 md:px-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-3">
            {product.images.length > 0 ? (
              <>
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  <img src={product.images[selectedImageIndex].url} alt={product.images[selectedImageIndex].altText || product.title} className="w-full h-full object-cover" />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={`aspect-square bg-gray-100 rounded overflow-hidden ring-2 transition-all ${
                          i === selectedImageIndex
                            ? 'ring-black'
                            : 'ring-transparent hover:ring-gray-300'
                        }`}
                      >
                        <img src={image.url} alt={image.altText || product.title} className="w-full h-full object-cover" />
                      </button>
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
                  ${displayPrice}{showPricePlus && '+'}
                </span>
                {comparePrice && parseFloat(comparePrice) > parseFloat(displayPrice) && (
                  <span className="text-lg text-gray-400 line-through" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    ${comparePrice}
                  </span>
                )}
              </div>
            </div>

            <AvailabilityBadge availability={product.availability} preorderDate={product.preorderDate} preorderDisclaimer={product.preorderDisclaimer} T={T} />

            {product.description && <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>}

            {hasOptions && (
              <div className="space-y-4">
                {product.options.map((option: any) => (
                  <div key={option.name}>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                      {option.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value: string) => {
                        const isSelected = selectedOptions[option.name] === value;
                        // Check if this option value leads to an available variant
                        const testOptions: Record<string, string> = { ...selectedOptions, [option.name]: value };
                        const matchingVariant = product.variants.find((v: any) =>
                          v.selectedOptions.every((opt: any) => testOptions[opt.name] === opt.value)
                        );
                        const isAvailable = matchingVariant?.availableForSale !== false;

                        return (
                          <button
                            key={value}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: value }))}
                            disabled={!isAvailable}
                            className={`px-4 py-2 border rounded transition-colors text-sm ${
                              isSelected
                                ? 'border-black bg-black text-white'
                                : isAvailable
                                  ? 'border-gray-300 hover:border-black'
                                  : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                            }`}
                            aria-pressed={isSelected}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <AddToCartButton
              variantId={selectedVariant?.id || product.variants[0]?.id}
              availability={
                selectedVariant?.availableForSale === false
                  ? 'sold_out'
                  : product.availability
              }
              showQuantity
            />
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
    <main className="min-h-screen pt-20 pb-16 px-4 md:px-8">
      <div className="max-w-[1600px] mx-auto">
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
            
            {product.id && product.availabilityMode && product.availabilityMode !== 'always_available' && (
              <ProductAvailabilityDisplay productId={product.id} />
            )}
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
