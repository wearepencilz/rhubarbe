# Implementation Plan: Launch-First CMS Model

## Overview

This implementation transforms the Janine CMS from an "offerings-first" to a "launch-first" data model. The work is organized into 9 implementation areas following a 4-phase migration strategy. All code will be written in TypeScript, consistent with the existing Next.js 14.2 codebase.

The migration is non-destructive, preserving all existing data while introducing new structures (Launch, Modifier, Product) and automatic format eligibility based on flavour type.

## Tasks

- [x] 1. Data Model & TypeScript Interfaces
  - [x] 1.1 Create core TypeScript interfaces in types/index.ts
    - Create Ingredient, Flavour, Format, Modifier, Product, Launch, Batch interfaces
    - Add FlavourType, FormatCategory, ModifierType, and other type definitions
    - Add FlavourIngredient, ContentBlock, and supporting interfaces
    - Add validation result interfaces (ValidationResult, ValidationError)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 1.2 Write property test for interface completeness
    - **Property 19: Schema Field Preservation**
    - **Validates: Requirements 0.3**
    - Verify all required fields exist in each interface
    - _Requirements: 0.3_

- [x] 2. Database Layer Updates
  - [x] 2.1 Update lib/db.js with new data access functions
    - Add getLaunches() and saveLaunches(launches)
    - Add getModifiers() and saveModifiers(modifiers)
    - Add getProducts() and saveProducts(products)
    - Add getMigrationStatus() and saveMigrationStatus(status)
    - Keep all existing functions unchanged for backward compatibility
    - _Requirements: 0.4, 11.1, 11.2, 11.3, 11.4_
  
  - [x] 2.2 Create initial JSON data files
    - Create public/data/modifiers.json with empty array
    - Create public/data/products.json with empty array
    - Create public/data/launches.json with empty array
    - Create public/data/migration-status.json with initial status
    - _Requirements: 0.2_
  
  - [x] 2.3 Write unit tests for database functions
    - Test CRUD operations for launches, modifiers, products
    - Test data persistence and retrieval
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 3. Format Eligibility Logic
  - [x] 3.1 Implement lib/format-eligibility.ts
    - Create ELIGIBILITY_RULES constant mapping FlavourType to FormatCategory[]
    - Implement getEligibleFormats(flavourType) function
    - Implement isEligibleForFormat(flavourType, formatCategory) function
    - Implement filterEligibleFlavours(flavours, format) function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 3.2 Write property test for format eligibility
    - **Property 3: Flavour Type Determines Format Eligibility**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6**
    - Test all flavour types return correct eligible formats
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 3.3 Write property test for product format filtering
    - **Property 4: Product Format Filtering**
    - **Validates: Requirements 2.7**
    - Test that only eligible flavours are shown for each format
    - _Requirements: 2.7_

- [x] 4. Validation Engine
  - [x] 4.1 Implement lib/validation.ts with core validation functions
    - Create ValidationResult and ValidationError interfaces
    - Implement validateProductComposition(product, format, flavours, modifiers)
    - Add flavour count validation (min/max)
    - Add type compatibility validation
    - _Requirements: 3.4, 14.5, 14.6_
  
  - [x] 4.2 Add format-specific validation functions
    - Implement validateTwistFormat(product, flavours)
    - Implement validateSandwichFormat(product, flavours, components)
    - Implement validateModifierAvailability(modifier, format)
    - _Requirements: 3.5, 3.6, 4.4, 17.4_
  
  - [x] 4.3 Write property test for type compatibility validation
    - **Property 5: Product Type Compatibility Validation**
    - **Validates: Requirements 3.4, 14.1, 14.2, 14.3, 14.4**
    - Test that incompatible flavour-format combinations are rejected
    - _Requirements: 3.4, 14.1, 14.2, 14.3, 14.4_
  
  - [x] 4.4 Write property test for twist format validation
    - **Property 6: Twist Format Validation**
    - **Validates: Requirements 3.5, 17.4**
    - Test twist requires exactly 2 gelato/sorbet flavours
    - _Requirements: 3.5, 17.4_
  
  - [x] 4.5 Write property test for sandwich format validation
    - **Property 7: Sandwich Format Validation**
    - **Validates: Requirements 3.6, 7.2, 7.3**
    - Test sandwich requires 1 filling + 2 cookie components
    - _Requirements: 3.6, 7.2, 7.3_
  
  - [x] 4.6 Write property test for modifier format restriction
    - **Property 8: Modifier Format Restriction**
    - **Validates: Requirements 4.4**
    - Test modifiers rejected when format disallows them
    - _Requirements: 4.4_
  
  - [x] 4.7 Write property test for flavour count boundaries
    - **Property 14: Flavour Count Boundaries**
    - **Validates: Requirements 14.5, 14.6**
    - Test min/max flavour constraints are enforced
    - _Requirements: 14.5, 14.6_
  
  - [x] 4.8 Write unit tests for validation edge cases
    - Test empty flavour arrays
    - Test null/undefined values
    - Test boundary conditions
    - _Requirements: 3.4, 3.5, 3.6_

