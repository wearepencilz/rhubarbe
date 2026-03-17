# Tasks: Shopify-CMS Integration Enhancement

## Task 1: Update Data Models and Database Schema

### 1.1 Update Ingredient Model
- [ ] Add `latinName` field (optional string)
- [ ] Add `dietaryFlags` field (array of DietaryFlag)
- [ ] Add `description` field (optional string)
- [ ] Update TypeScript interfaces in types file
- [ ] Update database schema documentation

### 1.2 Update Flavour Model
- [ ] Add `shopifyProductId` field (optional string for GID)
- [ ] Add `syncStatus` field (enum: synced, pending, failed, not_linked)
- [ ] Add `lastSyncedAt` field (optional ISO timestamp)
- [ ] Add `syncError` field (optional string)
- [ ] Update TypeScript interfaces

### 1.3 Create FlavourIngredient Relationship Model
- [ ] Create interface with ingredientId, quantity, displayOrder, notes
- [ ] Update Flavour model to use FlavourIngredient array
- [ ] Add validation for displayOrder uniqueness

### 1.4 Create Sync Models
- [ ] Create SyncJob interface
- [ ] Create SyncLog interface
- [ ] Add database helper functions for sync data

**References:** Design sections "Data Models", "Database Schema"

---

## Task 2: Implement Core API Endpoints

### 2.1 Enhance Ingredients API
- [ ] Update GET /api/ingredients with pagination, search, filters
- [ ] Update POST /api/ingredients with duplicate name check
- [ ] Update PUT /api/ingredients/:id
- [ ] Update DELETE /api/ingredients/:id with usage check
- [ ] Add GET /api/ingredients/:id/usage endpoint

### 2.2 Enhance Flavours API
- [ ] Update PUT /api/flavours/:id to handle ingredients array
- [ ] Add allergen auto-calculation logic
- [ ] Add dietary flag auto-determination logic
- [ ] Add sync queue trigger on product link
- [ ] Add GET /api/flavours/:id/ingredients endpoint

### 2.3 Create Shopify Integration API
- [ ] Create GET /api/shopify/products endpoint with search
- [ ] Create POST /api/shopify/sync endpoint
- [ ] Create GET /api/shopify/sync/status/:jobId endpoint
- [ ] Implement Shopify Admin API client
- [ ] Add rate limiting middleware

**References:** Design sections "API Interfaces", Requirements US-1, US-2, US-3

---

## Task 3: Implement Sync Queue System

### 3.1 Create Sync Queue Infrastructure
- [ ] Implement SyncJob creation and storage
- [ ] Implement SyncLog creation and storage
- [ ] Create sync queue processor
- [ ] Add retry logic with exponential backoff
- [ ] Implement rate limiter for Shopify API

### 3.2 Implement Metafield Sync Logic
- [ ] Create function to build metafield payload
- [ ] Implement Shopify metafield update via Admin API
- [ ] Add error handling and logging
- [ ] Update flavour sync status after sync
- [ ] Create manual resync endpoint

**References:** Design sections "Metafield Synchronization", "Error Handling"

---

## Task 4: Build Admin UI Components

### 4.1 Enhance Ingredient Manager
- [ ] Add search and filter UI
- [ ] Add dietary flags to ingredient form
- [ ] Add latin name field
- [ ] Add description field
- [ ] Show usage count on ingredient cards
- [ ] Add delete protection warning

### 4.2 Create Flavour Ingredient Selector
- [ ] Build ingredient search modal
- [ ] Implement multi-select with quantities
- [ ] Add drag-and-drop reordering
- [ ] Show real-time allergen calculation
- [ ] Add dietary conflict warnings

### 4.3 Create Shopify Product Picker
- [ ] Build product search UI
- [ ] Display product preview cards
- [ ] Add product selection handler
- [ ] Add unlink functionality
- [ ] Show validation errors

### 4.4 Build Sync Status Dashboard
- [ ] Create sync status list view
- [ ] Add status indicators (synced, pending, failed, not_linked)
- [ ] Add manual resync button
- [ ] Create sync error detail modal
- [ ] Add sync history timeline
- [ ] Show sync health metrics

**References:** Design sections "Components and Interfaces", Requirements US-1, US-2, US-3, US-7

---

## Task 5: Build Storefront Components

### 5.1 Create Ingredient Display Component
- [ ] Build ingredient list layout
- [ ] Add ingredient categorization
- [ ] Show ingredient images
- [ ] Display quantities
- [ ] Add seasonal indicators
- [ ] Make mobile-responsive

### 5.2 Create Allergen Warning Component
- [ ] Design prominent allergen display
- [ ] Add allergen icons
- [ ] Make accessible (ARIA labels)
- [ ] Add "Contains" and "May contain" sections

### 5.3 Create Dietary Badges Component
- [ ] Design badge UI (vegan, gluten-free, etc.)
- [ ] Add badge icons
- [ ] Support multiple sizes
- [ ] Make accessible

