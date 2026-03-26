# Implementation Plan: Volume Sales Ordering

## Overview

Implement a dedicated volume/bulk ordering path separate from the existing launch preorder system. This includes database schema extensions, new API routes, a customer-facing storefront page at `/volume-order`, admin CMS management for volume products and email templates, Shopify checkout integration, webhook processing for volume orders, and automated confirmation emails. Built on the existing Next.js 14 + TypeScript + Drizzle ORM + Shopify Storefront API stack.

## Tasks

- [x] 1. Extend database schema for volume ordering
  - [x] 1.1 Add volume fields to the products table and create volume-specific tables
    - Add `volumeEnabled` boolean flag (default false), `volumeDescription` (Translation_Object JSONB), `volumeInstructions` (Translation_Object JSONB), and `minOrderQuantity` (integer) columns to the `products` table in `lib/db/schema.ts`
    - Create a `volumeLeadTimeTiers` table with columns: `id` (uuid PK), `productId` (FK to products), `minQuantity` (integer), `leadTimeDays` (integer), `createdAt` (timestamp)
    - Create a `volumeVariants` table with columns: `id` (uuid PK), `productId` (FK to products), `label` (Translation_Object JSONB), `shopifyVariantId` (text), `sortOrder` (integer), `createdAt` (timestamp)
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [x] 1.2 Add volume order fields to the orders table
    - Add `orderType` text column (values: "launch" | "volume", default "launch") to the `orders` table in `lib/db/schema.ts`
    - Add `fulfillmentDate` timestamp column to the `orders` table
    - Add `allergenNotes` text column to the `orders` table
    - Add an index on `orderType` for filtering
    - _Requirements: 4.2, 4.3, 4.4, 4.6_

  - [x] 1.3 Create email templates and email log tables
    - Create an `emailTemplates` table with columns: `id` (uuid PK), `templateKey` (text, unique), `subject` (Translation_Object JSONB), `body` (Translation_Object JSONB), `updatedAt` (timestamp)
    - Create an `emailLogs` table with columns: `id` (uuid PK), `recipientEmail` (text), `templateKey` (text), `status` (text: "sent" | "failed"), `errorMessage` (text nullable), `sentAt` (timestamp)
    - _Requirements: 5.3, 5.4, 6.2, 6.3_

  - [x] 1.4 Generate and run the database migration
    - Generate a Drizzle migration for all schema changes
    - Ensure backward compatibility: existing orders default to `orderType = "launch"`
    - _Requirements: 4.4, 4.7_

- [x] 2. Implement volume product data layer and API
  - [x] 2.1 Create volume product query functions
    - Create `lib/db/queries/volume-products.ts` with functions: `listVolumeProducts()`, `getVolumeProductById(id)`, `updateVolumeConfig(id, data)`, `getLeadTimeTiers(productId)`, `setLeadTimeTiers(productId, tiers)`, `getVolumeVariants(productId)`, `setVolumeVariants(productId, variants)`
    - `listVolumeProducts` should return products where `volumeEnabled = true` with their tier count
    - `setLeadTimeTiers` should validate ascending `minQuantity` order and no gaps/overlaps before saving
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1_

  - [x] 2.2 Write unit tests for lead time tier validation
    - Test that tiers with non-ascending minQuantity values are rejected
    - Test that valid ascending tiers are accepted
    - Test edge cases: single tier, empty tiers
    - _Requirements: 1.4_

  - [x] 2.3 Create volume product API routes
    - Create `app/api/volume-products/route.ts` with GET (list volume products) handler
    - Create `app/api/volume-products/[id]/route.ts` with GET (single product with tiers and variants) and PUT (update volume config, tiers, variants) handlers
    - PUT should validate lead time tier ordering and return errors for invalid configurations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.4 Write unit tests for volume product API validation
    - Test tier validation rejects overlapping ranges
    - Test successful volume product update round-trip
    - _Requirements: 1.4_

