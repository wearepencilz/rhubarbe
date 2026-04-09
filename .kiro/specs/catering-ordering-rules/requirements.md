# Requirements Document

## Introduction

This feature overhauls how products are managed across the three ordering types (catering, cake, menu) on the Rhubarbe platform. The current model requires creating a product first, then enabling it for a type (via `cakeEnabled`, `volumeEnabled`, or linking to a launch). This is replaced by direct product management within each type section. Additionally, allergen management is simplified by removing ingredient-based computation and instead assigning allergens directly to products or variants. Catering products gain type grouping (Brunch, Lunch, Dînatoire), ordering rules, lead time enforcement, end dates, filtering, and descriptions. The ingredients feature is hidden from the UI.

The feature also establishes cross-cutting UX consistency principles: Shopify is treated as the source of truth for fields it already manages (tags, status), eliminating duplicate CMS-side management. Tasting notes are hidden from the admin UI while preserved in the database schema. All bilingual fields across product types use a consistent side-by-side translation pattern with AI auto-translate. All product edit forms use a consistent dirty-state save pattern with a fixed save header bar.

## Glossary

- **Product_Type_Section**: One of the three admin sections where products are managed directly: Catering, Cake, or Menu. Each section owns its products end-to-end.
- **Catering_Product**: A product created and managed within the Catering section, representing a single flavour/item available for catering orders.
- **Cake_Product**: A product created and managed within the Cake section, with flavour variants and size-based pricing.
- **Menu_Product**: A product created and managed within the Menu section, linked to weekly launch menus.
- **Catering_Type**: A grouping classification for catering products. One of: `brunch`, `lunch`, or `dinatoire` (cocktail dînatoire).
- **Catering_Type_Group**: A named container that groups Catering_Products under a specific Catering_Type for display and ordering rule enforcement.
- **Ordering_Rule_Engine**: The subsystem that enforces minimum quantity, quantity step, and set-size constraints based on Catering_Type.
- **Allergen_Set**: An array of allergen values (`dairy`, `egg`, `gluten`, `tree-nuts`, `peanuts`, `sesame`, `soy`) assigned directly to a product or variant.
- **Menu_Filter_Engine**: The subsystem that filters catering menu products by dietary tags and temperature tags.
- **Dietary_Tag**: A classification applied to a product indicating dietary compatibility (e.g., vegetarian, vegan, gluten-free).
- **Temperature_Tag**: A classification applied to a Catering_Product indicating serving temperature (hot or cold).
- **Admin_UI**: The administrative interface used by staff to manage products, menus, and configuration.
- **Ingredient_Feature**: The existing ingredients management module (ingredients table, productIngredients join table, ingredient CRUD pages) that is being hidden from the UI.
- **Shopify_Managed_Field**: A product field (e.g., tags, status) that Shopify already manages as source of truth. The CMS defers to Shopify for these fields and does not provide duplicate editing controls.
- **Tasting_Notes_Field**: The `tastingNotes` column on the products table, retained in the database schema but hidden from all admin UI forms.
- **Translation_Pattern**: The standard bilingual editing UX used across all product edit forms: both language fields displayed side-by-side with an AI auto-translate button (AiTranslateButton component) to translate from one language to the other.
- **Dirty_State_Save_Pattern**: The standard save UX used across all product edit forms: a fixed header bar appears when the form has unsaved changes, displaying a "Save" action and a "Discard" option (EditPageLayout component).
- **Catering_Lead_Time**: The minimum number of days in advance that a catering order must be placed. Defaults to 28 days (4 weeks) and is configurable by admins. Analogous to the `cakeLeadTimeTiers` system used for cake products.

## Requirements

### Requirement 1: Direct Product Management Within Type Sections

**User Story:** As an admin, I want to create and manage products directly within each type section (Catering, Cake, Menu), so that I do not need to create a generic product first and then enable it for a specific type.

#### Acceptance Criteria

1. THE Admin_UI SHALL provide a product creation flow within the Catering section that creates a Catering_Product directly without requiring a pre-existing generic product.
2. THE Admin_UI SHALL provide a product creation flow within the Cake section that creates a Cake_Product directly without requiring a pre-existing generic product.
3. THE Admin_UI SHALL provide a product creation flow within the Menu section that creates a Menu_Product directly without requiring a pre-existing generic product.
4. WHEN an admin creates a product within a Product_Type_Section, THE System SHALL set the appropriate type flag (e.g., `cakeEnabled = true` for Cake) automatically at creation time.
5. THE Admin_UI SHALL remove the secondary "enable this product for catering/cake/volume" flow from the product edit pages.
6. THE Admin_UI SHALL remove the "pick from existing products" step that previously allowed linking an untyped product to a type section.
7. WHEN an admin navigates to a Product_Type_Section, THE Admin_UI SHALL display only products belonging to that type section.

