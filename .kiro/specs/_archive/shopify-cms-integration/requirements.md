# Requirements: Shopify-CMS Integration Enhancement

## Feature Overview

Enhance the integration between Shopify products and the CMS to enable bidirectional data syncing, ingredient display on product pages, and seamless content management for ice cream products.

## Business Goals

1. **Single Source of Truth** - Ingredients managed in CMS, linked to Shopify products
2. **Rich Product Pages** - Display ingredient details, allergens, and dietary info on storefront
3. **Efficient Management** - Easy linking between CMS flavours and Shopify products
4. **Customer Transparency** - Clear ingredient and allergen information for customers
5. **Scalability** - Support future expansion of product catalog

## User Stories

### US-1: Admin Links Flavour to Shopify Product
**As an** admin  
**I want to** link a CMS flavour to a Shopify product  
**So that** ingredient and content data flows to the storefront

**Acceptance Criteria:**
- Admin can search and select Shopify products when editing a flavour
- System stores both product handle and product ID
- System validates that product exists in Shopify
- Admin sees confirmation when link is successful
- Admin can unlink a product

### US-2: Admin Manages Ingredient Library
**As an** admin  
**I want to** create and manage a library of ingredients  
**So that** I can reuse them across multiple flavours

**Acceptance Criteria:**
- Admin can create ingredients with: name, category, origin, allergens, dietary flags
- Admin can categorize ingredients (base, flavor, mix-in, topping, spice)
- Admin can mark ingredients as seasonal
- Admin can add images to ingredients
- Admin can search and filter ingredients
- System prevents duplicate ingredient names

### US-3: Admin Assigns Ingredients to Flavours
**As an** admin  
**I want to** assign ingredients to a flavour  
**So that** customers see what's in each product

**Acceptance Criteria:**
- Admin can search and select multiple ingredients
- Admin can specify quantity/percentage for each ingredient
- Admin can reorder ingredients (display order)
- System auto-calculates allergens from selected ingredients
- System auto-determines dietary flags (vegan, gluten-free, etc.)
- Admin sees warning if conflicting dietary information

### US-4: System Syncs Metafields to Shopify
**As a** system  
**I want to** sync ingredient data to Shopify metafields  
**So that** product pages can display ingredient information

**Acceptance Criteria:**
- System creates/updates Shopify metafields when flavour is linked
- Metafields include: flavour_id, ingredient_ids, allergens, dietary_tags
- System handles API errors gracefully
- System logs sync operations
- Admin sees sync status in UI
- System can retry failed syncs

### US-5: Customer Views Ingredients on Product Page
**As a** customer  
**I want to** see detailed ingredient information on product pages  
**So that** I can make informed purchasing decisions

**Acceptance Criteria:**
- Product page displays list of ingredients
- Each ingredient shows: name, origin, category
- Allergens are prominently displayed
- Dietary tags are clearly visible (vegan, gluten-free, etc.)
- Seasonal ingredients are marked
- Ingredient images are shown (if available)
- Information is mobile-responsive

### US-6: Customer Filters Products by Dietary Needs
**As a** customer  
**I want to** filter products by dietary requirements  
**So that** I can quickly find suitable options

**Acceptance Criteria:**
- Collection pages show dietary filter options
- Filters include: vegan, gluten-free, dairy-free, nut-free
- Multiple filters can be applied simultaneously
- Filter state persists during browsing
- Product count updates when filters change
- Clear indication when no products match filters

### US-7: Admin Views Shopify Sync Status
**As an** admin  
**I want to** see the sync status of flavours  
**So that** I know which products have up-to-date information

**Acceptance Criteria:**
- Flavour list shows sync status indicator
- Status includes: synced, pending, failed, not linked
- Admin can manually trigger re-sync
- Admin can view sync error details
- Admin receives notification on sync failures
- Dashboard shows overall sync health

### US-8: System Handles Shopify Product Changes
**As a** system  
**I want to** detect when Shopify products are updated or deleted  
**So that** CMS data stays in sync

**Acceptance Criteria:**
- System detects when linked product is deleted in Shopify
- System marks flavour as "unlinked" if product is deleted
- System can optionally use webhooks for real-time updates
- Admin is notified of broken links
- System provides bulk re-linking tool
- System logs all sync events

## Data Requirements

### Ingredient Data Model
```typescript
interface Ingredient {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  latinName?: string;            // Scientific name (optional)
  category: IngredientCategory;  // Classification
  origin: string;                // Source/origin
  allergens: Allergen[];         // Allergen tags
  dietaryFlags: DietaryFlag[];   // Dietary compatibility
  seasonal: boolean;             // Availability
  image?: string;                // Image URL
  description?: string;          // Additional info
  createdAt: string;
  updatedAt: string;
}

type IngredientCategory = 'base' | 'flavor' | 'mix-in' | 'topping' | 'spice';
type Allergen = 'dairy' | 'eggs' | 'nuts' | 'soy' | 'gluten' | 'sesame';
type DietaryFlag = 'vegan' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'nut-free';
```

