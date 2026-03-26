# Requirements Document

## Introduction

Quebec tax law requires quantity-based tax treatment for bakery and food items. Products sold in quantities of 5 or fewer identical items are fully taxable (GST 5% + QST 9.975%), while 6 or more identical items are tax-exempt. Some products are always taxable (sandwiches, salads) or always exempt (prepared meals, large cakes) regardless of quantity.

Since Rhubarbe uses a headless Shopify setup on a non-Plus plan (no access to Shopify Functions or Cart Transform), the system implements tax control via a dual-variant approach: each threshold-eligible product has two Shopify variants at the same price — one taxable (default) and one tax-exempt. At checkout time, the application selects the correct variant based on the effective unit count in the cart.

## Glossary

- **Tax_Behavior**: An enum field on a product indicating its tax treatment rule. Values: `always_taxable`, `always_exempt`, `quantity_threshold`.
- **Tax_Threshold**: An integer field on a product specifying the minimum effective unit count at which the product becomes tax-exempt. Default: 6.
- **Tax_Unit_Count**: An integer field on a product specifying how many real units one cart line item represents. A "Box of 6" has `taxUnitCount = 6`. Default: 1.
- **Effective_Units**: The computed value `cart_quantity × taxUnitCount` used to determine tax treatment for a given cart line.
- **Tax_Exempt_Variant**: A hidden Shopify variant on a product configured with tax collection disabled, used when the product qualifies for tax exemption.
- **Taxable_Variant**: The default Shopify variant on a product with standard tax collection enabled.
- **Variant_Switcher**: The checkout-time logic that selects either the Taxable_Variant or Tax_Exempt_Variant based on Effective_Units vs Tax_Threshold.
- **CMS**: The Rhubarbe admin application (Next.js) that manages product data in PostgreSQL.
- **Checkout_API**: The Next.js API routes (`/api/checkout` and `/api/checkout/volume`) that build Shopify carts via the Storefront API.
- **Shopify_Admin_API**: The Shopify GraphQL Admin API used to create/update products and variants.
- **Products_Table**: The `products` PostgreSQL table defined in `lib/db/schema.ts`.

## Constraints

### C1: No Separate Shopify App

THE system SHALL implement all variant-switching and tax-resolution logic within the existing Next.js application. No separate Shopify app (public or custom), Shopify Functions, Cart Transform extensions, or Shopify App Store submissions are required or permitted. All Shopify interactions use the already-configured Shopify Admin API (OAuth client credentials) and Storefront API credentials present in the environment.

### C2: Existing API Integration Only

THE system SHALL use the existing `lib/shopify/admin.ts` (Admin API via OAuth) and `lib/shopify/cart.ts` (Storefront API) clients for all Shopify operations. No new Shopify app installation, app proxy, or webhook endpoint registration is required.

### C3: Non-Plus Shopify Plan

THE system SHALL operate on a standard (non-Plus) Shopify plan. Shopify Functions, Cart Transform, and other Shopify Plus-only features are not available and SHALL NOT be referenced in the implementation.

## Requirements

### Requirement 1: Product Tax Configuration Schema

**User Story:** As a shop owner, I want each product to have configurable tax behavior fields stored in the database, so that the system can determine the correct tax treatment at checkout.

#### Acceptance Criteria

1. THE Products_Table SHALL include a `taxBehavior` text column with allowed values `always_taxable`, `always_exempt`, and `quantity_threshold`, defaulting to `always_taxable`.
2. THE Products_Table SHALL include a `taxThreshold` integer column defaulting to 6.
3. THE Products_Table SHALL include a `taxUnitCount` integer column defaulting to 1.
4. THE Products_Table SHALL include a `shopifyTaxExemptVariantId` text column defaulting to null.
5. WHEN a product row is created without explicit tax fields, THE Products_Table SHALL apply the default values (`always_taxable`, threshold 6, unit count 1, exempt variant null).

### Requirement 2: Admin Tax Configuration UI

