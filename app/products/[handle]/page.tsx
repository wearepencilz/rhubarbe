import { notFound } from 'next/navigation';
import { getProduct, enrichProduct } from '@/lib/shopify';
import { getProducts } from '@/lib/db.js';
import type { Metadata } from 'next';
import { ShopifyProductView, DbProductView } from './ProductPageClient';

interface ProductPageProps {
  params: {
    handle: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const shopifyProduct = await getProduct(params.handle);
  if (shopifyProduct) return { title: shopifyProduct.title, description: shopifyProduct.description };

  const allProducts = await getProducts().catch(() => []);
  const dbProduct = allProducts.find((p: any) => p.slug === params.handle || p.id === params.handle);
  if (dbProduct) return { title: dbProduct.name || dbProduct.title, description: dbProduct.description };

  return { title: 'Product Not Found' };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const productData = await getProduct(params.handle);

  if (productData) {
    const product = enrichProduct(productData);
    return <ShopifyProductView product={product} />;
  }

  const allProducts = await getProducts().catch(() => []);
  const dbProduct = allProducts.find((p: any) => p.slug === params.handle || p.id === params.handle);

  if (!dbProduct) notFound();

  return <DbProductView product={dbProduct} />;
}
