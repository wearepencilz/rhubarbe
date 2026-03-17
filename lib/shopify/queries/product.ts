export const getProductQuery = `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
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
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            image {
              url
              altText
              width
              height
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
      options {
        name
        values
      }
      tags
      productType
      metafields(identifiers: [
        { namespace: "custom", key: "is_preorder" }
        { namespace: "custom", key: "preorder_ship_date" }
        { namespace: "custom", key: "preorder_disclaimer_en" }
        { namespace: "custom", key: "preorder_disclaimer_fr" }
        { namespace: "custom", key: "is_ice_cream" }
        { namespace: "custom", key: "requires_scheduling" }
        { namespace: "custom", key: "lead_time_hours" }
      ]) {
        namespace
        key
        value
        type
      }
    }
  }
`;