### Requirement 2: Catering Type Grouping

**User Story:** As an admin, I want to organize catering products under their catering type (Brunch, Lunch, Dînatoire), so that products are grouped logically and ordering rules apply per group.

#### Acceptance Criteria

1. THE System SHALL support three Catering_Type values: `brunch`, `lunch`, and `dinatoire`.
2. EACH Catering_Product SHALL be assigned to exactly one Catering_Type.
3. WHEN an admin creates a Catering_Product, THE Admin_UI SHALL require selection of a Catering_Type before saving.
4. THE Admin_UI SHALL display Catering_Products grouped by their Catering_Type in the catering product list view.
5. EACH Catering_Type_Group SHALL have a bilingual label ({ en, fr }) for display to customers and admins.
6. WHEN a customer views a catering menu, THE System SHALL organize products under their respective Catering_Type_Group headings.

### Requirement 3: Simplified Allergen Management — Direct Assignment

**User Story:** As an admin, I want to assign allergens directly to products or variants instead of computing them from ingredients, so that allergen management is straightforward and does not require maintaining ingredient data.

#### Acceptance Criteria

1. THE Catering_Product SHALL store an Allergen_Set directly at the product level (one flavour per product, so allergens are per-product).
2. THE Cake_Product SHALL store an Allergen_Set on each cake variant (since flavours are represented as variants on cake products).
3. THE Menu_Product SHALL support storing an Allergen_Set either at the product level or at the variant level, depending on whether the Menu_Product has variants.
4. WHEN a Menu_Product has no variants, THE System SHALL store the Allergen_Set at the product level.
5. WHEN a Menu_Product has variants, THE System SHALL store an Allergen_Set on each variant.
6. THE Admin_UI SHALL provide an allergen multi-select control on the appropriate edit form (product-level for catering, variant-level for cake, product-or-variant-level for menu).
7. THE System SHALL remove the `computeProductAllergens` function that previously aggregated allergens from flavours and ingredients.
8. THE System SHALL derive dietary claims (vegan, vegetarian, gluten-free, nut-free, dairy-free) directly from the assigned Allergen_Set without referencing ingredient data.

### Requirement 4: Hide Ingredients Feature

**User Story:** As an admin, I want the ingredients feature hidden from the UI, so that the team is not confused by a complex feature that is no longer used for allergen computation.

#### Acceptance Criteria

1. THE Admin_UI SHALL hide the Ingredients navigation link from the admin sidebar.
2. THE Admin_UI SHALL hide the ingredient association controls from all product edit pages.
3. THE System SHALL retain the ingredients database table and productIngredients join table in the schema without deletion (data preservation).
4. THE Admin_UI SHALL not display ingredient-based allergen computation results on any product page.
5. IF an admin navigates directly to the ingredients URL path, THEN THE Admin_UI SHALL display a message indicating the feature is currently unavailable.

### Requirement 5: Catering Product Model — One Flavour Per Product

**User Story:** As an admin, I want each catering product to represent a single flavour, so that I can manage ordering rules, allergens, and descriptions at the product level.

#### Acceptance Criteria

1. THE Catering_Product SHALL store a bilingual flavour description (`cateringDescription: { en, fr }`) at the product level.
2. THE Catering_Product SHALL store a bilingual flavour name override (`cateringFlavourName: { en, fr }`) when the display name differs from the product name.
3. WHEN a Catering_Product is created, THE System SHALL default to one-flavour-per-product with no variant subdivision for flavours.
4. THE Catering_Product SHALL store dietary filter tags and temperature tags at the product level.

### Requirement 6: Catering Flavour End Date

**User Story:** As an admin, I want to set an end date on catering products, so that seasonal or limited items automatically become unavailable after a specified date.

#### Acceptance Criteria

1. THE Catering_Product SHALL have an optional `cateringEndDate` field (ISO 8601 date string).
2. WHEN the current date exceeds the `cateringEndDate` of a Catering_Product, THE System SHALL exclude that product from active catering menus displayed to customers.
3. WHILE a Catering_Product has a `cateringEndDate` in the future, THE Admin_UI SHALL display the end date with a visual indicator showing remaining availability.
4. WHEN a Catering_Product has no `cateringEndDate` set, THE System SHALL treat the product as having no expiry (always available while active).

### Requirement 7: Catering-Type-Specific Ordering Rules

