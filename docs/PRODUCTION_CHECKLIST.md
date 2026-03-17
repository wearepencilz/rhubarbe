# Production Deployment Checklist

## Image Upload Configuration

### Vercel Blob Storage Setup

1. **Connect Vercel Blob to your project:**
   - Go to Vercel Dashboard → Your Project → Storage
   - Click "Create Database" → Select "Blob"
   - Click "Connect to Project"
   - Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your environment variables

2. **Verify environment variable:**
   - Go to Project Settings → Environment Variables
   - Confirm `BLOB_READ_WRITE_TOKEN` exists
   - Format: `vercel_blob_rw_XXXXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYY`

3. **Image delivery:**
   - Images are automatically served via Vercel's CDN
   - URLs format: `https://[random].public.blob.vercel-storage.com/[filename]`
   - Optimized delivery with caching and compression

### Local Development

- Images are stored in `public/uploads/` directory
- No Vercel Blob token needed for local development
- Upload API automatically falls back to local storage

### Supported Image Formats

- **Allowed:** JPG, PNG, WebP, AVIF
- **Not allowed:** GIF, TIFF, HEIC
- **Max size:** 10 MB
- **Recommended:** Under 2 MB for optimal performance

### Filename Normalization

All uploaded files are automatically normalized:
- Converted to lowercase
- Spaces replaced with hyphens
- Special characters removed
- Example: `My Photo 2024.JPG` → `1234567890-my-photo-2024.jpg`

---

# Production Deployment Checklist

This checklist ensures your image upload system and all other features work correctly in production on Vercel.

## Pre-Deployment Checklist

### 1. Environment Variables Configuration

Verify all required environment variables are set in Vercel Dashboard:

**Shopify Configuration:**
- [ ] `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` - Your Shopify store domain
- [ ] `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Storefront API token
- [ ] `SHOPIFY_ADMIN_ACCESS_TOKEN` - Admin API token (optional)

**Authentication:**
- [ ] `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Your production URL (e.g., `https://janine.vercel.app`)
- [ ] `AUTH_SECRET` - Same as NEXTAUTH_SECRET or generate another

**Vercel KV (Data Storage):**
- [ ] `KV_URL` - Auto-added when connecting Vercel KV
- [ ] `KV_REST_API_URL` - Auto-added when connecting Vercel KV
- [ ] `KV_REST_API_TOKEN` - Auto-added when connecting Vercel KV
- [ ] `KV_REST_API_READ_ONLY_TOKEN` - Auto-added when connecting Vercel KV

**Vercel Blob (Image Storage) - CRITICAL FOR IMAGE UPLOADS:**
- [ ] `BLOB_READ_WRITE_TOKEN` - Auto-added when connecting Vercel Blob

### 2. Vercel Storage Setup

**Connect Vercel KV:**
1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Create Database** → **KV**
4. Name it: `janine-kv`
5. Click **Create** → **Connect to Project**
6. Verify environment variables were added automatically

**Connect Vercel Blob (REQUIRED FOR IMAGE UPLOADS):**
1. In **Storage** tab, click **Create Database** → **Blob**
2. Name it: `janine-blob`
3. Click **Create** → **Connect to Project**
4. Verify `BLOB_READ_WRITE_TOKEN` was added to environment variables

### 3. Next.js Configuration

Verify `next.config.js` includes Vercel Blob in remote image patterns:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.public.blob.vercel-storage.com',
      pathname: '/**',
    },
  ],
}
```

✅ Already configured in this project

### 4. Upload API Configuration

Verify `app/api/upload/route.ts` has:
- [ ] Correct file type validation (JPG, PNG, WebP, AVIF only)
- [ ] 10MB max file size limit
- [ ] Filename normalization
- [ ] Vercel Blob integration with proper error handling
- [ ] Environment detection (VERCEL=1 or NODE_ENV=production)

✅ Already configured in this project

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Deploy to production
npm run deploy

# Or using Vercel CLI directly
vercel --prod
```

### 2. Verify Environment Variables

After deployment, check that all environment variables are set:

```bash
# Pull environment variables locally to verify
vercel env pull .env.production
```

Review `.env.production` to ensure all variables are present.

### 3. Test Image Upload System

**Test in Production:**

1. Navigate to `https://your-domain.vercel.app/admin/login`
2. Login with credentials (default: admin/admin123)
3. Go to any content creation page (Ingredients, Flavours, Offerings, etc.)
4. Test image upload:
   - [ ] Click to upload works
   - [ ] Drag and drop works
   - [ ] File type validation works (try uploading a GIF - should fail)
   - [ ] File size validation works (try uploading >10MB - should fail)
   - [ ] Preview displays correctly
   - [ ] Alt text field is required
   - [ ] Delete button works
   - [ ] Replace image works

5. Verify uploaded image URL:
   - [ ] URL should be `https://[random].public.blob.vercel-storage.com/[filename]`
   - [ ] Image should load via CDN
   - [ ] Image should be publicly accessible

### 4. Test Image Display

**Verify images display correctly on frontend:**

