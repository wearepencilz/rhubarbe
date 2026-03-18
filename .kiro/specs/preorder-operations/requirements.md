# Requirements Document

## Introduction

This feature extends the Rhubarbe CMS and public storefront with a dedicated preorder operations layer. The goal is to give the Rhubarbe team structured, reusable tools to manage weekly B2C preorder menus, B2B rolling lead-time ordering, pickup locations, time slots, and product-level availability — without duplicating products or re-entering scheduling logic every week.

The feature introduces six new CMS content types (Availability Patterns, Pickup Locations, Slot Templates, Menu Weeks, Product Availability Windows, and an Order Operations view), extends the existing Product model with an Availability tab, and surfaces the resulting operational rules on the public storefront.

All development work for this feature MUST be done on a dedicated git branch before any code is merged to the main branch.

## Glossary

- **CMS**: The Rhubarbe back-office admin application at `/admin`
- **Product**: The canonical sellable item — linked to Shopify, carrying editorial content and ingredient relationships
- **Availability_Pattern**: A reusable scheduling rule set that defines when orders open/close, pickup logic, slot logic, and quantity rules
- **Availability_Window**: A product-level override or scheduled instance that applies a pattern (or custom rules) to a specific product for a specific date range
- **Pickup_Location**: A named physical location where customers collect their orders
- **Slot_Template**: A reusable time-slot definition (start time, end time, interval, default capacity)
- **Menu_Week**: A grouped weekly release of products with a shared cutoff, pickup date, and editorial content
- **Order_Operations_View**: A staff-facing read-only view of upcoming pickups, product prep totals, and customer collection lists
- **Cutoff**: The datetime after which new orders for a product or menu week are no longer accepted
- **Lead_Time**: A rolling minimum notice period (in hours) required before a pickup date/time
- **Slot**: A specific pickup time window with a defined capacity
- **B2C**: Business-to-consumer weekly preorder pattern with a fixed weekly cutoff
- **B2B**: Business-to-business catering pattern with a rolling lead-time rule
- **Staff**: An authenticated admin user of the CMS
- **Customer**: A public storefront user placing an order
- **Storefront**: The public-facing Next.js site


## Requirements

### Requirement 1: Project Principles

**User Story:** As a developer, I want clear architectural principles for the preorder system, so that the implementation maintains consistency with the existing Rhubarbe data model and supports both B2C and B2B selling patterns.

#### Acceptance Criteria

1. THE Preorder_System SHALL use the existing Product model as the canonical sellable item
2. THE Product SHALL remain linked to Shopify and SHALL continue to carry editorial content and ingredient relationships
3. THE Preorder_System SHALL extend the Product model with availability rules rather than creating a new sellable entity
4. THE Preorder_System SHALL separate product content from operational selling rules
5. THE Preorder_System SHALL provide reusable scheduling components to avoid manual re-entry of availability rules
6. THE Preorder_System SHALL support both B2C weekly menu cutoffs and B2B rolling lead-time ordering patterns
7. THE Preorder_System SHALL allow B2C and B2B patterns to coexist within the same CMS and storefront

---

### Requirement 2: Development Branch Constraint

**User Story:** As a developer, I want all preorder-operations work isolated on a dedicated git branch, so that the main branch remains stable until the feature is reviewed and approved.

#### Acceptance Criteria

1. THE Development_Team SHALL create a dedicated git branch named `feature/preorder-operations` before writing any code related to this feature
2. THE Development_Team SHALL not merge any preorder-operations code into the main branch until the feature has passed review
3. WHEN a pull request is opened for this feature, THE Development_Team SHALL target the main branch from `feature/preorder-operations`

---

### Requirement 3: Product Availability Mode

**User Story:** As a staff member, I want to set an availability mode on each product, so that I can control whether a product is always orderable, scheduled, pattern-driven, or hidden.

#### Acceptance Criteria

1. THE Product SHALL support an `availability_mode` field with the following values: `always_available`, `scheduled`, `pattern_based`, `hidden`
2. WHEN a product's `availability_mode` is `always_available`, THE Storefront SHALL display the product as orderable at all times
3. WHEN a product's `availability_mode` is `hidden`, THE Storefront SHALL not display the product on any public listing or product page
4. WHEN a product's `availability_mode` is `scheduled`, THE Storefront SHALL only display the product as orderable when an active Availability_Window exists for it
5. WHEN a product's `availability_mode` is `pattern_based`, THE Storefront SHALL derive orderability from the rules of the assigned Availability_Pattern
6. THE Product SHALL support an optional `assigned_availability_pattern` field referencing an Availability_Pattern
7. THE Product SHALL support a `default_pickup_required` boolean field
8. THE Product SHALL support a `default_min_quantity` integer field with a minimum value of 1
9. THE Product SHALL support a `default_quantity_step` integer field with a minimum value of 1
10. THE Product SHALL support an optional `default_max_quantity` integer field
11. THE Product SHALL support an optional `default_lead_time_hours` integer field
12. THE Product SHALL support an optional `default_location_restriction` field referencing one or more Pickup_Locations
13. THE Product SHALL support an optional `order_type` field with values: `weekly_menu`, `b2b_catering`, `signature_cake`, `special_launch`
14. THE Product SHALL support an `online_orderable` boolean field
15. THE Product SHALL support a `pickup_only` boolean field
16. THE Product SHALL support an optional `inventory_mode` field
17. THE Product SHALL support an optional `cap_mode` field
18. THE Product SHALL support a `date_selection_type` field
19. THE Product SHALL support a `slot_selection_type` field

