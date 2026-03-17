# Shopify-CMS Integration Status

This document tracks the implementation of the Shopify-CMS integration for linking flavours to Shopify products and syncing ingredient data via metafields.

## Implementation Status

### ✅ Completed

1. **Type Definitions** (`types/index.ts`)
   - Ingredient, Flavour, FlavourIngredient types
   - Shopify product types
   - Sync job and log types
   - All necessary interfaces defined

2. **Sync Queue System** (`lib/sync/queue.ts`)
   - Metafield payload builder
   - Allergen auto-calculation
   - Dietary flag auto-determination
   - Sync job creation and processing
   - Retry logic with exponential backoff

3. **API Routes**
   - ✅ `/api/shopify/sync` - Trigger sync
   - ✅ `/api/shopify/sync/status/[jobId]` - Get sync status
   - ✅ `/api/shopify/products` - Search Shopify products
   - ✅ `/api/flavours/[id]` - Update flavours with auto-sync trigger
   - ✅ `/api/flavours/[id]/ingredients` - Get flavour ingredients with allergens/dietary
   - ✅ `/api/ingredients/[id]/usage` - Get ingredient usage in flavours

4. **Shopify Admin Client** (`lib/shopify/admin.ts`)
   - Product metafield updates
   - Product search
   - Product retrieval with metafields
   - GraphQL query handling

5. **Admin Components**
   - ✅ `ShopifyProductPicker` - Search and link products
   - ✅ `FlavourIngredientSelector` - Manage ingredients with drag-and-drop
   - ✅ `SyncStatusIndicator` - Show sync status and trigger resync

6. **Admin Pages**
   - ✅ Flavour edit page integrated with new components
   - ✅ Ingredient create/edit pages have all required fields (latinName, description, dietaryFlags)

7. **Database Helpers** (`lib/db.js`)
   - ✅ `getSyncJobs()` and `saveSyncJobs()`
   - ✅ `getSyncLogs()` and `saveSyncLogs()`

8. **Storefront Components** (`components/product/`)
   - ✅ `IngredientDisplay` - Show ingredients by category with seasonal indicators
   - ✅ `AllergenWarning` - Display allergen information with icons
   - ✅ `DietaryBadges` - Show dietary flags with color coding
   - ✅ `DietaryFilter` - Filter products by dietary preferences with URL state

### ⏳ Remaining Tasks

9. **Product Page Integration**
   - Fetch metafields from Shopify product
   - Display IngredientDisplay component
   - Display AllergenWarning component
   - Display DietaryBadges component
   - Add caching strategy

10. **Collection Page Integration**
    - Add DietaryFilter component
    - Implement filter logic
    - Update product queries with dietary filters

11. **Admin Enhancements**
    - Add usage count to ingredient cards in list view
    - Add delete protection warning when ingredient is in use
    - Create sync dashboard page at `/admin/sync`
    - Add sync dashboard to admin navigation

12. **Testing**
    - Property-based tests with fast-check (30 properties defined in requirements)
    - Unit tests for API routes
    - Component tests
    - Integration tests

13. **Documentation**
    - API documentation
    - Metafield setup guide in Shopify
    - Admin user guide
    - Update README

## Architecture Overview

```
┌─────────────────┐
│   CMS Admin     │
│  (Ingredients   │
│   & Flavours)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Sync Queue     │─────▶│  Shopify Admin   │
│  (Metafields)   │      │  API (GraphQL)   │
└─────────────────┘      └──────────────────┘
         │                        │
         │                        ▼
         │               ┌──────────────────┐
         │               │ Product          │
         │               │ Metafields:      │
         │               │ - flavour_id     │
         │               │ - ingredient_ids │
         │               │ - allergens      │
         │               │ - dietary_tags   │
         │               │ - seasonal       │
         │               └──────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│  Sync Logs      │      │  Storefront      │
│  (Monitoring)   │      │  (Display)       │
└─────────────────┘      └──────────────────┘
```

## Data Flow

1. **Admin creates/updates flavour** → Links Shopify product → Adds ingredients
2. **On save** → Sync job created → Metafields calculated (allergens, dietary flags)
3. **Sync queue** → Updates Shopify product metafields via Admin API
4. **Storefront** → Fetches product → Reads metafields → Displays ingredients/allergens/dietary info

## Metafield Structure

The following metafields are synced to Shopify products:

```typescript
{
  "custom.flavour_id": "flavour_123",           // CMS flavour ID
  "custom.ingredient_ids": ["ing_1", "ing_2"],  // Array of ingredient IDs
  "custom.allergens": ["dairy", "nuts"],        // Calculated allergen list
  "custom.dietary_tags": ["vegetarian"],        // Calculated dietary flags
  "custom.seasonal_ingredients": true           // Has seasonal ingredients
}
```

## Next Steps

1. ✅ Create storefront components
2. ⏳ Integrate components into product page (`app/products/[handle]/page.tsx`)
3. ⏳ Integrate DietaryFilter into collection pages
4. ⏳ Add usage count to ingredient list
5. ⏳ Create sync dashboard
6. ⏳ Write tests
7. ⏳ Update documentation

## Environment Variables Required

```env
# Shopify Admin API (for metafield sync)
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com

# Shopify Storefront API (for product display)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxx
```

## Testing the Integration

1. **Create an ingredient** at `/admin/ingredients/create`
2. **Create a flavour** at `/admin/flavours/create`
3. **Edit the flavour** → Add ingredients → Link Shopify product
4. **Save** → Sync should trigger automatically
5. **Check sync status** → Should show "Synced" with timestamp
6. **View product page** → Should display ingredients, allergens, dietary badges

## Shopify Metafield Setup

Navigate to: **Settings → Custom Data → Products**

Add these metafield definitions:

1. **Flavour ID**
   - Namespace and key: `custom.flavour_id`
   - Type: Single line text
   - Description: Links this product to a CMS flavour

2. **Ingredient IDs**
   - Namespace and key: `custom.ingredient_ids`
   - Type: JSON
   - Description: Array of ingredient IDs

3. **Allergens**
   - Namespace and key: `custom.allergens`
   - Type: JSON
   - Description: Calculated allergen list

4. **Dietary Tags**
   - Namespace and key: `custom.dietary_tags`
   - Type: JSON
   - Description: Dietary compatibility flags (vegan, gluten-free, etc.)

5. **Seasonal Ingredients**
   - Namespace and key: `custom.seasonal_ingredients`
   - Type: Boolean
   - Description: Indicates if product contains seasonal ingredients
