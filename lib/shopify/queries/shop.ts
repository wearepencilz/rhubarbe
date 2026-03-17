export const getShopQuery = `
  query getShop {
    shop {
      name
      description
      primaryDomain {
        url
      }
    }
  }
`;
