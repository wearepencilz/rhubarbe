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

export async function shopifyAdminFetch(query: string, variables?: any) {
  const { shop, accessToken } = await getConfig();
  
  const url = `https://${shop}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
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

export async function getProductVariantId(productId: string): Promise<string | null> {
  const query = `
    query getProductVariant($id: ID!) {
      product(id: $id) {
        variants(first: 1) {
          edges {
            node { id }
          }
        }
      }
    }
  `;
  const data = await shopifyAdminFetch(query, { id: productId });
  return data.product?.variants?.edges?.[0]?.node?.id ?? null;
}

export async function getProduct(productId: string) {
  const query = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        handle
        title
        status
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
        variants(first: 100) {
          edges {
            node {
              id
              title
              price
              sku
              selectedOptions {
                name
                value
              }
            }
          }
        }
        options {
          id
          name
          values
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

/**
 * Fetch inventory levels for multiple Shopify products in a single query.
 * Returns a map of shopifyProductId → total available quantity across all locations.
 */
export async function getInventoryLevels(productIds: string[]): Promise<Record<string, number | null>> {
  if (productIds.length === 0) return {};

  // Shopify Admin API supports up to 250 IDs per query
  const query = `
    query getInventory($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          totalInventory
          tracksInventory
          variants(first: 100) {
            edges {
              node {
                id
                inventoryQuantity
                inventoryPolicy
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyAdminFetch(query, { ids: productIds });
    const result: Record<string, number | null> = {};

    for (const node of (data.nodes || [])) {
      if (!node?.id) continue;
      // If the product doesn't track inventory, it's unlimited
      if (!node.tracksInventory) {
        result[node.id] = null; // null = unlimited
        continue;
      }
      result[node.id] = node.totalInventory ?? 0;
    }

    return result;
  } catch (err) {
    console.error('[Shopify] Failed to fetch inventory levels:', err instanceof Error ? err.message : err);
    return {};
  }
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
    optionValues?: { optionName: string; name: string }[];
    inventoryQuantities?: { availableQuantity: number; locationId: string }[];
  }[];
  options?: string[]; // Option names e.g. ["Saveur"] or ["Taille"]
  images?: { src: string; altText?: string }[];
  metafields?: { namespace: string; key: string; value: string; type: string }[];
}

export async function createProduct(input: CreateProductInput) {
  const hasMultipleVariants = input.variants && input.variants.length > 1 && input.options && input.options.length > 0;

  // Step 1: Create the product (Shopify auto-creates a default variant)
  const createMutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          handle
          title
          status
          featuredImage { url altText }
          variants(first: 1) {
            edges { node { id price } }
          }
        }
        userErrors { field message }
      }
    }
  `;

  const createData = await shopifyAdminFetch(createMutation, {
    input: {
      title: input.title,
      descriptionHtml: input.descriptionHtml,
      productType: input.productType,
      vendor: input.vendor,
      tags: input.tags,
      status: input.status || 'DRAFT',
      ...(input.metafields && input.metafields.length > 0 ? { metafields: input.metafields } : {}),
    }
  });

  if (createData.productCreate.userErrors.length > 0) {
    throw new Error(`Shopify create errors: ${JSON.stringify(createData.productCreate.userErrors)}`);
  }

  const product = createData.productCreate.product;

  // Add images via productCreateMedia
  if (input.images && input.images.length > 0) {
    const mediaData = await shopifyAdminFetch(`
      mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media { alt status }
          mediaUserErrors { field message }
        }
      }
    `, {
      productId: product.id,
      media: input.images.map(img => ({
        originalSource: img.src,
        alt: img.altText || '',
        mediaContentType: 'IMAGE',
      })),
    });
    if (mediaData.productCreateMedia.mediaUserErrors.length > 0) {
      console.warn('Failed to add product images:', mediaData.productCreateMedia.mediaUserErrors);
    }
  }

  if (hasMultipleVariants && input.variants && input.options) {
    // Step 2: Add options with all values using LEAVE_AS_IS
    // This adds the option definition without creating extra variants
    const optionData = await shopifyAdminFetch(`
      mutation productOptionsCreate(
        $productId: ID!,
        $options: [OptionCreateInput!]!,
        $variantStrategy: ProductOptionCreateVariantStrategy
      ) {
        productOptionsCreate(
          productId: $productId,
          options: $options,
          variantStrategy: $variantStrategy
        ) {
          product {
            id
            options { id name values }
            variants(first: 10) {
              edges { node { id title selectedOptions { name value } } }
            }
          }
          userErrors { field message }
        }
      }
    `, {
      productId: product.id,
      variantStrategy: 'LEAVE_AS_IS',
      options: input.options.map(optionName => ({
        name: optionName,
        values: input.variants!.map(v => {
          const ov = v.optionValues?.find(o => o.optionName === optionName);
          return { name: ov?.name || 'Default' };
        }),
      })),
    });

    if (optionData.productOptionsCreate.userErrors.length > 0) {
      console.warn('Failed to create options:', optionData.productOptionsCreate.userErrors);
    }

    // Step 3: Bulk-create all variants with REMOVE_STANDALONE_VARIANT
    // This replaces the auto-created default variant with our real variants
    const bulkCreateData = await shopifyAdminFetch(`
      mutation productVariantsBulkCreate(
        $productId: ID!,
        $variants: [ProductVariantsBulkInput!]!,
        $strategy: ProductVariantsBulkCreateStrategy
      ) {
        productVariantsBulkCreate(
          productId: $productId,
          variants: $variants,
          strategy: $strategy
        ) {
          productVariants {
            id
            title
            price
            selectedOptions { name value }
          }
          userErrors { field message }
        }
      }
    `, {
      productId: product.id,
      strategy: 'REMOVE_STANDALONE_VARIANT',
      variants: input.variants.map(v => ({
        price: v.price,
        optionValues: v.optionValues?.map(ov => ({
          optionName: ov.optionName,
          name: ov.name,
        })) || [],
      })),
    });

    if (bulkCreateData.productVariantsBulkCreate.userErrors.length > 0) {
      console.warn('Failed to bulk-create variants:', bulkCreateData.productVariantsBulkCreate.userErrors);
    }
  } else if (input.variants && input.variants.length > 0 && product.variants.edges.length > 0) {
    // Single variant: just update the default variant price
    const variantId = product.variants.edges[0].node.id;
    const variantInput = input.variants[0];

    const updateData = await shopifyAdminFetch(`
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id price }
          userErrors { field message }
        }
      }
    `, {
      productId: product.id,
      variants: [{ id: variantId, price: variantInput.price }],
    });

    if (updateData.productVariantsBulkUpdate.userErrors.length > 0) {
      console.warn('Failed to update variant price:', updateData.productVariantsBulkUpdate.userErrors);
    }
  }

  // Attempt to publish the product to the Storefront / Headless sales channel.
  // This requires `write_publications` scope — if missing, log a warning.
  await publishProductToStorefront(product.id);

  // Fetch the complete product to return
  const finalProduct = await getProduct(product.id);
  return finalProduct;
}

/**
 * Attempt to publish a product to all available sales channels.
 * Requires `write_publications` + `read_publications` scopes.
 * Fails silently if scopes are missing — the product must then be
 * published manually in Shopify Admin.
 */
export async function publishProductToStorefront(productId: string): Promise<boolean> {
  try {
    // Discover all available publications (Headless, Online Store, etc.)
    const pubData = await shopifyAdminFetch(`
      query {
        publications(first: 20) {
          edges {
            node {
              id
              name
              supportsFuturePublishing
            }
          }
        }
      }
    `);

    const publications = pubData?.publications?.edges?.map((e: any) => e.node) || [];
    // Publish to Headless channel (and any channel with "headless" or "storefront" in the name)
    const targets = publications.filter((p: any) =>
      /headless|storefront|hydrogen/i.test(p.name)
    );

    if (targets.length === 0) {
      // Fallback: try the app's own publication
      const appData = await shopifyAdminFetch(`
        query { app { installation { id publication { id name } } } }
      `);
      const appPub = appData?.app?.installation?.publication;
      if (appPub?.id) {
        targets.push(appPub);
      }
    }

    if (targets.length === 0) {
      console.warn('[Shopify] No Headless/Storefront publication found — product must be published manually.');
      return false;
    }

    // Publish to all matching channels
    const publishData = await shopifyAdminFetch(`
      mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          publishable { ... on Product { id title } }
          userErrors { field message }
        }
      }
    `, {
      id: productId,
      input: targets.map((t: any) => ({ publicationId: t.id })),
    });

    if (publishData.publishablePublish?.userErrors?.length > 0) {
      console.warn('[Shopify] Failed to publish product:', publishData.publishablePublish.userErrors);
      return false;
    }

    console.log(`[Shopify] Published product ${productId} to: ${targets.map((t: any) => t.name).join(', ')}`);
    return true;
  } catch (err) {
    // Expected to fail if scopes are missing — not a hard error
    console.warn('[Shopify] Auto-publish failed (likely missing write_publications scope). Product must be published manually.', err instanceof Error ? err.message : err);
    return false;
  }
}

export interface UpdateProductInput {
  shopifyProductId: string;
  title?: string;
  descriptionHtml?: string;
  status?: string;
  tags?: string[];
  price?: string;
  variants?: { id?: string; price: string; optionValues?: { optionName: string; name: string }[] }[];
  metafields?: { namespace: string; key: string; value: string; type: string }[];
}

export async function updateProduct(input: UpdateProductInput) {
  // Update product fields
  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          handle
          title
          status
          variants(first: 100) {
            edges {
              node {
                id
                price
                title
                selectedOptions {
                  name
                  value
                }
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

  const variables: any = {
    input: {
      id: input.shopifyProductId,
      ...(input.title && { title: input.title }),
      ...(input.descriptionHtml && { descriptionHtml: input.descriptionHtml }),
      ...(input.status && { status: input.status }),
      ...(input.tags && { tags: input.tags }),
      ...(input.metafields && input.metafields.length > 0 && { metafields: input.metafields }),
    }
  };

  const data = await shopifyAdminFetch(mutation, variables);

  if (data.productUpdate.userErrors.length > 0) {
    throw new Error(
      `Shopify update errors: ${JSON.stringify(data.productUpdate.userErrors)}`
    );
  }

  const product = data.productUpdate.product;

  // Update variant prices
  if (input.variants && input.variants.length > 0 && product.variants.edges.length > 0) {
    // Match input variants to existing Shopify variants by ID or position
    const variantUpdates = input.variants
      .filter(v => v.id) // Only update variants that have a Shopify ID
      .map(v => ({ id: v.id!, price: v.price }));

    if (variantUpdates.length > 0) {
      const variantMutation = `
        mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants {
              id
              price
              title
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variantData = await shopifyAdminFetch(variantMutation, {
        productId: product.id,
        variants: variantUpdates,
      });

      if (variantData.productVariantsBulkUpdate.userErrors.length > 0) {
        console.warn('Failed to update variant prices:', variantData.productVariantsBulkUpdate.userErrors);
      }
    }
  } else if (input.price && product.variants.edges.length > 0) {
    // Fallback: single variant price update
    const variantId = product.variants.edges[0].node.id;

    const variantMutation = `
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
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

    const variantData = await shopifyAdminFetch(variantMutation, {
      productId: product.id,
      variants: [{ id: variantId, price: input.price }],
    });

    if (variantData.productVariantsBulkUpdate.userErrors.length > 0) {
      console.warn('Failed to update variant price:', variantData.productVariantsBulkUpdate.userErrors);
    }
  }

  return product;
}

export interface DraftOrderInput {
  lineItems: Array<{ variantId: string; quantity: number }>;
  note?: string;
  customAttributes?: Array<{ key: string; value: string }>;
}

export async function createDraftOrder(input: DraftOrderInput) {
  const mutation = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          invoiceUrl
          name
          totalPrice
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
      lineItems: input.lineItems,
      note: input.note,
      customAttributes: input.customAttributes,
    },
  };

  const data = await shopifyAdminFetch(mutation, variables);

  if (data.draftOrderCreate.userErrors.length > 0) {
    throw new Error(
      `Draft order errors: ${JSON.stringify(data.draftOrderCreate.userErrors)}`
    );
  }

  return data.draftOrderCreate.draftOrder;
}


/**
 * Fulfill a Shopify order by its legacy (numeric) order ID.
 * Uses the fulfillmentOrder → fulfillmentCreateV2 flow.
 * Returns true if fulfilled, false if already fulfilled or no fulfillment orders found.
 */
export async function fulfillShopifyOrder(shopifyOrderId: string): Promise<boolean> {
  // Convert legacy ID to GID if needed
  const gid = shopifyOrderId.startsWith('gid://')
    ? shopifyOrderId
    : `gid://shopify/Order/${shopifyOrderId}`;

  // Step 1: Get fulfillment orders for this order
  const data = await shopifyAdminFetch(
    `query getFulfillmentOrders($id: ID!) {
      order(id: $id) {
        fulfillmentOrders(first: 10) {
          edges {
            node {
              id
              status
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    remainingQuantity
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { id: gid },
  );

  if (!data.order) {
    console.warn(`[Shopify Fulfill] Order not found: ${gid}`);
    return false;
  }

  const fulfillmentOrders = data.order.fulfillmentOrders.edges
    .map((e: any) => e.node)
    .filter((fo: any) => fo.status === 'OPEN' || fo.status === 'IN_PROGRESS');

  if (fulfillmentOrders.length === 0) {
    console.log(`[Shopify Fulfill] No open fulfillment orders for ${gid} — may already be fulfilled`);
    return false;
  }

  // Step 2: Create fulfillment for each open fulfillment order
  for (const fo of fulfillmentOrders) {
    const lineItems = fo.lineItems.edges
      .map((e: any) => e.node)
      .filter((li: any) => li.remainingQuantity > 0)
      .map((li: any) => ({ fulfillmentOrderLineItemId: li.id, quantity: li.remainingQuantity }));

    if (lineItems.length === 0) continue;

    const result = await shopifyAdminFetch(
      `mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
        fulfillmentCreateV2(fulfillment: $fulfillment) {
          fulfillment { id status }
          userErrors { field message }
        }
      }`,
      {
        fulfillment: {
          lineItemsByFulfillmentOrder: [
            {
              fulfillmentOrderId: fo.id,
              fulfillmentOrderLineItems: lineItems,
            },
          ],
          notifyCustomer: false,
        },
      },
    );

    if (result.fulfillmentCreateV2.userErrors.length > 0) {
      console.error(`[Shopify Fulfill] Errors:`, result.fulfillmentCreateV2.userErrors);
      return false;
    }
  }

  console.log(`[Shopify Fulfill] Successfully fulfilled ${gid}`);
  return true;
}
