# Requirements Document

## Introduction

The Cake Orders feature adds a dedicated ordering flow for custom cakes, mirroring the architecture of the existing Volume Orders feature. Key differences: fulfillment is pickup-only (no delivery option), and orders capture cake-specific metadata — number of people, pickup date, event type, and special instructions. Lead time tiers are based on number of people rather than unit quantity. The feature spans the admin panel (product management, email templates), API routes, database schema, storefront page, and Shopify checkout integration, with full bilingual (EN/FR) support.

## Glossary

- **Cake_Product**: A product in the `products` table with `cakeEnabled = true`, representing a cake available for custom ordering.
- **Cake_Lead_Time_Tier**: A row in the `cake_lead_time_tiers` table defining the minimum lead time (in days) required based on the number of people the cake serves.
- **Cake_Variant**: A row in the `cake_variants` table representing a size/style option for a cake product, with bilingual labels and Shopify variant mapping.
- **Cake_Order_Page**: The public-facing storefront page where customers browse cake products, configure orders, and proceed to checkout.
- **Cake_Admin_List_Page**: The admin page listing all cake-enabled products with tier counts and minimum order sizes.
- **Cake_Admin_Edit_Page**: The admin page for configuring a single cake product's settings, lead time tiers, description, and instructions.
- **Cake_Email_Template_Page**: The admin page for customizing the cake order confirmation email with bilingual support and template variables.
- **Cake_Checkout_API**: The API endpoint that creates a Shopify cart with cake order metadata (event type, number of people, pickup date, special instructions).
- **Cake_Storefront_API**: The public API endpoint returning cake-enabled products with their lead time tiers and variants for the storefront.
- **Cake_Admin_API**: The authenticated API endpoints for listing, enabling, updating, and configuring cake products.
- **Event_Type**: A category describing the occasion for the cake order (e.g., birthday, wedding, corporate, other).
- **Number_Of_People**: The number of guests the cake is intended to serve, used to determine lead time via Cake_Lead_Time_Tiers.

## Requirements

### Requirement 1: Cake Product Database Schema

**User Story:** As a developer, I want cake-specific fields and tables in the database, so that cake product configuration, lead time tiers, and variants are persisted independently from volume orders.

#### Acceptance Criteria

1. THE Database SHALL include `cakeEnabled` (boolean, default false), `cakeDescription` (bilingual JSONB), `cakeInstructions` (bilingual JSONB), and `cakeMinPeople` (integer) fields on the `products` table.
2. THE Database SHALL include a `cake_lead_time_tiers` table with columns: `id` (UUID PK), `productId` (FK to products, cascade delete), `minPeople` (integer), `leadTimeDays` (integer), and `createdAt` (timestamp).
3. THE Database SHALL include a `cake_variants` table with columns: `id` (UUID PK), `productId` (FK to products, cascade delete), `label` (bilingual JSONB), `shopifyVariantId` (text, nullable), `sortOrder` (integer, default 0), `active` (boolean, default true), and `createdAt` (timestamp).
4. THE Database SHALL index `cake_lead_time_tiers.productId` and `cake_variants.productId` for query performance.

### Requirement 2: Cake Admin API Routes

**User Story:** As an admin, I want API endpoints to manage cake products, so that I can enable, configure, and update cake ordering settings from the admin panel.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/cake-products`, THE Cake_Admin_API SHALL return all products where `cakeEnabled = true`, including tier count and minimum people, ordered by name.
2. WHEN a GET request is made to `/api/cake-products?candidates=true`, THE Cake_Admin_API SHALL return all products where `cakeEnabled = false` as candidates for enabling.
3. WHEN a POST request is made to `/api/cake-products` with a valid `productId`, THE Cake_Admin_API SHALL set `cakeEnabled = true` on the specified product and return the updated product with status 201.
4. WHEN a GET request is made to `/api/cake-products/[id]`, THE Cake_Admin_API SHALL return the cake product with its lead time tiers and variants.
5. WHEN a PUT request is made to `/api/cake-products/[id]` with configuration data, THE Cake_Admin_API SHALL update the cake product fields, lead time tiers, and variants, then return the updated product.
6. IF a PUT request includes lead time tiers with non-ascending `minPeople` values, THEN THE Cake_Admin_API SHALL return a 400 error with a descriptive message.
7. IF an unauthenticated request is made to any Cake_Admin_API endpoint, THEN THE Cake_Admin_API SHALL return a 401 Unauthorized response.
8. IF a request references a non-existent product ID, THEN THE Cake_Admin_API SHALL return a 404 Not Found response.

### Requirement 3: Cake Storefront API

**User Story:** As a customer, I want to browse available cake products on the storefront, so that I can see what cakes are available for ordering.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/storefront/cake-products`, THE Cake_Storefront_API SHALL return all products where `cakeEnabled = true` and at least one Cake_Lead_Time_Tier is configured.
2. THE Cake_Storefront_API SHALL include for each product: id, name, slug, image, price, shopifyProductId, cakeDescription, cakeInstructions, cakeMinPeople, allergens, lead time tiers, and variants.
3. THE Cake_Storefront_API SHALL return lead time tiers ordered by ascending `minPeople`.
4. THE Cake_Storefront_API SHALL map product variants to a storefront shape with bilingual labels, price, and shopifyVariantId.
5. THE Cake_Storefront_API SHALL require no authentication (public endpoint).

