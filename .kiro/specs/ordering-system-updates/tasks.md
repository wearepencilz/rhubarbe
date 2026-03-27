# Implementation Plan: Ordering System Updates

## Overview

Incremental changes across three order flows (Menu, Catering, Cake) adding new product fields, sidebar UX improvements, multi-day pickup windows, and consistent serves display. All changes extend existing schema, API routes, and React components — no new tables or architectural changes.

## Tasks

- [x] 1. Schema migration and Drizzle schema updates
  - [x] 1.1 Add new columns to `products`, `launches`, `volumeVariants`, `cakeVariants` in `lib/db/schema.ts`
    - `products`: add `nextAvailableDate` (timestamp, nullable), `servesPerUnit` (integer, nullable), `cakeFlavourNotes` (jsonb bilingual, nullable), `cakeDeliveryAvailable` (boolean, default true)
    - `launches`: add `pickupWindowStart` (timestamp, nullable), `pickupWindowEnd` (timestamp, nullable)
    - `volumeVariants`: add `description` (jsonb bilingual, nullable)
    - `cakeVariants`: add `description` (jsonb bilingual, nullable)
    - _Requirements: 2.1, 3.1, 5.1, 6.1, 7.1, 9.2, 11.3_
  - [x] 1.2 Create Drizzle migration file for all column additions
    - Run `drizzle-kit generate` to produce the SQL migration
    - Verify migration applies cleanly with `drizzle-kit push` or manual review
    - _Requirements: 2.1, 3.1, 5.1, 6.1, 7.1, 9.2, 11.3_

- [x] 2. Admin API route updates
  - [x] 2.1 Update `PUT /api/products/[id]` to accept and persist `nextAvailableDate` and `servesPerUnit`
    - Update request body parsing and Drizzle update query
    - Add validation: `servesPerUnit` must be non-negative integer if provided
    - _Requirements: 2.1, 7.1_
  - [x] 2.2 Update `PUT /api/cake-products/[id]` to accept and persist `cakeFlavourNotes` and `cakeDeliveryAvailable`
    - Update request body parsing and Drizzle update query
    - _Requirements: 9.2, 11.3_
  - [x] 2.3 Update `PUT /api/volume-products/[id]` to accept variant `description` in `setVolumeVariants`
    - Include `description` field in volume variant insert/update logic
    - _Requirements: 5.1, 6.1_
  - [x] 2.4 Update `PUT /api/launches/[id]` to accept `pickupWindowStart` and `pickupWindowEnd`
    - Add validation: `pickupWindowEnd` must be >= `pickupWindowStart` when both provided
    - _Requirements: 3.1_
  - [ ]* 2.5 Write property test for field persistence round-trip (Property 12)
    - **Property 12: New field persistence round-trip**
    - Test that writing `nextAvailableDate`, `servesPerUnit`, `cakeFlavourNotes`, `cakeDeliveryAvailable`, `pickupWindowStart`, `pickupWindowEnd`, and variant `description` via admin API and reading back returns the same values
    - **Validates: Requirements 2.1, 3.1, 5.1, 6.1, 7.1, 9.2**

- [x] 3. Storefront API route updates
  - [x] 3.1 Update `GET /api/storefront/volume-products` to include `servesPerUnit` from products and `description` from volumeVariants
    - Update Drizzle query to select new fields
    - _Requirements: 5.2, 6.2, 7.1_
  - [x] 3.2 Update `GET /api/storefront/cake-products` to include `cakeFlavourNotes`, `cakeDeliveryAvailable`, and `serves` from products
    - Update Drizzle query to select new fields
    - _Requirements: 9.3, 11.3, 12.1_
  - [x] 3.3 Update `GET /api/launches` to include `pickupWindowStart` and `pickupWindowEnd` in response
    - Add new columns to the select clause
    - _Requirements: 3.2_

- [x] 4. Checkpoint — Schema and API
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extract pure logic helpers for frontend features
  - [x] 5.1 Create `generatePickupDays(pickupWindowStart, pickupWindowEnd, pickupDate)` utility
    - Returns inclusive array of date strings from start to end, or single pickupDate when window is null
    - Place in `lib/utils/` or co-located with order helpers
    - _Requirements: 3.2, 3.3_
  - [x] 5.2 Create `calculateServesEstimate(items: {quantity, servesPerUnit}[])` utility
    - Returns sum of `quantity × servesPerUnit`, or 0
    - _Requirements: 7.2, 7.3_
  - [x] 5.3 Create `isSundayUnavailable(date: DateValue)` utility for catering date picker
    - Returns true if date is Sunday (day of week === 0)
    - _Requirements: 8.1, 8.3_
  - [x] 5.4 Create `getActivePricingTier(tiers, headcount)` utility
    - Returns the tier with the largest `minPeople` ≤ headcount, or null
    - _Requirements: 10.1, 10.2_
  - [ ]* 5.5 Write property tests for pure logic helpers (Properties 3, 6, 7, 8)
    - **Property 3: Pickup window generates correct inclusive date range**
    - **Property 6: Catering serves estimate equals sum of quantity × servesPerUnit**
    - **Property 7: Sundays are always unavailable in catering date picker**
    - **Property 8: Active pricing tier is the highest-minPeople tier not exceeding headcount**
    - **Validates: Requirements 3.2, 3.3, 7.2, 7.3, 8.1, 8.3, 10.1, 10.2**

