# Implementation Plan: Quebec Tax Variant Switcher

## Overview

Implement Quebec tax law compliance via a dual-variant strategy. Products get configurable tax behavior (always taxable, always exempt, or quantity-threshold). For threshold products, a tax-exempt Shopify variant is lazily created. At checkout, a pure `resolveVariant()` function picks the correct variant based on effective unit count. All logic lives in the existing Next.js app.

## Tasks

- [x] 1. Add tax columns to the products schema and generate migration
  - [x] 1.1 Add `taxBehavior`, `taxThreshold`, `taxUnitCount`, and `shopifyTaxExemptVariantId` columns to the `products` table in `lib/db/schema.ts`
    - `taxBehavior`: `text('tax_behavior').notNull().default('always_taxable')`
    - `taxThreshold`: `integer('tax_threshold').notNull().default(6)`
    - `taxUnitCount`: `integer('tax_unit_count').notNull().default(1)`
    - `shopifyTaxExemptVariantId`: `text('shopify_tax_exempt_variant_id')`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Generate and apply the Drizzle migration
    - Run `npx drizzle-kit generate` to create the SQL migration file
    - Run `npx drizzle-kit migrate` to apply it
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement the pure `resolveVariant()` function
  - [x] 2.1 Create `lib/tax/resolve-variant.ts` with `TaxConfig`, `VariantResolution` types and the `resolveVariant()` function
    - Export `TaxConfig` interface: `{ taxBehavior, taxThreshold, taxUnitCount, shopifyTaxExemptVariantId }`
    - Export `VariantResolution` interface: `{ variantId, isExempt, effectiveUnits, fallback }`
    - `always_taxable` → return default variant, `isExempt: false`
    - `always_exempt` → return exempt variant if non-null, else fallback to default with `fallback: true`
    - `quantity_threshold` → compute `effectiveUnits = cartQuantity × taxUnitCount`, compare to threshold
    - If exempt variant is null when needed, fallback to taxable with `fallback: true`
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 2.2 Write property test: determinism (Property 1 — same inputs always produce same output)
    - **Property 1: Deterministic variant selection**
    - **Validates: Requirements 7.1, 7.6**

  - [ ]* 2.3 Write property test: threshold boundary (Property 2 — effectiveUnits ≥ threshold → exempt, < threshold → taxable)
    - **Property 2: Threshold boundary correctness**
    - **Validates: Requirements 7.3, 7.4, 7.5**

  - [ ]* 2.4 Write property test: bundle multiplication (Property 3 — effectiveUnits = cartQuantity × taxUnitCount)
    - **Property 3: Bundle unit multiplication**
    - **Validates: Requirements 7.2, 5.4**

  - [ ]* 2.5 Write property test: fallback safety (Property 4 — null exempt variant always falls back to taxable)
    - **Property 4: Null exempt variant fallback**
    - **Validates: Requirements 5.7, 7.6**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Shopify exempt variant creation and price sync
  - [x] 4.1 Create `lib/tax/create-exempt-variant.ts`
    - Use existing `shopifyAdminFetch` from `lib/shopify/admin.ts`
    - Add "Tax Mode" option with values ["Standard", "Exempt"] via `productOptionsCreate` with `LEAVE_AS_IS` strategy
    - Create "Exempt" variant at same price via `productVariantsBulkCreate`
    - Set `taxable: false` on the new variant via `productVariantUpdate`
    - Convert Admin GID to Storefront GID (base64 encode `gid://shopify/ProductVariant/{numericId}`)
    - Return `{ storefrontVariantId, adminVariantId }`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Create `lib/tax/sync-exempt-variant-price.ts`
    - Accept `shopifyProductId`, `exemptVariantAdminId`, `newPrice`
    - Use `productVariantsBulkUpdate` to update the exempt variant price
    - _Requirements: 4.1_

- [x] 5. Add `getTaxConfigByIds` batch query to the product query layer
  - [x] 5.1 Add `getTaxConfigByIds(productIds: string[])` to `lib/db/queries/products.ts`
    - Accept an array of product IDs, return `Map<string, TaxConfig>` with tax fields for each
    - Use a single `SELECT ... WHERE id IN (...)` query via Drizzle's `inArray`
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 6. Integrate variant resolution into checkout APIs
  - [x] 6.1 Modify `/api/checkout/route.ts` to resolve tax variants
    - After resolving Shopify variant IDs, fetch tax config for all products via `getTaxConfigByIds`
    - For each cart line, call `resolveVariant()` to determine the correct variant GID
    - Replace `merchandiseId` with the resolved variant when applicable
    - Log fallback warnings
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 6.2 Modify `/api/checkout/volume/route.ts` to resolve tax variants
    - Same pattern: fetch tax config, call `resolveVariant()` per item using item `quantity` as `cartQuantity`
    - Replace `merchandiseId` with the resolved variant
    - Log fallback warnings
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add "Tax & Shipping" section to the admin product edit page
  - [x] 8.1 Create a `TaxShippingSection` component in `app/admin/components/TaxShippingSection.tsx`
    - Tax Behavior dropdown: "Always taxable" / "Always exempt" / "Quantity threshold" using Untitled UI `Select`
    - Tax Threshold integer input (visible only when `quantity_threshold`) using Untitled UI `Input`
    - Tax Unit Count integer input (visible only when `quantity_threshold`) using Untitled UI `Input`
    - Tax-Exempt Variant read-only text showing stored GID or "Not linked" (visible only when `quantity_threshold`)
    - Pickup Only toggle (moved from Availability section into this section) using Untitled UI `Checkbox`
    - White card with header, `border-gray-200`, matching existing admin card patterns
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 8.2 Integrate `TaxShippingSection` into `app/admin/products/[id]/page.tsx`
    - Add tax fields to `formData` state: `taxBehavior`, `taxThreshold`, `taxUnitCount`, `shopifyTaxExemptVariantId`
    - Place the section in the right column below the Shopify integration card
    - Load tax fields from the product API response in `fetchData`
    - Remove `pickupOnly` from the Availability section (now in Tax & Shipping)
    - _Requirements: 2.1, 2.5, 2.6_

- [x] 9. Wire exempt variant creation into the product save flow
  - [x] 9.1 Update `PUT /api/products/[id]` to handle tax fields and trigger exempt variant creation
    - Accept `taxBehavior`, `taxThreshold`, `taxUnitCount` in the request body
    - Persist tax fields to the products table
    - If `taxBehavior === 'quantity_threshold'` and product has a `shopifyProductId` but no `shopifyTaxExemptVariantId`, call `createTaxExemptVariant()`
    - Store the returned Storefront GID in `shopifyTaxExemptVariantId`
    - On Shopify API failure, return error message to admin (don't set the GID)
    - When tax behavior changes away from `quantity_threshold`, retain existing GID (no deletion)
    - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 9.2 Update the product sync flow to call `syncExemptVariantPrice` when price changes
    - In the existing Shopify sync logic within `PUT /api/products/[id]`, if product has a non-null `shopifyTaxExemptVariantId` and price changed, call `syncExemptVariantPrice()`
    - Log warning on failure, don't block the save
    - _Requirements: 4.1, 4.2_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the core `resolveVariant()` correctness properties
- The new schema columns default to `always_taxable` / 6 / 1 / null, so existing products need zero data migration
- The exempt variant is created lazily on save, not via batch migration