### Requirement 4: Cake Checkout API

**User Story:** As a customer, I want to check out my cake order through Shopify, so that I can pay and confirm my order.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/checkout/cake` with valid items, pickup date, number of people, event type, and locale, THE Cake_Checkout_API SHALL create a Shopify cart and return the checkout URL and cart ID.
2. THE Cake_Checkout_API SHALL store order metadata as Shopify cart attributes: Order Type ("cake"), Cake Product ID, Pickup Date, Number of People, and Event Type.
3. THE Cake_Checkout_API SHALL generate a bilingual (EN/FR) order note containing: order type, pickup date, number of people, event type, line items with quantities, and special instructions (if provided).
4. THE Cake_Checkout_API SHALL enforce pickup-only fulfillment by setting the Fulfillment Type attribute to "pickup" on all cake orders.
5. THE Cake_Checkout_API SHALL resolve Shopify variant IDs for each line item and apply tax-exempt variant substitution using the same convention-based logic as volume checkout.
6. IF no items are provided in the request, THEN THE Cake_Checkout_API SHALL return a 400 error with message "No items in cart".
7. IF the pickup date is missing, THEN THE Cake_Checkout_API SHALL return a 400 error with message "Pickup date is required".
8. IF any variant cannot be resolved to a Shopify variant ID, THEN THE Cake_Checkout_API SHALL return a 422 error listing the unresolvable variants.

### Requirement 5: Cake Admin List Page

**User Story:** As an admin, I want to see all cake-enabled products in a list, so that I can manage which products are available for cake ordering.

#### Acceptance Criteria

1. THE Cake_Admin_List_Page SHALL display a table of all cake-enabled products with columns: Product (name + image), Min People, Lead Time Tiers (count), and Status.
2. THE Cake_Admin_List_Page SHALL display a badge count of total cake products in the page header.
3. WHEN the admin clicks "Add Product", THE Cake_Admin_List_Page SHALL open a modal listing non-cake-enabled products with search filtering.
4. WHEN the admin selects a product in the Add Product modal, THE Cake_Admin_List_Page SHALL call the POST `/api/cake-products` endpoint and refresh the product list on success.
5. WHEN the admin clicks a product row, THE Cake_Admin_List_Page SHALL navigate to `/admin/cake-products/[id]`.
6. THE Cake_Admin_List_Page SHALL use the shared Table, TableCard, Badge, and Button components consistent with the existing admin design system.

### Requirement 6: Cake Admin Edit Page

**User Story:** As an admin, I want to configure a cake product's settings, lead time tiers, and descriptions, so that the storefront displays accurate information and enforces correct lead times.

#### Acceptance Criteria

1. THE Cake_Admin_Edit_Page SHALL display the product name as the page title with a back link to `/admin/cake-products`.
2. THE Cake_Admin_Edit_Page SHALL provide a toggle to enable or disable cake ordering for the product, with a confirmation modal when disabling.
3. THE Cake_Admin_Edit_Page SHALL provide an input for Minimum Number of People.
4. THE Cake_Admin_Edit_Page SHALL provide an interface to add, edit, and remove Cake_Lead_Time_Tiers with `minPeople` and `leadTimeDays` fields.
5. IF the admin enters lead time tiers with non-ascending `minPeople` values, THEN THE Cake_Admin_Edit_Page SHALL display a validation error before saving.
6. THE Cake_Admin_Edit_Page SHALL provide bilingual (EN/FR) textarea fields for Cake Description and Cake Instructions using the TranslationFields component and AdminLocaleSwitcher.
7. WHEN the admin clicks Save, THE Cake_Admin_Edit_Page SHALL send a PUT request to `/api/cake-products/[id]` and display a success or error toast.
8. THE Cake_Admin_Edit_Page SHALL track unsaved changes and use the EditPageLayout dirty-state pattern.
9. THE Cake_Admin_Edit_Page SHALL include links to the product's main admin page and Shopify admin page.

### Requirement 7: Cake Order Email Template Page

**User Story:** As an admin, I want to customize the cake order confirmation email, so that customers receive a branded, informative confirmation in their preferred language.

#### Acceptance Criteria

1. THE Cake_Email_Template_Page SHALL provide bilingual (EN/FR) input fields for the email subject and textarea fields for the email body using TranslationFields and AdminLocaleSwitcher.
2. THE Cake_Email_Template_Page SHALL display a reference panel listing available template variables: `{{orderNumber}}`, `{{customerName}}`, `{{pickupDate}}`, `{{numberOfPeople}}`, `{{eventType}}`, `{{variantBreakdown}}`, `{{specialInstructions}}`, and `{{totalQuantity}}`.
3. WHEN the admin saves the template, THE Cake_Email_Template_Page SHALL send a PUT request to `/api/settings/email-templates/cake-order-confirmation` and display a success or error toast.
4. THE Cake_Email_Template_Page SHALL validate that the English subject and body are non-empty before saving.
5. THE Cake_Email_Template_Page SHALL use the `cake-order-confirmation` template key for storage and retrieval.

### Requirement 8: Cake Order Storefront Page

**User Story:** As a customer, I want to browse cake products, select options, specify event details, and check out, so that I can place a cake order for my event.

#### Acceptance Criteria

1. THE Cake_Order_Page SHALL fetch and display cake-enabled products from `/api/storefront/cake-products` in a responsive grid (2 columns mobile, 3 columns desktop).
2. THE Cake_Order_Page SHALL display for each product: image (or brand-color placeholder), name, price, description, allergen badges, and variant quantity inputs.
3. THE Cake_Order_Page SHALL display lead time tier information per product, highlighting the currently active tier based on the selected number of people.
4. WHEN the customer has items in the cart, THE Cake_Order_Page SHALL display an inline cart sidebar (desktop) showing grouped line items, subtotal, item count, and allergen summary.
5. THE Cake_Order_Page SHALL provide a Number of People input that drives lead time calculation across all cart items.
6. THE Cake_Order_Page SHALL provide a date picker for Pickup Date with a minimum date calculated from the maximum lead time across all cart items based on the selected number of people.
7. IF the customer selects a pickup date earlier than the calculated earliest date, THEN THE Cake_Order_Page SHALL display a warning message and disable the checkout button.
8. THE Cake_Order_Page SHALL provide a dropdown or input for Event Type with options: birthday, wedding, corporate, and other.
9. THE Cake_Order_Page SHALL provide a textarea for Special Instructions / Other Information.
10. THE Cake_Order_Page SHALL enforce pickup-only fulfillment and not display a delivery option toggle.
11. WHEN the customer has items in the cart and a valid pickup date, THE Cake_Order_Page SHALL enable the checkout button.
12. WHEN the customer clicks checkout, THE Cake_Order_Page SHALL send a POST request to `/api/checkout/cake` and redirect to the Shopify checkout URL on success.
13. IF a product's total quantity is below its `cakeMinPeople`, THEN THE Cake_Order_Page SHALL display a minimum-not-met warning and disable checkout.
14. THE Cake_Order_Page SHALL persist the cart to localStorage under a `rhubarbe:cake:cart` key and report the cart count to the navigation context.
15. THE Cake_Order_Page SHALL be fully bilingual, using the `T.cakeOrder` translation namespace.
16. WHEN viewed on mobile, THE Cake_Order_Page SHALL display a fixed bottom checkout bar instead of the sidebar.

### Requirement 9: Cake Order Data in Orders Table

**User Story:** As a developer, I want cake orders captured via Shopify webhooks to be stored with cake-specific metadata, so that admins can view and manage cake orders.

#### Acceptance Criteria

1. THE Database `orders` table `orderType` field SHALL support the value "cake" in addition to "launch" and "volume".
2. WHEN a Shopify order webhook is received with Order Type attribute "cake", THE System SHALL store the order with `orderType = "cake"`, the pickup date in `fulfillmentDate`, and special instructions in `allergenNotes` (or a new dedicated field).
3. THE System SHALL store cake-specific metadata (number of people, event type) extracted from the Shopify order note or attributes.

### Requirement 10: Admin Navigation Integration

**User Story:** As an admin, I want cake products to appear in the admin navigation, so that I can easily access cake order management.

#### Acceptance Criteria

1. THE Admin_Navigation SHALL include a "Cake Products" link in the sidebar, navigating to `/admin/cake-products`.
2. THE Admin_Navigation SHALL position the "Cake Products" link near the existing "Volume Products" link for discoverability.
