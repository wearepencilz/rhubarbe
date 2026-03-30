const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

const endpoint = domain ? `https://${domain}/api/2025-01/graphql.json` : '';

export async function shopifyFetch<T>({
  query,
  variables,
  cache = 'force-cache',
}: {
  query: string;
  variables?: Record<string, any>;
  cache?: RequestCache;
}): Promise<{ data: T; errors?: any[] }> {
  if (!domain || !storefrontAccessToken) {
    throw new Error('Shopify environment variables are not configured');
  }

  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache,
    });

    if (!result.ok) {
      throw new Error(`Shopify API error: ${result.status} ${result.statusText}`);
    }

    const json = await result.json();

    if (json.errors) {
      console.error('Shopify GraphQL errors:', json.errors);
    }

    return json;
  } catch (error) {
    console.error('Shopify fetch error:', error);
    throw error;
  }
}
