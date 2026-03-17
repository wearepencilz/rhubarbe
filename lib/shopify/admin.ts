// Shopify Admin API client for metafield management

const SHOPIFY_ADMIN_API_VERSION = '2024-01';

interface ShopifyAdminConfig {
  shop: string;
  accessToken: string;
}

// Cache for OAuth access token
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getOAuthAccessToken(): Promise<string> {
  const shop = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!shop || !clientId || !clientSecret) {
    throw new Error('Missing OAuth credentials: NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, and SHOPIFY_CLIENT_SECRET are required');
  }

  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  // Exchange client credentials for access token
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth token exchange failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error('No access token in OAuth response');
  }

  cachedAccessToken = data.access_token;
  // Tokens typically expire in 24 hours, cache for 23 hours to be safe
  tokenExpiresAt = Date.now() + (23 * 60 * 60 * 1000);
  
  if (!cachedAccessToken) {
    throw new Error('Failed to cache access token');
  }
  
  return cachedAccessToken;
}

async function getConfig(): Promise<ShopifyAdminConfig> {
  const shop = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  
  if (!shop) {
    throw new Error('Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN environment variable');
  }

  // Try direct access token first (for custom apps)
  let accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  let authMethod = 'none';
  
  // If no direct token, try OAuth flow (for OAuth apps)
  if (!accessToken) {
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    
    if (clientId && clientSecret) {
      authMethod = 'oauth';
      accessToken = await getOAuthAccessToken();
    } else {
      throw new Error(
        'Missing Shopify credentials. Provide either:\n' +
        '1. SHOPIFY_ADMIN_ACCESS_TOKEN (for custom apps), or\n' +
        '2. SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (for OAuth apps)'
      );
    }
  } else {
    authMethod = 'direct_token';
  }
  
  // Log authentication method (first 10 chars of token for debugging)
  console.log(`[Shopify Auth] Using ${authMethod}, token prefix: ${accessToken.substring(0, 10)}...`);
  
  return { shop, accessToken };
}

async function shopifyAdminFetch(query: string, variables?: any) {
  const { shop, accessToken } = await getConfig();
  
  const url = `https://${shop}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify Admin API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  
  return data.data;
}

export interface ProductMetafieldInput {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export async function updateProductMetafields(
  productId: string,
  metafields: ProductMetafieldInput[]
) {
  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          metafields(first: 10) {
            edges {
              node {
                namespace
                key
                value
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    input: {
      id: productId,
      metafields: metafields.map(mf => ({
        namespace: mf.namespace,
        key: mf.key,
        value: mf.value,
        type: mf.type
      }))
    }
  };
  
  const data = await shopifyAdminFetch(mutation, variables);
  
  if (data.productUpdate.userErrors.length > 0) {
    throw new Error(
      `Shopify user errors: ${JSON.stringify(data.productUpdate.userErrors)}`
    );
  }
  
  return data.productUpdate.product;
}

export async function searchProducts(query: string, limit: number = 10) {
  const searchQuery = `
    query searchProducts($query: String!, $first: Int!) {
      products(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
        edges {
          node {
            id
            handle
            title
            featuredImage {
              url
              altText
            }
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;
  
  // If query is wildcard or empty, search for all products (any status)
  // Use -status:archived to exclude only archived products
  const searchTerm = query === '*' || !query ? '-status:archived' : query;
  
  const variables = { query: searchTerm, first: limit };
  const data = await shopifyAdminFetch(searchQuery, variables);
  
  return data.products.edges.map((edge: any) => edge.node);
}

export async function getProduct(productId: string) {
  const query = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        handle
        title
        featuredImage {
          url
          altText
        }
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        metafields(first: 20) {
          edges {
            node {
              namespace
              key
              value
              type
            }
          }
        }
      }
    }
  `;
  
  const variables = { id: productId };
  const data = await shopifyAdminFetch(query, variables);
  
  return data.product;
}


export interface CreateProductInput {
  title: string;
  descriptionHtml?: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  status?: string;
  variants?: {
    price: string;
    sku?: string;
    inventoryQuantities?: { availableQuantity: number; locationId: string }[];
  }[];
  images?: { src: string; altText?: string }[];
  metafields?: { namespace: string; key: string; value: string; type: string }[];
}

export async function createProduct(input: CreateProductInput) {
  // Create product without variants first
  const createMutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          handle
          title
          status
          featuredImage {
            url
            altText
          }
          variants(first: 1) {
            edges {
              node {
                id
                sku
                price
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const createVariables = {
    input: {
      title: input.title,
      descriptionHtml: input.descriptionHtml,
      productType: input.productType,
      vendor: input.vendor,
      tags: input.tags,
      status: input.status || 'DRAFT',
      ...(input.images && input.images.length > 0 ? { images: input.images } : {}),
      ...(input.metafields && input.metafields.length > 0 ? { metafields: input.metafields } : {})
    }
  };

  const createData = await shopifyAdminFetch(createMutation, createVariables);

  if (createData.productCreate.userErrors.length > 0) {
    throw new Error(
      `Shopify user errors: ${JSON.stringify(createData.productCreate.userErrors)}`
    );
  }

  const product = createData.productCreate.product;

  // Update the default variant with price only (SKU not supported in bulk update)
  if (input.variants && input.variants.length > 0 && product.variants.edges.length > 0) {
    const variantId = product.variants.edges[0].node.id;
    const variantInput = input.variants[0];

    const updateVariantMutation = `
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          product {
            id
          }
          productVariants {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const updateVariables = {
      productId: product.id,
      variants: [{
        id: variantId,
        price: variantInput.price
      }]
    };

    const updateData = await shopifyAdminFetch(updateVariantMutation, updateVariables);

    if (updateData.productVariantsBulkUpdate.userErrors.length > 0) {
      console.warn('Failed to update variant price:', updateData.productVariantsBulkUpdate.userErrors);
      // Don't throw - product was created successfully
    }
  }

  // Fetch the complete product to return
  const finalProduct = await getProduct(product.id);

  return finalProduct;
}
