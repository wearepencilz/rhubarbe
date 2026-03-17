# Janine Vercel Deployment Guide

Complete guide for deploying the Janine ice cream shop website to Vercel.

## Project Overview

Janine is a Next.js-based ice cream shop with:
- Shopify integration for e-commerce
- Custom CMS for managing projects, news, pages, and settings
- Image uploads (Vercel Blob in production)
- Data storage (Vercel KV/Redis in production, JSON files in development)

## Prerequisites

1. Vercel account (sign up at vercel.com)
2. Shopify store with Storefront API access
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

This opens your browser for authentication.

## Step 3: Initial Deployment

From your project root:

```bash
vercel
```

Answer the prompts:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your account/team
3. **Link to existing project?** → No (first time)
4. **Project name?** → `janine-test` (or your preferred name)
5. **Code directory?** → `./` (press Enter)
6. **Override settings?** → No (Next.js auto-detected)

This creates a preview deployment and initializes your project.

## Step 4: Configure Environment Variables

Go to your Vercel dashboard: `https://vercel.com/[your-username]/janine-test`

Navigate to **Settings** → **Environment Variables**

### Required Variables

#### Shopify Configuration
```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
SHOPIFY_ADMIN_ACCESS_TOKEN=your-admin-token (optional)
```

**How to get Shopify tokens:**
1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps" → "Create an app"
3. Configure Storefront API access
4. Copy the Storefront Access Token

#### Authentication
```
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://janine-test.vercel.app
AUTH_SECRET=same-as-nextauth-secret-or-generate-another
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

### Important Notes
- Set all variables for **Production**, **Preview**, and **Development** environments
- `NEXTAUTH_URL` should match your Vercel domain
- After adding variables, redeploy for them to take effect

## Step 5: Add Vercel KV (Data Storage)

Janine uses Vercel KV (Redis) for production data storage.

1. In your Vercel project, go to **Storage** tab
2. Click **Create Database** → **KV**
3. Name it: `janine-kv`
4. Click **Create**
5. Click **Connect to Project** → Select your project

This automatically adds these environment variables:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### Data Migration to Production

Your development data is in JSON files (`public/data/*.json`). To migrate to production:

**Option 1: Manual via CMS**
1. Deploy to production
2. Login to `/admin/login` (admin/admin123)
3. Recreate your content through the CMS interface

**Option 2: Migration Script** (recommended for large datasets)
Create a migration script to seed Vercel KV with your JSON data:

```bash
# Run locally with production KV credentials
node scripts/migrate-to-redis.js
```

## Step 6: Add Vercel Blob (Image Storage)

Janine uses Vercel Blob for production image uploads.

1. In **Storage** tab, click **Create Database** → **Blob**
2. Name it: `janine-blob`
3. Click **Create**
4. Click **Connect to Project** → Select your project

This automatically adds:
- `BLOB_READ_WRITE_TOKEN`

### Migrating Existing Images

Your development images are in `public/uploads/`. To migrate:

1. Upload images through the CMS after deployment, or
2. Use Vercel Blob API to bulk upload existing images

## Step 7: Deploy to Production

```bash
vercel --prod
```

Or use the npm script:

```bash
npm run deploy
```

Your site will be live at: `https://janine-test.vercel.app`

## Step 8: Verify Deployment

Test these critical paths:

1. **Homepage**: `https://janine-test.vercel.app`
2. **Admin Login**: `https://janine-test.vercel.app/admin/login`
3. **Shopify Products**: Browse collections and products
4. **CMS Functions**: Create/edit content in admin
5. **Image Uploads**: Upload an image through CMS

## Step 9: Connect Git Repository (Recommended)

For automatic deployments on every push:

1. Go to **Settings** → **Git**
2. Click **Connect Git Repository**
3. Select your repository
4. Choose branch (usually `main` or `master`)

Now every push to your main branch automatically deploys to production!

## Data Storage Architecture

### Development (Local)
```
Storage: JSON files in public/data/
- projects.json
- news.json
- pages.json
- settings.json

Images: Local files in public/uploads/
```

### Production (Vercel)
```
Storage: Vercel KV (Redis)
- Key-value pairs for each data type
- Automatic persistence
- Fast read/write

Images: Vercel Blob
- Secure cloud storage
- CDN delivery
- Automatic optimization
```

### How the Database Adapter Works

The `lib/db.js` adapter automatically detects the environment:

**Development:**
- Reads/writes JSON files in `public/data/`
- No setup required

**Production (Vercel):**
- Detects `VERCEL=1` environment variable
- Connects to Vercel KV if `KV_REST_API_URL` exists
- Falls back to Redis if `REDIS_URL` exists
- Falls back to file system (not recommended)

## Custom Domain Setup

To use your own domain:

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `janine.com`)
4. Follow DNS configuration instructions
5. Update `NEXTAUTH_URL` environment variable to match

## Useful Commands

```bash
# Preview deployment (test branch)
vercel

# Production deployment
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Pull environment variables to local
vercel env pull

# Remove deployment
vercel remove [deployment-name]
```

## Monitoring & Debugging

### View Logs
```bash
vercel logs --follow
```

Or in Vercel dashboard: **Deployments** → Click deployment → **Logs**

### Common Issues

**Build fails:**
- Check environment variables are set
- Review build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`

**Authentication not working:**
- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again

**Shopify products not loading:**
- Verify Shopify credentials
- Check Storefront API permissions
- Test API connection in logs

**Images not uploading:**
- Verify Vercel Blob is connected
- Check `BLOB_READ_WRITE_TOKEN` exists
- Review upload API logs

**Data not persisting:**
- Verify Vercel KV is connected
- Check KV environment variables
- Review database adapter logs

## Performance Optimization

Vercel automatically provides:
- Edge caching
- Image optimization
- Automatic compression
- Global CDN

For additional optimization:
- Use Next.js Image component for all images
- Enable ISR (Incremental Static Regeneration) for product pages
- Configure caching headers in `next.config.js`

## Security Checklist

- [ ] Change default admin password (admin/admin123)
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Restrict Shopify API permissions to minimum required
- [ ] Enable HTTPS only (automatic on Vercel)
- [ ] Review Vercel security headers
- [ ] Set up environment variable encryption

## Backup Strategy

### Data Backup
Vercel KV data should be backed up regularly:

```bash
# Export data from production
node scripts/export-kv-data.js > backup-$(date +%Y%m%d).json
```

### Image Backup
Vercel Blob files are automatically backed up by Vercel.

## Cost Considerations

**Vercel Free Tier includes:**
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function executions

**Vercel KV Free Tier:**
- 256 MB storage
- 10,000 commands/day

**Vercel Blob Free Tier:**
- 500 MB storage
- 5 GB bandwidth/month

Monitor usage in Vercel dashboard under **Usage**.

## Next Steps

1. Set up custom domain
2. Configure analytics (Vercel Analytics or Google Analytics)
3. Set up monitoring (Vercel Monitoring or Sentry)
4. Create staging environment (separate Vercel project)
5. Document content management workflows
6. Train team on CMS usage

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Shopify Storefront API: https://shopify.dev/docs/api/storefront
- Vercel Support: support@vercel.com