- [x] 5. Checkpoint - Core Logic Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. API Endpoints - Launches
  - [x] 6.1 Create app/api/launches/route.ts
    - Implement GET handler with status and featured filtering
    - Implement POST handler with validation
    - Return proper error responses (400, 500)
    - _Requirements: 11.1_
  
  - [x] 6.2 Create app/api/launches/[id]/route.ts
    - Implement GET handler for single launch
    - Implement PUT handler with validation
    - Implement DELETE handler with referential integrity check
    - _Requirements: 11.1_
  
  - [x] 6.3 Write integration tests for launch endpoints
    - Test GET all launches with filters
    - Test POST create launch
    - Test PUT update launch
    - Test DELETE launch
    - _Requirements: 11.1_

- [x] 7. API Endpoints - Modifiers
  - [x] 7.1 Create app/api/modifiers/route.ts
    - Implement GET handler with type, status, formatId filtering
    - Implement POST handler with validation
    - _Requirements: 11.3_
  
  - [x] 7.2 Create app/api/modifiers/[id]/route.ts
    - Implement GET handler for single modifier
    - Implement PUT handler with validation
    - Implement DELETE handler with referential integrity check
    - _Requirements: 11.3_
  
  - [x] 7.3 Write property test for referential integrity on deletion
    - **Property 13: Referential Integrity on Deletion**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 20.5**
    - Test deletion prevented when object is referenced
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 7.4 Write integration tests for modifier endpoints
    - Test GET all modifiers with filters
    - Test POST create modifier
    - Test PUT update modifier
    - Test DELETE with references (should fail)
    - _Requirements: 11.3_

- [x] 8. API Endpoints - Products
  - [x] 8.1 Create app/api/products/route.ts
    - Implement GET handler with status, formatId, onlineOrderable filtering
    - Implement POST handler with full composition validation
    - Use validateProductComposition() from lib/validation.ts
    - Return 400 with ValidationError format on validation failure
    - _Requirements: 11.4, 11.6_
  
  - [x] 8.2 Create app/api/products/[id]/route.ts
    - Implement GET handler with expanded relationships (format, flavours, modifiers)
    - Implement PUT handler with validation
    - Implement DELETE handler with launch reference check
    - _Requirements: 11.4_
  
  - [x] 8.3 Create app/api/products/[id]/sync/route.ts
    - Implement POST handler for Shopify sync
    - Update syncStatus, lastSyncedAt, syncError fields
    - Handle Shopify API errors gracefully (502 response)
    - _Requirements: 13.6, 13.7, 13.9_
  
  - [x] 8.4 Write property test for product name generation
    - **Property 9: Product Name Generation**
    - **Validates: Requirements 5.7**
    - Test descriptive names generated for all compositions
    - _Requirements: 5.7_
  
  - [x] 8.5 Write property test for API validation error format
    - **Property 15: API Validation Error Format**
    - **Validates: Requirements 11.6**
    - Test 400 responses include detailed validation errors
    - _Requirements: 11.6_
  
  - [x] 8.6 Write integration tests for product endpoints
    - Test GET all products with filters
    - Test POST create product with valid composition
    - Test POST create product with invalid composition (should fail)
    - Test PUT update product
    - Test DELETE product
    - Test POST sync to Shopify
    - _Requirements: 11.4, 11.6_

