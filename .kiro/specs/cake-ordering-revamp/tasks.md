# Implementation Plan: Cake Ordering Revamp

## Overview

Extend the existing cake ordering system to support four new product types (XXL, Croquembouche, Tiered Wedding Cakes, Wedding Cake Tasting) with a two-axis pricing grid (size × flavour), flavour configuration, tier detail metadata, and add-on product linking. Legacy single-axis products continue working unchanged. Implementation follows: schema → queries → API routes → admin UI → storefront UI → checkout → tests.

## Tasks

- [x] 1. Extend database schema with new tables and fields
  - [x] 1.1 Add new product fields to the `products` table in `lib/db/schema.ts`
    - Add `cakeProductType` (text, nullable) for product type discriminator
    - Add `cakeFlavourConfig` (JSONB, nullable) for flavour array
    - Add `cakeTierDetailConfig` (JSONB, nullable) for tier detail array
    - Add `cakeMaxFlavours` (integer, nullable) for croquembouche multi-flavour limit
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create the `cake_pricing_grid` table in `lib/db/schema.ts`
    - Define columns: id (UUID PK), productId (FK cascade), sizeValue (text), flavourHandle (text), priceInCents (integer), shopifyVariantId (text, nullable), createdAt
    - Add unique index on (productId, sizeValue, flavourHandle)
    - Add index on productId
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.3 Create the `cake_addon_links` table in `lib/db/schema.ts`
    - Define columns: id (UUID PK), parentProductId (FK cascade), addonProductId (FK cascade), sortOrder (integer), createdAt
    - Add unique index on (parentProductId, addonProductId)
    - Add index on parentProductId
    - _Requirements: 3.1, 3.2_

  - [x] 1.4 Generate and run the Drizzle migration
    - Run `npx drizzle-kit generate` and `npx drizzle-kit migrate` to apply schema changes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2_

- [x] 2. Extend database queries in `lib/db/queries/cake-products.ts`
  - [x] 2.1 Add `getCakePricingGrid(productId)` and `setCakePricingGrid(productId, rows)` query functions
    - `getCakePricingGrid` returns all grid rows ordered by sizeValue, flavourHandle
    - `setCakePricingGrid` replaces grid rows in a transaction (delete + insert)
    - _Requirements: 2.1, 2.4_

  - [x] 2.2 Add `getCakeAddonLinks(productId)` and `setCakeAddonLinks(productId, links)` query functions
    - `getCakeAddonLinks` returns linked add-on product IDs with sort order
    - `setCakeAddonLinks` replaces addon links in a transaction (delete + insert)
    - _Requirements: 3.1, 3.2_

  - [x] 2.3 Extend `getCakeProductById(id)` to include pricing grid, addon links, and new product fields
    - Return `cakeProductType`, `cakeFlavourConfig`, `cakeTierDetailConfig`, `cakeMaxFlavours`, pricing grid rows, and addon links alongside existing data
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.4 Extend `updateCakeConfig(id, data)` to accept new fields
    - Accept `cakeProductType`, `cakeFlavourConfig`, `cakeTierDetailConfig`, `cakeMaxFlavours` in the update payload
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

- [x] 3. Add shared helper `resolvePricingGridPrice` in `lib/utils/order-helpers.ts`
  - Implement `resolvePricingGridPrice(grid, sizeValue, flavourHandle)` as a pure function
  - Returns `{ priceInCents, shopifyVariantId } | null`
  - Used by both storefront client (price display) and checkout API (variant resolution)
  - _Requirements: 2.4, 7.3, 8.3_

