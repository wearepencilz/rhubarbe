import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const shop = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    // Check which credentials are available
    const credentials = {
      hasShop: !!shop,
      hasAdminToken: !!adminToken,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      adminTokenPrefix: adminToken ? adminToken.substring(0, 10) + '...' : null,
    };

    // Try to query Shopify to see what access we have
    if (!shop || !adminToken) {
      return NextResponse.json({
        credentials,
        error: 'Missing required credentials',
      });
    }

    // Test the token with a simple query
    const testQuery = `
      query {
        shop {
          name
          myshopifyDomain
        }
      }
    `;

    const response = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify({ query: testQuery }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      return NextResponse.json({
        credentials,
        tokenValid: false,
        errors: data.errors,
      });
    }

    // Try a write operation to test permissions
    const writeTestQuery = `
      mutation {
        productCreate(input: {
          title: "Test Product - Delete Me"
        }) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const writeResponse = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify({ query: writeTestQuery }),
      }
    );

    const writeData = await writeResponse.json();

    return NextResponse.json({
      credentials,
      tokenValid: true,
      shop: data.data?.shop,
      writeTest: {
        success: !writeData.errors,
        errors: writeData.errors,
        userErrors: writeData.data?.productCreate?.userErrors,
      },
    });

  } catch (error: any) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify token',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