---

### Requirement 9: Product Editor Availability Tab

**User Story:** As a staff member, I want an Availability tab in the Product editor, so that I can configure all operational selling rules in one dedicated section without mixing them with editorial content.

#### Acceptance Criteria

1. THE Product_Editor SHALL provide an Availability tab alongside existing Content, Ingredients, Shopify, Media, and Relationships tabs
2. THE Availability_Tab SHALL display a Selling Mode section with fields: `online_orderable`, `pickup_only`, `availability_mode`, `assigned_availability_pattern`
3. THE Availability_Tab SHALL display an Order Rules section with fields: `default_min_quantity`, `default_quantity_step`, `default_max_quantity`, `inventory_mode`, `cap_mode`
4. THE Availability_Tab SHALL display a Pickup Rules section with fields: `default_pickup_required`, `default_location_restriction`, `date_selection_type`, `slot_selection_type`
5. THE Availability_Tab SHALL display an Availability Instances section listing all Product_Availability_Windows for the current product
6. WHEN the Availability Instances section is displayed, THE CMS SHALL provide actions to add, duplicate, or archive windows

---

### Requirement 10: Order Operations View

**User Story:** As a staff member, I want an Order Operations view in the CMS, so that I can see upcoming pickups, export pickup lists, and print prep sheets without manually compiling order data.

#### Acceptance Criteria

1. THE CMS SHALL provide an Order_Operations_View accessible to authenticated staff users
2. THE Order_Operations_View SHALL display upcoming pickups grouped by date, location, and slot
3. THE Order_Operations_View SHALL provide an export function for pickup lists
4. THE Order_Operations_View SHALL provide a filter by product
5. THE Order_Operations_View SHALL display slot counts for each time window
6. THE Order_Operations_View SHALL display special instructions for each order
7. THE Order_Operations_View SHALL provide a print function for prep sheets

---

### Requirement 11: Storefront Product Display Logic

**User Story:** As a customer, I want to see only orderable products on the storefront, so that I don't waste time viewing items I cannot purchase.

#### Acceptance Criteria

1. WHEN a product's `availability_mode` is `hidden`, THE Storefront SHALL not display the product on any listing page or product detail page
2. WHEN a product's `availability_mode` is `always_available`, THE Storefront SHALL display the product with standard "Add to Cart" functionality
3. WHEN a product's `availability_mode` is `scheduled`, THE Storefront SHALL display the product only when an active Product_Availability_Window exists for the current date
4. WHEN a product's `availability_mode` is `pattern_based`, THE Storefront SHALL evaluate the assigned Availability_Pattern to determine if the product is currently orderable
5. WHEN a product is orderable, THE Storefront SHALL display the applicable cutoff datetime
6. WHEN a product is orderable, THE Storefront SHALL display the applicable pickup date or date range
7. WHEN a product requires pickup, THE Storefront SHALL display available Pickup_Locations
8. WHEN a product requires slot selection, THE Storefront SHALL display available time slots with remaining capacity
9. WHEN a product has a minimum quantity greater than 1, THE Storefront SHALL display the minimum quantity requirement
10. WHEN a product has a quantity step greater than 1, THE Storefront SHALL enforce quantity increments in the order interface

---

### Requirement 12: Order Placement Validation

**User Story:** As a customer, I want my order to be validated before submission, so that I receive clear feedback if my order violates availability rules.

#### Acceptance Criteria

1. WHEN a customer attempts to add a product to cart, THE Storefront SHALL validate that the product is currently orderable based on its availability rules
2. WHEN a customer attempts to add a product to cart after the cutoff datetime, THE Storefront SHALL reject the addition and display an error message
3. WHEN a customer selects a quantity below the minimum, THE Storefront SHALL reject the selection and display the minimum quantity requirement
4. WHEN a customer selects a quantity that does not match the quantity step, THE Storefront SHALL reject the selection and display the required increment
5. WHEN a customer selects a quantity above the maximum, THE Storefront SHALL reject the selection and display the maximum quantity limit
6. WHEN a customer selects a pickup slot that has reached capacity, THE Storefront SHALL reject the selection and display available alternative slots
7. WHEN a customer attempts to select a pickup location not allowed for the product, THE Storefront SHALL reject the selection and display allowed locations
8. WHEN a customer submits an order, THE Storefront SHALL validate all products in the cart against current availability rules before processing payment
9. IF any product in the cart is no longer orderable at submission time, THEN THE Storefront SHALL reject the order and display which products are no longer available

