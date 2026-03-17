export const getProductsQuery = `
  query getProducts($first: Int = 20) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          availableForSale
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                availableForSale
              }
            }
          }
          tags
          productType
          metafields(identifiers: [
            { namespace: "custom", key: "is_preorder" }
            { namespace: "custom", key: "preorder_ship_date" }
            { namespace: "custom", key: "is_ice_cream" }
          ]) {
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