- [x] 4. Checkpoint — Ensure schema, queries, and helpers compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extend admin API routes
  - [x] 5.1 Extend `GET /api/cake-products/[id]` to return new fields
    - Return pricing grid, addon links, cakeProductType, cakeFlavourConfig, cakeTierDetailConfig, cakeMaxFlavours
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.2 Extend `PUT /api/cake-products/[id]` to accept and persist new fields
    - Accept and save cakeProductType, cakeFlavourConfig, cakeTierDetailConfig, cakeMaxFlavours
    - Accept and save pricing grid rows via `setCakePricingGrid`
    - Accept and save addon links via `setCakeAddonLinks`
    - Validate that all active (size, flavour) combinations have a price before saving
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Extend admin edit page `app/admin/cake-products/[id]/page.tsx`
  - [x] 6.1 Add Product Type selector section
    - Dropdown for `cakeProductType` with options: null (Legacy), cake-xxl, croquembouche, wedding-cake-tiered, wedding-cake-tasting
    - Show `cakeMaxFlavours` input when product type is `croquembouche`
    - _Requirements: 4.1, 4.6_

  - [x] 6.2 Add Flavour Config list editor section
    - List editor for `cakeFlavourConfig` entries with: handle, bilingual label, bilingual description, pricingTierGroup, sortOrder, active toggle
    - Use TranslationFields pattern for bilingual fields
    - _Requirements: 4.2_

  - [x] 6.3 Add Tier Detail editor section
    - List editor for `cakeTierDetailConfig` entries with: sizeValue, layers, diameters, bilingual label
    - _Requirements: 4.3_

  - [x] 6.4 Add Pricing Grid editor section
    - Editable table with sizes as columns and flavours as rows
    - Price entry in dollars (stored in cents) and Shopify variant ID per cell
    - Client-side validation that all active (size, flavour) cells have a price before save
    - _Requirements: 4.4, 4.5_

  - [x] 6.5 Add Add-On Links editor section
    - Product picker to link/unlink add-on products with sort order
    - _Requirements: 3.4_

- [x] 7. Checkpoint — Ensure admin pages render and save correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Extend storefront API `GET /api/storefront/cake-products`
  - Return new fields: cakeProductType, cakeFlavourConfig (active only, sorted by sortOrder), cakeTierDetailConfig, cakeMaxFlavours, pricingGrid rows
  - Return linked add-on products with their own pricing data
  - Derive available size options from distinct sizeValue entries in the pricing grid
  - Continue returning legacy products with existing pricingTiers unchanged
  - Exclude products with no pricing data (no tiers and no grid)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.2_

- [ ] 9. Extend storefront page `app/cake/CakeOrderPageClient.tsx`
  - [ ] 9.1 Add product type branching logic
    - Legacy products (`cakeProductType = null`) use existing single-axis flow unchanged
    - Wedding cake tasting renders as simple fixed-price add-to-cart with no flavour/size selection
    - Grid-based products use new two-axis flow
    - _Requirements: 1.5, 6.5, 9.1_

  - [ ] 9.2 Add flavour variant expansion beneath product cards
    - When a product card is selected, expand a flavour list beneath it showing bilingual label and description
    - Radio-style selection for XXL and wedding cakes (single flavour)
    - Multi-select up to `cakeMaxFlavours` for croquembouche, with limit message
    - Show contact note when flavour handle is `custom`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [ ] 9.3 Extend sidebar cart with size selection and grid-based price resolution
    - Size selector labeled "Guests"/"Invités" for XXL/wedding, "Choux" for croquembouche
    - Resolve price from pricing grid using `resolvePricingGridPrice(grid, sizeValue, flavourHandle)`
    - Display selected flavour name(s) and tax note
    - _Requirements: 7.1, 7.2, 7.3, 7.8_

  - [ ] 9.4 Add tier detail display and visual tier diagram in sidebar
    - Display layers and diameters for the selected size from `cakeTierDetailConfig`
    - Render a visual tier diagram (SVG/CSS stacked layers) that updates with size selection
    - _Requirements: 7.4, 7.5_

  - [ ] 9.5 Add add-on toggles in sidebar
    - Display linked add-on products with price resolved from selected size (flavourHandle = 'default')
    - Disable add-on toggles when no size is selected
    - _Requirements: 7.6, 7.7_

  - [ ] 9.6 Implement cart persistence with cascading removal
    - Persist selected product, flavour(s), size, add-ons, and computed price to localStorage under `rhubarbe:cake:cart`
    - When main product is removed, also remove associated add-on items
    - _Requirements: 8.1, 8.2_

