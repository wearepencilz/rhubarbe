// Shopify Types
export interface Shop {
  name: string;
  description: string;
  primaryDomain: {
    url: string;
  };
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  compareAtPriceRange?: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: ShopifyImage;
    }>;
  };
  variants: {
    edges: Array<{
      node: ShopifyVariant;
    }>;
  };
  options: ShopifyOption[];
  tags: string[];
  productType: string;
  metafields: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable?: number;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  };
  image?: ShopifyImage;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

export interface ShopifyImage {
  url: string;
  altText?: string;
  width: number;
  height: number;
}

export interface ShopifyOption {
  name: string;
  values: string[];
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image?: ShopifyImage;
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
  };
}

export type ProductAvailability = 'in_stock' | 'preorder' | 'sold_out';

export interface EnrichedProduct extends Omit<ShopifyProduct, 'images' | 'variants'> {
  availability: ProductAvailability;
  isPreorder: boolean;
  preorderDate?: string;
  preorderDisclaimer?: string;
  isIceCream: boolean;
  requiresScheduling: boolean;
  leadTimeHours?: number;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
}