### Flavour-Ingredient Relationship
```typescript
interface FlavourIngredient {
  ingredientId: string;
  quantity?: string;      // e.g., "30%", "2 cups"
  displayOrder: number;   // Sort order
  notes?: string;         // Special preparation notes
}

interface Flavour {
  id: string;
  name: string;
  description: string;
  ingredients: FlavourIngredient[];
  shopifyProductHandle?: string;
  shopifyProductId?: string;
  syncStatus: 'synced' | 'pending' | 'failed' | 'not_linked';
  lastSyncedAt?: string;
  // ... existing fields
}
```

### Shopify Metafields
```typescript
// Stored in Shopify product metafields
interface ProductMetafields {
  'custom.flavour_id': string;              // CMS flavour ID
  'custom.ingredient_ids': string[];        // Array of ingredient IDs
  'custom.allergens': string[];             // Calculated allergen list
  'custom.dietary_tags': string[];          // vegan, gluten-free, etc.
  'custom.seasonal_ingredients': boolean;   // Has seasonal items
}
```

## Functional Requirements

### FR-1: Ingredient Management
- CRUD operations for ingredients
- Search and filter by category, allergen, dietary flag
- Bulk import from CSV
- Image upload for ingredients
- Duplicate detection

### FR-2: Flavour-Product Linking
- Search Shopify products by name/handle
- Store product handle and GID
- Validate product exists before linking
- Support unlinking
- Bulk linking tool

### FR-3: Metafield Synchronization
- Create/update Shopify metafields via Admin API
- Sync on flavour save
- Retry failed syncs
- Log all sync operations
- Handle rate limiting

### FR-4: Storefront Display
- Fetch ingredient details from CMS API
- Display on product pages
- Show allergen warnings
- Display dietary badges
- Mobile-responsive layout

### FR-5: Filtering & Search
- Filter products by dietary tags
- Filter by allergen exclusion
- Search ingredients
- Combine multiple filters

### FR-6: Admin Dashboard
- Sync status overview
- Failed sync alerts
- Bulk operations
- Audit log

## Non-Functional Requirements

### NFR-1: Performance
- Ingredient list loads in < 500ms
- Product page ingredient display < 200ms
- Sync operations complete in < 5s
- Support 500+ ingredients
- Support 100+ flavours

### NFR-2: Reliability
- 99.9% uptime for CMS API
- Graceful handling of Shopify API failures
- Automatic retry for failed syncs
- Data backup before sync operations

### NFR-3: Security
- Shopify Admin API token stored securely
- API endpoints require authentication
- Rate limiting on public endpoints
- Input validation on all forms

### NFR-4: Usability
- Intuitive ingredient selection UI
- Clear sync status indicators
- Helpful error messages
- Mobile-friendly admin interface

### NFR-5: Maintainability
- Modular code structure
- Comprehensive error logging
- API documentation
- Type safety with TypeScript

## Technical Constraints

1. **Shopify API Limits**
   - Admin API: 2 requests/second
   - Storefront API: No strict limit but throttled
   - Must implement rate limiting

2. **Metafield Limits**
   - Max 250 metafields per product
   - Max 5MB per metafield value
   - JSON metafields must be valid JSON

3. **Next.js Constraints**
   - Server components for data fetching
   - Client components for interactivity
   - API routes for CMS operations

4. **Data Storage**
   - Development: JSON files
   - Production: Vercel KV or Redis
   - Must support both

## Success Metrics

1. **Admin Efficiency**
   - Time to link flavour to product: < 30 seconds
   - Time to add ingredient to flavour: < 15 seconds
   - Sync success rate: > 95%

2. **Customer Experience**
   - Ingredient information visible on 100% of linked products
   - Page load time impact: < 100ms
   - Mobile usability score: > 90

3. **Data Quality**
   - Ingredient data completeness: > 90%
   - Allergen accuracy: 100%
   - Sync data freshness: < 5 minutes

## Out of Scope

- Shopify app development (using API only)
- Real-time webhooks (manual sync for now)
- Multi-language support
- Nutritional information calculation
- Recipe management
- Supplier management
- Inventory tracking

## Dependencies

- Shopify Admin API access token with `write_products` scope
- Shopify Storefront API access
- Vercel Blob for image storage
- Next.js 14+ with App Router
- Existing CMS infrastructure

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Shopify API rate limits | High | Medium | Implement queue system, batch operations |
| Metafield sync failures | Medium | Low | Retry logic, manual re-sync tool |
| Data inconsistency | High | Low | Validation before sync, audit logs |
| Performance degradation | Medium | Low | Caching, lazy loading, pagination |
| Admin API token exposure | High | Low | Environment variables, secure storage |

## Future Enhancements

- Shopify webhook integration for real-time sync
- Nutritional information tracking
- Recipe version control
- Supplier and sourcing information
- Batch-to-product linking
- Customer reviews integration
- Multi-language ingredient names
- Allergen cross-contamination warnings

---

**Status**: Draft  
**Last Updated**: 2026-03-09  
**Next Step**: Design document