- [ ] 10. Checkpoint — Ensure storefront renders all product types correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Extend checkout API `POST /api/checkout/cake`
  - Resolve Shopify variant IDs from pricing grid for grid-based products using `resolvePricingGridPrice`
  - Handle both legacy (direct shopifyVariantId) and grid-based (sizeValue + flavourHandle lookup) items in the same cart
  - Store selected flavour(s) in Shopify cart attributes
  - Generate bilingual order note listing product, flavour(s), size, add-ons, and special instructions
  - For croquembouche, list selected flavour names (up to 2) in the order note
  - Return 422 if any line item's Shopify variant ID cannot be resolved
  - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 9.3_

- [ ] 12. Checkpoint — Ensure checkout works for all product types
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Property-based tests and unit tests
  - [ ]* 13.1 Write property test for price resolution routing (Property 1)
    - **Property 1: Price resolution routing by product type**
    - Generate random products with random `cakeProductType` values (including null), verify correct pricing path is selected
    - **Validates: Requirements 1.5, 2.4, 9.1**

  - [ ]* 13.2 Write property test for pricing grid lookup (Property 2)
    - **Property 2: Pricing grid lookup correctness**
    - Generate random pricing grids and lookup keys, verify `resolvePricingGridPrice` returns correct entry or null
    - **Validates: Requirements 3.3, 7.3, 8.3**

  - [ ]* 13.3 Write property test for pricing grid completeness validation (Property 3)
    - **Property 3: Pricing grid completeness validation**
    - Generate random sets of active flavours and sizes with partial grids, verify validation returns exactly the missing cells
    - **Validates: Requirements 4.5**

  - [ ]* 13.4 Write property test for croquembouche flavour limit (Property 4)
    - **Property 4: Croquembouche flavour selection limit**
    - Generate random flavour lists and maxFlavours values, simulate toggle sequences, verify count never exceeds max
    - **Validates: Requirements 6.4**

  - [ ]* 13.5 Write property test for size options derived from grid (Property 5)
    - **Property 5: Size options derived from pricing grid**
    - Generate random pricing grids, verify derived sizes equal the distinct sizeValue set
    - **Validates: Requirements 5.2**

  - [ ]* 13.6 Write property test for cart serialization round-trip (Property 6)
    - **Property 6: Cart serialization round-trip**
    - Generate random cart states, serialize and deserialize, verify equality
    - **Validates: Requirements 8.1**

  - [ ]* 13.7 Write property test for cart cascading removal (Property 7)
    - **Property 7: Cart cascading removal**
    - Generate random carts with 0–5 add-ons, remove main product, verify empty cart
    - **Validates: Requirements 8.2**

  - [ ]* 13.8 Write property test for order note completeness (Property 8)
    - **Property 8: Order note completeness**
    - Generate random checkout requests, verify note contains all expected strings
    - **Validates: Requirements 8.5, 8.6**

  - [ ]* 13.9 Write property test for unresolvable variant 422 (Property 9)
    - **Property 9: Unresolvable variant produces 422**
    - Generate random grids and checkout items with missing grid matches, verify 422 response
    - **Validates: Requirements 8.7**

  - [ ]* 13.10 Write property test for tier detail lookup (Property 10)
    - **Property 10: Tier detail lookup by size**
    - Generate random tier detail configs and size values, verify correct entry or null
    - **Validates: Requirements 7.4**

  - [ ]* 13.11 Write unit tests for `resolvePricingGridPrice`
    - Test exact match, no match, add-on with `default` handle, empty grid
    - _Requirements: 2.4, 7.3, 8.3_

  - [ ]* 13.12 Write unit tests for admin pricing grid validation
    - Test complete grid, partial grid, empty grid, inactive flavours excluded
    - _Requirements: 4.5_

  - [ ]* 13.13 Write unit tests for order note generation
    - Test all fields populated, optional fields null, croquembouche with 2 flavours, legacy item
    - _Requirements: 8.5, 8.6_

- [ ] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Legacy single-axis products (`cakeProductType = null`) must remain fully functional throughout
