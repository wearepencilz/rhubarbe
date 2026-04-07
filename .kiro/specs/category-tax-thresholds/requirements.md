# Requirements Document

## Introduction

This feature expands the existing per-product quantity-threshold tax logic in the Rhubarbe Shopify app to support category-level aggregation. Currently, each product independently checks its own cart quantity against its threshold to decide between taxable and tax-exempt variants. The new category-based threshold groups all cart items sharing a Shopify product category, sums their effective units, and applies the threshold check to the entire category. A new CMS settings page allows the operator to configure which Shopify product categories use threshold behavior and what each category's threshold is. The threshold-enabled categories and their thresholds are stored in the CMS database (the existing Postgres/Drizzle `settings` table), not in Shopify. The existing per-product tax behavior (always_taxable, always_exempt, quantity_threshold) continues to work unchanged for products not in a threshold-enabled category.

## Glossary

- **Variant_Resolver**: The module (`lib/tax/resolve-variant.ts` and checkout route logic) that determines which Shopify variant (taxable or tax-exempt) to use for each cart line item.
- **Tax_Settings_Record**: A row in the CMS `settings` table with key `tax_threshold_categories`, storing the list of threshold-enabled categories and their thresholds as a JSONB value.
- **Threshold_Category**: A Shopify product category that has been configured in the Tax_Settings_Record with a quantity threshold for tax exemption.
- **Effective_Units**: The product of a cart line item's quantity and its `tax_unit_count` column value from the CMS `products` table (quantity × tax_unit_count). For example, a box of 4 croissants has `tax_unit_count = 4`, so ordering 1 box yields 1 × 4 = 4 effective units.
- **Category_Total**: The sum of Effective_Units for all cart items belonging to the same Shopify product category.
- **Exempt_Variant**: The Shopify variant with Tax option set to "false", used when a product qualifies for tax exemption.
- **Taxable_Variant**: The default Shopify variant with Tax option set to "true".
- **Settings_Page**: The admin CMS page where the operator configures Threshold_Categories and their thresholds.
- **Shopify_Product_Category**: The native product category assigned to a product in Shopify (e.g., "Viennoiserie", "Pâtisserie"), retrieved via the Shopify API `productCategory` field.

## Requirements

### Requirement 1: Category-Based Quantity Aggregation

**User Story:** As the Rhubarbe operator, I want cart items sharing the same Shopify product category to have their quantities aggregated for tax threshold evaluation, so that the tax exemption applies based on the total category count rather than individual product counts.

#### Acceptance Criteria

1. WHEN a cart contains items belonging to a Threshold_Category, THE Variant_Resolver SHALL sum the Effective_Units of all items in that Threshold_Category to produce the Category_Total.
2. WHEN the Category_Total for a Threshold_Category meets or exceeds the configured threshold, THE Variant_Resolver SHALL select the Exempt_Variant for every item in that Threshold_Category.
3. WHEN the Category_Total for a Threshold_Category is below the configured threshold, THE Variant_Resolver SHALL select the Taxable_Variant for every item in that Threshold_Category.
4. THE Variant_Resolver SHALL compute Category_Totals independently for each Threshold_Category (items from different categories do not combine).
5. WHEN a product does not belong to any Threshold_Category, THE Variant_Resolver SHALL apply the existing per-product tax behavior (always_taxable, always_exempt, or per-product quantity_threshold) without modification.

### Requirement 2: Tax Settings Storage in CMS Database

**User Story:** As the Rhubarbe operator, I want the threshold-enabled categories and their thresholds stored in the CMS database, so that the configuration is managed alongside other CMS settings and the Variant_Resolver can look up category thresholds at checkout time.

#### Acceptance Criteria

1. THE Tax_Settings_Record SHALL be a row in the CMS `settings` table with key `tax_threshold_categories`.
2. THE Tax_Settings_Record SHALL store a JSONB value containing an array of objects, each with a `category` string and a `threshold` positive integer.
3. WHEN the Variant_Resolver processes a cart, THE Variant_Resolver SHALL query the CMS database to fetch the Tax_Settings_Record and determine which categories are threshold-enabled and their respective thresholds.
4. IF the Tax_Settings_Record does not exist or cannot be fetched, THEN THE Variant_Resolver SHALL treat all products as non-threshold (existing per-product behavior applies).

### Requirement 3: Shopify Product Category Resolution

**User Story:** As the Rhubarbe operator, I want the system to use Shopify's native product categories to determine which category a product belongs to, so that I do not need to manually tag products for category-based tax behavior.

#### Acceptance Criteria

1. WHEN resolving tax variants for cart items, THE Variant_Resolver SHALL retrieve each product's Shopify_Product_Category from the Shopify API.
2. THE Variant_Resolver SHALL match a product's Shopify_Product_Category against the categories listed in the Tax_Settings_Record to determine if the product belongs to a Threshold_Category.
3. IF a product has no Shopify_Product_Category assigned, THEN THE Variant_Resolver SHALL treat that product as not belonging to any Threshold_Category.

