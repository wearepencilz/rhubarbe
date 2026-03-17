#!/usr/bin/env tsx
/**
 * Shopify Connection Test Script
 * 
 * Run this to test your Shopify API connection:
 * npx tsx scripts/test-shopify-connection.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SHOPIFY_ADMIN_API_VERSION = '2024-01';

async function getAccessToken(): Promise<string> {
  const shop = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  // Try direct token first
  if (adminToken) {
    console.log('🔑 Using direct Admin API access token\n');
    return adminToken;
  }

  // Try OAuth
  if (clientId && clientSecret && shop) {
    console.log('🔐 Using OAuth client credentials flow');
    console.log(`   Client ID: ${clientId}`);
    console.log(`   Client Secret: ${clientSecret.substring(0, 15)}...\n`);

    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    console.log(`📡 Requesting token from: ${tokenUrl}`);

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

    console.log(`📥 Response: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`📥 Body: ${responseText}\n`);

    if (!response.ok) {
      throw new Error(`OAuth failed: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    if (!data.access_token) {
      throw new Error('No access_token in response');
    }

    console.log(`✅ Access token obtained: ${data.access_token.substring(0, 20)}...\n`);
    return data.access_token;
  }

  throw new Error('No authentication method available');
}

async function testShopifyConnection() {
  console.log('🔍 Testing Shopify Connection...\n');

  // Check environment variables
  const shop = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  console.log('📋 Environment Variables:');
  console.log(`   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: ${shop || '❌ MISSING'}`);
  console.log(`   SHOPIFY_ADMIN_ACCESS_TOKEN: ${adminToken ? '✅ Set' : '❌ Not set'}`);
  console.log(`   SHOPIFY_CLIENT_ID: ${clientId || '❌ Not set'}`);
  console.log(`   SHOPIFY_CLIENT_SECRET: ${clientSecret ? clientSecret.substring(0, 15) + '...' : '❌ Not set'}`);
  console.log('');

  if (!shop) {
    console.error('❌ NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is required!');
    process.exit(1);
  }

  if (!adminToken && (!clientId || !clientSecret)) {
    console.error('❌ No authentication method configured!');
    console.log('\nProvide either:');
    console.log('1. SHOPIFY_ADMIN_ACCESS_TOKEN (for custom apps)');
    console.log('2. SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (for OAuth apps)');
    process.exit(1);
  }

  // Get access token
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error: any) {
    console.error('❌ Failed to get access token:', error.message);
    process.exit(1);
  }

  // Test GraphQL query
  console.log('🧪 Testing GraphQL query...');
  const apiUrl = `https://${shop}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`;
  console.log(`   URL: ${apiUrl}\n`);

  const query = `
    query {
      products(first: 5, query: "status:active") {
        edges {
          node {
            id
            title
            handle
            status
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    });

    console.log(`📥 Response: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`📥 Body: ${responseText}\n`);

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
    }

    const products = data.data.products.edges;
    console.log(`✅ Found ${products.length} products\n`);

    if (products.length > 0) {
      console.log('📦 Sample products:');
      products.forEach((edge: any, index: number) => {
        console.log(`   ${index + 1}. ${edge.node.title} (${edge.node.handle})`);
      });
    } else {
      console.log('⚠️  No active products found');
      console.log('   Create some products in Shopify Admin first');
    }

    console.log('\n✅ All tests passed! Shopify connection is working correctly.');
  } catch (error: any) {
    console.error('❌ GraphQL query failed:', error.message);
    process.exit(1);
  }
}

testShopifyConnection().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
