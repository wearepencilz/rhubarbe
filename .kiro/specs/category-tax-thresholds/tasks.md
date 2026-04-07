# Implementation Plan: Category Tax Thresholds

## Overview

Extend the existing per-product tax variant resolution to support category-level quantity aggregation. Add a pure `resolveCategoryVariants` function, CMS-backed tax settings, a Shopify product category fetcher, an admin settings page, and integrate category resolution into all three checkout routes. The existing `resolveVariant` function and per-product behavior remain untouched.

## Tasks

- [x] 1. Create core types and tax settings module
  - [x] 1.1 Create `lib/tax/resolve-category-variants.ts` with TypeScript interfaces
    - Define `CategoryCartItem`, `ThresholdCategory`, `TaxSettings`, and `CategoryVariantResolution` interfaces
    - Export interfaces for use by other modules
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 7.1_

  - [x] 1.2 Create `lib/tax/tax-settings.ts` for reading/writing tax settings
    - Implement `fetchTaxSettings()` using `getByKey('tax_threshold_categories')` from `lib/db/queries/settings.ts`
    - Implement `saveTaxSettings()` using `upsertMany` from `lib/db/queries/settings.ts`
    - Implement `parseTaxSettings()` to validate and parse raw JSONB value, returning `null` for invalid data
    - Filter out entries with threshold < 1 and log warnings
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.2, 5.3_

  - [ ]* 1.3 Write property test for tax settings serialization round-trip
    - **Property 5: Tax settings serialization round-trip**
    - Generate random valid `TaxSettings` objects with fast-check, serialize to JSON, pass through `parseTaxSettings`, verify deep equality
    - **Validates: Requirements 2.2**

  - [ ]* 1.4 Write property test for threshold validation
    - **Property 6: Threshold validation accepts only positive integers**
    - Generate random numbers (integers, floats, negatives, zero, NaN, Infinity) with fast-check, verify validation accepts only integers >= 1
    - **Validates: Requirements 4.6**

- [x] 2. Implement category variant resolution logic
  - [x] 2.1 Implement `resolveCategoryVariants` pure function in `lib/tax/resolve-category-variants.ts`
    - Group items by `shopifyCategory` matching threshold-enabled categories
    - Compute effective units as `quantity × taxUnitCount` for each item
    - Sum effective units per category to get `categoryTotal`
    - If `categoryTotal >= threshold`: assign exempt variant (or taxable with `fallback: true` if exempt is null)
    - If `categoryTotal < threshold`: assign taxable variant with `isExempt: false`
    - Exclude items not in any threshold category from results (return empty array for those)
    - Items with `shopifyCategory: null` are excluded from category resolution
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.2, 3.3, 5.1, 7.1, 7.2, 7.3_

  - [ ]* 2.2 Write property test: category total uses effective units
    - **Property 1: Category total uses effective units**
    - Generate random cart items with varying quantities and taxUnitCount values, verify `categoryTotal` equals `Σ(quantity × taxUnitCount)`
    - **Validates: Requirements 1.1, 7.1, 7.2**

  - [ ]* 2.3 Write property test: variant resolution follows threshold rule
    - **Property 2: Variant resolution follows threshold rule**
    - Generate random carts and thresholds, verify all items in a category get exempt when total >= threshold, taxable when total < threshold
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 2.4 Write property test: categories are counted independently
    - **Property 3: Categories are counted independently**
    - Generate multi-category carts, modify one category's items, verify other categories' resolutions are unchanged
    - **Validates: Requirements 1.4**

  - [ ]* 2.5 Write property test: non-threshold products are unaffected
    - **Property 4: Non-threshold products are unaffected**
    - Generate carts with mixed threshold/non-threshold items, verify non-threshold items are excluded from category resolution results
    - **Validates: Requirements 1.5, 6.1, 6.2**

  - [ ]* 2.6 Write unit tests for `resolveCategoryVariants`
    - Test missing exempt variant fallback (Req 5.1)
    - Test null/empty settings returns no resolutions (Req 2.4)
    - Test invalid threshold entries are ignored (Req 5.3)
    - Test products with null shopifyCategory are excluded (Req 3.3)
    - Test concrete scenarios from Req 7 (box of 4 + 2 singles, box of 6, 2 boxes of 2 + 4 singles)
    - _Requirements: 2.4, 3.3, 5.1, 5.2, 5.3, 7.1, 7.2, 7.3_

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create Shopify product categories fetcher
  - [x] 4.1 Create `lib/shopify/queries/product-categories.ts`
    - Implement `fetchProductCategories(shopifyProductIds: string[])` returning `Map<string, string | null>`
    - Use `shopifyAdminFetch` from `lib/shopify/admin.ts` with a GraphQL query for `productCategory { productTaxonomyNode { name } }`
    - Handle batching if needed (Shopify API limits)
    - Return `null` for products with no category assigned
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Create `app/api/admin/product-categories/route.ts`
    - GET endpoint that queries Shopify Admin API for distinct product categories across all products
    - Protected by admin auth (follow existing `app/api/settings/route.ts` pattern)
    - Return sorted array of unique category names
    - _Requirements: 4.2_

