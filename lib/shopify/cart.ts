// Cart operations using Shopify Storefront API
import { shopifyFetch } from './client';

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage?: {
        url: string;
        altText?: string;
      };
    };
    price: {
      amount: string;
      currencyCode: string;
    };
    selectedOptions?: Array<{
      name: string;
      value: string;
    }>;
    image?: {
      url: string;
      altText?: string;
    };
  };
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: {
    edges: Array<{
      node: CartLine;
    }>;
  };
  cost: {
    subtotalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

const cartFragment = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              product {
                id
                handle
                title
                featuredImage {
                  url
                  altText
                }
              }
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              image {
                url
                altText
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
  }
`;

export async function createCart(options?: {
  lines?: Array<{ merchandiseId: string; quantity: number }>;
  attributes?: Array<{ key: string; value: string }>;
  note?: string;
}): Promise<Cart> {
  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          ...CartFragment
        }
        userErrors {
          field
          message
        }
      }
    }
    ${cartFragment}
  `;

  const input: Record<string, any> = {};
  if (options?.lines) input.lines = options.lines;
  if (options?.attributes) input.attributes = options.attributes;
  if (options?.note) input.note = options.note;

  const response = await shopifyFetch({ query, variables: { input }, cache: 'no-store' });

  if (response.errors?.length) {
    throw new Error(`Storefront API errors: ${JSON.stringify(response.errors)}`);
  }

  const result = (response.data as any).cartCreate;

  if (!result) {
    throw new Error('cartCreate returned null — product may not be published to the Storefront API sales channel');
  }

  if (result.userErrors?.length > 0) {
    throw new Error(`Cart create errors: ${JSON.stringify(result.userErrors)}`);
  }
  if (!result.cart) {
    throw new Error('Cart was not created — check that all variant IDs are valid and products are published to the Storefront API');
  }
  return result.cart;
}

export async function updateCartAttributes(
  cartId: string,
  attributes: Array<{ key: string; value: string }>
): Promise<Cart> {
  const query = `
    mutation cartAttributesUpdate($cartId: ID!, $attributes: [AttributeInput!]!) {
      cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
        cart {
          ...CartFragment
        }
        userErrors {
          field
          message
        }
      }
    }
    ${cartFragment}
  `;

  const response = await shopifyFetch({
    query,
    variables: { cartId, attributes },
  });
  return (response.data as any).cartAttributesUpdate.cart;
}

export async function updateCartNote(cartId: string, note: string): Promise<Cart> {
  const query = `
    mutation cartNoteUpdate($cartId: ID!, $note: String!) {
      cartNoteUpdate(cartId: $cartId, note: $note) {
        cart {
          ...CartFragment
        }
        userErrors {
          field
          message
        }
      }
    }
    ${cartFragment}
  `;

  const response = await shopifyFetch({
    query,
    variables: { cartId, note },
  });
  return (response.data as any).cartNoteUpdate.cart;
}

export async function addToCart(cartId: string, lines: Array<{ merchandiseId: string; quantity: number }>): Promise<Cart> {
  const query = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFragment
        }
      }
    }
    ${cartFragment}
  `;

  const response = await shopifyFetch({
    query,
    variables: { cartId, lines },
  });

  return (response.data as any).cartLinesAdd.cart;
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const query = `
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFragment
        }
      }
    }
    ${cartFragment}
  `;

  const response = await shopifyFetch({
    query,
    variables: {
      cartId,
      lines: [{ id: lineId, quantity }],
    },
  });

  return (response.data as any).cartLinesUpdate.cart;
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  const query = `
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...CartFragment
        }
      }
    }
    ${cartFragment}
  `;

  const response = await shopifyFetch({
    query,
    variables: { cartId, lineIds },
  });

  return (response.data as any).cartLinesRemove.cart;
}

export async function getCart(cartId: string): Promise<Cart> {
  const query = `
    query cartQuery($cartId: ID!) {
      cart(id: $cartId) {
        ...CartFragment
      }
    }
    ${cartFragment}
  `;

  const response = await shopifyFetch({
    query,
    variables: { cartId },
  });

  return (response.data as any).cart;
}