**User Story:** As an admin, I want different minimum quantities and increment rules per catering type, so that brunch, dînatoire, and lunch orders follow their respective business constraints.

#### Acceptance Criteria

1. THE Ordering_Rule_Engine SHALL enforce the following rules for `brunch` Catering_Type: minimum quantity of 12 per flavour, quantity increments in sets of 6 (valid quantities: 12, 18, 24, 30, ...).
2. THE Ordering_Rule_Engine SHALL enforce the following rules for `dinatoire` Catering_Type: minimum quantity of 3 per flavour, quantity increments of 1 (valid quantities: 3, 4, 5, 6, ...).
3. THE Ordering_Rule_Engine SHALL enforce the following rules for `lunch` Catering_Type: minimum quantity of 6 per flavour, quantity increments of 1 (valid quantities: 6, 7, 8, 9, ...).
4. WHEN a customer submits a catering order, THE Ordering_Rule_Engine SHALL validate that each line item quantity satisfies the minimum and increment rules for the associated Catering_Type.
5. IF a line item quantity violates the ordering rules for the Catering_Type, THEN THE Ordering_Rule_Engine SHALL return a descriptive validation error specifying the violated rule, the expected minimum, and the allowed increment.
6. WHEN a new Catering_Type is needed in the future, THE Ordering_Rule_Engine SHALL support adding new types with custom min/step rules via configuration without code changes.

### Requirement 8: Catering Menu Filtering

**User Story:** As a customer, I want to filter catering menu items by dietary preference and serving temperature, so that I can quickly find items that match my event needs.

#### Acceptance Criteria

1. THE Catering_Product SHALL store an array of dietary filter tags (values: `vegetarian`, `vegan`, `gluten-free`, `dairy-free`, `nut-free`).
2. THE Catering_Product SHALL store an array of temperature tags (values: `hot`, `cold`).
3. WHEN a customer selects one or more dietary filter tags, THE Menu_Filter_Engine SHALL return only Catering_Products that match ALL selected dietary tags (AND logic).
4. WHEN a customer selects a temperature filter, THE Menu_Filter_Engine SHALL return only Catering_Products that match the selected temperature tag.
5. WHEN both dietary and temperature filters are active, THE Menu_Filter_Engine SHALL return only Catering_Products matching ALL dietary tags AND the selected temperature tag.
6. WHEN no filters are selected, THE Menu_Filter_Engine SHALL display all active Catering_Products in the catering menu.
7. THE Admin_UI SHALL provide controls for assigning dietary filter tags and temperature tags to each Catering_Product.

### Requirement 9: Catering Ordering Rule Configuration Storage

**User Story:** As an admin, I want catering ordering rules stored as configuration data, so that rules can be adjusted without deploying code changes.

#### Acceptance Criteria

1. THE System SHALL store catering ordering rules in a `cateringOrderingRules` configuration structure, keyed by Catering_Type.
2. EACH entry in `cateringOrderingRules` SHALL contain: `minQuantity` (integer), `quantityStep` (integer), and a bilingual `label` ({ en, fr }).
3. WHEN the Ordering_Rule_Engine validates a catering order, THE Ordering_Rule_Engine SHALL read rules from the `cateringOrderingRules` configuration rather than from hardcoded values.
4. THE Admin_UI SHALL provide an interface to view and edit catering ordering rules per Catering_Type.
5. IF a Catering_Type has no entry in `cateringOrderingRules`, THEN THE Ordering_Rule_Engine SHALL reject orders for that type with a descriptive error indicating missing configuration.

### Requirement 10: Catering Flavour Description Display

**User Story:** As a customer, I want to see a description for each catering item, so that I understand what each item contains before ordering.

#### Acceptance Criteria

1. THE Catering_Product SHALL store a bilingual `cateringDescription` field ({ en, fr }) for the flavour description.
2. WHEN a catering menu is displayed to a customer, THE System SHALL render the `cateringDescription` for each Catering_Product in the customer's selected locale.
3. WHEN a Catering_Product has no `cateringDescription` set, THE System SHALL fall back to the product-level `description` field.
4. THE Admin_UI SHALL provide a bilingual rich text editor for the `cateringDescription` field on the catering product edit page.

### Requirement 11: Shopify-First for Duplicated Data

**User Story:** As an admin, I want the CMS to defer to Shopify for fields that Shopify already manages (tags, status), so that I do not have to maintain the same data in two places.

#### Acceptance Criteria

