# Local Development Setup - Quick Fix Guide

## Issues Fixed

1. ✅ Added missing Shopify environment variables
2. ✅ Fixed port configuration (now consistently using 3001)
3. ✅ Updated dev scripts to use correct port

## Required Actions

### 1. Get Shopify Credentials

You need to add your actual Shopify credentials to `.env.local`:

#### Storefront API (Required for public store)
1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps" → Create an app (or use existing)
3. Configure Storefront API access
4. Copy the credentials:
   - Store domain: `janinemtl.myshopify.com`
   - Storefront Access Token: `shpca_...`

#### Admin API (Required for CMS)
Choose ONE method:

**Method 1: OAuth (Recommended)**
- Client ID and Client Secret from your Shopify app

**Method 2: Direct Token**
- Admin API access token: `shpat_...`

### 2. Update .env.local

Replace the placeholder values in `.env.local`:

```bash
# Replace these with your actual credentials:
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-actual-token-here"
SHOPIFY_CLIENT_ID="your-actual-client-id"
SHOPIFY_CLIENT_SECRET="your-actual-secret"
```

### 3. Start Development Server

```bash
npm run dev
```

The app will now run on: http://localhost:3001

## Quick Test

Once the server is running:

1. **Test Store**: Visit http://localhost:3001
2. **Test CMS**: Visit http://localhost:3001/admin/login
   - Username: `admin`
   - Password: `admin123`

## Common Issues

### "Shopify environment variables are not configured"
- Make sure you've added the actual Shopify credentials (not placeholders)
- Restart the dev server after updating `.env.local`

### Port already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
# Then restart
npm run dev
```

### Database connection errors
- The PostgreSQL and Redis connections are already configured
- If you see game-related errors, run: `npm run db:migrate`

## Next Steps

After fixing the Shopify credentials:

1. Test product fetching: Visit http://localhost:3001/collections/all
2. Test CMS: Create a new ingredient at http://localhost:3001/admin/ingredients
3. Test image uploads: Upload an image in the CMS

## Need Help?

Check these files for reference:
- `.env.example` - All available environment variables
- `DEPLOYMENT.md` - Production deployment guide
- `CMS_QUICKSTART.md` - CMS usage guide
