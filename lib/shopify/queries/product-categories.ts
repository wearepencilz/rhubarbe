/**
 * Fetch Shopify collections and product-to-collection mappings.
 *
 * Uses the Admin API to get collections and determine which
 * collections each product belongs to.
 */

import { shopifyAdminFetch } from '@/lib/shopify/admin';

const BATCH_SIZE = 50;

const PRODUCT_COLLECTIONS_QUERY = `
  query ProductCollections($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        collections(first: 20) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    }
  }
`;

const ALL_COLLECTIONS_QUERY = `
  query AllCollections($cursor: String) {
    collections(first: 250, after: $cursor) {
      edges {
        node {
          id
          title
          handle
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/**
 * Fetch Shopify collections for specific product IDs.
 * Returns a Map of shopifyProductId → array of collection titles.
 * A product can belong to multiple collections.
 */
export async function fetchProductCategories(
  shopifyProductIds: string[],
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();

  if (!shopifyProductIds.length) return result;

  for (let i = 0; i < shopifyProductIds.length; i += BATCH_SIZE) {
    const batch = shopifyProductIds.slice(i, i + BATCH_SIZE);
    const data = await shopifyAdminFetch(PRODUCT_COLLECTIONS_QUERY, { ids: batch });

    for (const node of data.nodes ?? []) {
      if (!node?.id) continue;
      // Return the first collection title as the "category" for threshold matching
      // Products can be in multiple collections; we check all of them during resolution
      const collections = node.collections?.edges?.map((e: any) => e.node.title) ?? [];
      // Store all collection titles joined — the resolver will check each one
      result.set(node.id, collections.length > 0 ? JSON.stringify(collections) : null);
    }
  }

  return result;
}

/**
 * Fetch all distinct Shopify collection titles.
 * Used by the admin settings page to populate the collection dropdown.
 */
export async function fetchAllProductCategories(): Promise<string[]> {
  const collections: string[] = [];
  let cursor: string | null = null;

  do {
    const data = await shopifyAdminFetch(ALL_COLLECTIONS_QUERY, { cursor });

    for (const edge of data.collections.edges) {
      const title = edge.node.title;
      if (title) collections.push(title);
    }

    cursor = data.collections.pageInfo.hasNextPage
      ? data.collections.pageInfo.endCursor
      : null;
  } while (cursor);

  return collections.sort();
}