**User Story:** As a shop owner, I want a "Tax & Shipping" section on the product edit page, so that I can configure tax behavior per product without touching code.

#### Acceptance Criteria

1. THE CMS SHALL display a "Tax & Shipping" section on the product edit page containing a Tax_Behavior dropdown with options "Always taxable", "Always exempt", and "Quantity threshold".
2. WHILE Tax_Behavior is set to `quantity_threshold`, THE CMS SHALL display editable fields for Tax_Threshold (integer input) and Tax_Unit_Count (integer input).
3. WHILE Tax_Behavior is set to `always_taxable` or `always_exempt`, THE CMS SHALL hide the Tax_Threshold, Tax_Unit_Count, and Tax_Exempt_Variant fields.
4. WHILE Tax_Behavior is set to `quantity_threshold`, THE CMS SHALL display the Shopify Tax_Exempt_Variant ID field (read-only text showing the stored GID, or "Not linked" when null).
5. WHEN the product edit form is saved, THE CMS SHALL persist the tax configuration fields to the Products_Table.
6. THE CMS SHALL display the existing `pickupOnly` toggle within the same "Tax & Shipping" section.

### Requirement 3: Tax-Exempt Variant Creation in Shopify

**User Story:** As a shop owner, I want the system to create a tax-exempt variant in Shopify when I configure a product for quantity-threshold tax behavior, so that I don't have to manually set up dual variants.

#### Acceptance Criteria

1. WHEN a product with Tax_Behavior `quantity_threshold` is saved and the product has a linked Shopify product but no Tax_Exempt_Variant, THE CMS SHALL create a hidden "Tax Mode" option on the Shopify product with values "Standard" and "Exempt" via the Shopify_Admin_API.
2. WHEN the "Tax Mode" option is created, THE CMS SHALL create an "Exempt" variant at the same price as the existing taxable variant with tax collection disabled via the Shopify_Admin_API.
3. WHEN the Tax_Exempt_Variant is created in Shopify, THE CMS SHALL store the returned variant GID in the `shopifyTaxExemptVariantId` column of the Products_Table.
4. IF the Shopify_Admin_API call fails during variant creation, THEN THE CMS SHALL display an error message to the admin user and leave the `shopifyTaxExemptVariantId` as null.
5. WHEN a product's Tax_Behavior is changed away from `quantity_threshold`, THE CMS SHALL retain the existing `shopifyTaxExemptVariantId` value without deleting the Shopify variant (manual cleanup).

### Requirement 4: Variant Price Synchronization

**User Story:** As a shop owner, I want both the taxable and tax-exempt variants to stay at the same price when I update a product's price, so that customers are charged correctly regardless of tax treatment.

#### Acceptance Criteria

1. WHEN a product with a non-null `shopifyTaxExemptVariantId` is synced to Shopify and the price has changed, THE Shopify_Admin_API client SHALL update both the Taxable_Variant and the Tax_Exempt_Variant to the same price.
2. IF the price sync for the Tax_Exempt_Variant fails, THEN THE CMS SHALL log the error and display a warning to the admin user.

### Requirement 5: Launch Checkout Variant Resolution

**User Story:** As a customer ordering from the weekly menu, I want the correct tax treatment applied automatically based on how many units I order, so that I pay the legally correct amount.

#### Acceptance Criteria

