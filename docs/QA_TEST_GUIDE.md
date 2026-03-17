# QA Test Guide - Janine CMS

## Overview

This document outlines all implemented QA tests and manual testing procedures for the Janine ice cream CMS platform.

## Automated Tests (Legacy CMS - `src/cms/`)

### Test Framework
- **Framework**: Vitest + React Testing Library
- **Location**: `src/cms/__tests__/`
- **Run Command**: `npm test` (if configured)

### 1. CMSDashboard Comprehensive Tests
**File**: `src/cms/__tests__/CMSDashboard.comprehensive.test.jsx`

#### Navigation Tests
- ✅ Renders all navigation tabs (Projects, News, Pages, Home Page, Tags, Settings)
- ✅ Switches sections when clicking navigation tabs
- ✅ Highlights active section

#### Projects Section Tests
- ✅ Displays projects list
- ✅ Shows empty state when no projects
- ✅ Navigates to new project page
- ✅ Navigates to edit page when clicking project row
- ✅ Displays project images
- ✅ Displays project categories
- ✅ Shows project links

#### Delete Operations Tests
- ✅ Opens delete dialog when clicking delete in dropdown
- ✅ Deletes project when confirmed
- ✅ Cancels deletion when clicking cancel
- ✅ Deletes news items

#### News Section Tests
- ✅ Displays news list when switching to news tab
- ✅ Formats dates correctly
- ✅ Navigates to new article page

#### Pages Section Tests
- ✅ Displays static pages list (About, Services, FAQ, Terms, Privacy)
- ✅ Navigates to page editor

#### Logout Tests
- ✅ Logs out when clicking sign out button

### 2. Form Validation Tests
**File**: `src/cms/__tests__/formValidation.test.jsx`

- ✅ Prevents ProjectForm submission without required fields
- ✅ Prevents NewsForm submission without required fields
- ✅ Allows ProjectForm submission with all required fields

### 3. Data Persistence Tests
**File**: `src/cms/__tests__/dataPersistence.test.jsx`

- ✅ Preserves existing fields when updating settings
- ✅ Verifies all fields are maintained during partial updates

### 4. Component Tests

#### ProjectForm Tests
**File**: `src/cms/__tests__/ProjectForm.test.jsx`
- Form rendering and validation
- Field interactions
- Save/cancel operations

#### NewsForm Tests
**File**: `src/cms/__tests__/NewsForm.test.jsx`
- Form rendering and validation
- Field interactions
- Save/cancel operations

#### SettingsForm Tests
**File**: `src/cms/__tests__/SettingsForm.test.jsx`
- Settings form rendering
- Field updates
- Data persistence

#### UI Component Tests
**File**: `src/components/ui/__tests__/`
- Card component rendering
- TagInput comprehensive tests (rendering, selection, filtering)

## Manual Testing Procedures (New CMS - `app/admin/`)

### Authentication Tests

#### Login Flow
1. Navigate to `/admin/login`
2. Test invalid credentials → Should show error
3. Test valid credentials (`admin` / `admin123`) → Should redirect to dashboard
4. Verify session persistence on page refresh
5. Test logout → Should redirect to login page

### Ingredients Management

#### Create Ingredient
1. Navigate to `/admin/ingredients`
2. Click "New Ingredient"
3. Fill required fields:
   - Name (required)
   - Slug (auto-generated)
   - Type (select from dropdown)
4. Optional fields:
   - Description
   - Origin
   - Provenance story
   - Tasting notes
   - Image upload
5. Save and verify in list

#### Edit Ingredient
1. Click on existing ingredient
2. Modify fields
3. Save and verify changes persist
4. Check that slug updates if name changes

#### Delete Ingredient
1. Click delete button
2. Confirm deletion
3. Verify removed from list

#### Seed Ingredients
1. Navigate to `/admin/ingredients/seed`
2. Test three modes:
   - **Skip**: Doesn't overwrite existing
   - **Merge**: Updates existing, adds new
   - **Replace**: Deletes all, adds seed data
3. Download example file
4. Upload custom JSON file
5. Verify seeded data appears correctly

### Flavours Management

#### Create Flavour
1. Navigate to `/admin/flavours`
2. Click "New Flavour"
3. Fill required fields:
   - Name
   - Type (Gelato/Sorbet/Special)
   - Status (Active/Archived/Upcoming/Draft)
4. Select ingredients:
   - Primary ingredients
   - Optional ingredients
