import { shopifyFetch } from './client';
import { getShopQuery } from './queries/shop';
import { getCollectionQuery, getCollectionsQuery } from './queries/collection';
import { getProductQuery } from './queries/product';
import { getProductsQuery } from './queries/products';
import type { Shop } from './types';
import type { ShopifyCollection, ShopifyProduct, EnrichedProduct, ProductAvailability } from './types';

export async function getShop(): Promise<Shop | null> {
  try {
    const res = await shopifyFetch<{ shop: Shop }>({
      query: getShopQuery,
      cache: 'no-store',
    });

    return res.data.shop;
  } catch (error) {
    console.error('Error fetching shop:', error);
    return null;
  }
}

export async function getCollection(handle: string): Promise<ShopifyCollection | null> {
  try {
    const res = await shopifyFetch<{ collection: ShopifyCollection }>({
      query: getCollectionQuery,
      variables: { handle },
      cache: 'no-store',
    });

    return res.data.collection;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export async function getCollections(): Promise<ShopifyCollection[]> {
  try {
    const res = await shopifyFetch<{ collections: { edges: Array<{ node: ShopifyCollection }> } }>({
      query: getCollectionsQuery,
      cache: 'no-store',
    });

    return res.data.collections.edges.map((edge) => edge.node);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  try {
    const res = await shopifyFetch<{ product: ShopifyProduct }>({
      query: getProductQuery,
      variables: { handle },
      cache: 'no-store',
    });

    return res.data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Helper function to enrich product with metadata
export function enrichProduct(product: ShopifyProduct): EnrichedProduct {
  const metafields = product.metafields || [];
  
  // Extract metafield values safely
  const isPreorder = metafields.find((m) => m?.key === 'is_preorder')?.value === 'true';
  const preorderDate = metafields.find((m) => m?.key === 'preorder_ship_date')?.value;
  const preorderDisclaimerEn = metafields.find((m) => m?.key === 'preorder_disclaimer_en')?.value;
  const preorderDisclaimerFr = metafields.find((m) => m?.key === 'preorder_disclaimer_fr')?.value;
  const isIceCream = metafields.find((m) => m?.key === 'is_ice_cream')?.value === 'true';
  const requiresScheduling = metafields.find((m) => m?.key === 'requires_scheduling')?.value === 'true';
  const leadTimeHours = metafields.find((m) => m?.key === 'lead_time_hours')?.value;

  // Determine availability
  let availability: ProductAvailability = 'in_stock';
  if (!product.availableForSale) {
    availability = 'sold_out';
  } else if (isPreorder) {
    availability = 'preorder';
  }

  // Flatten images and variants safely
  const images = product.images?.edges?.map((edge) => edge.node) || [];
  const variants = product.variants?.edges?.map((edge) => edge.node) || [];

  return {
    ...product,
    images,
    variants,
    availability,
    isPreorder,
    preorderDate,
    preorderDisclaimer: preorderDisclaimerEn, // Default to EN, will handle locale later
    isIceCream,
    requiresScheduling,
    leadTimeHours: leadTimeHours ? parseInt(leadTimeHours, 10) : undefined,
  };
}

export async function getProducts(): Promise<ShopifyProduct[]> {
  try {
    const res = await shopifyFetch<{ products: { edges: Array<{ node: ShopifyProduct }> } }>({
      query: getProductsQuery,
      cache: 'no-store',
    });

    return res.data.products.edges.map((edge) => edge.node);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}
