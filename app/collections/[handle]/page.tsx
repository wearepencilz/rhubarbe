import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCollection, enrichProduct } from '@/lib/shopify';
import type { Metadata } from 'next';

interface CollectionPageProps {
  params: {
    handle: string;
  };
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const collection = await getCollection(params.handle);

  if (!collection) {
    return {
      title: 'Collection Not Found',
    };
  }

  return {
    title: collection.title,
    description: collection.description,
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const collection = await getCollection(params.handle);

  if (!collection) {
    notFound();
  }

  const products = collection.products.edges.map((edge) => enrichProduct(edge.node));

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Collection Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{collection.title}</h1>
          {collection.description && (
            <p className="text-lg text-gray-600">{collection.description}</p>
          )}
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                {product.images[0] && (
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].altText || product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    {/* Availability Badge */}
                    {product.availability === 'preorder' && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Pre-order
                      </div>
                    )}
                    {product.availability === 'sold_out' && (
                      <div className="absolute top-2 right-2 bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Sold Out
                      </div>
                    )}
                  </div>
                )}

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">
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
                    <p className="text-sm text-blue-600 mt-2">
                      Ships {new Date(product.preorderDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found in this collection.</p>
          </div>
        )}
      </div>
    </main>
  );
}