- [x] 9. API Endpoints - Updated Flavours
  - [x] 9.1 Update app/api/flavours/route.ts
    - Add type filtering to GET handler
    - Add formatId filtering (using format eligibility logic)
    - Include eligibleFormats in response for each flavour
    - Update POST handler to require type field
    - _Requirements: 11.5_
  
  - [x] 9.2 Create app/api/formats/[id]/eligible-flavours/route.ts
    - Implement GET handler that returns format and eligible flavours
    - Use filterEligibleFlavours() from lib/format-eligibility.ts
    - _Requirements: 11.5_
  
  - [x] 9.3 Write integration tests for updated flavour endpoints
    - Test GET flavours with type filter
    - Test GET flavours with formatId filter
    - Test eligibleFormats included in response
    - Test GET eligible flavours for format
    - _Requirements: 11.5_

- [x] 10. Checkpoint - API Layer Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Migration Tool - Extraction Logic
  - [x] 11.1 Create lib/migration/extract-modifiers.ts
    - Implement extractModifiers() function
    - Read all offerings and extract unique topping references
    - Create Modifier objects with proper fields
    - Return modifierMap (name -> id) for linking
    - _Requirements: 9.6_
  
  - [x] 11.2 Create lib/migration/create-products.ts
    - Implement createProductsFromOfferings(modifierMap) function
    - Map all Offering fields to Product fields
    - Link extracted modifiers via toppingIds
    - Create OfferingMigrationMap for tracking
    - _Requirements: 9.2, 9.8_
  
  - [x] 11.3 Create lib/migration/migrate-shopify-fields.ts
    - Implement migrateShopifyFields() function
    - Find flavours with Shopify fields
    - Move fields to corresponding products
    - Create default product if no match found
    - Create FlavourShopifyMigration tracking map
    - _Requirements: 9.7, 13.3, 13.4_
  
  - [x] 11.4 Write property test for modifier extraction
    - **Property 10: Modifier Extraction During Migration**
    - **Validates: Requirements 9.6**
    - Test modifiers created from offering toppings
    - _Requirements: 9.6_
  
  - [x] 11.5 Write property test for Shopify field migration
    - **Property 11: Shopify Field Migration**
    - **Validates: Requirements 9.7, 13.3**
    - Test Shopify fields moved from Flavour to Product
    - _Requirements: 9.7, 13.3_
  
  - [x] 11.6 Write property test for orphaned Shopify link preservation
    - **Property 12: Orphaned Shopify Link Preservation**
    - **Validates: Requirements 13.4**
    - Test default product created for orphaned Shopify links
    - _Requirements: 13.4_

- [x] 12. Migration Tool - Validation & Backup
  - [x] 12.1 Create lib/migration/backup.ts
    - Implement createBackup(filename, timestamp) function
    - Copy files to timestamped backup directory
    - Return backup manifest with file list
    - _Requirements: 0.7_
  
  - [x] 12.2 Create lib/migration/validate.ts
    - Implement validateMigration() function
    - Check all offerings have corresponding products
    - Check all Shopify fields migrated
    - Check referential integrity
    - Return validation report with errors/warnings
    - _Requirements: 0.6, 9.9_
  
  - [x] 12.3 Create lib/migration/rollback.ts
    - Implement rollbackToPhase(phase, backupTimestamp) function
    - Restore files from backup
    - Delete new files if rolling back to phase 0
    - Clear migrated data if rolling back to phase 1
    - _Requirements: 0.8_
  
  - [x] 12.4 Write property test for non-destructive migration
    - **Property 1: Non-Destructive Migration Preservation**
    - **Validates: Requirements 0.1, 9.2, 9.3, 9.4, 9.5**
    - Test all original data preserved after migration
    - _Requirements: 0.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 12.5 Write property test for backup creation
    - **Property 2: Migration Backup Creation**
    - **Validates: Requirements 0.7**
    - Test timestamped backups created before changes
    - _Requirements: 0.7_
  
  - [x] 12.6 Write unit tests for migration validation
    - Test detection of missing products
    - Test detection of unmigrated Shopify fields
    - Test detection of broken references
    - _Requirements: 0.6, 9.9_