5. Set format eligibility:
   - Soft Serve (default: eligible)
   - Twist, Pint, Sandwich (requires explicit selection)
6. Save and verify

#### Edit Flavour
1. Click on existing flavour
2. Modify fields
3. Verify ingredient relationships maintained
4. Save and check changes

#### Seed Flavours
1. Navigate to `/admin/flavours/seed`
2. Test seed modes (skip/merge/replace)
3. Download example file
4. Upload custom JSON
5. Verify relationships to ingredients work

### Formats Management

#### Create Format
1. Navigate to `/admin/formats`
2. Click "New Format"
3. Fill fields:
   - Name (e.g., "Soft Serve", "Twist")
   - Category (frozen/experience/bundle)
   - Serving style
   - Min/max flavours
4. Configure options:
   - Requires flavours
   - Allow mixed types
   - Can include add-ons
5. Save and verify

#### Edit Format
1. Click on existing format
2. Modify configuration
3. Save and verify offerings using this format still work

### Offerings Management

#### Create Offering
1. Navigate to `/admin/offerings`
2. Click "New Offering"
3. Select format (determines flavour constraints)
4. Select flavours (respects format min/max)
5. Fill details:
   - Internal name
   - Public name
   - Description
   - Price (required for Shopify sync)
6. Configure:
   - Status (draft/scheduled/active/sold-out/archived)
   - Inventory tracking
   - Online orderable
   - Pickup only
7. Save and verify

#### Edit Offering
1. Click on existing offering
2. Note: Format and flavours cannot be changed
3. Update price, description, status
4. Save and verify

#### Link to Shopify Product
1. Edit an offering
2. Scroll to "Shopify Integration"
3. Use ShopifyProductPicker to search and select existing product
4. Save and verify link

#### Create Shopify Product from Offering
1. Edit an offering
2. Ensure price > $0
3. Click "✨ Create New Shopify Product"
4. Verify:
   - Success message appears
   - Offering refreshes and shows linked product
   - Product appears in Shopify Admin
   - Product has correct:
     - Title: "{Flavour Names} - {Format Name}"
     - Price from offering
     - Tags from offering + format + flavour types
     - Metafields linking back to CMS

### Batches Management

#### Create Batch
1. Navigate to `/admin/batches/create`
2. Select flavour
3. Fill batch details:
   - Batch number
   - Production date
   - Quantity
   - Notes
4. Save and verify

#### View Batch History
1. Navigate to flavour detail page
2. View associated batches
3. Verify batch tracking works

### Shopify Integration Tests

#### Connection Test
1. Run: `npx tsx scripts/test-shopify-connection.ts`
2. Verify:
   - Environment variables loaded
   - Authentication successful
   - Can query products
   - Returns sample products

#### Product Creation Test
1. Create offering with valid price
2. Click "Create Shopify Product"
3. Monitor server logs for:
   - GraphQL request
   - Response status
   - Product creation success
4. Verify in Shopify Admin:
   - Product exists
   - Correct price
   - Correct tags
   - Metafields present

#### Product Linking Test
1. Create offering
2. Use ShopifyProductPicker
3. Search for existing product
4. Select and save
5. Verify link persists

### Data Seeding Tests

#### Unified Seed Page
1. Navigate to `/admin/seed`
2. Test seeding both ingredients and flavours at once
3. Verify:
   - Both datasets load
   - Relationships maintained
   - No data corruption

#### Custom Seed Upload
1. Download example JSON
2. Modify data
3. Upload custom file
4. Verify custom data loads correctly

### Image Upload Tests

#### Development Mode
1. Upload image in any form
2. Verify saved to `/public/uploads/`
3. Verify image displays correctly
4. Check filename has timestamp prefix

#### Production Mode (if deployed)
1. Upload image
2. Verify uploaded to Vercel Blob
3. Verify URL returned
4. Check image accessible

### API Endpoint Tests

#### Ingredients API
- `GET /api/ingredients` - List all
- `GET /api/ingredients/[id]` - Get single
- `POST /api/ingredients` - Create
- `PUT /api/ingredients/[id]` - Update
- `DELETE /api/ingredients/[id]` - Delete
- `POST /api/ingredients/seed` - Seed data

#### Flavours API
- `GET /api/flavours` - List all
- `GET /api/flavours/[id]` - Get single
- `POST /api/flavours` - Create
- `PUT /api/flavours/[id]` - Update
- `DELETE /api/flavours/[id]` - Delete
- `POST /api/flavours/seed` - Seed data

