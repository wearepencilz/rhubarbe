// Quick Shopify connection test
import 'dotenv/config';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

console.log('\n🔍 Testing Shopify Connection...\n');
console.log('Domain:', domain || '❌ MISSING');
console.log('Token:', token ? `${token.substring(0, 10)}...` : '❌ MISSING');
console.log('Endpoint:', `https://${domain}/api/2024-01/graphql.json`);

if (!domain || !token) {
  console.error('\n❌ Missing environment variables!');
  process.exit(1);
}

const query = `
  {
    shop {
      name
      description
    }
  }
`;

console.log('\n📡 Making request...\n');

fetch(`https://${domain}/api/2024-01/graphql.json`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': token,
  },
  body: JSON.stringify({ query }),
})
  .then(async (res) => {
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('\nResponse:');
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.data?.shop) {
        console.log('\n✅ SUCCESS! Connected to:', json.data.shop.name);
      } else if (json.errors) {
        console.log('\n❌ GraphQL Errors:', json.errors);
      }
    } catch (e) {
      console.log(text);
    }
  })
  .catch((err) => {
    console.error('\n❌ Request failed:', err.message);
  });