1. THE Admin_UI SHALL not provide editing controls for product tags when the product is linked to a Shopify product (tags are managed in Shopify).
2. THE Admin_UI SHALL not provide editing controls for product status when the product is linked to a Shopify product (status is managed in Shopify).
3. WHEN a product is linked to a Shopify product, THE Admin_UI SHALL display Shopify-managed fields (tags, status) as read-only values fetched from Shopify.
4. THE System SHALL treat Shopify as the source of truth for all Shopify_Managed_Fields and not store duplicate editable copies in the CMS.
5. WHEN a product is not linked to a Shopify product, THE Admin_UI SHALL allow editing of tags and status directly in the CMS (no Shopify source available).
6. THE Admin_UI SHALL remove any CMS-side tag management controls (e.g., TagPicker) from product edit forms for Shopify-linked products.

### Requirement 12: Hide Tasting Notes from Admin UI

**User Story:** As an admin, I want tasting notes hidden from the product edit forms, so that the UI is not cluttered with a field that is not currently used.

#### Acceptance Criteria

1. THE Admin_UI SHALL not display the tasting notes field on any product edit form (Catering, Cake, or Menu).
2. THE Admin_UI SHALL not provide any control to view or edit the Tasting_Notes_Field in the product creation flow.
3. THE System SHALL retain the `tastingNotes` column in the products database table without deletion (data preservation for future use).
4. WHEN a product has existing tasting notes data in the database, THE System SHALL preserve that data without modification.

### Requirement 13: Consistent Translation UX Across Product Types

**User Story:** As an admin, I want all bilingual fields across all product types to use the same translation editing pattern, so that the editing experience is predictable and consistent.

#### Acceptance Criteria

1. THE Admin_UI SHALL display bilingual fields with both language versions visible side-by-side in the form for all Product_Type_Sections (Catering, Cake, Menu).
2. THE Admin_UI SHALL provide an AI auto-translate button (AiTranslateButton component) on each bilingual field group to translate content from one language to the other.
3. THE Admin_UI SHALL use the TranslationFields component as the standard implementation for all bilingual field rendering across product edit forms.
4. WHEN an admin clicks the AI auto-translate button, THE System SHALL translate the source language content to the target language and populate the target field.
5. THE Admin_UI SHALL apply the Translation_Pattern consistently to all bilingual fields including: product name, description, flavour name, catering description, volume description, volume instructions, cake description, and cake instructions.
6. THE Admin_UI SHALL use the same translation layout and interaction pattern on the Catering product edit form, the Cake product edit form, and the Menu product edit form.

### Requirement 14: Consistent Dirty-State Save UX Across Product Types

**User Story:** As an admin, I want all product edit forms to use the same dirty-state save pattern, so that the save experience is consistent and I always know when I have unsaved changes.

#### Acceptance Criteria

1. THE Admin_UI SHALL display a fixed save header bar when a product edit form has unsaved changes, across all Product_Type_Sections (Catering, Cake, Menu).
2. THE save header bar SHALL contain a "Save" action button and a "Discard" action to revert unsaved changes.
3. THE Admin_UI SHALL use the EditPageLayout component with the `isDirty` prop as the standard implementation for the dirty-state save pattern across all product edit forms.
4. WHEN an admin modifies any field on a product edit form, THE Admin_UI SHALL detect the change and display the save header bar.
5. WHEN an admin saves or discards changes, THE Admin_UI SHALL hide the save header bar.
6. THE Admin_UI SHALL apply the Dirty_State_Save_Pattern consistently on the Catering product edit form, the Cake product edit form, and the Menu product edit form.

### Requirement 15: Catering Lead Time Rule

**User Story:** As a customer, I want the catering order form to enforce a lead time rule, so that I can only select dates far enough in advance for the bakery to prepare my catering order.

#### Acceptance Criteria

1. THE System SHALL enforce a configurable Catering_Lead_Time that determines the earliest date a customer can select when placing a catering order.
2. THE System SHALL default the Catering_Lead_Time to 28 days (4 weeks) when no custom value is configured.
3. WHEN a customer opens the catering order date picker, THE System SHALL disable all dates earlier than the current date plus the configured Catering_Lead_Time.
4. IF a customer submits a catering order with a requested date earlier than the current date plus the configured Catering_Lead_Time, THEN THE System SHALL reject the order with a descriptive error specifying the earliest allowed date.
5. THE Admin_UI SHALL provide an interface to view and edit the Catering_Lead_Time value.
6. WHEN an admin updates the Catering_Lead_Time, THE System SHALL apply the new value to all subsequent catering orders without requiring a code deployment.
7. THE System SHALL store the Catering_Lead_Time configuration in the same configuration structure pattern used by `cateringOrderingRules` (Requirement 9).
