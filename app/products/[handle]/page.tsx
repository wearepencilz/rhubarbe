import { notFound } from 'next/navigation';
import { getProduct, enrichProduct } from '@/lib/shopify';
import AddToCartButton from '@/components/AddToCartButton';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: {
    handle: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.handle);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.title,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const productData = await getProduct(params.handle);

  if (!productData) {
    notFound();
  }

  const product = enrichProduct(productData);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {product.images.length > 0 ? (
              <>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].altText || product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {product.images.slice(1, 5).map((image, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.altText || `${product.title} ${index + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">
                  ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
                </span>
                {product.compareAtPriceRange && (
                  <span className="text-xl text-gray-500 line-through">
                    ${parseFloat(product.compareAtPriceRange.minVariantPrice.amount).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Availability Status */}
            <div>
              {product.availability === 'in_stock' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  In Stock
                </div>
              )}
              {product.availability === 'preorder' && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Pre-order
                  </div>
                  {product.preorderDate && (
                    <p className="text-sm text-gray-600">
                      Expected to ship: {new Date(product.preorderDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  )}
                  {product.preorderDisclaimer && (
                    <p className="text-sm text-gray-600 italic">{product.preorderDisclaimer}</p>
                  )}
                </div>
              )}
              {product.availability === 'sold_out' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-full">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Sold Out
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Variant Selection (if applicable) */}
            {product.options.length > 0 && product.options[0].name !== 'Title' && (
              <div className="space-y-4">
                {product.options.map((option) => (
                  <div key={option.name}>
                    <label className="block text-sm font-medium mb-2">{option.name}</label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => (
                        <button
                          key={value}
                          className="px-4 py-2 border rounded-lg hover:border-black transition-colors"
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add to Cart Button */}
            <AddToCartButton
              variantId={product.variants[0].id}
              availability={product.availability}
            />

            {/* Product Details */}
            {(product.productType || product.tags.length > 0) && (
              <div className="pt-6 border-t space-y-2">
                {product.productType && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span> {product.productType}
                  </p>
                )}
                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