---

### Requirement 13: Cutoff and Lead-Time Logic

**User Story:** As a staff member, I want to configure different cutoff logic types for different product categories, so that I can support both fixed weekly cutoffs and rolling lead-time requirements.

#### Acceptance Criteria

1. THE Preorder_System SHALL support fixed cutoff logic for weekly menu products
2. WHEN a product uses fixed cutoff logic, THE Preorder_System SHALL close orders at a defined weekly day and time
3. THE Preorder_System SHALL support relative lead-time logic for B2B products
4. WHEN a product uses relative lead-time logic, THE Preorder_System SHALL require orders to be placed a minimum number of hours before the pickup datetime
5. THE Preorder_System SHALL support generated slot logic for always-available or lead-time products
6. WHEN a product uses generated slot logic, THE Preorder_System SHALL calculate valid pickup dates and times from pattern rules
7. THE Preorder_System SHALL support explicit slot logic for tightly scheduled launches
8. WHEN a product uses explicit slot logic, THE Preorder_System SHALL use authored and stored slot definitions

---

### Requirement 14: Data Model and Storage

**User Story:** As a developer, I want a clear data model for preorder entities, so that I can implement the feature with appropriate storage and querying capabilities.

#### Acceptance Criteria

1. THE Preorder_System SHALL store Product availability configuration as part of the Product entity
2. THE Preorder_System SHALL store Availability_Patterns as independent entities
3. THE Preorder_System SHALL store Product_Availability_Windows as independent entities linked to Products
4. THE Preorder_System SHALL store Pickup_Locations as independent entities
5. THE Preorder_System SHALL store Slot_Templates as independent entities
6. THE Preorder_System SHALL store Menu_Weeks as independent entities
7. THE Preorder_System SHALL support efficient querying of upcoming pickups by date, location, and slot
8. THE Preorder_System SHALL support efficient calculation of slot availability and capacity
9. THE Preorder_System SHALL support concurrent edits to availability configuration without data loss

---

### Requirement 4: Availability Pattern Content Type

**User Story:** As a staff member, I want to create reusable Availability Patterns, so that I can define scheduling rules once and apply them to multiple products without re-entering logic.

#### Acceptance Criteria

1. THE CMS SHALL provide an Availability_Pattern content type
2. THE Availability_Pattern SHALL support a `pattern_name` text field
3. THE Availability_Pattern SHALL support a unique `slug` text field
4. THE Availability_Pattern SHALL support an `internal_description` text field
5. THE Availability_Pattern SHALL support an `active` boolean field
6. THE Availability_Pattern SHALL support a `pattern_type` field with values: `recurring_weekly`, `rolling_lead_time`, `one_off_scheduled`, `manual_custom`
7. THE Availability_Pattern SHALL support an `order_open_logic` field with values: `always_open`, `fixed_datetime`, `recurring_open_day_time`, `relative_to_pickup`
8. THE Availability_Pattern SHALL support an `order_close_logic` field with values: `fixed_datetime`, `recurring_close_day_time`, `relative_lead_time_hours`, `relative_lead_time_days`
9. THE Availability_Pattern SHALL support a `pickup_required` boolean field
10. THE Availability_Pattern SHALL support an optional `allowed_locations` field referencing one or more Pickup_Locations
11. THE Availability_Pattern SHALL support a `pickup_date_mode` field with values: `recurring_pickup_day`, `allowed_weekdays`, `date_range`, `blackout_exclusions`
12. THE Availability_Pattern SHALL support an optional `slot_template` field referencing a Slot_Template
13. THE Availability_Pattern SHALL support optional `custom_slot_range` datetime fields
14. THE Availability_Pattern SHALL support an optional `interval_minutes` integer field
15. THE Availability_Pattern SHALL support an optional `capacity_per_slot` integer field
16. THE Availability_Pattern SHALL support a `slot_limit_mode` field with values: `no_limit`, `per_slot_capacity`, `total_daily_capacity`
17. THE Availability_Pattern SHALL support a `min_quantity` integer field with a minimum value of 1
18. THE Availability_Pattern SHALL support a `quantity_step` integer field with a minimum value of 1
19. THE Availability_Pattern SHALL support an optional `max_quantity` integer field
20. THE Availability_Pattern SHALL support bilingual `preorder_label` fields for French and English
21. THE Availability_Pattern SHALL support bilingual `order_cutoff_message` fields for French and English
22. THE Availability_Pattern SHALL support bilingual `pickup_instruction_text` fields for French and English

