# Image Upload System Guide

## Overview

The image upload system supports both local development and production deployment with automatic environment detection.

## Architecture

### Development Environment
- **Storage:** Local filesystem (`public/uploads/`)
- **Access:** Direct file access via `/uploads/[filename]`
- **Setup:** No configuration needed

### Production Environment (Vercel)
- **Storage:** Vercel Blob Storage (CDN)
- **Access:** CDN URLs (`https://[random].public.blob.vercel-storage.com/[filename]`)
- **Setup:** Connect Vercel Blob Storage to your project

## Production Setup

### Step 1: Connect Vercel Blob Storage

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Storage** tab
4. Click **Create Database**
5. Select **Blob**
6. Click **Connect to Project**

Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your environment variables.

### Step 2: Verify Configuration

1. Go to **Project Settings** → **Environment Variables**
2. Confirm `BLOB_READ_WRITE_TOKEN` exists
3. Format should be: `vercel_blob_rw_XXXXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYYYYYY`

### Step 3: Deploy

```bash
npm run build
npm run deploy
```

Images will now be uploaded to Vercel Blob and served via CDN.

## Image Requirements

### Allowed Formats
- JPG / JPEG
- PNG
- WebP
- AVIF (future-proof)

### Not Allowed
- GIF (unpredictable browser support)
- TIFF (large file sizes)
- HEIC (limited browser support)

### File Size Limits
- **Maximum:** 10 MB (hard limit)
- **Recommended:** Under 2 MB for optimal performance
- **Warning:** Files over 2 MB will trigger a console warning

### Filename Normalization

All filenames are automatically normalized:
- Converted to lowercase
- Spaces replaced with hyphens
- Special characters removed
- Timestamp prefix added for uniqueness

**Example:**
```
Input:  "My Photo 2024.JPG"
Output: "1234567890-my-photo-2024.jpg"
```

## Component Usage

### Basic Usage

```tsx
import ImageUploader from '@/app/admin/components/ImageUploader';

function MyForm() {
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');

  return (
    <ImageUploader
      value={imageUrl}
      onChange={setImageUrl}
      altText={altText}
      onAltTextChange={setAltText}
      aspectRatio="1:1"
      label="Product Image"
      required
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `undefined` | Current image URL |
| `onChange` | `(url: string) => void` | required | Callback when image is uploaded |
| `onDelete` | `() => void` | `undefined` | Callback when image is deleted |
| `altText` | `string` | `''` | Alt text for accessibility |
| `onAltTextChange` | `(alt: string) => void` | `undefined` | Callback when alt text changes |
| `aspectRatio` | `'1:1' \| '4:5' \| '16:9'` | `'1:1'` | Preview aspect ratio |
| `label` | `string` | `'Image'` | Field label |
| `required` | `boolean` | `false` | Whether field is required |

### Aspect Ratios

- **1:1** (Square) - Menu cards, product listings
- **4:5** (Portrait) - Instagram-style posts
- **16:9** (Landscape) - Hero banners

## API Endpoint

### POST /api/upload

Upload an image file.

**Request:**
```
Content-Type: multipart/form-data

Fields:
- image: File (required)
- altText: string (optional)
```

**Response (Success):**
```json
{
  "url": "https://[random].public.blob.vercel-storage.com/[filename]",
  "filename": "1234567890-my-photo.jpg",
  "size": 1048576,
  "type": "image/jpeg",
  "altText": "Product photo",
  "storage": "vercel-blob"
}
```

**Response (Error):**
```json
{
  "error": "Invalid file type. Only JPG, PNG, WebP, and AVIF are allowed."
}
```

## Error Handling

### Common Errors

1. **"Invalid file type"**
   - Solution: Use JPG, PNG, WebP, or AVIF only

2. **"File size exceeds 10 MB limit"**
   - Solution: Compress image before uploading

3. **"Upload failed. Please check your Vercel Blob configuration"**
   - Solution: Verify `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables

4. **"Image upload not configured"**
   - Solution: Connect Vercel Blob Storage to your project

## Environment Detection

The upload API automatically detects the environment:

```typescript
// Check for Vercel Blob token
const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1';

// Check if production mode
const isProduction = process.env.NODE_ENV === 'production';
```

**Decision Logic:**
1. If `BLOB_READ_WRITE_TOKEN` exists → Use Vercel Blob
2. If on Vercel without token → Return error (read-only filesystem)
3. If local development → Use local filesystem

## Next.js Image Optimization

Images from Vercel Blob are automatically optimized by Next.js:

```tsx
import Image from 'next/image';

<Image
  src={imageUrl}
  alt={altText}
  width={400}
  height={400}
  className="rounded-lg"
/>
```

Supported formats in `next.config.js`:
```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.public.blob.vercel-storage.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'blob.vercel-storage.com',
      pathname: '/**',
    },
  ],
}
```

## Troubleshooting

### Images not uploading in production

1. Check Vercel environment variables:
   ```bash
   vercel env ls
   ```

2. Verify `BLOB_READ_WRITE_TOKEN` exists

3. Check Vercel deployment logs for errors

### Images not displaying

1. Verify URL format is correct
2. Check Next.js `remotePatterns` in `next.config.js`
3. Ensure image is publicly accessible

### Large file sizes

1. Compress images before upload using tools like:
   - [TinyPNG](https://tinypng.com/)
   - [Squoosh](https://squoosh.app/)
   - ImageOptim (Mac)

2. Consider implementing auto-compression in the upload API

## Future Enhancements

- [ ] Crop tool with focal point selection
- [ ] Image metadata fields (photographer, source, usage rights, tags)
- [ ] Global media library for image reuse
- [ ] Multiple image types per content (hero, menu card, detail shot, process shot)
- [ ] Auto-compression on upload
- [ ] Image optimization presets
- [ ] Batch upload support
- [ ] Image search and filtering
