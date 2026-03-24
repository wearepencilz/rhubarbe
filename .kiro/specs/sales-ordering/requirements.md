# Requirements Document

## Introduction

The Volume Sales Ordering feature introduces a new ordering path for bulk/volume orders, separate from the existing weekly menu/launch preorder system. Customers order X units of a product for a specific date and time, with quantity-dependent lead times, minimum order quantities, variant selection (e.g. Chef's Choice, Vegetarian, Vegan), and a single order-level allergen note. The feature includes automated confirmation emails, full CMS admin management, bilingual (EN/FR) support, and integration with the existing Shopify headless checkout flow.

## Glossary

- **Volume_Order**: A bulk order of one or more products for a specific date and time, placed through the volume sales ordering path. Each Volume_Order has a single Allergen_Note that applies to the entire order, not to individual products.
- **Volume_Product**: A product configured for volume sales ordering, with lead time tiers, minimum order quantity, and variant options. References an existing product record.
- **Lead_Time_Tier**: A rule defining the minimum number of advance days required based on the ordered quantity range for a specific Volume_Product (e.g. 1–10 units = 2 days, 11–40 units = 4 days, 41+ units = 7 days).
- **Minimum_Order_Quantity**: The minimum number of units a customer must order for a given Volume_Product.
- **Variant_Line**: A line within a Volume_Order representing a specific variant (e.g. Chef's Choice, Vegetarian, Vegan) with its own independent quantity.
- **Allergen_Note**: A single free-text field on the Volume_Order where the customer describes allergen concerns for the entire order. This is order-level, not product-level or variant-level.
- **Fulfillment_DateTime**: The specific date and time the customer requests for their Volume_Order to be ready.
- **Confirmation_Email**: An automated email sent after a Volume_Order is paid, containing order details, variant breakdown, allergen note, and fulfillment information.
- **Email_Template**: An admin-configurable bilingual template (subject + body) used to generate Confirmation_Emails, with variable interpolation for order data.
- **Volume_Storefront**: The dedicated customer-facing page at `/volume-order` for browsing and ordering Volume_Products, completely separate from the `/order` page used for launch/menu preorders.
- **CMS_Admin**: The administrative interface at `/admin` used to manage Volume_Product configurations, lead time tiers, email templates, and volume order settings.
- **Checkout_API**: The existing `/api/checkout` endpoint that creates a Shopify cart and returns a checkout URL.
- **Webhook_Handler**: The existing `/api/shopify/webhooks/orders-paid` endpoint that processes paid Shopify orders into the local database.
- **Translation_Object**: A JSONB structure `{ en: string; fr: string }` used throughout the system for bilingual content.

## Requirements

### Requirement 1: Volume Product Configuration

**User Story:** As an administrator, I want to configure products for volume sales with lead time tiers and minimum quantities, so that customers can place bulk orders with appropriate advance notice.

#### Acceptance Criteria

1. THE CMS_Admin SHALL allow administrators to designate existing products as Volume_Products by enabling a volume sales flag on the product record.
2. WHEN a product is designated as a Volume_Product, THE CMS_Admin SHALL allow administrators to set a Minimum_Order_Quantity for that product.
3. THE CMS_Admin SHALL allow administrators to define one or more Lead_Time_Tiers for each Volume_Product, where each tier specifies a quantity range lower bound and a required lead time in days.
4. WHEN an administrator saves Lead_Time_Tiers, THE CMS_Admin SHALL validate that quantity range lower bounds are in ascending order and that no gaps or overlaps exist between tiers.
5. THE CMS_Admin SHALL allow administrators to configure variant options for each Volume_Product with bilingual labels stored as Translation_Object fields.
6. THE CMS_Admin SHALL allow administrators to set a bilingual description and bilingual ordering instructions for each Volume_Product, stored as Translation_Object fields.
7. WHEN a Volume_Product has no Lead_Time_Tiers defined, THE CMS_Admin SHALL display a warning indicating that the product cannot accept volume orders until at least one tier is configured.

### Requirement 2: Volume Ordering Storefront

**User Story:** As a customer, I want a dedicated volume ordering page separate from the weekly menu, so that I can browse products available for bulk orders, select a fulfillment date based on lead times, and place a volume order with a single allergen note for the entire order.

#### Acceptance Criteria

1. THE Volume_Storefront SHALL be a standalone page at the `/volume-order` route, completely separate from the `/order` page used for launch/menu preorders. THE Volume_Storefront SHALL NOT be accessible as a tab, modal, or sub-section within the `/order` page.
2. THE Volume_Storefront SHALL fetch only products with the volume sales flag enabled and at least one Lead_Time_Tier configured. THE Volume_Storefront SHALL NOT reference or depend on any launch, menu, or launch-product data.
3. THE Volume_Storefront SHALL display all active Volume_Products with their names, images, descriptions, variant options, and Minimum_Order_Quantity in the customer's active locale. WHEN a French translation is missing for a user-facing field, THE Volume_Storefront SHALL fall back to the English value.
4. THE Volume_Storefront SHALL display each available variant for a Volume_Product with an independent quantity input field.
5. WHEN the total quantity across all Variant_Lines for a Volume_Product is below the configured Minimum_Order_Quantity, THE Volume_Storefront SHALL disable the add-to-order action and display a bilingual message indicating the minimum required quantity.
6. THE Volume_Storefront SHALL provide a date and time picker for the customer to select the desired Fulfillment_DateTime.
7. WHEN the customer enters or changes the total quantity for a Volume_Product, THE Volume_Storefront SHALL determine the applicable Lead_Time_Tier and compute the earliest available Fulfillment_DateTime as the current date plus the lead time days from that tier.
8. WHEN the customer increases the total quantity into a higher Lead_Time_Tier, THE Volume_Storefront SHALL recalculate and display the updated earliest available Fulfillment_DateTime. THE Volume_Storefront SHALL disable dates in the date picker that are earlier than the computed earliest available Fulfillment_DateTime.
9. IF the customer selects a Fulfillment_DateTime that violates the applicable Lead_Time_Tier, THEN THE Volume_Storefront SHALL display a bilingual message explaining the minimum advance notice required for the selected quantity.
10. THE Volume_Storefront SHALL provide a single Allergen_Note free-text input field where the customer can describe allergen concerns for the entire order. The Allergen_Note applies to the whole Volume_Order, not to individual products or variants.
11. THE Volume_Storefront SHALL display an order summary showing each Variant_Line with its quantity, the total quantity, the selected Fulfillment_DateTime, and the Allergen_Note before proceeding to checkout.
12. THE Site_Navigation and Site_Footer SHALL each include a dedicated bilingual link to the `/volume-order` page, separate from the existing `/order` link.

### Requirement 3: Shopify Checkout Integration

**User Story:** As a customer, I want my volume order to go through the same Shopify checkout as menu orders, so that payment processing is consistent.

#### Acceptance Criteria

1. WHEN a customer submits a Volume_Order, THE Checkout_API SHALL create a Shopify cart with each Variant_Line as a separate line item using the variant's Shopify variant ID and quantity.
2. THE Checkout_API SHALL attach cart attributes identifying the order as a volume order, including the order type "volume", the Volume_Product identifier, and the requested Fulfillment_DateTime.
3. WHEN a Volume_Order includes an Allergen_Note, THE Checkout_API SHALL include the order-level Allergen_Note as a cart attribute and append the Allergen_Note to the order note.
4. THE Checkout_API SHALL include a human-readable order note summarizing the volume order: product name, each variant with quantity, fulfillment date and time, and allergen concerns.
5. IF any Variant_Line references a Shopify variant ID that cannot be resolved, THEN THE Checkout_API SHALL return an error identifying the unresolvable variant.

### Requirement 4: Order Storage and Webhook Processing

**User Story:** As a developer, I want paid volume orders stored with their volume-specific metadata, so that volume orders can be managed separately from launch orders.

#### Acceptance Criteria

1. WHEN the Webhook_Handler receives a paid order with a volume order type attribute, THE Webhook_Handler SHALL store the order with an order_type value of "volume".
2. THE Database SHALL store a fulfillment_date field on the orders table for the customer's requested Fulfillment_DateTime.
3. THE Database SHALL store an allergen_notes text field on the orders table for the order-level Allergen_Note.
4. THE Database SHALL store an order_type discriminator field on the orders table with values "launch" or "volume", defaulting to "launch" for backward compatibility.
5. THE Database SHALL store each Variant_Line as an order item record with the variant label and quantity.
6. WHEN querying orders, THE Database SHALL support filtering by order_type.
7. WHEN the Webhook_Handler receives a paid order without a recognized order type attribute, THE Webhook_Handler SHALL default the order_type to "launch".

### Requirement 5: Confirmation Emails

**User Story:** As a business owner, I want automated confirmation emails sent after volume orders are paid, so that customers receive a detailed summary tailored to their bulk order.

#### Acceptance Criteria

1. WHEN the Webhook_Handler processes a paid Volume_Order, THE Email_System SHALL send a Confirmation_Email to the customer's email address.
2. THE Confirmation_Email SHALL include the order number, customer name, order date, requested Fulfillment_DateTime, a breakdown of each Variant_Line with its quantity, and the order-level Allergen_Note when present.
3. THE Confirmation_Email SHALL use a bilingual template matching the customer's locale at the time of order.
4. THE Email_Template SHALL support variable interpolation for: order number, customer name, fulfillment date, fulfillment time, variant breakdown, allergen note, and total quantity.
5. IF the Email_System fails to send the Confirmation_Email, THEN THE Email_System SHALL log the failure with the order identifier and retry up to 3 times with exponential backoff.

### Requirement 6: Email Infrastructure

**User Story:** As a developer, I want a transactional email sending capability, so that the system can send confirmation emails for volume orders.

#### Acceptance Criteria

1. THE Email_System SHALL send transactional emails via an external email service provider API.
2. THE Email_System SHALL support HTML email templates with variable interpolation for order data.
3. THE Email_System SHALL log each email send attempt with the recipient address, template identifier, send status (sent or failed), and timestamp.
4. IF the external email service returns an error, THEN THE Email_System SHALL retry the send up to 3 times with exponential backoff before marking the attempt as failed.
5. THE Email_System SHALL validate the recipient email address format before attempting to send.

### Requirement 7: Admin CMS for Volume Sales Management

**User Story:** As an administrator, I want to manage volume product configurations, view volume orders, and configure email templates in the CMS, so that I can control the volume sales experience.

#### Acceptance Criteria

1. THE CMS_Admin SHALL provide a list view of all Volume_Products showing the product name, Minimum_Order_Quantity, number of Lead_Time_Tiers, and active status.
2. WHEN an administrator selects a Volume_Product, THE CMS_Admin SHALL display an edit form with sections for: bilingual description, bilingual ordering instructions, Minimum_Order_Quantity, Lead_Time_Tiers, and variant configuration.
3. THE CMS_Admin SHALL provide an inline editor for Lead_Time_Tiers where administrators can add, edit, and remove tiers with quantity range lower bound and lead time in days.
4. THE CMS_Admin SHALL provide an email template editor where administrators can configure the Confirmation_Email subject and body in both English and French using the TranslationFields component pattern.
5. THE CMS_Admin SHALL provide a volume orders list view that filters the existing orders list to show only orders with order_type "volume", displaying the fulfillment date, total quantity, and allergen notes.
6. THE CMS_Admin SHALL support the existing locale switcher for editing all bilingual content, and SHALL store all user-facing volume sales content as Translation_Object JSONB fields with `en` and `fr` keys.
7. WHEN an administrator disables a Volume_Product, THE CMS_Admin SHALL display a confirmation prompt warning that the product will no longer appear on the volume ordering page.