- [x] 13. Migration API Endpoints
  - [x] 13.1 Create app/api/migration/status/route.ts
    - Implement GET handler returning migration status
    - Include phase, progress, errors, warnings
    - Include backup timestamp if available
    - _Requirements: 0.10_
  
  - [x] 13.2 Create app/api/migration/run/route.ts
    - Implement POST handler to run migration phases
    - Support dryRun parameter for preview
    - Execute backup, extraction, validation in sequence
    - Return detailed change report
    - _Requirements: 0.9_
  
  - [x] 13.3 Create app/api/migration/rollback/route.ts
    - Implement POST handler for rollback
    - Accept backupTimestamp and targetPhase
    - Execute rollback procedure
    - Return success/failure status
    - _Requirements: 0.8_
  
  - [x] 13.4 Write integration tests for migration endpoints
    - Test GET migration status
    - Test POST run migration with dryRun
    - Test POST run migration (actual)
    - Test POST rollback
    - _Requirements: 0.8, 0.9, 0.10_

- [x] 14. Legacy API Compatibility
  - [x] 14.1 Update app/api/offerings/route.ts for backward compatibility
    - Map GET requests to products
    - Transform product data to legacy offering format
    - Add deprecation warning in response headers
    - _Requirements: 21.2_
  
  - [x] 14.2 Write property test for legacy API compatibility
    - **Property 18: Legacy API Compatibility**
    - **Validates: Requirements 21.2**
    - Test legacy endpoints return structurally equivalent responses
    - _Requirements: 21.2_
  
  - [x] 14.3 Write property test for API endpoint continuity
    - **Property 20: API Endpoint Continuity**
    - **Validates: Requirements 0.4**
    - Test all pre-migration endpoints still functional
    - _Requirements: 0.4_

- [x] 15. Checkpoint - Migration Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. CMS Admin UI - Navigation
  - [x] 16.1 Update app/admin/layout.tsx with new navigation structure
    - Reorder navigation: Launches, Menu Items, Flavours, Ingredients, Formats, Modifiers, Batches
    - Rename "Offerings" to "Menu Items"
    - Add "Launches" as first item with rocket icon
    - Add "Modifiers" after Formats with plus-circle icon
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 17. CMS Admin UI - Launch Management
  - [x] 17.1 Create app/admin/launches/page.tsx
    - Display list of all launches with status badges
    - Add filters for status (upcoming, active, ended, archived)
    - Add "Create Launch" button
    - Show featured flag and active date range
    - _Requirements: 6.1, 6.2_
  
  - [x] 17.2 Create app/admin/launches/new/page.tsx
    - Implement multi-step creation workflow
    - Step 1: Basic info (title, slug, status, dates, hero image)
    - Step 2: Story and description
    - Step 3: Featured flavours and products selection
    - Step 4: Content blocks editor
    - Step 5: Related events and membership drops
    - _Requirements: 6.1, 6.2, 20.1, 20.2_
  
  - [x] 17.3 Create app/admin/launches/[id]/page.tsx
    - Implement edit interface with same workflow as creation
    - Show current values in all fields
    - Allow reordering content blocks
    - _Requirements: 6.1, 6.2_

- [x] 18. CMS Admin UI - Modifier Management
  - [x] 18.1 Create app/admin/modifiers/page.tsx
    - Display list of all modifiers with type badges
    - Add filters for type and status
    - Show price and available formats
    - Add "Create Modifier" button
    - _Requirements: 4.1, 4.2_
  
  - [x] 18.2 Create app/admin/modifiers/new/page.tsx
    - Create form with all modifier fields
    - Include type selection dropdown
    - Include format availability multi-select
    - Include allergen and dietary flag checkboxes
    - Include price input (in cents)
    - _Requirements: 4.1, 4.2_
  
  - [x] 18.3 Create app/admin/modifiers/[id]/page.tsx
    - Implement edit form with same fields as creation
    - Show current values
    - Display warning if modifier is referenced by products
    - _Requirements: 4.1, 4.2_

