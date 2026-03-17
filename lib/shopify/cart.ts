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

export async function createCart(): Promise<Cart> {
  const query = `
    mutation cartCreate {
      cartCreate {
        cart {
          ...CartFragment
        }
      }
    }
    ${cartFragment}
  `;

  const response = await shopifyFetch({ query });
  return (response.data as any).cartCreate.cart;
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