- [x] 3. Checkpoint - Ensure schema and data layer work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement storefront volume product API
  - [x] 4.1 Create public storefront API for volume products
    - Create `app/api/storefront/volume-products/route.ts` with GET handler
    - Return only products where `volumeEnabled = true` AND at least one lead time tier exists
    - Include product name, image, description, variants with labels, minOrderQuantity, and lead time tiers
    - Must NOT reference or return any launch, menu, or launch-product data
    - Serve bilingual content (Translation_Object fields) so the client can pick the active locale
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Build the Volume Ordering Storefront page
  - [x] 5.1 Create the volume order page shell and product listing
    - Create `app/volume-order/page.tsx` (server component with metadata) and `app/volume-order/VolumeOrderPageClient.tsx` (client component)
    - Fetch volume products from `/api/storefront/volume-products`
    - Display each product with name, image, description, variant options, and minimum order quantity in the active locale
    - Fall back to English when a French translation is missing
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.2 Implement variant quantity inputs and minimum order validation
    - Render an independent quantity input for each variant of a volume product
    - Compute total quantity across all variant lines for a product
    - Disable the add-to-order action and show a bilingual minimum quantity message when total is below `minOrderQuantity`
    - _Requirements: 2.4, 2.5_

  - [x] 5.3 Implement date/time picker with lead time enforcement
    - Add a date and time picker for the customer to select the Fulfillment_DateTime
    - When total quantity changes, determine the applicable lead time tier and compute the earliest available date (today + leadTimeDays)
    - Disable dates earlier than the computed earliest date in the picker
    - When quantity increases into a higher tier, recalculate and update the earliest date; if the currently selected date violates the new tier, show a bilingual warning
    - _Requirements: 2.6, 2.7, 2.8, 2.9_

  - [x] 5.4 Write unit tests for lead time calculation logic
    - Test that the correct tier is selected for a given quantity
    - Test earliest date computation
    - Test tier transition when quantity increases
    - _Requirements: 2.7, 2.8_

  - [x] 5.5 Implement allergen note and order summary
    - Add a single free-text Allergen_Note input field (order-level, not per-product/variant)
    - Display an order summary showing each variant line with quantity, total quantity, selected Fulfillment_DateTime, and Allergen_Note before checkout
    - _Requirements: 2.10, 2.11_

  - [x] 5.6 Add volume order navigation links
    - Add a bilingual link to `/volume-order` in the site navigation component
    - Add a bilingual link to `/volume-order` in the site footer component
    - These links must be separate from the existing `/order` link
    - _Requirements: 2.12_

- [x] 6. Checkpoint - Ensure storefront page renders and validates correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement volume order Shopify checkout integration
  - [x] 7.1 Create the volume order checkout API route
    - Create `app/api/checkout/volume/route.ts` with POST handler
    - Accept volume order payload: product info, variant lines (each with shopifyVariantId and quantity), fulfillment date/time, allergen note, locale
    - Create a Shopify cart via `createCart()` with each variant line as a separate line item using the variant's Shopify variant ID
    - Attach cart attributes: order type "volume", volume product identifier, requested Fulfillment_DateTime
    - Include the Allergen_Note as a cart attribute and append it to the order note
    - Build a human-readable order note: product name, each variant with quantity, fulfillment date/time, allergen concerns
    - Return error identifying unresolvable variant if any Shopify variant ID cannot be resolved
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 7.2 Write unit tests for volume checkout payload construction
    - Test cart attributes include order type "volume" and fulfillment date
    - Test allergen note is included in both cart attributes and order note
    - Test error returned for invalid Shopify variant IDs
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 7.3 Wire the storefront checkout button to the volume checkout API
    - Connect the order summary "Proceed to Checkout" button in `VolumeOrderPageClient.tsx` to POST `/api/checkout/volume`
    - Redirect to the Shopify checkout URL on success
    - Display error messages on failure
    - _Requirements: 3.1, 3.4_

- [x] 8. Extend webhook handler for volume orders
  - [x] 8.1 Update the orders-paid webhook to handle volume orders
    - Modify `app/api/shopify/webhooks/orders-paid/route.ts` `processShopifyOrder` function
    - Check cart attributes for order type "volume"; if present, set `orderType = "volume"` on the order record
    - Extract and store `fulfillmentDate` from the cart attributes
    - Extract and store `allergenNotes` from the cart attributes
    - Store each line item with the variant label from the Shopify line item title
    - Default `orderType` to "launch" when no recognized order type attribute is present
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_

  - [x] 8.2 Write unit tests for webhook volume order detection
    - Test that orders with volume type attribute are stored with `orderType = "volume"`
    - Test that orders without type attribute default to `orderType = "launch"`
    - Test fulfillment date and allergen notes are correctly extracted and stored
    - _Requirements: 4.1, 4.4, 4.7_