---

### Requirement 5: Pickup Location Content Type

**User Story:** As a staff member, I want to manage Pickup Locations as a dedicated content type, so that I have one clean source of truth for location details across products, menus, and order exports.

#### Acceptance Criteria

1. THE CMS SHALL provide a Pickup_Location content type
2. THE Pickup_Location SHALL support an `internal_name` text field
3. THE Pickup_Location SHALL support bilingual `public_label` fields for French and English
4. THE Pickup_Location SHALL support an `address` text field
5. THE Pickup_Location SHALL support bilingual `pickup_instructions` fields for French and English
6. THE Pickup_Location SHALL support a `contact_details` text field
7. THE Pickup_Location SHALL support an `active` boolean field
8. THE Pickup_Location SHALL support a `sort_order` integer field
9. THE Pickup_Location SHALL support an optional `map_or_directions_link` URL field
10. THE Pickup_Location SHALL support an `operational_notes_for_staff` text field

---

### Requirement 6: Slot Template Content Type

**User Story:** As a staff member, I want to create reusable Slot Templates, so that I can define time-slot structures once and reference them in multiple Availability Patterns.

#### Acceptance Criteria

1. THE CMS SHALL provide a Slot_Template content type
2. THE Slot_Template SHALL support a `name` text field
3. THE Slot_Template SHALL support an `internal_description` text field
4. THE Slot_Template SHALL support a `start_time` time field
5. THE Slot_Template SHALL support an `end_time` time field
6. THE Slot_Template SHALL support an `interval_minutes` integer field with a minimum value of 1
7. THE Slot_Template SHALL support a `default_per_slot_capacity` integer field with a minimum value of 1
8. THE Slot_Template SHALL support an `active` boolean field

---

### Requirement 7: Menu Week Content Type

**User Story:** As a staff member, I want to create Menu Weeks for B2C weekly releases, so that I can group products editorially and surface the current menu, cutoff, and featured items on the homepage and order page.

#### Acceptance Criteria

1. THE CMS SHALL provide a Menu_Week content type
2. THE Menu_Week SHALL support an `internal_title` text field
3. THE Menu_Week SHALL support bilingual `public_title` fields for French and English
4. THE Menu_Week SHALL support a `week_label` text field
5. THE Menu_Week SHALL support a `launch_date` date field
6. THE Menu_Week SHALL support an `order_cutoff_datetime` datetime field
7. THE Menu_Week SHALL support a `pickup_date_or_range` field that accepts either a single date or a date range
8. THE Menu_Week SHALL support a `featured_products` field referencing one or more Products
9. THE Menu_Week SHALL support bilingual `menu_intro_copy` rich text fields for French and English
10. THE Menu_Week SHALL support bilingual `banner_messaging` text fields for French and English
11. THE Menu_Week SHALL support a `status` field with values: `active`, `scheduled`, `archived`

---

### Requirement 8: Product Availability Window Content Type

**User Story:** As a staff member, I want to create Availability Windows for specific products, so that I can override pattern rules or disable products for specific date ranges without modifying the base Product or Pattern.

#### Acceptance Criteria

1. THE CMS SHALL provide a Product_Availability_Window content type
2. THE Product_Availability_Window SHALL support a `product` field referencing a Product
3. THE Product_Availability_Window SHALL support a `date_range_or_pickup_date` field that accepts either a date range or a single pickup date
4. THE Product_Availability_Window SHALL support an optional `override_pattern` field referencing an Availability_Pattern
5. THE Product_Availability_Window SHALL support a `disable_product_for_period` boolean field
6. THE Product_Availability_Window SHALL support an optional `min_quantity_override` integer field
7. THE Product_Availability_Window SHALL support an optional `capacity_override` integer field
8. THE Product_Availability_Window SHALL support an optional `location_restriction_override` field referencing one or more Pickup_Locations
9. THE Product_Availability_Window SHALL support an optional `custom_cutoff_override` datetime field
10. THE Product_Availability_Window SHALL support a `notes` text field

---

### Requirement 15: CMS List Views for Preorder Content Types

**User Story:** As a staff member, I want dedicated list views for Availability Patterns, Pickup Locations, Slot Templates, Menu Weeks, and Availability Windows, so that I can browse, search, filter, and manage these entities efficiently.

#### Acceptance Criteria

