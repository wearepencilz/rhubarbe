# Shopify Token Still Not Working - Troubleshooting

## Current Status
✅ Token format is correct (starts with `shpca_`)
❌ Still getting 401 Unauthorized

## Most Common Causes

### 1. Storefront API Not Enabled
The custom app might not have Storefront API access enabled.

**Fix:**
1. Go to https://janinemtl.myshopify.com/admin/settings/apps/development
2. Click on your custom app
3. Click **"Configuration"** tab
4. Under **"Storefront API"**, click **"Configure"**
5. Make sure these are checked:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_collection_listings`
6. Click **"Save"**
7. Go back to **"API credentials"** tab
8. You might need to **reinstall the app** or generate a new token

### 2. Sales Channel Not Configured
The products might not be published to the Headless channel.

**Fix:**
1. In Shopify Admin, go to **Settings** → **Apps and sales channels**
2. Click on your custom app
3. Under **"Sales channels"**, make sure it's enabled
4. Go to **Products** → Select a product
5. In the right sidebar under **"Sales channels and apps"**, make sure your custom app is checked

### 3. Wrong API Version
The endpoint might be using the wrong API version.

**Try this alternative test:**
```bash
# Test with 2023-10 API version
curl -X POST \
  https://janinemtl.myshopify.com/api/2023-10/graphql.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Storefront-Access-Token: YOUR_TOKEN_HERE" \
  -d '{"query": "{ shop { name } }"}'
```

### 4. Token Regeneration Needed
Sometimes tokens need to be regenerated.

**Fix:**
1. Go to your custom app in Shopify Admin
2. Go to **"API credentials"** tab
3. Under **"Storefront API access token"**, click the **"Regenerate"** button
4. Copy the new token
5. Update `.env.local` with the new token

### 5. App Not Installed
The custom app might not be installed on your store.

**Fix:**
1. Go to your custom app in Shopify Admin
2. Look for an **"Install app"** button
3. Click it to install the app to your store
4. Then copy the Storefront API token

## Quick Test Commands

Test with curl (replace YOUR_TOKEN with your actual token):

```bash
# Test shop query
curl -X POST \
  https://janinemtl.myshopify.com/api/2024-01/graphql.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Storefront-Access-Token: YOUR_TOKEN" \
  -d '{"query": "{ shop { name description } }"}'

# Test products query
curl -X POST \
  https://janinemtl.myshopify.com/api/2024-01/graphql.json \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Storefront-Access-Token: YOUR_TOKEN" \
  -d '{"query": "{ products(first: 1) { edges { node { title } } } }"}'
```

## Alternative: Use Admin API Token Instead

If Storefront API continues to fail, you can temporarily use the Admin API token:

1. Get your Admin API token (starts with `shpat_`)
2. Update `lib/shopify/client.ts` to use Admin API endpoint
3. This is less ideal but will work for development

## Next Steps

1. Check the Storefront API configuration in your Shopify app
2. Make sure the app is installed
3. Verify products are published to the sales channel
4. Try regenerating the token
5. If all else fails, we can switch to using the Admin API for development

## Need More Help?

Check the Shopify logs:
1. Go to https://janinemtl.myshopify.com/admin/settings/apps/development
2. Click on your app
3. Look for any error messages or warnings
