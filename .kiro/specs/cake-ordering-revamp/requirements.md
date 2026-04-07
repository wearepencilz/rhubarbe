# Requirements Document

## Introduction

The Cake Ordering Revamp extends the existing cake ordering page to support the new Shopify product catalog: Large Format Cakes (XXL), Croquembouche, Tiered Wedding Cakes, and a Wedding Cake Tasting Session. The UX stays close to the current pattern — product cards with large images, a sidebar cart, and a familiar selection flow — but adds flavour variant selection beneath each card, richer tier detail (layers, diameters), and price resolution from a two-axis grid (size × flavour).

The existing single-axis cake products continue to work unchanged. All new product types use the same Shopify checkout flow, bilingual EN/FR patterns, and admin component library already in place.

## Glossary

- **Cake_Product**: A product in the `products` table with `cakeEnabled = true`.
- **Product_Type**: A discriminator indicating the product's option/pricing structure. Values: `cake-xxl`, `croquembouche`, `wedding-cake-tiered`, `wedding-cake-tasting`, `null` (legacy).
- **Pricing_Grid**: A table mapping (productId, sizeValue, flavourHandle) → priceInCents + shopifyVariantId. Replaces single-axis `cakePricingTiers` for new product types.
- **Flavour_Config**: A JSONB array on the product storing available flavours with bilingual labels, descriptions, pricing tier group, and sort order.
- **Tier_Detail_Config**: A JSONB array on the product storing per-size metadata: number of layers, diameter of each layer (e.g., "10/8/6"), and display label. Used for the visual tier diagram on the storefront.
- **Add_On_Product**: A Cake_Product linked to a parent as an optional extra (Extra Fruits, Gold/Dried Flowers). Priced by the parent's selected size.
- **Cart**: Client-side selected product with chosen options and computed price, persisted to localStorage. Follows the same sidebar pattern as existing cake/volume orders.

## Requirements

### Requirement 1: Product Type and Flavour Configuration Schema

**User Story:** As a developer, I want each cake product to declare its product type and store its flavour and tier detail configuration, so that the system renders the correct UI and pricing logic.

#### Acceptance Criteria

1. THE Database SHALL include a `cakeProductType` field (text, nullable) on the `products` table accepting values: `cake-xxl`, `croquembouche`, `wedding-cake-tiered`, `wedding-cake-tasting`, and `null` (legacy).
2. THE Database SHALL include a `cakeFlavourConfig` field (JSONB, nullable) on the `products` table storing an array of flavour objects, each with: `handle` (string), `label` ({ en, fr }), `description` ({ en, fr }, nullable — e.g., "gâteau banane, crémeux fruit de la passion, croustillant café"), `pricingTierGroup` (string, nullable), `sortOrder` (number), and `active` (boolean).
3. THE Database SHALL include a `cakeTierDetailConfig` field (JSONB, nullable) on the `products` table storing an array of tier detail objects, each with: `sizeValue` (string, matching the pricing grid axis1), `layers` (number), `diameters` (string, e.g., "10/8/6"), and `label` ({ en, fr }, nullable).
4. THE Database SHALL include a `cakeMaxFlavours` field (integer, nullable) on the `products` table for Croquembouche multi-flavour limit (default: 2).
5. WHEN `cakeProductType` is `null`, THE System SHALL treat the product as a legacy single-axis product using existing `cakePricingTiers`.

### Requirement 2: Two-Axis Pricing Grid

**User Story:** As a developer, I want a pricing grid that maps (size, flavour) to a price and Shopify variant, so that products can resolve prices from two customer selections.

#### Acceptance Criteria

1. THE Database SHALL include a `cake_pricing_grid` table with columns: `id` (UUID PK), `productId` (FK to products, cascade delete), `sizeValue` (text, e.g., "30", "72"), `flavourHandle` (text, e.g., "pistachio", "default" for single-axis add-ons), `priceInCents` (integer), `shopifyVariantId` (text, nullable), and `createdAt` (timestamp).
2. THE Database SHALL enforce a unique constraint on (`productId`, `sizeValue`, `flavourHandle`).
3. THE Database SHALL index `cake_pricing_grid.productId` for query performance.
4. WHEN a Cake_Product has a non-null `cakeProductType` (except `wedding-cake-tasting`), THE System SHALL use the Pricing_Grid for price resolution.

### Requirement 3: Add-On Product Linking

**User Story:** As an admin, I want to link add-on products to parent cake products, so that customers can optionally add extras during ordering.

#### Acceptance Criteria

1. THE Database SHALL include a `cake_addon_links` table with columns: `id` (UUID PK), `parentProductId` (FK to products, cascade delete), `addonProductId` (FK to products, cascade delete), `sortOrder` (integer), and `createdAt` (timestamp).
2. THE Database SHALL enforce a unique constraint on (`parentProductId`, `addonProductId`).
3. Add_On_Products SHALL use `flavourHandle = 'default'` in their Pricing_Grid, with `sizeValue` matching the parent's size options, so price resolves from the parent's selected size only.
4. THE Admin_CMS edit page SHALL provide an interface to link and unlink add-on products.

### Requirement 4: Admin Product Configuration

**User Story:** As an admin, I want to manage the product type, flavour config, tier details, and pricing grid for each cake product.

#### Acceptance Criteria