1. THE CMS SHALL provide a list view for Availability_Patterns at `/admin/availability-patterns`
2. THE Availability_Patterns_List SHALL display columns: pattern_name, pattern_type, active status, number of products using this pattern
3. THE Availability_Patterns_List SHALL support filtering by pattern_type and active status
4. THE Availability_Patterns_List SHALL support search by pattern_name
5. THE CMS SHALL provide a list view for Pickup_Locations at `/admin/pickup-locations`
6. THE Pickup_Locations_List SHALL display columns: internal_name, public_label, active status, sort_order
7. THE Pickup_Locations_List SHALL support filtering by active status
8. THE Pickup_Locations_List SHALL support drag-and-drop reordering by sort_order
9. THE CMS SHALL provide a list view for Slot_Templates at `/admin/slot-templates`
10. THE Slot_Templates_List SHALL display columns: name, start_time, end_time, interval_minutes, default_per_slot_capacity, active status
11. THE Slot_Templates_List SHALL support filtering by active status
12. THE CMS SHALL provide a list view for Menu_Weeks at `/admin/menu-weeks`
13. THE Menu_Weeks_List SHALL display columns: internal_title, week_label, launch_date, order_cutoff_datetime, pickup_date_or_range, status
14. THE Menu_Weeks_List SHALL support filtering by status
15. THE Menu_Weeks_List SHALL support sorting by launch_date
16. THE CMS SHALL provide a list view for Product_Availability_Windows at `/admin/availability-windows`
17. THE Availability_Windows_List SHALL display columns: product name, date_range_or_pickup_date, override_pattern, disable_product_for_period
18. THE Availability_Windows_List SHALL support filtering by product
19. THE Availability_Windows_List SHALL support filtering by date range

---

### Requirement 16: CMS Editor Forms for Preorder Content Types

**User Story:** As a staff member, I want intuitive editor forms for creating and editing Availability Patterns, Pickup Locations, Slot Templates, Menu Weeks, and Availability Windows, so that I can configure preorder rules without technical knowledge.

#### Acceptance Criteria

1. THE CMS SHALL provide a create/edit form for Availability_Patterns at `/admin/availability-patterns/[id]` and `/admin/availability-patterns/create`
2. THE Availability_Pattern_Form SHALL organize fields into logical sections: Basic Info, Order Timing, Pickup Rules, Slot Configuration, Quantity Rules, Customer Messaging
3. THE Availability_Pattern_Form SHALL provide inline help text for complex fields
4. THE Availability_Pattern_Form SHALL validate that recurring_close_day_time occurs after recurring_open_day_time
5. THE Availability_Pattern_Form SHALL validate that end_time occurs after start_time for custom slot ranges
6. THE CMS SHALL provide a create/edit form for Pickup_Locations at `/admin/pickup-locations/[id]` and `/admin/pickup-locations/create`
7. THE Pickup_Location_Form SHALL provide bilingual input fields for public_label and pickup_instructions
8. THE CMS SHALL provide a create/edit form for Slot_Templates at `/admin/slot-templates/[id]` and `/admin/slot-templates/create`
9. THE Slot_Template_Form SHALL validate that end_time occurs after start_time
10. THE Slot_Template_Form SHALL validate that interval_minutes is a positive integer
11. THE CMS SHALL provide a create/edit form for Menu_Weeks at `/admin/menu-weeks/[id]` and `/admin/menu-weeks/create`
12. THE Menu_Week_Form SHALL provide a product picker for featured_products
13. THE Menu_Week_Form SHALL provide bilingual rich text editors for menu_intro_copy
14. THE Menu_Week_Form SHALL validate that order_cutoff_datetime occurs before pickup_date_or_range
15. THE CMS SHALL provide a create/edit form for Product_Availability_Windows at `/admin/availability-windows/[id]` and `/admin/availability-windows/create`
16. THE Availability_Window_Form SHALL provide a product picker for the product field
17. THE Availability_Window_Form SHALL provide a pattern picker for the override_pattern field
18. THE Availability_Window_Form SHALL provide a location picker for the location_restriction_override field

---

### Requirement 17: Storefront Cart Integration

**User Story:** As a customer, I want to add preorder products to my cart with pickup details, so that I can review my order before checkout.

#### Acceptance Criteria

1. WHEN a customer adds a preorder product to cart, THE Storefront SHALL capture the selected pickup date
2. WHEN a customer adds a preorder product to cart, THE Storefront SHALL capture the selected pickup location
3. WHEN a customer adds a preorder product to cart, THE Storefront SHALL capture the selected pickup time slot if applicable
4. WHEN a customer adds a preorder product to cart, THE Storefront SHALL display the pickup details in the cart summary
5. WHEN a customer views their cart, THE Storefront SHALL display the cutoff datetime for each preorder product
6. WHEN a customer views their cart, THE Storefront SHALL group products by pickup date and location
7. WHEN a customer modifies the quantity of a preorder product in cart, THE Storefront SHALL revalidate quantity rules
8. WHEN a customer removes a preorder product from cart, THE Storefront SHALL release any reserved slot capacity
9. WHEN a customer navigates away from the cart, THE Storefront SHALL preserve cart contents for the session
10. WHEN a customer returns to the cart after a cutoff has passed, THE Storefront SHALL display a warning for expired products

