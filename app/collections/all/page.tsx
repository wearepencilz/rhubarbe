import { getProducts, enrichProduct } from '@/lib/shopify';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse all products',
};

export default async function AllProductsPage() {
  const productsData = await getProducts();
  const products = productsData.map(enrichProduct);

  return (
    <main className="min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">All Products</h1>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="group"
              >
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].altText || product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}

                  {/* Availability Badge */}
                  <div className="absolute top-3 right-3">
                    {product.availability === 'preorder' && (
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        Pre-order
                      </span>
                    )}
                    {product.availability === 'sold_out' && (
                      <span className="px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded-full">
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-1 group-hover:text-gray-600 transition-colors">
                  {product.title}
                </h3>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold">
                    ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
                    {product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount && '+'}
                  </span>
                  {product.compareAtPriceRange && (
                    <span className="text-sm text-gray-500 line-through">
                      ${parseFloat(product.compareAtPriceRange.minVariantPrice.amount).toFixed(2)}
                    </span>
                  )}
                </div>

                {product.isPreorder && product.preorderDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    Ships: {new Date(product.preorderDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
