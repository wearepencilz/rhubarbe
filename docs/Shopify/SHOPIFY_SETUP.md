# Shopify Integration Setup

## Current Issue: Access Denied for Product Creation

**Error:** `Access denied for productCreate field. Required access: write_products access scope`

## Problem

The current Shopify Admin Access Token (`SHOPIFY_ADMIN_ACCESS_TOKEN`) does not have the `write_products` permission scope. This prevents the CMS from creating products in Shopify.

## Solution

You need to regenerate the Shopify Admin Access Token with the correct permissions.

### Option 1: Custom App (Recommended)

1. Go to your Shopify Admin: https://janinemtl.myshopify.com/admin
2. Navigate to **Settings** → **Apps and sales channels** → **Develop apps**
3. Click on your existing custom app (or create a new one)
4. Go to **Configuration** tab
5. Under **Admin API access scopes**, ensure these are checked:
   - ✅ `read_products` - Read products
   - ✅ `write_products` - Write products (REQUIRED for creation)
   - ✅ `read_product_listings` - Read product listings
   - ✅ `write_product_listings` - Write product listings
6. Click **Save**
7. Go to **API credentials** tab
8. Click **Install app** (if not installed) or **Reinstall** (if updating scopes)
9. Copy the new **Admin API access token**
10. Update `.env.development.local` and `.env.local`:
    ```
    SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_YOUR_NEW_TOKEN_HERE"
    ```

### Option 2: OAuth App

If using OAuth instead of a custom app:

1. Update your app's requested scopes in Shopify Partners
2. Ensure `write_products` is included
3. Reinstall the app on your store
4. Update the OAuth credentials in your environment variables

## Required Environment Variables

```bash
# Shopify Store
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN="janinemtl.myshopify.com"

# Storefront API (for public product browsing)
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="your_storefront_token"

# Admin API (for CMS product management)
SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_YOUR_TOKEN_WITH_WRITE_PRODUCTS"

# OR use OAuth (alternative to Admin Access Token)
SHOPIFY_CLIENT_ID="your_client_id"
SHOPIFY_CLIENT_SECRET="your_client_secret"
```

## Testing After Setup

1. Restart your development server: `npm run dev`
2. Go to a product in the CMS: http://localhost:3001/admin/products/[id]
3. Click "Create New Shopify Product"
4. Should successfully create the product in Shopify

## Required Scopes Summary

For full CMS functionality, your Shopify app needs:

- `read_products` - View products
- `write_products` - Create/update products
- `read_product_listings` - View product listings
- `write_product_listings` - Manage product listings
- `read_inventory` - View inventory (optional)
- `write_inventory` - Update inventory (optional)

## Troubleshooting

### "Access denied" errors
- Token doesn't have required scope
- Regenerate token with correct permissions

### "Invalid access token"
- Token is expired or revoked
- Generate a new token

### "Store domain not found"
- Check `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` is correct
- Should be: `yourstore.myshopify.com` (not the custom domain)

## Security Notes

- Never commit `.env.local` or `.env.development.local` to git
- These files are in `.gitignore` by default
- Use Vercel environment variables for production
- Rotate tokens periodically for security
