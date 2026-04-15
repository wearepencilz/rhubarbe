# Shopify Setup Guide - Fix 401 Unauthorized Error

## Current Issue

Your app is running successfully on http://localhost:3001, but getting a **401 Unauthorized** error when trying to fetch products from Shopify. This means your Storefront Access Token needs to be updated.

## How to Get the Correct Shopify Credentials

### Step 1: Access Your Shopify Admin

1. Go to: https://janinemtl.myshopify.com/admin
2. Log in with your Shopify credentials

### Step 2: Create or Access a Custom App

1. In Shopify Admin, go to: **Settings** → **Apps and sales channels**
2. Click **"Develop apps"** (top right)
3. If you already have an app, click on it. Otherwise, click **"Create an app"**
   - Name it something like "Janine Headless Store"
   - Click **"Create app"**

### Step 3: Configure Storefront API Access

1. Click on **"Configuration"** tab
2. Under **"Storefront API"**, click **"Configure"**
3. Enable these scopes (minimum required):
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
   - ✅ `unauthenticated_read_collection_listings`
   - ✅ `unauthenticated_write_checkouts`
   - ✅ `unauthenticated_read_checkouts`
4. Click **"Save"**

### Step 4: Get Your Storefront Access Token

1. Go to **"API credentials"** tab
2. Under **"Storefront API access token"**, click **"Install app"** (if not already installed)
3. Copy the **Storefront API access token** (starts with `shpca_...`)

### Step 5: Configure Admin API (for CMS)

1. Still in **"Configuration"** tab
2. Under **"Admin API"**, click **"Configure"**
3. Enable these scopes:
   - ✅ `read_products`
   - ✅ `write_products`
   - ✅ `read_product_listings`
4. Click **"Save"**
5. Go back to **"API credentials"** tab
6. Copy the **Admin API access token** (starts with `shpat_...`)

### Step 6: Update Your .env.local

Replace the values in your `.env.local` file:

```bash
# Shopify Configuration
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="janinemtl.myshopify.com"
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="shpca_YOUR_ACTUAL_TOKEN_HERE"

# Admin API
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_YOUR_ACTUAL_ADMIN_TOKEN_HERE"
```

### Step 7: Restart the Dev Server

The server should automatically reload, but if not:

```bash
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

## Testing the Fix

Once you've updated the tokens:

1. Visit http://localhost:3001
2. You should see products and collections loading
3. No more "401 Unauthorized" errors in the console

## Troubleshooting

### Still getting 401 errors?

1. **Check token format**: 
   - Storefront token should start with `shpca_`
   - Admin token should start with `shpat_`

2. **Verify scopes**: Make sure you enabled all the required scopes listed above

3. **Check store domain**: Ensure it's exactly `janinemtl.myshopify.com` (no https://, no trailing slash)

4. **Reinstall the app**: In Shopify Admin, uninstall and reinstall the custom app

### Need to test Shopify connection?

Run this test script:

```bash
npx tsx scripts/test-shopify-connection.ts
```

This will verify your Shopify credentials are working correctly.

## Next Steps After Fixing

Once Shopify is connected:

1. ✅ Test the store: http://localhost:3001
2. ✅ Test collections: http://localhost:3001/collections/all
3. ✅ Test CMS login: http://localhost:3001/admin/login (admin/admin123)
4. ✅ Link products to flavours in the CMS

## Important Notes

- The Storefront API token is **public** (safe to use in browser)
- The Admin API token is **private** (only used server-side)
- Never commit real tokens to git (they're in .gitignore)
- For production, add these tokens to Vercel environment variables
