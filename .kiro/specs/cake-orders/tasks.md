# Implementation Plan: Cake Orders

## Overview

Implement the Cake Orders feature mirroring the existing Volume Orders architecture. The implementation follows a dependency-driven order: schema → queries → API routes → admin pages → storefront page → checkout → webhook/order handling → nav integration.

## Tasks

- [x] 1. Database schema: add cake fields and tables
  - [x] 1.1 Add cake product fields to the `products` table in `lib/db/schema.ts`
    - Add `cakeEnabled` (boolean, default false), `cakeDescription` (bilingual JSONB), `cakeInstructions` (bilingual JSONB), `cakeMinPeople` (integer) fields
    - Follow the same pattern as the existing `volumeEnabled`, `volumeDescription`, `volumeInstructions`, `volumeMinOrderQuantity` fields
    - _Requirements: 1.1_

  - [x] 1.2 Create `cakeLeadTimeTiers` table in `lib/db/schema.ts`
    - Define table with `id` (UUID PK), `productId` (FK to products, cascade delete), `minPeople` (integer), `leadTimeDays` (integer), `createdAt` (timestamp)
    - Add index on `productId`
    - Mirror `volumeLeadTimeTiers` but use `minPeople` instead of `minQuantity`
    - _Requirements: 1.2, 1.4_

  - [x] 1.3 Create `cakeVariants` table in `lib/db/schema.ts`
    - Define table with `id` (UUID PK), `productId` (FK to products, cascade delete), `label` (bilingual JSONB), `shopifyVariantId` (text, nullable), `sortOrder` (integer, default 0), `active` (boolean, default true), `createdAt` (timestamp)
    - Add indexes on `productId` and `sortOrder`
    - Mirror `volumeVariants` table structure
    - _Requirements: 1.3, 1.4_

  - [x] 1.4 Generate and run the database migration
    - Run `npx drizzle-kit generate` and `npx drizzle-kit push` (or the project's migration command) to apply schema changes
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Database queries module for cake products
  - [x] 2.1 Create `lib/db/queries/cake-products.ts` with CRUD query functions
    - Implement `listCakeProducts()` — all cake-enabled products with tier count, ordered by name (mirror `listVolumeProducts`)
    - Implement `listNonCakeProducts()` — candidates where `cakeEnabled = false`, ordered by name
    - Implement `getCakeProductById(id)` — single product with tiers + variants
    - Implement `updateCakeConfig(id, data)` — update cake fields on product (`cakeEnabled`, `cakeDescription`, `cakeInstructions`, `cakeMinPeople`)
    - Implement `getCakeLeadTimeTiers(productId)` — tiers ordered by ascending `minPeople`
    - Implement `setCakeLeadTimeTiers(productId, tiers)` — validate ascending `minPeople`, then delete+insert in a transaction (mirror `setLeadTimeTiers`)
    - Implement `getCakeVariants(productId)` — variants ordered by `sortOrder`
    - Implement `setCakeVariants(productId, variants)` — delete+insert in a transaction (mirror `setVolumeVariants`)
    - Follow the exact patterns from `lib/db/queries/volume-products.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.2 Write unit tests for cake product query functions
    - Test `setCakeLeadTimeTiers` rejects non-ascending `minPeople` values
    - Test `listCakeProducts` returns only cake-enabled products
    - _Requirements: 2.6_

- [x] 3. Cake Admin API routes
  - [x] 3.1 Create `app/api/cake-products/route.ts` with GET and POST handlers
    - GET: return cake-enabled products (or candidates with `?candidates=true`), require auth, return 401 if unauthenticated
    - POST: accept `productId`, set `cakeEnabled = true`, return 201, require auth, return 404 if product not found
    - Mirror `app/api/volume-products/route.ts` patterns exactly
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 2.8_

  - [x] 3.2 Create `app/api/cake-products/[id]/route.ts` with GET and PUT handlers
    - GET: return cake product with tiers and variants, require auth, return 404 if not found
    - PUT: update cake config fields, lead time tiers (with ascending `minPeople` validation returning 400), and variants; require auth, return 404 if not found
    - Mirror `app/api/volume-products/[id]/route.ts` patterns exactly
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 3.3 Write integration tests for cake admin API routes
    - Test auth guard returns 401 for unauthenticated requests
    - Test 404 for non-existent product IDs
    - Test 400 for non-ascending `minPeople` tiers on PUT
    - _Requirements: 2.6, 2.7, 2.8_

- [x] 4. Cake Storefront API route
  - [x] 4.1 Create `app/api/storefront/cake-products/route.ts` with public GET handler
    - Return all products where `cakeEnabled = true` AND at least one `cake_lead_time_tiers` row exists
    - Include: id, name, slug, image, price, shopifyProductId, cakeDescription, cakeInstructions, cakeMinPeople, allergens, lead time tiers (ordered by ascending `minPeople`), and variants (mapped to storefront shape with bilingual labels, price, shopifyVariantId)
    - No authentication required
    - Mirror `app/api/storefront/volume-products/route.ts` patterns, substituting cake tables/fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.2 Write unit tests for cake storefront API
    - Test that only cake-enabled products with tiers are returned
    - Test that tiers are ordered by ascending `minPeople`
    - _Requirements: 3.1, 3.3_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Cake Admin List Page
  - [x] 6.1 Create `app/admin/cake-products/page.tsx` — cake products list page
    - Display a table of cake-enabled products with columns: Product (name + image), Min People, Lead Time Tiers (count), Status
    - Display badge count of total cake products in the page header
    - Include "Add Product" button that opens a modal listing non-cake-enabled products with search filtering
    - On product selection in modal, POST to `/api/cake-products` and refresh the list
    - Row click navigates to `/admin/cake-products/[id]`
    - Use shared `Table`, `TableCard`, `Badge`, `Button` components
    - Mirror `app/admin/volume-products/page.tsx` patterns, substituting cake fields (minPeople instead of minQty)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 7. Cake Admin Edit Page
  - [x] 7.1 Create `app/admin/cake-products/[id]/page.tsx` — cake product edit page
    - Display product name as page title with back link to `/admin/cake-products`
    - Provide enable/disable toggle with `ConfirmModal` when disabling
    - Provide "Minimum Number of People" input
    - Provide interface to add/edit/remove lead time tiers with `minPeople` and `leadTimeDays` fields
    - Client-side validation: reject non-ascending `minPeople` values before saving
    - Provide bilingual (EN/FR) textarea fields for Cake Description and Cake Instructions using `TranslationFields` and `AdminLocaleSwitcher`
    - Save sends PUT to `/api/cake-products/[id]`, show success/error toast
    - Track unsaved changes using `EditPageLayout` dirty-state pattern
    - Include links to product's main admin page and Shopify admin page
    - Mirror `app/admin/volume-products/[id]/page.tsx` patterns, substituting cake fields (minPeople for minQuantity, cakeDescription for volumeDescription, etc.)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [x] 8. Cake Email Template Page
  - [x] 8.1 Create `app/admin/cake-products/email-template/page.tsx` — cake order confirmation email template editor
    - Provide bilingual (EN/FR) input for email subject and textarea for email body using `TranslationFields` and `AdminLocaleSwitcher`
    - Display reference panel listing available template variables: `{{orderNumber}}`, `{{customerName}}`, `{{pickupDate}}`, `{{numberOfPeople}}`, `{{eventType}}`, `{{variantBreakdown}}`, `{{specialInstructions}}`, `{{totalQuantity}}`
    - Save sends PUT to `/api/settings/email-templates/cake-order-confirmation`, show success/error toast
    - Validate English subject and body are non-empty before saving
    - Use `cake-order-confirmation` template key for storage and retrieval
    - Mirror `app/admin/volume-products/email-template/page.tsx` patterns, substituting cake-specific variables
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Checkpoint - Ensure all admin pages render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Cake Order Storefront Page
  - [x] 10.1 Create `app/cake-order/page.tsx` server component and `app/cake-order/CakeOrderPageClient.tsx` client component
    - Fetch and display cake-enabled products from `/api/storefront/cake-products` in a responsive grid (2 columns mobile, 3 columns desktop)
    - Display per product: image (or brand-color placeholder), name, price, description, allergen badges, variant quantity inputs
    - Display lead time tier info per product, highlighting the active tier based on selected number of people
    - Provide a "Number of People" input that drives lead time calculation across all cart items
    - Provide a date picker for Pickup Date with minimum date calculated from the maximum lead time across all cart items
    - Display warning and disable checkout if pickup date is earlier than calculated earliest date
    - Provide Event Type dropdown with options: birthday, wedding, corporate, other
    - Provide Special Instructions textarea
    - Enforce pickup-only fulfillment (no delivery toggle)
    - Enable checkout button when items in cart and valid pickup date selected
    - Display minimum-not-met warning and disable checkout if product total quantity is below `cakeMinPeople`
    - Persist cart to localStorage under `rhubarbe:cake:cart` key and report cart count to navigation context
    - Use `T.cakeOrder` translation namespace for full bilingual support
    - Mirror `app/volume-order/VolumeOrderPageClient.tsx` patterns, substituting cake-specific fields and removing delivery toggle
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.13, 8.14, 8.15_

  - [x] 10.2 Implement inline cart sidebar (desktop) and fixed bottom checkout bar (mobile)
    - Desktop: sticky sidebar showing grouped line items, subtotal, item count, allergen summary, number of people, date picker, event type, special instructions, checkout button
    - Mobile: fixed bottom bar with item count, subtotal, and checkout button
    - Checkout sends POST to `/api/checkout/cake` and redirects to Shopify checkout URL on success
    - _Requirements: 8.4, 8.12, 8.16_

- [x] 11. Cake Checkout API route
  - [x] 11.1 Create `app/api/checkout/cake/route.ts` with POST handler
    - Accept request body: `items`, `pickupDate`, `numberOfPeople`, `eventType`, `specialInstructions`, `locale`
    - Validate: return 400 if no items ("No items in cart"), return 400 if pickup date missing ("Pickup date is required")
    - Resolve Shopify variant IDs for each line item; return 422 listing unresolvable variants
    - Apply convention-based tax-exempt variant substitution using `findExemptVariant` (same logic as volume checkout)
    - Create Shopify cart with attributes: Order Type "cake", Cake Product ID, Pickup Date, Fulfillment Type "pickup", Number of People, Event Type, Special Instructions (if provided)
    - Generate bilingual order note with: order type, pickup date, number of people, event type, line items with quantities, special instructions
    - Return `{ checkoutUrl, cartId }`
    - Mirror `app/api/checkout/volume/route.ts` patterns, substituting cake-specific attributes and enforcing pickup-only
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 11.2 Write unit tests for cake checkout API
    - Test 400 response for empty items
    - Test 400 response for missing pickup date
    - Test that Fulfillment Type is always "pickup"
    - _Requirements: 4.4, 4.6, 4.7_

- [x] 12. Cake order handling in webhook/order processing
  - [x] 12.1 Update the `orders` table `orderType` field to support "cake" value
    - Ensure the `orderType` field on the `orders` table accepts "cake" in addition to "launch" and "volume" (update enum or comment if applicable)
    - _Requirements: 9.1_

  - [x] 12.2 Update the Shopify order webhook handler to process cake orders
    - When a Shopify order webhook is received with Order Type attribute "cake", store the order with `orderType = "cake"`
    - Store the pickup date in `fulfillmentDate`
    - Store special instructions in `allergenNotes`
    - Extract and store cake-specific metadata (number of people, event type) from the Shopify order note or attributes
    - _Requirements: 9.2, 9.3_

- [x] 13. Admin Navigation integration
  - [x] 13.1 Add "Cake Products" link to the admin sidebar in `app/admin/components/AdminSidebar.tsx`
    - Add a "Cake" nav item with href `/admin/cake-products` in the "Ordering" section
    - Position it near the existing "Volume" link (e.g., directly after it)
    - _Requirements: 10.1, 10.2_

- [x] 14. Add `T.cakeOrder` translation namespace
  - [x] 14.1 Add cake order translations to the i18n translation files
    - Add EN and FR translations for all storefront strings under a `cakeOrder` namespace
    - Include: title, subtitle, quantity, minimum, leadTimeTitle, yourOrder, noItems, startHint, estTotal, items, taxNote, pickup, date, earliest, eventType, eventOptions (birthday, wedding, corporate, other), specialInstructions, checkout, mobileCheckout, loading, checkoutError, loadError, noProducts, numberOfPeople, dateWarning, minWarning, noDateError
    - Mirror the `volumeOrder` namespace structure
    - _Requirements: 8.15_

- [x] 15. Wire cake cart count into navigation context
  - [x] 15.1 Update `OrderItemsContext` (or equivalent) to support cake cart count
    - Add `setCakeCount` and `cakeCount` to the order items context, mirroring `setVolumeCount`/`volumeCount`
    - Ensure the navigation badge reflects cake cart items
    - _Requirements: 8.14_

- [x] 16. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The implementation closely mirrors the existing Volume Orders feature — use the volume code as a direct template for each corresponding cake component