### Requirement 4: Category Tax Settings Admin Page

**User Story:** As the Rhubarbe operator, I want a settings page in the admin CMS where I can select which Shopify product categories get threshold behavior and set per-category thresholds, so that I can manage tax rules without editing code.

#### Acceptance Criteria

1. THE Settings_Page SHALL display the current list of Threshold_Categories with their configured thresholds.
2. THE Settings_Page SHALL allow the operator to add a new Threshold_Category by selecting a Shopify_Product_Category and entering a threshold value.
3. THE Settings_Page SHALL allow the operator to remove an existing Threshold_Category from the list.
4. THE Settings_Page SHALL allow the operator to modify the threshold value for an existing Threshold_Category.
5. WHEN the operator saves changes, THE Settings_Page SHALL persist the updated configuration to the Tax_Settings_Record in the CMS database.
6. THE Settings_Page SHALL validate that each threshold value is a positive integer greater than or equal to 1 before saving.
7. IF the operator enters an invalid threshold value, THEN THE Settings_Page SHALL display an inline validation error and prevent saving.

### Requirement 5: Variant Resolution Fallback Behavior

**User Story:** As the Rhubarbe operator, I want the system to degrade gracefully when configuration or variant data is missing, so that checkout never fails due to tax configuration issues.

#### Acceptance Criteria

1. IF a product in a Threshold_Category does not have an Exempt_Variant, THEN THE Variant_Resolver SHALL use the Taxable_Variant and log a warning.
2. IF the Tax_Settings_Record contains an invalid or unparseable `threshold_categories` value, THEN THE Variant_Resolver SHALL treat all products as non-threshold and log a warning.
3. IF a Threshold_Category entry has a threshold value less than 1, THEN THE Variant_Resolver SHALL ignore that category entry and log a warning.

### Requirement 6: Backward Compatibility

**User Story:** As the Rhubarbe operator, I want the existing per-product tax behavior to continue working unchanged, so that products not using category-based thresholds are unaffected.

#### Acceptance Criteria

1. THE Variant_Resolver SHALL continue to support the existing `always_taxable`, `always_exempt`, and `quantity_threshold` per-product tax behaviors for products not in a Threshold_Category.
2. WHEN a product has a per-product `quantity_threshold` tax behavior and does not belong to a Threshold_Category, THE Variant_Resolver SHALL evaluate the threshold using only that product's own Effective_Units (existing behavior).
3. THE checkout API routes (`/api/checkout`, `/api/checkout/cake`, `/api/checkout/volume`) SHALL continue to function with the existing request and response formats.

### Requirement 7: Effective Unit Calculation

**User Story:** As the Rhubarbe operator, I want the category total to account for products that represent multiple tax units (e.g., a box of 6 croissants counts as 6 units), so that the threshold is evaluated correctly.

#### Acceptance Criteria

1. THE Variant_Resolver SHALL calculate each item's Effective_Units as the product of the cart line quantity and the item's `tax_unit_count` value from the CMS `products` table (column: `tax_unit_count`, Drizzle field: `taxUnitCount`, default: 1).
2. THE Variant_Resolver SHALL use Effective_Units (not raw cart quantities) when computing the Category_Total for a Threshold_Category.
3. WHEN a product does not have a `tax_unit_count` value, THE Variant_Resolver SHALL default to a tax_unit_count of 1.

#### Concrete Scenarios

The following examples illustrate how `tax_unit_count` and Effective_Units work for boxes and bundles. Assume the Threshold_Category is "Viennoiserie" with a threshold of 6.

**Scenario A: Box of 4 + 2 individual items**
- 1 × box of 4 croissants (`tax_unit_count = 4`, quantity = 1) → Effective_Units = 1 × 4 = 4
- 2 × individual pastries (`tax_unit_count = 1`, quantity = 2) → Effective_Units = 2 × 1 = 2
- Category_Total = 4 + 2 = **6** → meets threshold → **NO TAX** (exempt variant for all items)

**Scenario B: Box of 6**
- 1 × box of 6 pastries (`tax_unit_count = 6`, quantity = 1) → Effective_Units = 1 × 6 = 6
- Category_Total = **6** → meets threshold → **NO TAX**
- The fact that items are pre-bundled does not matter; the `tax_unit_count` field captures how many single-serving units the product represents.

**Scenario C: 2 boxes of 2 + 4 individual items**
- 2 × box of 2 croissants (`tax_unit_count = 2`, quantity = 2) → Effective_Units = 2 × 2 = 4
- 4 × individual pastries (`tax_unit_count = 1`, quantity = 4) → Effective_Units = 4 × 1 = 4
- Category_Total = 4 + 4 = **8** → meets threshold → **NO TAX**