- [x] 5. Create tax settings admin API route
  - [x] 5.1 Create `app/api/admin/tax-settings/route.ts`
    - GET endpoint: read tax settings via `fetchTaxSettings()`, return JSON
    - PUT endpoint: validate payload, save via `saveTaxSettings()`, return updated settings
    - Validate each threshold is a positive integer >= 1 before saving
    - Protected by admin auth
    - _Requirements: 2.1, 2.2, 4.5, 4.6, 4.7_

- [x] 6. Create admin settings page
  - [x] 6.1 Create `app/admin/settings/tax/page.tsx`
    - Client component using React Hook Form (per admin UI rules)
    - Fetch current settings from `/api/admin/tax-settings` on mount
    - Fetch available Shopify product categories from `/api/admin/product-categories`
    - Display table of threshold-enabled categories with editable threshold inputs
    - Add category via select dropdown (filtered to exclude already-added categories)
    - Remove category button on each row
    - Inline validation: threshold must be positive integer >= 1
    - Save button calls PUT `/api/admin/tax-settings`
    - Success/error feedback via toast
    - Follow Untitled UI patterns and Tailwind conventions from admin UI rules
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 6.2 Add "Tax Thresholds" link to admin settings navigation
    - Add link in admin sidebar/nav pointing to `/admin/settings/tax`
    - _Requirements: 4.1_

- [x] 7. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integrate category resolution into checkout routes
  - [x] 8.1 Modify `app/api/checkout/route.ts` to call category resolver
    - After fetching tax configs, fetch tax settings via `fetchTaxSettings()`
    - Fetch Shopify product categories via `fetchProductCategories()` for all cart items with `shopifyProductId`
    - Build `CategoryCartItem[]` from cart items, tax configs, and product categories
    - Call `resolveCategoryVariants()` and apply results (override `merchandiseId` for resolved items)
    - For items not resolved by category, fall through to existing per-product tax logic (unchanged)
    - Handle errors gracefully: if settings fetch or category fetch fails, log and fall through to per-product behavior
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.3, 2.4, 3.1, 5.1, 5.2, 6.1, 6.3_

  - [x] 8.2 Modify `app/api/checkout/cake/route.ts` with same category resolution pattern
    - Same integration pattern as 8.1 applied to the cake checkout route
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.3, 6.3_

  - [x] 8.3 Modify `app/api/checkout/volume/route.ts` with same category resolution pattern
    - Same integration pattern as 8.1 applied to the volume checkout route
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.3, 6.3_

  - [ ]* 8.4 Write integration tests for checkout with category thresholds
    - Test checkout with mocked Shopify API and CMS DB
    - Verify correct variants selected for items in threshold categories
    - Verify per-product behavior unchanged for non-threshold items
    - Verify graceful fallback when settings are missing
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.4, 6.3_

- [x] 9. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with minimum 100 iterations each
- The existing `resolveVariant` function in `lib/tax/resolve-variant.ts` is never modified
- All error paths fall back to taxable variant (safe default per design)
