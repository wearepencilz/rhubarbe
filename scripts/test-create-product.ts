#!/usr/bin/env tsx
/**
 * Test Shopify Product Creation
 * 
 * Run this to test creating a Shopify product from an offering:
 * npx tsx scripts/test-create-product.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const OFFERING_ID = '1773116847998'; // Grilled Corn offering
const API_BASE_URL = 'http://localhost:3000';

async function testCreateProduct() {
  console.log('🧪 Testing Shopify Product Creation\n');
  console.log(`📦 Offering ID: ${OFFERING_ID}`);
  console.log(`🌐 API URL: ${API_BASE_URL}\n`);

  try {
    // First, fetch the offering to see its current state
    console.log('1️⃣ Fetching offering data...');
    const offeringRes = await fetch(`${API_BASE_URL}/api/offerings/${OFFERING_ID}`);
    
    if (!offeringRes.ok) {
      throw new Error(`Failed to fetch offering: ${offeringRes.status} ${offeringRes.statusText}`);
    }
    
    const offering = await offeringRes.json();
    console.log('✅ Offering fetched:');
    console.log(`   Name: ${offering.publicName}`);
    console.log(`   Price: $${(offering.price / 100).toFixed(2)}`);
    console.log(`   Format ID: ${offering.formatId}`);
    console.log(`   Flavours: ${offering.primaryFlavourIds.join(', ')}`);
    console.log(`   Shopify Product: ${offering.shopifyProductId || 'Not linked'}\n`);

    if (offering.shopifyProductId) {
      console.log('⚠️  Offering is already linked to a Shopify product');
      console.log(`   Product ID: ${offering.shopifyProductId}`);
      console.log(`   Handle: ${offering.shopifyProductHandle}\n`);
      console.log('Skipping product creation (already exists)');
      return;
    }

    // Create the Shopify product
    console.log('2️⃣ Creating Shopify product...');
    const createRes = await fetch(`${API_BASE_URL}/api/offerings/${OFFERING_ID}/create-shopify-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you'd need to include authentication headers
        // For local testing, we'll assume middleware is disabled or you're authenticated
      },
    });

    console.log(`📥 Response: ${createRes.status} ${createRes.statusText}`);

    const responseText = await createRes.text();
    console.log(`📥 Body: ${responseText}\n`);

    if (!createRes.ok) {
      const errorData = JSON.parse(responseText);
      throw new Error(`Failed to create product: ${errorData.error}\nDetails: ${JSON.stringify(errorData.details)}`);
    }

    const result = JSON.parse(responseText);
    
    console.log('✅ Shopify product created successfully!\n');
    console.log('📦 Product Details:');
    console.log(`   ID: ${result.shopifyProduct.id}`);
    console.log(`   Title: ${result.shopifyProduct.title}`);
    console.log(`   Handle: ${result.shopifyProduct.handle}`);
    console.log(`   Status: ${result.shopifyProduct.status}\n`);

    console.log('🔗 Updated Offering:');
    console.log(`   Shopify Product ID: ${result.offering.shopifyProductId}`);
    console.log(`   Shopify Handle: ${result.offering.shopifyProductHandle}`);
    console.log(`   Sync Status: ${result.offering.syncStatus}`);
    console.log(`   Last Synced: ${result.offering.lastSyncedAt}\n`);

    console.log('✅ Test completed successfully!');
    console.log(`\n🌐 View in Shopify Admin:`);
    console.log(`   https://janinemtl.myshopify.com/admin/products/${result.shopifyProduct.id.split('/').pop()}`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\n📋 Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testCreateProduct().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