1. THE Admin_CMS edit page SHALL display a `cakeProductType` selector when editing a cake-enabled product.
2. THE Admin_CMS edit page SHALL display a flavour list editor for managing `cakeFlavourConfig`, with bilingual label and description fields per entry.
3. THE Admin_CMS edit page SHALL display a tier detail editor for managing `cakeTierDetailConfig`, with fields for sizeValue, layers, diameters, and bilingual label per entry.
4. THE Admin_CMS edit page SHALL display the Pricing_Grid as an editable table with sizes as columns and flavours as rows, allowing price entry in dollars (stored in cents) and Shopify variant ID per cell.
5. THE Admin_CMS edit page SHALL validate that all active (size, flavour) combinations have a price before saving.
6. WHEN Product_Type is `croquembouche`, THE Admin_CMS SHALL display a `cakeMaxFlavours` input.

### Requirement 5: Storefront API

**User Story:** As a developer, I want the storefront API to return the full product configuration so the frontend can render the correct UI per product type.

#### Acceptance Criteria

1. THE Storefront_API SHALL return each Cake_Product with: `cakeProductType`, `cakeFlavourConfig` (active entries only, ordered by sortOrder), `cakeTierDetailConfig`, `cakeMaxFlavours`, the Pricing_Grid rows, and linked Add_On_Products with their own pricing data.
2. THE Storefront_API SHALL derive available size options from the distinct `sizeValue` entries in the product's Pricing_Grid.
3. THE Storefront_API SHALL continue to return lead time tiers and existing fields for all products.
4. THE Storefront_API SHALL return legacy products (`cakeProductType = null`) with their existing `pricingTiers` array unchanged.
5. THE Storefront_API SHALL exclude products that have no pricing data configured.

### Requirement 6: Storefront Product Cards with Flavour Variants

**User Story:** As a customer, I want to see cake products as large image cards and select a flavour variant beneath each card, so that I can browse and choose intuitively.

#### Acceptance Criteria

1. THE Cake_Order_Page SHALL display products as cards with large images (current layout: 2 columns mobile, 3 columns desktop), product name, and short description.
2. WHEN the customer selects a product card (click to select, like current UI), THE page SHALL expand a flavour variant list beneath the selected card showing each flavour's bilingual label and description (e.g., "Banane café passion — gâteau banane, crémeux fruit de la passion, croustillant café").
3. THE customer SHALL select one flavour from the list (radio-style selection for XXL and wedding cakes).
4. WHEN Product_Type is `croquembouche`, THE flavour list SHALL allow multi-select up to `cakeMaxFlavours` (default 2), with a message when the limit is reached.
5. WHEN Product_Type is `wedding-cake-tasting`, THE card SHALL show a simple "Add to cart" at the fixed price with no flavour or size selection.
6. WHEN a flavour handle is `custom`, THE page SHALL display a note indicating the customer should contact the bakery.

### Requirement 7: Sidebar Cart with Size Selection and Tier Details

**User Story:** As a customer, I want to set my guest/choux count in the sidebar and see tier details (layers, diameters) and the resolved price, so that I understand exactly what I'm ordering.

#### Acceptance Criteria

1. THE sidebar cart SHALL follow the same layout pattern as the existing cake order sidebar: product name, size input, resolved price, fulfillment options, date picker, event type, special instructions, and checkout button.
2. THE sidebar SHALL display a size selector (number input or dropdown) labeled "Guests" / "Invités" for XXL and wedding cakes, or "Choux" for croquembouche.
3. WHEN the customer selects a size AND a flavour, THE sidebar SHALL display the resolved price from the Pricing_Grid for that (size, flavour) combination.
4. WHEN `cakeTierDetailConfig` is available for the selected size, THE sidebar SHALL display the tier details: number of layers and diameter of each layer (e.g., "3 étages: 10/8/6 pouces" or "3 tiers: 10/8/6 inches").
5. THE sidebar SHALL display a visual tier diagram showing the stacked layers with relative sizes, updating when the size selection changes.
6. WHEN the selected product has linked Add_On_Products, THE sidebar SHALL display add-on toggles with the add-on name and price resolved from the selected size.
7. IF no size is selected, add-on toggles SHALL be disabled.
8. THE sidebar SHALL display the selected flavour name(s) and the tax note ("Prices subject to 5% TPS and 9.975% TVQ").

### Requirement 8: Cart and Checkout

**User Story:** As a customer, I want to check out my cake order through Shopify with all my selections captured.

#### Acceptance Criteria

1. THE Cart SHALL persist the selected product, flavour(s), size, add-ons, and computed price to localStorage under `rhubarbe:cake:cart`.
2. WHEN the customer removes the main product, THE Cart SHALL also remove associated add-on items.
3. THE Checkout_API SHALL create a Shopify cart resolving Shopify variant IDs from the Pricing_Grid (sizeValue + flavourHandle) for each line item.
4. THE Checkout_API SHALL store order metadata as Shopify cart attributes: Order Type ("cake"), Fulfillment Date, Fulfillment Type, selected flavour(s), and size.
5. THE Checkout_API SHALL generate a bilingual order note listing the product, selected flavour(s), size, add-ons, and special instructions.
6. WHEN a Croquembouche item is included, THE order note SHALL list the selected flavour names (up to 2).
7. IF any line item's Shopify variant ID cannot be resolved, THE Checkout_API SHALL return a 422 error.

### Requirement 9: Backward Compatibility

**User Story:** As a developer, I want existing single-axis cake products to continue working unchanged.

#### Acceptance Criteria

1. WHEN `cakeProductType` is `null`, THE System SHALL use existing `cakePricingTiers` for price resolution and render the current single-axis UI (number of people → price, no flavour selection).
2. THE Storefront_API SHALL return legacy products alongside new products without breaking the existing response shape.
3. THE Checkout_API SHALL handle both legacy and grid-based items in the same cart.