---

### Requirement 18: Storefront Checkout Flow

**User Story:** As a customer, I want a clear checkout flow for preorder products, so that I understand what I'm ordering, when I'll pick it up, and where.

#### Acceptance Criteria

1. WHEN a customer proceeds to checkout, THE Storefront SHALL display a summary of all products grouped by pickup date and location
2. WHEN a customer proceeds to checkout, THE Storefront SHALL display the total price
3. WHEN a customer proceeds to checkout, THE Storefront SHALL display pickup instructions for each location
4. WHEN a customer proceeds to checkout, THE Storefront SHALL require customer contact information
5. WHEN a customer proceeds to checkout, THE Storefront SHALL provide an optional special instructions field
6. WHEN a customer submits payment, THE Storefront SHALL revalidate all availability rules before processing
7. IF any product is no longer available at payment time, THEN THE Storefront SHALL reject the order and display which products are unavailable
8. WHEN payment is successful, THE Storefront SHALL create an order record with all pickup details
9. WHEN payment is successful, THE Storefront SHALL decrement slot capacity for reserved slots
10. WHEN payment is successful, THE Storefront SHALL send an order confirmation email to the customer

---

### Requirement 19: Order Confirmation and Customer Communication

**User Story:** As a customer, I want to receive clear confirmation of my preorder, so that I know what I ordered, when to pick it up, and where.

#### Acceptance Criteria

1. WHEN an order is placed, THE Storefront SHALL display an order confirmation page
2. THE Order_Confirmation_Page SHALL display the order number
3. THE Order_Confirmation_Page SHALL display all ordered products with quantities
4. THE Order_Confirmation_Page SHALL display pickup date, location, and time slot for each product
5. THE Order_Confirmation_Page SHALL display pickup instructions for each location
6. THE Order_Confirmation_Page SHALL display customer contact information
7. THE Order_Confirmation_Page SHALL display any special instructions provided by the customer
8. THE Storefront SHALL send an order confirmation email to the customer
9. THE Order_Confirmation_Email SHALL include all information displayed on the order confirmation page
10. THE Order_Confirmation_Email SHALL include a calendar attachment for the pickup date and time

---

### Requirement 20: Admin Order Management

**User Story:** As a staff member, I want to view and manage preorders in the CMS, so that I can track orders, update statuses, and handle customer requests.

#### Acceptance Criteria

1. THE CMS SHALL provide an order list view at `/admin/orders`
2. THE Order_List SHALL display columns: order number, customer name, order date, pickup date, pickup location, status, total
3. THE Order_List SHALL support filtering by pickup date
4. THE Order_List SHALL support filtering by pickup location
5. THE Order_List SHALL support filtering by status
6. THE Order_List SHALL support search by order number or customer name
7. THE CMS SHALL provide an order detail view at `/admin/orders/[id]`
8. THE Order_Detail_View SHALL display all order information including products, quantities, pickup details, and customer information
9. THE Order_Detail_View SHALL provide an action to mark the order as fulfilled
10. THE Order_Detail_View SHALL provide an action to cancel the order
11. THE Order_Detail_View SHALL provide an action to send a custom email to the customer
12. THE Order_Detail_View SHALL display a history of status changes

---

### Requirement 21: Prep Sheet Generation

**User Story:** As a staff member, I want to generate prep sheets for upcoming pickups, so that I can see what products need to be prepared and in what quantities.

#### Acceptance Criteria

1. THE Order_Operations_View SHALL provide a prep sheet generation function
2. WHEN a staff member generates a prep sheet, THE CMS SHALL prompt for a date range
3. WHEN a staff member generates a prep sheet, THE CMS SHALL prompt for optional location filter
4. THE Prep_Sheet SHALL display products grouped by category or type
5. THE Prep_Sheet SHALL display total quantity needed for each product
6. THE Prep_Sheet SHALL display breakdown by pickup date for each product
7. THE Prep_Sheet SHALL display any special instructions from orders
8. THE Prep_Sheet SHALL be printable
9. THE Prep_Sheet SHALL be exportable as PDF
10. THE Prep_Sheet SHALL be exportable as CSV

---

### Requirement 22: Pickup List Generation

**User Story:** As a staff member, I want to generate pickup lists for specific dates and locations, so that I can organize orders for customer collection.

#### Acceptance Criteria