- [x] 9. Checkpoint - Ensure checkout and webhook flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement email infrastructure and confirmation emails
  - [x] 10.1 Create the email sending service
    - Create `lib/email/send.ts` with a `sendEmail` function that sends transactional emails via an external email service provider API (e.g. Resend, SendGrid, or Postmark — use env var for API key)
    - Support HTML email templates with variable interpolation
    - Validate recipient email address format before sending
    - Log each send attempt to the `emailLogs` table (recipient, template key, status, timestamp)
    - Implement retry logic: up to 3 retries with exponential backoff on failure
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 10.2 Write unit tests for email service
    - Test email address validation rejects invalid formats
    - Test retry logic attempts up to 3 times
    - Test successful send logs with status "sent"
    - Test failed send logs with status "failed" after retries exhausted
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 10.3 Create the volume order confirmation email template and sender
    - Create `lib/email/volume-order-confirmation.ts` with a function that builds and sends the confirmation email
    - Fetch the email template from the `emailTemplates` table (key: "volume-order-confirmation")
    - Interpolate variables: order number, customer name, fulfillment date, fulfillment time, variant breakdown (each variant with quantity), allergen note, total quantity
    - Select the template locale (EN/FR) matching the customer's locale at order time
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.4 Trigger confirmation email from the webhook handler
    - After the webhook handler successfully stores a volume order, call the confirmation email sender
    - If email sending fails, log the failure with the order identifier but do not fail the webhook response
    - _Requirements: 5.1, 5.5_

  - [x] 10.5 Write unit tests for confirmation email template interpolation
    - Test all variables are correctly interpolated into the template
    - Test French locale template is selected for FR orders
    - Test allergen note is omitted from email when not present on the order
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 11. Checkpoint - Ensure email sending works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Build admin CMS for volume product management
  - [x] 12.1 Create the admin volume products list page
    - Create `app/admin/volume-products/page.tsx` showing all volume-enabled products
    - Display product name, Minimum_Order_Quantity, number of Lead_Time_Tiers, and active status using the existing `TableCard` and `Table` component patterns
    - Link each row to the product edit page
    - _Requirements: 7.1_

  - [x] 12.2 Create the admin volume product edit page
    - Create `app/admin/volume-products/[id]/page.tsx` with an edit form
    - Include sections for: bilingual description (Translation_Object), bilingual ordering instructions (Translation_Object), Minimum_Order_Quantity input, Lead_Time_Tiers inline editor, and variant configuration
    - Use the existing `TranslationFields` component pattern for bilingual fields
    - Support the existing locale switcher for editing bilingual content
    - Store all user-facing content as Translation_Object JSONB fields with `en` and `fr` keys
    - _Requirements: 7.2, 7.6_

  - [x] 12.3 Implement the lead time tiers inline editor
    - Build an inline editor component where admins can add, edit, and remove tiers
    - Each tier has: quantity range lower bound (minQuantity) and lead time in days (leadTimeDays)
    - Validate ascending minQuantity order on save; display errors for invalid configurations
    - Display a warning when no tiers are configured indicating the product cannot accept volume orders
    - _Requirements: 7.3, 1.4, 1.7_

  - [x] 12.4 Implement variant configuration editor
    - Build a variant editor component for adding/removing/reordering variants
    - Each variant has: bilingual label (Translation_Object) and Shopify variant ID
    - _Requirements: 1.5, 7.2_

  - [x] 12.5 Add volume product enable/disable with confirmation
    - Add a toggle to enable/disable volume sales on a product
    - When disabling, show a confirmation prompt warning that the product will no longer appear on the volume ordering page
    - _Requirements: 1.1, 7.7_

- [x] 13. Build admin volume orders view and email template editor
  - [x] 13.1 Add volume orders filter to the admin orders page
    - Extend the orders list API (`app/api/orders/route.ts`) to accept an `orderType` query parameter
    - Update `lib/db/queries/orders.ts` `list()` to support filtering by `orderType`
    - Add an order type filter (All / Launch / Volume) to the admin orders page
    - Display fulfillment date, total quantity, and allergen notes columns for volume orders
    - _Requirements: 4.6, 7.5_

  - [x] 13.2 Create the admin email template editor page
    - Create `app/admin/volume-products/email-template/page.tsx` with a form to edit the volume order confirmation email template
    - Use `TranslationFields` for bilingual subject and body fields
    - Save to the `emailTemplates` table with key "volume-order-confirmation"
    - _Requirements: 7.4_

- [x] 14. Add volume products link to admin navigation
  - Add a "Volume Products" link to the admin sidebar navigation in `app/admin/components/AdminSidebar.tsx` or `AdminNav.tsx`
  - Link to `/admin/volume-products`
  - _Requirements: 7.1_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The implementation uses TypeScript throughout, following existing patterns in the codebase (Drizzle ORM, Next.js App Router, existing UI components)
- All bilingual content uses the existing `Translation_Object` JSONB pattern `{ en: string; fr: string }`