### 5.4 Create Dietary Filter Component
- [ ] Build filter checkbox UI
- [ ] Add product count badges
- [ ] Implement filter state management
- [ ] Add URL state persistence
- [ ] Add "Clear all" action

**References:** Design sections "Components and Interfaces", Requirements US-5, US-6

---

## Task 6: Integrate Components into Pages

### 6.1 Update Flavour Edit Page
- [ ] Add FlavourIngredientSelector component
- [ ] Add ShopifyProductPicker component
- [ ] Add SyncStatusIndicator
- [ ] Wire up save handlers
- [ ] Add validation

### 6.2 Update Product Page
- [ ] Fetch flavour data from metafields
- [ ] Add IngredientDisplay component
- [ ] Add AllergenWarning component
- [ ] Add DietaryBadges component
- [ ] Implement caching strategy

### 6.3 Update Collection Pages
- [ ] Add DietaryFilter component
- [ ] Implement filter logic
- [ ] Update product queries with filters
- [ ] Add filter state to URL

### 6.4 Create Sync Dashboard Page
- [ ] Create /admin/sync route
- [ ] Add SyncDashboard component
- [ ] Wire up resync handlers
- [ ] Add to admin navigation

**References:** Requirements US-1, US-5, US-6, US-7

---

## Task 7: Implement Error Handling

### 7.1 Add Validation Error Handling
- [ ] Create validation error response format
- [ ] Add field-level error messages
- [ ] Display errors in UI forms
- [ ] Add client-side validation

### 7.2 Add Shopify API Error Handling
- [ ] Implement rate limit handling
- [ ] Add retry logic for failures
- [ ] Log all API errors
- [ ] Display user-friendly error messages

### 7.3 Add Database Error Handling
- [ ] Implement fallback to file system (dev)
- [ ] Add connection error handling
- [ ] Log database errors
- [ ] Display maintenance messages

### 7.4 Add Resource Conflict Handling
- [ ] Check dependencies before deletion
- [ ] Return conflict errors with details
- [ ] Display resolution steps in UI

**References:** Design section "Error Handling"

---

## Task 8: Write Tests

### 8.1 Write Property-Based Tests
- [ ] Set up fast-check library
- [ ] Create ingredient arbitrary generator
- [ ] Write Property 1: Ingredient Data Persistence
- [ ] Write Property 11: Allergen Auto-Calculation
- [ ] Write Property 12: Dietary Flag Auto-Determination
- [ ] Write Property 14: Complete Metafield Synchronization
- [ ] Write Property 17: Sync Retry Logic
- [ ] Configure 100+ iterations per test

### 8.2 Write Unit Tests for API Routes
- [ ] Test POST /api/ingredients (valid, duplicate, invalid)
- [ ] Test DELETE /api/ingredients (unused, in-use)
- [ ] Test PUT /api/flavours/:id (link product, update ingredients)
- [ ] Test POST /api/shopify/sync
- [ ] Test error responses

### 8.3 Write Component Tests
- [ ] Test FlavourIngredientSelector (add, remove, reorder)
- [ ] Test ShopifyProductPicker (search, select, unlink)
- [ ] Test IngredientDisplay (render, allergens, dietary)
- [ ] Test DietaryFilter (select, clear, count)

### 8.4 Write Integration Tests
- [ ] Test flavour-product linking flow
- [ ] Test sync queue processing
- [ ] Test ingredient display on product page
- [ ] Test dietary filtering on collection page

**References:** Design section "Testing Strategy", all 30 correctness properties

---

## Task 9: Documentation and Deployment

### 9.1 Update Documentation
- [ ] Update API documentation
- [ ] Document metafield setup in Shopify
- [ ] Create admin user guide
- [ ] Update README with new features

### 9.2 Environment Configuration
- [ ] Add Shopify Admin API token to .env
- [ ] Configure rate limiting settings
- [ ] Set up Vercel Blob for images
- [ ] Configure Redis/KV for production

### 9.3 Deployment
- [ ] Run all tests
- [ ] Build production bundle
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production

**References:** Requirements "Dependencies", "Technical Constraints"

---

## Task Priority

**Phase 1 (Core Functionality):**
- Task 1: Data Models
- Task 2: API Endpoints
- Task 3: Sync Queue

**Phase 2 (Admin UI):**
- Task 4: Admin Components
- Task 6.1: Flavour Edit Page
- Task 6.4: Sync Dashboard

**Phase 3 (Storefront):**
- Task 5: Storefront Components
- Task 6.2: Product Page
- Task 6.3: Collection Pages

**Phase 4 (Quality & Launch):**
- Task 7: Error Handling
- Task 8: Testing
- Task 9: Documentation & Deployment

---

**Status**: Ready for implementation  
**Estimated Effort**: 3-4 weeks  
**Next Step**: Begin Task 1 (Data Models)
