# Tasks: Three-Layer CMS Architecture

## Overview

Implementation of the 3-layer CMS architecture (Formats → Flavours → Offerings) for Janine. This restructures the CMS to separate product formats, flavour entities, and sellable offerings, enabling flexible menu management and eliminating content duplication.

---

## Phase 1: Core Data Models & Types

### Task 1.1: Extend TypeScript Types
- [ ] Add Format interface to types/index.ts
- [ ] Add enhanced Flavour interface with format eligibility flags
- [ ] Add Offering interface
- [ ] Add Bundle interface
- [ ] Add Component interface
- [ ] Add SeasonalCollection interface
- [ ] Add validation types (ValidationError, ValidationResult)
- [ ] Add helper types (OfferingFull, FlavourWithUsage, etc.)

### Task 1.2: Create Data Files
- [ ] Create public/data/formats.json
- [ ] Create public/data/offerings.json
- [ ] Create public/data/bundles.json
- [ ] Create public/data/components.json
- [ ] Create public/data/seasonal-collections.json

### Task 1.3: Add Database Helpers
- [ ] Add getFormats() and saveFormats() to lib/db.js
- [ ] Add getOfferings() and saveOfferings() to lib/db.js
- [ ] Add getBundles() and saveBundles() to lib/db.js
- [ ] Add getComponents() and saveComponents() to lib/db.js
- [ ] Add getSeasonalCollections() and saveSeasonalCollections() to lib/db.js

---

## Phase 2: Format Management

### Task 2.1: Format API Routes
- [ ] Create app/api/formats/route.ts (GET, POST)
- [ ] Create app/api/formats/[id]/route.ts (GET, PUT, DELETE)
- [ ] Add format validation logic
- [ ] Add usage checking before deletion

### Task 2.2: Format Admin UI
- [ ] Create app/admin/formats/page.tsx (list view)
- [ ] Create app/admin/formats/create/page.tsx
- [ ] Create app/admin/formats/[id]/page.tsx (edit view)
- [ ] Create FormatList component
- [ ] Create FormatCard component
- [ ] Create FormatForm component
- [ ] Create FormatConstraints component
- [ ] Add format icons/images

### Task 2.3: Seed Default Formats
- [ ] Create migration script to seed default formats
- [ ] Add formats: Soft Serve, Twist, Pint, Sandwich, Tasting, Combo
- [ ] Configure constraints for each format

---

## Phase 3: Enhanced Flavour Management

### Task 3.1: Update Flavour Model
- [ ] Add type field (gelato/sorbet/special/tasting-component)
- [ ] Add baseStyle field (dairy/non-dairy/fruit/cheese/other)
- [ ] Add shortDescription field
- [ ] Add keyNotes array
- [ ] Add colour field
- [ ] Add season field
- [ ] Add availabilityStatus field
- [ ] Add canBeUsedInTwist flag
- [ ] Add canBeSoldAsPint flag
- [ ] Add canBeUsedInSandwich flag
- [ ] Add sortOrder and featured fields

### Task 3.2: Update Flavour API
- [ ] Update GET /api/flavours with new filters (type, baseStyle, twistEligible)
- [ ] Update POST /api/flavours with new fields
- [ ] Update PUT /api/flavours/[id] with new fields
- [ ] Create GET /api/flavours/[id]/usage endpoint

### Task 3.3: Update Flavour Admin UI
- [ ] Add FormatEligibilitySelector component
- [ ] Add BaseStyleSelector component
- [ ] Add FlavourUsagePanel component
- [ ] Update flavour create page with new fields
- [ ] Update flavour edit page with new fields
- [ ] Add usage tracking display

---

## Phase 4: Offering Management

### Task 4.1: Offering API Routes
- [ ] Create app/api/offerings/route.ts (GET, POST)
- [ ] Create app/api/offerings/[id]/route.ts (GET, PUT, DELETE)
- [ ] Create app/api/offerings/[id]/full/route.ts (with populated relationships)
- [ ] Create app/api/offerings/[id]/validate/route.ts
- [ ] Add format constraint validation
- [ ] Add twist validation logic
- [ ] Add pint validation logic
- [ ] Add sandwich validation logic

### Task 4.2: Offering Admin UI - Core
- [ ] Create app/admin/offerings/page.tsx (list view)
- [ ] Create app/admin/offerings/create/page.tsx
- [ ] Create app/admin/offerings/[id]/page.tsx (edit view)
- [ ] Create OfferingList component
- [ ] Create OfferingCard component
- [ ] Create OfferingForm component

### Task 4.3: Offering Admin UI - Selectors
- [ ] Create FormatSelector component
- [ ] Create FlavourSelector component (format-aware)
- [ ] Create TwistBuilder component
- [ ] Create InventoryPanel component
- [ ] Create AvailabilityScheduler component