1. THE Order_Operations_View SHALL provide a pickup list generation function
2. WHEN a staff member generates a pickup list, THE CMS SHALL prompt for a pickup date
3. WHEN a staff member generates a pickup list, THE CMS SHALL prompt for a pickup location
4. THE Pickup_List SHALL display orders grouped by time slot
5. THE Pickup_List SHALL display customer name for each order
6. THE Pickup_List SHALL display order number for each order
7. THE Pickup_List SHALL display products and quantities for each order
8. THE Pickup_List SHALL display special instructions for each order
9. THE Pickup_List SHALL be printable
10. THE Pickup_List SHALL be exportable as PDF
11. THE Pickup_List SHALL be sortable by customer name or time slot

---

### Requirement 23: Slot Capacity Management

**User Story:** As a staff member, I want to monitor and adjust slot capacity, so that I can prevent overbooking and accommodate special circumstances.

#### Acceptance Criteria

1. THE Order_Operations_View SHALL display current capacity for each slot
2. THE Order_Operations_View SHALL display remaining capacity for each slot
3. THE Order_Operations_View SHALL display a warning when a slot reaches 80% capacity
4. THE Order_Operations_View SHALL display an alert when a slot reaches 100% capacity
5. THE CMS SHALL provide an action to manually adjust slot capacity
6. WHEN a staff member adjusts slot capacity, THE CMS SHALL require a reason note
7. WHEN a staff member adjusts slot capacity, THE CMS SHALL log the change with timestamp and user
8. THE CMS SHALL provide an action to temporarily close a slot
9. WHEN a staff member closes a slot, THE Storefront SHALL not display that slot as available
10. THE CMS SHALL provide an action to reopen a closed slot

---

### Requirement 24: Data Migration and Backwards Compatibility

**User Story:** As a developer, I want a migration strategy for existing products, so that the preorder system can be deployed without breaking existing functionality.

#### Acceptance Criteria

1. THE Preorder_System SHALL provide a migration script to add availability fields to existing Products
2. THE Migration_Script SHALL set `availability_mode` to `always_available` for all existing products
3. THE Migration_Script SHALL set `online_orderable` to true for all existing products
4. THE Migration_Script SHALL set `pickup_only` to false for all existing products
5. THE Migration_Script SHALL set `default_min_quantity` to 1 for all existing products
6. THE Migration_Script SHALL set `default_quantity_step` to 1 for all existing products
7. THE Migration_Script SHALL set `default_pickup_required` to false for all existing products
8. THE Storefront SHALL continue to display existing products with standard "Add to Cart" functionality after migration
9. THE Product_Editor SHALL display the new Availability tab for all products after migration
10. THE CMS SHALL not require staff to configure availability settings for existing products unless they want to change the default behavior

---

### Requirement 25: Performance and Caching

**User Story:** As a developer, I want efficient querying and caching strategies, so that the storefront remains fast even with complex availability calculations.

#### Acceptance Criteria

1. THE Storefront SHALL cache availability calculations for each product for a minimum of 1 minute
2. THE Storefront SHALL invalidate availability cache when an Availability_Pattern is updated
3. THE Storefront SHALL invalidate availability cache when a Product_Availability_Window is created, updated, or deleted
4. THE Storefront SHALL invalidate availability cache when a Menu_Week is updated
5. THE Storefront SHALL use database indexes on pickup_date, pickup_location, and product_id for order queries
6. THE Order_Operations_View SHALL use database indexes on pickup_date and pickup_location for efficient filtering
7. THE Storefront SHALL preload slot capacity data for the next 7 days
8. THE Storefront SHALL use optimistic locking for slot capacity updates to prevent race conditions
9. THE CMS SHALL provide a manual cache invalidation action for troubleshooting
10. THE Preorder_System SHALL log slow queries exceeding 500ms for performance monitoring

---

### Requirement 26: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can diagnose issues and ensure system reliability.

#### Acceptance Criteria

1. WHEN an availability calculation fails, THE Preorder_System SHALL log the error with product ID, pattern ID, and timestamp
2. WHEN an availability calculation fails, THE Storefront SHALL fall back to displaying the product as unavailable
3. WHEN a slot capacity update fails due to a race condition, THE Preorder_System SHALL retry the update up to 3 times
4. WHEN a slot capacity update fails after 3 retries, THE Preorder_System SHALL log the error and notify staff
5. WHEN an order validation fails at checkout, THE Storefront SHALL log the validation error with cart contents and timestamp
6. WHEN an order validation fails at checkout, THE Storefront SHALL display a user-friendly error message
7. THE Preorder_System SHALL log all configuration changes to Availability_Patterns with user and timestamp
8. THE Preorder_System SHALL log all slot capacity adjustments with user, reason, and timestamp
9. THE CMS SHALL provide an error log view for staff to review recent errors
10. THE CMS SHALL provide an action to export error logs for a specified date range

---