1. WHEN the Checkout_API at `/api/checkout` receives a cart, THE Checkout_API SHALL fetch the tax configuration (Tax_Behavior, Tax_Threshold, Tax_Unit_Count, `shopifyTaxExemptVariantId`) for each product from the Products_Table before building Shopify cart lines.
2. WHEN a product has Tax_Behavior `always_taxable`, THE Checkout_API SHALL use the default Taxable_Variant for that product's cart line.
3. WHEN a product has Tax_Behavior `always_exempt` and has a non-null `shopifyTaxExemptVariantId`, THE Checkout_API SHALL use the Tax_Exempt_Variant for that product's cart line.
4. WHEN a product has Tax_Behavior `quantity_threshold`, THE Checkout_API SHALL compute Effective_Units as `cart_quantity × taxUnitCount` for that cart line.
5. WHEN Effective_Units is greater than or equal to Tax_Threshold, THE Checkout_API SHALL use the Tax_Exempt_Variant for that cart line.
6. WHEN Effective_Units is less than Tax_Threshold, THE Checkout_API SHALL use the Taxable_Variant for that cart line.
7. IF a product has Tax_Behavior `always_exempt` or qualifies for exemption via threshold but `shopifyTaxExemptVariantId` is null, THEN THE Checkout_API SHALL fall back to the Taxable_Variant and log a warning.

### Requirement 6: Volume Checkout Variant Resolution

**User Story:** As a customer placing a volume order, I want the same tax rules applied to my volume order, so that large quantity orders receive the correct tax exemption.

#### Acceptance Criteria

1. WHEN the Checkout_API at `/api/checkout/volume` receives items, THE Checkout_API SHALL fetch the tax configuration for each product from the Products_Table before building Shopify cart lines.
2. WHEN a volume order item has Tax_Behavior `quantity_threshold`, THE Checkout_API SHALL compute Effective_Units as `cart_quantity × taxUnitCount` for that item.
3. WHEN Effective_Units is greater than or equal to Tax_Threshold for a volume item, THE Checkout_API SHALL use the Tax_Exempt_Variant for that cart line.
4. WHEN Effective_Units is less than Tax_Threshold for a volume item, THE Checkout_API SHALL use the Taxable_Variant for that cart line.
5. THE Checkout_API SHALL apply the same Tax_Behavior `always_taxable` and `always_exempt` rules to volume items as defined in Requirement 5.

### Requirement 7: Variant Resolution Correctness

**User Story:** As a shop owner, I want the variant selection logic to be deterministic and correct for all edge cases, so that tax is never applied incorrectly.

#### Acceptance Criteria

1. FOR ALL products with Tax_Behavior `quantity_threshold`, THE Variant_Switcher SHALL produce the same variant selection when given the same inputs (cart_quantity, taxUnitCount, taxThreshold, shopifyTaxExemptVariantId).
2. WHEN Tax_Unit_Count is greater than 1 (bundle product), THE Variant_Switcher SHALL multiply cart_quantity by Tax_Unit_Count before comparing to Tax_Threshold.
3. WHEN cart_quantity is 1 and Tax_Unit_Count is 6 and Tax_Threshold is 6, THE Variant_Switcher SHALL select the Tax_Exempt_Variant (because Effective_Units = 6 ≥ 6).
4. WHEN cart_quantity is 5 and Tax_Unit_Count is 1 and Tax_Threshold is 6, THE Variant_Switcher SHALL select the Taxable_Variant (because Effective_Units = 5 < 6).
5. WHEN cart_quantity is 6 and Tax_Unit_Count is 1 and Tax_Threshold is 6, THE Variant_Switcher SHALL select the Tax_Exempt_Variant (because Effective_Units = 6 ≥ 6).
6. FOR ALL valid inputs, THE Variant_Switcher SHALL select exactly one variant (taxable or exempt), with no ambiguous or undefined states.

### Requirement 8: Product Query Tax Data Access

**User Story:** As a developer, I want the product query layer to return tax configuration fields, so that the checkout API and admin UI can access them without additional queries.

#### Acceptance Criteria

1. THE product query `getById` in `lib/db/queries/products.ts` SHALL return the `taxBehavior`, `taxThreshold`, `taxUnitCount`, and `shopifyTaxExemptVariantId` fields as part of the product object.
2. THE product query `list` in `lib/db/queries/products.ts` SHALL return the `taxBehavior` field for each product.
3. WHEN the Checkout_API needs tax configuration for multiple products, THE CMS SHALL provide a query method that fetches tax fields for a list of product IDs in a single database call.