### Task 4.4: Offering Validation
- [ ] Implement format constraint checking
- [ ] Implement twist eligibility checking
- [ ] Implement pint eligibility checking
- [ ] Implement sandwich eligibility checking
- [ ] Add real-time validation in UI

---

## Phase 5: Bundle & Component Management

### Task 5.1: Component Management
- [ ] Create app/api/components/route.ts (GET, POST)
- [ ] Create app/api/components/[id]/route.ts (GET, PUT, DELETE)
- [ ] Create app/admin/components/page.tsx
- [ ] Create app/admin/components/create/page.tsx
- [ ] Create app/admin/components/[id]/page.tsx
- [ ] Create ComponentList component
- [ ] Create ComponentForm component

### Task 5.2: Bundle Management
- [ ] Create app/api/bundles/route.ts (GET, POST)
- [ ] Create app/api/bundles/[id]/route.ts (GET, PUT, DELETE)
- [ ] Create app/api/bundles/[id]/validate-choice/route.ts
- [ ] Create app/admin/bundles/page.tsx
- [ ] Create app/admin/bundles/create/page.tsx
- [ ] Create app/admin/bundles/[id]/page.tsx
- [ ] Create BundleList component
- [ ] Create BundleForm component
- [ ] Create BundleItemSelector component
- [ ] Create ChoiceRuleBuilder component
- [ ] Create PricingCalculator component

---

## Phase 6: Seasonal Collections

### Task 6.1: Collection API
- [ ] Create app/api/collections/route.ts (GET, POST)
- [ ] Create app/api/collections/[id]/route.ts (GET, PUT, DELETE)
- [ ] Create app/api/collections/[id]/offerings/route.ts

### Task 6.2: Collection Admin UI
- [ ] Create app/admin/collections/page.tsx
- [ ] Create app/admin/collections/create/page.tsx
- [ ] Create app/admin/collections/[id]/page.tsx
- [ ] Create CollectionList component
- [ ] Create CollectionForm component
- [ ] Create OfferingMultiSelector component
- [ ] Create CollectionPreview component

---

## Phase 7: Data Migration

### Task 7.1: Migration Scripts
- [ ] Create migration script for existing flavours
- [ ] Migrate flavour data to new schema
- [ ] Create default offerings from existing flavours
- [ ] Preserve Shopify product links
- [ ] Preserve ingredient relationships
- [ ] Create backup of existing data

### Task 7.2: Validation & Testing
- [ ] Verify all flavours migrated correctly
- [ ] Verify all ingredient relationships preserved
- [ ] Verify all Shopify links maintained
- [ ] Test offering creation workflow
- [ ] Test twist creation workflow

---

## Phase 8: Admin Navigation & Polish

### Task 8.1: Update Admin Navigation
- [ ] Add Formats to admin nav
- [ ] Add Offerings to admin nav
- [ ] Add Bundles to admin nav
- [ ] Add Components to admin nav
- [ ] Add Collections to admin nav
- [ ] Update Flavours nav label

### Task 8.2: UI Polish
- [ ] Add loading states to all pages
- [ ] Add error boundaries
- [ ] Add success/error toasts
- [ ] Add confirmation dialogs for deletions
- [ ] Add keyboard shortcuts
- [ ] Improve mobile responsiveness

### Task 8.3: Documentation
- [ ] Update README with new architecture
- [ ] Create admin user guide
- [ ] Document API endpoints
- [ ] Add inline code comments
- [ ] Create migration guide

---

## Phase 9: Testing (Optional but Recommended)

### Task 9.1: Unit Tests
- [ ] Test format validation
- [ ] Test offering validation
- [ ] Test twist validation
- [ ] Test referential integrity checks
- [ ] Test API error handling

### Task 9.2: Integration Tests
- [ ] Test offering creation workflow
- [ ] Test twist creation workflow
- [ ] Test bundle creation workflow
- [ ] Test flavour usage tracking
- [ ] Test migration scripts

### Task 9.3: Property-Based Tests
- [ ] Set up fast-check
- [ ] Create entity generators
- [ ] Implement Property 1-10 (core persistence)
- [ ] Implement Property 11-20 (validation)
- [ ] Implement Property 21-30 (relationships)

---

## Task Priority

**Immediate (Week 1-2):**
- Phase 1: Core Data Models & Types
- Phase 2: Format Management
- Phase 3: Enhanced Flavour Management

**Short-term (Week 3-4):**
- Phase 4: Offering Management
- Phase 7: Data Migration

**Medium-term (Week 5-6):**
- Phase 5: Bundle & Component Management
- Phase 6: Seasonal Collections
- Phase 8: Admin Navigation & Polish

**Optional (Week 7-8):**
- Phase 9: Testing

---

**Status**: Ready for implementation  
**Estimated Effort**: 6-8 weeks  
**Next Step**: Begin Phase 1 - Core Data Models & Types