1. Create content with images in CMS
2. View content on public pages
3. Check browser DevTools Network tab:
   - [ ] Images load from Vercel Blob CDN
   - [ ] Images are optimized (WebP/AVIF format)
   - [ ] Images have correct cache headers

### 5. Monitor Upload Performance

**Check Vercel Logs:**

```bash
vercel logs --follow
```

Look for:
- ✅ `✓ Uploaded to Vercel Blob: https://...`
- ❌ `⚠ Vercel Blob upload failed: ...`

## Troubleshooting

### Issue: "Image upload not configured" error

**Cause:** `BLOB_READ_WRITE_TOKEN` environment variable is missing

**Solution:**
1. Go to Vercel Dashboard → Storage
2. Create Vercel Blob storage if not exists
3. Connect to your project
4. Redeploy: `vercel --prod`

### Issue: "Upload failed" error in production

**Cause:** Vercel Blob API error or network issue

**Solution:**
1. Check Vercel Blob status: https://vercel.com/status
2. Verify `BLOB_READ_WRITE_TOKEN` is correct
3. Check Vercel logs for detailed error: `vercel logs`
4. Ensure file meets requirements (type, size)

### Issue: Images not displaying after upload

**Cause:** Next.js image optimization not configured for Vercel Blob domain

**Solution:**
1. Verify `next.config.js` includes `*.public.blob.vercel-storage.com` in `remotePatterns`
2. Redeploy after config change
3. Clear browser cache

### Issue: "Module not found: @vercel/blob"

**Cause:** Missing dependency

**Solution:**
```bash
npm install @vercel/blob
npm run deploy
```

### Issue: Upload works locally but fails in production

**Cause:** Environment variable not set in production

**Solution:**
1. Verify environment variables in Vercel Dashboard
2. Ensure variables are set for "Production" environment (not just Preview/Development)
3. Redeploy after adding variables

## Post-Deployment Verification

### Image Upload System Health Check

Run through this checklist after every deployment:

1. **Upload Test:**
   - [ ] Upload JPG image (should succeed)
   - [ ] Upload PNG image (should succeed)
   - [ ] Upload WebP image (should succeed)
   - [ ] Upload AVIF image (should succeed)
   - [ ] Upload GIF image (should fail with validation error)
   - [ ] Upload 15MB image (should fail with size error)

2. **Image Display Test:**
   - [ ] Uploaded image displays in CMS preview
   - [ ] Uploaded image displays on public pages
   - [ ] Image URL uses Vercel Blob CDN
   - [ ] Image loads quickly (CDN performance)

3. **Alt Text Test:**
   - [ ] Alt text field is required
   - [ ] Alt text saves correctly
   - [ ] Alt text displays in image alt attribute

4. **Delete Test:**
   - [ ] Delete button removes image from preview
   - [ ] Can upload new image after delete
   - [ ] Replace image works correctly

## Performance Monitoring

### Vercel Blob Usage

Monitor your Vercel Blob usage in Dashboard:

**Free Tier Limits:**
- 500 MB storage
- 5 GB bandwidth/month

**Recommendations:**
- Keep images under 2MB for optimal performance
- Use WebP/AVIF formats for better compression
- Monitor usage monthly to avoid overages

### Image Optimization

Verify Next.js image optimization is working:

1. Check Network tab in browser DevTools
2. Images should be served as WebP or AVIF
3. Images should have appropriate cache headers
4. Images should be resized based on viewport

## Security Checklist

- [ ] Change default admin password (admin/admin123)
- [ ] Verify `BLOB_READ_WRITE_TOKEN` is not exposed in client-side code
- [ ] Ensure upload API requires authentication
- [ ] Verify file type validation is strict (no executable files)
- [ ] Test file size limits are enforced
- [ ] Verify uploaded files are publicly accessible but not listable

## Rollback Plan

If image uploads fail in production:

1. **Immediate:** Revert to previous deployment
   ```bash
   vercel rollback
   ```

2. **Temporary:** Disable image upload UI in CMS
   - Comment out ImageUploader component
   - Show "Image upload temporarily unavailable" message

3. **Debug:** Check logs and fix issue
   ```bash
   vercel logs --follow
   ```

4. **Redeploy:** After fix is verified locally
   ```bash
   npm run deploy
   ```

## Success Criteria

Your image upload system is production-ready when:

- ✅ All environment variables are configured
- ✅ Vercel Blob storage is connected
- ✅ Upload API works in production
- ✅ Images display correctly on frontend
- ✅ File validation works (type and size)
- ✅ Alt text is required and saves correctly
- ✅ Delete and replace functions work
- ✅ Images are served via CDN
- ✅ No errors in Vercel logs
- ✅ Performance is acceptable (<2s upload time)

## Additional Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)

## Support

If you encounter issues not covered in this checklist:

1. Check Vercel Status: https://vercel.com/status
2. Review Vercel Docs: https://vercel.com/docs
3. Check project logs: `vercel logs`
4. Contact Vercel Support: support@vercel.com