- [x] 19. CMS Admin UI - Product Management
  - [x] 19.1 Rename app/admin/offerings to app/admin/products
    - Update all file paths and imports
    - Update route references
    - _Requirements: 8.2_
  
  - [x] 19.2 Update app/admin/products/new/page.tsx with format-based filtering
    - Step 1: Format selection with rules display
    - Step 2: Flavour selection filtered by format eligibility
    - Show only type-compatible flavours based on selected format
    - Display format rules (min/max flavours, allowed types)
    - Step 3: Modifier selection (only if format allows)
    - Filter modifiers by availableForFormatIds
    - Step 4: Details (names, description, image)
    - Step 5: Pricing
    - Step 6: Availability
    - Step 7: Shopify integration
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 14.7_
  
  - [x] 19.3 Update app/admin/products/[id]/page.tsx
    - Apply same format-based filtering as creation
    - Show validation errors inline
    - Display Shopify sync status
    - Add "Sync to Shopify" button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 20. CMS Admin UI - Flavour Updates
  - [x] 20.1 Update app/admin/flavours/new/page.tsx
    - Add type selection dropdown (required field)
    - Show format eligibility preview based on selected type
    - Display helper text explaining type implications
    - _Requirements: 2.1_
  
  - [x] 20.2 Update app/admin/flavours/[id]/page.tsx
    - Add type field to edit form
    - Show current eligible formats
    - Warn if changing type affects existing products
    - _Requirements: 2.1_

- [x] 21. CMS Admin UI - Migration Dashboard
  - [x] 21.1 Create app/admin/migration/page.tsx
    - Display current migration phase and status
    - Show progress bar with percentage
    - Display migration summary (offerings processed, products created, etc.)
    - List warnings and errors
    - Show backup timestamp
    - Add "Run Migration" button with phase selection
    - Add "Rollback" button
    - Add "Download Report" button
    - _Requirements: 0.9, 0.10_

- [x] 22. Checkpoint - CMS UI Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 23. Public Site Updates
  - [x] 23.1 Create app/launches/page.tsx
    - Display active launches in reverse chronological order
    - Filter by activeStart and activeEnd dates
    - Show hero image, title, and description
    - _Requirements: 12.1, 12.5_
  
  - [x] 23.2 Create app/launches/[slug]/page.tsx
    - Display full launch story and hero image
    - Show featured flavours with links to flavour pages
    - Show featured products with "Add to Cart" buttons
    - Render content blocks in order
    - _Requirements: 12.2, 12.3, 12.4_
  
  - [x] 23.3 Write property test for launch status auto-update
    - **Property 16: Launch Status Auto-Update**
    - **Validates: Requirements 18.4**
    - Test launches auto-update to "ended" after activeEnd
    - _Requirements: 18.4_
  
  - [x] 23.4 Write property test for public flavour filtering
    - **Property 17: Public Flavour Filtering**
    - **Validates: Requirements 18.5**
    - Test only active/seasonal flavours shown on public site
    - _Requirements: 18.5_

- [x] 24. Product Display with Modifiers
  - [x] 24.1 Update product display components to show modifiers
    - Display available modifiers with pricing
    - Add modifier selection UI
    - Calculate total price including modifiers
    - _Requirements: 19.1, 19.2_
  
  - [x] 24.2 Update cart functionality for modifiers
    - Include selected modifiers in cart items
    - Display modifier selections in cart
    - Show modifier pricing in order summary
    - _Requirements: 19.3, 19.4_

- [x] 25. Final Integration & Testing
  - [x] 25.1 Run full migration in development environment
    - Execute all migration phases
    - Validate data integrity
    - Test rollback functionality
    - _Requirements: 9.1, 9.2, 9.9_
  
  - [x] 25.2 Test all CMS workflows end-to-end
    - Create launch with featured content
    - Create modifier and use in product
    - Create product with format validation
    - Sync product to Shopify
    - _Requirements: 5.1, 6.1, 4.1_
  
  - [x] 25.3 Test public site display
    - Verify launches display correctly
    - Verify products show modifiers
    - Verify flavour archive works
    - _Requirements: 12.1, 12.2, 19.1_
  
  - [x] 25.4 Run full test suite and verify coverage
    - Run all 20 property tests
    - Run all unit tests
    - Run all integration tests
    - Verify 80%+ code coverage
    - _Requirements: All_

- [x] 26. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties (20 total)
- Unit tests validate specific examples and edge cases
- Migration is non-destructive - all original data is preserved
- The implementation follows a 4-phase migration strategy: Preparation, Migration, Transition, Cleanup
- TypeScript is used throughout, consistent with the Next.js 14.2 codebase
- All validation logic is centralized in lib/validation.ts
- Format eligibility is automatic based on flavour type
- Shopify integration moves from Flavour to Product level only
