# Janine CMS - Quick Start Guide

## What's Been Implemented

### ✅ Authentication System
- NextAuth with credentials provider
- Protected admin routes via middleware
- Session management with JWT
- Default credentials: `admin` / `admin123`

### ✅ Ingredients Section (Complete CRUD)
- **List**: View all ingredients with search and category filters
- **Create**: Add new ingredients with full provenance details
- **Edit**: Update ingredient information
- **Delete**: Remove ingredients (with safety check for flavour relationships)

### Features:
- Name, Latin name, origin, category
- Story and provenance
- Tasting notes (comma-separated)
- Supplier and farm information
- Allergen tracking (dairy, nuts, gluten, soy, eggs)
- Seasonal availability with month selection
- Organic flag
- Image support

### ✅ Data Storage
- Development: JSON files in `/public/data/`
- Production: Redis/Vercel KV support
- Automatic fallback to file system

### ✅ Updated Navigation
- Dashboard with new sections
- Ingredients, Flavours, Batches, Stories, Settings
- Removed old Projects, News, Pages sections

## How to Use

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Access the CMS

Navigate to: `http://localhost:3000/admin/login`

**Login credentials:**
- Username: `admin`
- Password: `admin123`

### 3. Manage Ingredients

1. Click "Ingredients" from the dashboard or navigation
2. Click "Add Ingredient" to create a new one
3. Fill in the form with ingredient details
4. Click "Create Ingredient"
5. Edit or delete ingredients from the list view

### 4. Search and Filter

- Use the search bar to find ingredients by name or origin
- Filter by category: base, flavor, mix-in, topping, spice
- View seasonal ingredients with month availability

## Data Files

All CMS data is stored in `/public/data/`:
- `ingredients.json` - Ingredient library
- `flavours.json` - Flavour archive (ready for implementation)
- `batches.json` - Test kitchen batches (ready for implementation)
- `stories.json` - Editorial content (ready for implementation)
- `settings.json` - Global settings

## Next Steps

### To Implement:
1. **Flavours Section** - Link to Shopify products, manage ingredient relationships
2. **Batches Section** - Test kitchen tracking with batch iterations
3. **Stories Section** - Editorial content with rich text editor
4. **Settings Update** - Janine-specific settings (featured flavours, etc.)
5. **Image Upload** - Integrate with Vercel Blob for production

### To Remove:
- Old Projects section (`app/admin/projects/`)
- Old News section (`app/admin/news/`)
- Old Pages section (`app/admin/pages/`)

## Testing the CMS

### Test Ingredient Creation:
1. Login to admin
2. Go to Ingredients
3. Click "Add Ingredient"
4. Fill in:
   - Name: "Blood Orange"
   - Latin Name: "Citrus × sinensis"
   - Origin: "Sicily"
   - Category: "flavor"
   - Story: "Sourced from a family farm in Sicily..."
   - Tasting Notes: "citrus, floral, bittersweet"
   - Allergens: (none)
   - Seasonal: Yes
   - Available Months: Select Jan-Mar
5. Save and verify it appears in the list

### Test Relationships:
1. Try to delete an ingredient
2. System should check if it's used in any flavours
3. If used, deletion is prevented with a helpful message

## Environment Variables

Required in `.env.local`:

```env
# NextAuth
AUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Shopify (for storefront)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=janinemtl.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token

# Optional: Production storage
REDIS_URL=your-redis-url
BLOB_READ_WRITE_TOKEN=your-blob-token
```

## API Endpoints

### Ingredients
- `GET /api/ingredients` - List all ingredients
- `POST /api/ingredients` - Create ingredient (auth required)
- `GET /api/ingredients/[id]` - Get single ingredient
- `PUT /api/ingredients/[id]` - Update ingredient (auth required)
- `DELETE /api/ingredients/[id]` - Delete ingredient (auth required)

## Architecture

### Authentication Flow
1. User visits `/admin/*` route
2. Middleware checks for session
3. If no session, redirect to `/admin/login`
4. After login, redirect to `/admin` dashboard
5. Session stored as JWT

### Data Flow
1. Admin makes changes in UI
2. Client sends request to API route
3. API route checks authentication
4. Data saved to JSON file (dev) or Redis (prod)
5. Response sent back to client
6. UI updates

## Troubleshooting

### Can't login?
- Check `.env.local` has `AUTH_SECRET` set
- Verify credentials: `admin` / `admin123`
- Clear browser cookies and try again

### Changes not saving?
- Check file permissions on `/public/data/`
- Verify API routes are working (check Network tab)
- Check server logs for errors

### Middleware not working?
- Ensure `middleware.ts` is in root directory
- Check Next.js version is 14.2+
- Verify `auth` export from `lib/auth.ts`

## Production Deployment

### Vercel
1. Connect your repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy
4. Vercel will automatically use KV/Blob if connected

### Environment Variables for Production
- `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your production URL
- `REDIS_URL` or `KV_REST_API_URL` - For data storage
- `BLOB_READ_WRITE_TOKEN` - For image uploads

## Security Notes

- Default credentials should be changed in production
- Consider implementing proper user management
- Add rate limiting to API routes
- Enable CORS protection
- Use HTTPS in production
- Rotate AUTH_SECRET regularly

## Support

For issues or questions:
1. Check the steering documents in `.kiro/steering/`
2. Review `JANINE_OVERVIEW.md` for architecture
3. Check `PRODUCT_CMS_DESIGN.md` for data models