### Requirement 27: Internationalization

**User Story:** As a customer, I want to see preorder information in my preferred language, so that I can understand availability rules and pickup instructions.

#### Acceptance Criteria

1. THE Storefront SHALL display all preorder labels in the customer's selected language (French or English)
2. THE Storefront SHALL display cutoff messages in the customer's selected language
3. THE Storefront SHALL display pickup instructions in the customer's selected language
4. THE Storefront SHALL display menu week intro copy in the customer's selected language
5. THE Order_Confirmation_Email SHALL use the customer's selected language
6. THE CMS SHALL provide bilingual input fields for all customer-facing text
7. THE CMS SHALL validate that both French and English translations are provided before publishing
8. THE CMS SHALL display a warning if a translation is missing
9. THE CMS SHALL provide a translation helper tool for staff
10. THE Preorder_System SHALL fall back to English if a French translation is missing

---

### Requirement 28: Menu Week Storefront Display

**User Story:** As a customer, I want to see the current menu week on the homepage and order page, so that I know what's available this week and when the cutoff is.

#### Acceptance Criteria

1. THE Storefront SHALL display the current active Menu_Week on the homepage
2. THE Homepage_Menu_Week_Section SHALL display the public_title
3. THE Homepage_Menu_Week_Section SHALL display the week_label
4. THE Homepage_Menu_Week_Section SHALL display the order_cutoff_datetime
5. THE Homepage_Menu_Week_Section SHALL display the pickup_date_or_range
6. THE Homepage_Menu_Week_Section SHALL display the menu_intro_copy
7. THE Homepage_Menu_Week_Section SHALL display featured_products with images and prices
8. THE Homepage_Menu_Week_Section SHALL provide a link to the full order page
9. THE Storefront SHALL display the current active Menu_Week on the order page
10. THE Order_Page_Menu_Week_Section SHALL display the banner_messaging
11. THE Order_Page_Menu_Week_Section SHALL display a countdown to the order cutoff
12. WHEN the order cutoff has passed, THE Order_Page SHALL display a message indicating that orders are closed for this week

---

### Requirement 29: Product Filtering and Search on Storefront

**User Story:** As a customer, I want to filter products by availability and pickup options, so that I can quickly find products that fit my schedule.

#### Acceptance Criteria

1. THE Storefront SHALL provide a filter for products available for a specific pickup date
2. THE Storefront SHALL provide a filter for products available at a specific pickup location
3. THE Storefront SHALL provide a filter for products with immediate availability
4. THE Storefront SHALL provide a filter for products in the current menu week
5. THE Storefront SHALL provide a filter for B2B catering products
6. THE Storefront SHALL update product listings in real-time as filters are applied
7. THE Storefront SHALL display the number of products matching current filters
8. THE Storefront SHALL provide a "Clear all filters" action
9. THE Storefront SHALL preserve filter selections when navigating between pages
10. THE Storefront SHALL display a message when no products match the selected filters

---

### Requirement 30: Accessibility and Usability

**User Story:** As a customer with accessibility needs, I want the preorder interface to be fully accessible, so that I can place orders independently.

#### Acceptance Criteria

1. THE Storefront SHALL provide keyboard navigation for all preorder controls
2. THE Storefront SHALL provide ARIA labels for all interactive elements
3. THE Storefront SHALL provide screen reader announcements for availability status changes
4. THE Storefront SHALL provide sufficient color contrast for all text and controls
5. THE Storefront SHALL provide focus indicators for all interactive elements
6. THE Storefront SHALL provide error messages that are announced to screen readers
7. THE Storefront SHALL provide a skip link to bypass navigation and go directly to product listings
8. THE Date_Picker SHALL be keyboard accessible
9. THE Time_Slot_Selector SHALL be keyboard accessible
10. THE Location_Selector SHALL be keyboard accessible

---

### Requirement 31: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive test coverage for the preorder system, so that I can deploy with confidence and prevent regressions.

#### Acceptance Criteria

1. THE Preorder_System SHALL include unit tests for all availability calculation functions
2. THE Preorder_System SHALL include unit tests for all validation functions
3. THE Preorder_System SHALL include integration tests for the order placement flow
4. THE Preorder_System SHALL include integration tests for slot capacity management
5. THE Preorder_System SHALL include end-to-end tests for the complete customer journey from product selection to order confirmation
6. THE Preorder_System SHALL include end-to-end tests for the complete staff workflow from pattern creation to order fulfillment
7. THE Test_Suite SHALL achieve a minimum of 80% code coverage for preorder-related code
8. THE Test_Suite SHALL include tests for concurrent slot capacity updates
9. THE Test_Suite SHALL include tests for edge cases such as cutoff boundary conditions
10. THE Test_Suite SHALL include tests for internationalization and bilingual content