#### Formats API
- `GET /api/formats` - List all
- `GET /api/formats/[id]` - Get single
- `POST /api/formats` - Create
- `PUT /api/formats/[id]` - Update
- `DELETE /api/formats/[id]` - Delete

#### Offerings API
- `GET /api/offerings` - List all
- `GET /api/offerings/[id]` - Get single
- `POST /api/offerings` - Create
- `PUT /api/offerings/[id]` - Update
- `DELETE /api/offerings/[id]` - Delete
- `POST /api/offerings/[id]/create-shopify-product` - Create Shopify product
- `GET /api/offerings/[id]/validate` - Validate offering

### Error Handling Tests

#### Validation Errors
1. Try creating offering without price
2. Try creating Shopify product with price = $0
3. Verify helpful error messages shown
4. Verify UI prevents invalid operations

#### Network Errors
1. Disconnect network
2. Try saving data
3. Verify error message shown
4. Reconnect and retry

#### Authentication Errors
1. Clear session
2. Try accessing protected route
3. Verify redirect to login
4. Login and verify redirect back

## Test Coverage Gaps

### Areas Needing Tests

1. **Batches Management** - No automated tests
2. **Offerings CRUD** - No automated tests
3. **Formats CRUD** - No automated tests
4. **Shopify Integration** - Only manual tests
5. **Image Upload** - No automated tests
6. **Seeding System** - No automated tests
7. **API Endpoints** - No integration tests
8. **Authentication** - No automated tests

### Recommended Test Additions

1. **E2E Tests** (Playwright/Cypress)
   - Full user workflows
   - Multi-step processes
   - Cross-page navigation

2. **API Integration Tests**
   - Test all CRUD operations
   - Test error responses
   - Test validation

3. **Component Tests** (New CMS)
   - Test all admin components
   - Test form validation
   - Test data display

4. **Shopify Integration Tests**
   - Mock Shopify API
   - Test product creation
   - Test product linking
   - Test error handling

## Running Tests

### Automated Tests (Legacy)
```bash
# Run all tests
npm test

# Run specific test file
npm test CMSDashboard.comprehensive.test.jsx

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Manual Testing Checklist

Use this checklist for each release:

- [ ] Login/Logout flow
- [ ] Create/Edit/Delete Ingredient
- [ ] Create/Edit/Delete Flavour
- [ ] Create/Edit/Delete Format
- [ ] Create/Edit/Delete Offering
- [ ] Seed ingredients (all modes)
- [ ] Seed flavours (all modes)
- [ ] Upload custom seed file
- [ ] Create Shopify product from offering
- [ ] Link offering to existing Shopify product
- [ ] Upload images
- [ ] Test all API endpoints
- [ ] Verify data persistence
- [ ] Check error handling
- [ ] Test on mobile viewport
- [ ] Test in different browsers

## Bug Reporting

When reporting bugs, include:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots** (if applicable)
5. **Browser/device info**
6. **Console errors** (F12 → Console)
7. **Network errors** (F12 → Network)
8. **Server logs** (from terminal)

## Performance Testing

### Load Testing
1. Create 100+ ingredients
2. Create 50+ flavours
3. Create 20+ offerings
4. Test list page performance
5. Test search/filter performance

### Image Upload Testing
1. Upload large images (>5MB)
2. Upload multiple images simultaneously
3. Test upload progress indicators
4. Verify image optimization

## Security Testing

### Authentication
- [ ] Test session expiration
- [ ] Test CSRF protection
- [ ] Test XSS prevention
- [ ] Test SQL injection prevention (if using SQL)

### Authorization
- [ ] Test protected routes without auth
- [ ] Test API endpoints without auth
- [ ] Test role-based access (if implemented)

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast meets WCAG standards
- [ ] Form labels properly associated
- [ ] Error messages are accessible

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Related Documentation

- [Seeding Guide](SEEDING_GUIDE.md)
- [Shopify Integration Guide](SHOPIFY_INTEGRATION_GUIDE.md)
- [Shopify Product Creation](SHOPIFY_PRODUCT_CREATION.md)
- [Test Shopify Product Creation](TEST_SHOPIFY_PRODUCT_CREATION.md)
- [Image Upload Guide](IMAGE_UPLOAD_GUIDE.md)