- [x] 6. Menu Order frontend changes (`app/order/OrderPageClient.tsx`)
  - [x] 6.1 Show `serves` label on ProductCard below product name when non-null
    - Muted label style consistent with allergen tags
    - _Requirements: 1.1, 1.2, 12.1, 12.3_
  - [x] 6.2 Show "Next available: [date]" below sold-out overlay when `nextAvailableDate` is set
    - Only render when product is sold out AND date is non-null; hide when in stock
    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 6.3 Show pickup date and order cut-off reminder in sidebar
    - Display target pickup date from launch data
    - Display cut-off reminder from `orderCloses`, or opening date if window hasn't opened
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.4 Show selected date confirmation line in sidebar
    - Persistent confirmation line showing the selected pickup date
    - _Requirements: 13.1, 13.2, 13.3_
  - [ ]* 6.5 Write property tests for menu order display logic (Properties 1, 2, 4, 11)
    - **Property 1: Serves label presence matches serves field presence**
    - **Property 2: Next-available date display is conditional on sold-out status and date presence**
    - **Property 4: Order cut-off reminder formatting**
    - **Property 11: Date confirmation line reflects selected date**
    - **Validates: Requirements 1.1, 1.2, 2.2, 2.3, 2.4, 4.2, 4.3, 12.1, 12.3, 13.1, 13.2**

- [x] 7. Catering/Volume Order frontend changes (`app/volume-order/VolumeOrderPageClient.tsx`)
  - [x] 7.1 Show variant `description` below variant label on VolumeProductCard
    - Muted style, only when description is non-empty for current locale
    - _Requirements: 5.2, 5.3, 6.2, 6.3_
  - [x] 7.2 Display "Serves approx. X people" in VolumeInlineCart using `calculateServesEstimate`
    - Omit when sum is 0 or cart is empty; update dynamically on quantity change
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 7.3 Disable Sundays in DatePickerField using `isSundayUnavailable`
    - Pass as `isDateUnavailable` prop; add explanatory note below picker
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 7.4 Show selected date confirmation line in VolumeInlineCart sidebar
    - _Requirements: 13.1, 13.2, 13.3_
  - [ ]* 7.5 Write property test for volume variant description display (Property 5)
    - **Property 5: Volume variant description display matches field presence**
    - **Validates: Requirements 5.2, 5.3, 6.2, 6.3**

- [x] 8. Cake Order frontend changes (`app/cake-order/CakeOrderPageClient.tsx`)
  - [x] 8.1 Show `cakeFlavourNotes` as teaser on CakeProductCard grid card
    - Display below cake name in muted style when non-empty
    - _Requirements: 9.4_
  - [x] 8.2 Show `serves` label on CakeProductCard consistently with menu order styling
    - _Requirements: 12.1, 12.2, 12.3_
  - [x] 8.3 Highlight active pricing tier row based on headcount using `getActivePricingTier`
    - Visually distinguish active tier with background color or border
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 8.4 Add Pickup/Delivery toggle and address input in cake order sidebar
    - Mirror existing catering order pattern; show address field when delivery selected
    - Show warning and block checkout when `cakeDeliveryAvailable` is false and delivery is selected
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [x] 8.5 Show selected date confirmation line in cake order sidebar
    - _Requirements: 13.1, 13.2, 13.3_
  - [ ]* 8.6 Write property tests for cake order logic (Properties 9, 10)
    - **Property 9: Cake delivery blocked when cakeDeliveryAvailable is false**
    - **Property 10: Address field visibility matches delivery selection**
    - **Validates: Requirements 11.2, 11.3, 11.4**

- [x] 9. Admin UI updates
  - [x] 9.1 Add `nextAvailableDate` date picker and `servesPerUnit` number input to product edit page (`app/admin/products/[id]`)
    - _Requirements: 2.1, 7.1_
  - [x] 9.2 Add variant `description` bilingual fields to volume product VariantEditor (`app/admin/volume-products/[id]`)
    - _Requirements: 5.1, 6.1_
  - [x] 9.3 Add `cakeFlavourNotes` bilingual fields and `cakeDeliveryAvailable` toggle to cake product edit page (`app/admin/cake-products/[id]`)
    - _Requirements: 9.2, 11.3_
  - [x] 9.4 Add `pickupWindowStart` / `pickupWindowEnd` date pickers to launch/menu edit page (`app/admin/menus/[id]`)
    - Conditionally shown for seasonal menus; validate end >= start
    - _Requirements: 3.1_

- [x] 10. Final checkpoint — All features integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` with Vitest (already in project stack)
- Pure logic helpers (task 5) are extracted to enable both direct use in components and isolated property testing
- All 13 requirements are covered across tasks 1–9
- All 12 correctness properties are mapped to test sub-tasks
