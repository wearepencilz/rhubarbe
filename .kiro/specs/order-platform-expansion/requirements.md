# Requirements Document

## Introduction

The Order Platform Expansion feature enhances the admin orders experience to provide differentiated views, details, and tools for each of the three order types: launch, catering (volume), and cake. It also verifies and hardens localStorage cart persistence across all order types via the `OrderItemsContext`.

## Glossary

- **Admin_Orders_Page**: The admin page at `/admin/orders` that lists all orders with filtering and search capabilities
- **Order_Detail_Page**: The admin page at `/admin/orders/[id]` that displays full details for a single order
- **Prep_Sheet**: The admin page at `/admin/orders/prep-sheet` that aggregates product quantities across orders for kitchen production planning
- **Pickup_List**: The admin page at `/admin/orders/pickup-list` that manages customer pickup fulfillment with QR scanning
- **Order_Type**: A discriminator field on orders with values "launch", "volume", or "cake"
- **Launch_Order**: An order placed through the weekly launch menu, tied to a specific launch/menu with pickup date, location, and time slot
- **Volume_Order**: A catering/volume order with a fulfillment date, fulfillment type (pickup or delivery), and allergen notes
- **Cake_Order**: A cake order with a pickup date, number of people, event type, and special instructions
- **Cart_Context**: The `OrderItemsContext` React context that tracks cart item counts for all three order types using localStorage
- **localStorage_Cart**: Browser localStorage entries keyed as `rhubarbe:order:cart`, `rhubarbe:volume:cart`, and `rhubarbe:cake:cart`
- **Orders_API**: The REST API at `/api/orders` that returns order data with optional status and orderType filters
- **Fulfillment_Date**: The date a volume or cake order is scheduled for pickup or delivery

## Requirements

### Requirement 1: localStorage Cart Persistence Verification

**User Story:** As a customer, I want my cart items to persist across page navigations and browser refreshes for all order types, so that I do not lose my selections.

#### Acceptance Criteria

1. WHEN a customer adds items to the launch order cart, THE Cart_Context SHALL persist the items to `rhubarbe:order:cart` in localStorage as a JSON array of objects containing `quantity` fields
2. WHEN a customer adds items to the catering order cart, THE Cart_Context SHALL persist the items to `rhubarbe:volume:cart` in localStorage as a JSON array of `[variantId, quantity]` tuples
3. WHEN a customer adds items to the cake order cart, THE Cart_Context SHALL persist the items to `rhubarbe:cake:cart` in localStorage as a JSON array of `[variantId, quantity]` tuples
4. WHEN the browser page is refreshed, THE Cart_Context SHALL rehydrate all three cart counts from localStorage on mount
5. WHEN the customer navigates between pages, THE Cart_Context SHALL rehydrate all three cart counts on each route change
6. IF localStorage is unavailable or contains malformed JSON, THEN THE Cart_Context SHALL default the affected cart count to zero without throwing an error

### Requirement 2: Order Type Badge on Orders List

**User Story:** As an admin, I want to see the order type clearly indicated on each row in the orders table, so that I can quickly identify what kind of order it is.

#### Acceptance Criteria

1. THE Admin_Orders_Page SHALL display an order type badge on each order row indicating "Launch", "Catering", or "Cake"
2. THE Admin_Orders_Page SHALL use visually distinct badge colors for each Order_Type value
3. WHEN the order type filter is set to "all", THE Admin_Orders_Page SHALL show the order type badge on every row

### Requirement 3: Order-Type-Specific Table Columns

**User Story:** As an admin, I want the orders table to show relevant columns based on the selected order type filter, so that I see the most useful information for each type.

#### Acceptance Criteria

1. WHEN the order type filter is set to "launch" or "all", THE Admin_Orders_Page SHALL display columns for pickup date and pickup location
2. WHEN the order type filter is set to "volume", THE Admin_Orders_Page SHALL display columns for fulfillment date, fulfillment type, total quantity, and allergen notes
3. WHEN the order type filter is set to "cake", THE Admin_Orders_Page SHALL display columns for pickup date, number of people, event type, and total quantity
4. THE Admin_Orders_Page SHALL display order number, customer name, order date, status, and total columns for all order type filters

### Requirement 4: Order-Type-Specific Detail Page

**User Story:** As an admin, I want the order detail page to show information relevant to the specific order type, so that I can see all pertinent details for that order.

#### Acceptance Criteria

1. THE Order_Detail_Page SHALL display the Order_Type as a badge in the order header
2. WHEN the order is a Launch_Order, THE Order_Detail_Page SHALL display the launch/menu title, pickup date, pickup location, and pickup time slot
3. WHEN the order is a Volume_Order, THE Order_Detail_Page SHALL display the fulfillment date, fulfillment type, and allergen notes in a dedicated section
4. WHEN the order is a Cake_Order, THE Order_Detail_Page SHALL display the pickup date, number of people, and event type in a dedicated section
5. WHEN the order is a Cake_Order with special instructions, THE Order_Detail_Page SHALL display the special instructions in a highlighted section
6. WHEN the order is a Volume_Order with allergen notes, THE Order_Detail_Page SHALL display the allergen notes in a highlighted section

### Requirement 5: Catering Prep Sheet

**User Story:** As an admin, I want a prep sheet view for catering orders that aggregates quantities by product across orders for a given fulfillment date, so that the kitchen can plan production.

#### Acceptance Criteria

1. THE Prep_Sheet SHALL support a date-based selector for catering orders in addition to the existing launch/menu selector
2. WHEN a fulfillment date is selected for catering orders, THE Prep_Sheet SHALL aggregate product quantities across all Volume_Order records matching that Fulfillment_Date
3. THE Prep_Sheet SHALL display allergen notes from each catering order alongside the aggregated product rows
4. THE Prep_Sheet SHALL support CSV export for catering prep data
5. THE Prep_Sheet SHALL support print for catering prep data

### Requirement 6: Cake Order Prep Sheet

**User Story:** As an admin, I want a prep sheet view for cake orders that aggregates quantities by product for a given pickup date, so that the kitchen can plan cake production.

#### Acceptance Criteria

1. THE Prep_Sheet SHALL support a date-based selector for cake orders
2. WHEN a pickup date is selected for cake orders, THE Prep_Sheet SHALL aggregate product quantities across all Cake_Order records matching that date
3. THE Prep_Sheet SHALL display event type and number of people from each cake order alongside the aggregated product rows
4. THE Prep_Sheet SHALL support CSV export for cake prep data
5. THE Prep_Sheet SHALL support print for cake prep data

### Requirement 7: Catering and Cake Pickup/Fulfillment List

**User Story:** As an admin, I want a fulfillment list for catering and cake orders organized by date, so that I can track which orders have been picked up or delivered.

#### Acceptance Criteria

1. THE Pickup_List SHALL support a date-based selector for catering and cake orders in addition to the existing launch/menu selector
2. WHEN a fulfillment date is selected, THE Pickup_List SHALL display all Volume_Order and Cake_Order records matching that date
3. THE Pickup_List SHALL group catering and cake orders by Order_Type within the selected date
4. THE Pickup_List SHALL display the fulfillment type (pickup or delivery) for each catering order
5. THE Pickup_List SHALL display the event type and number of people for each cake order
6. THE Pickup_List SHALL allow marking individual catering and cake orders as fulfilled

### Requirement 8: Orders API Order-Type-Specific Data

**User Story:** As a developer, I want the orders API to return order-type-specific fields, so that the admin UI can render differentiated views.

#### Acceptance Criteria

1. THE Orders_API SHALL return `orderType`, `fulfillmentDate`, and `allergenNotes` fields for all orders in the list endpoint
2. THE Orders_API SHALL return `specialInstructions` parsed metadata (number of people, event type) for Cake_Order records in the detail endpoint
3. WHEN filtering by orderType, THE Orders_API SHALL return only orders matching the specified Order_Type value
4. THE Orders_API SHALL return `launchTitle` for Launch_Order records

### Requirement 9: Prep Sheet and Pickup List Order Type Selector

**User Story:** As an admin, I want to switch between launch, catering, and cake modes on the prep sheet and pickup list pages, so that I can use the appropriate workflow for each order type.

#### Acceptance Criteria

1. THE Prep_Sheet SHALL display an order type selector with options for "Launch", "Catering", and "Cake"
2. WHEN "Launch" is selected on the Prep_Sheet, THE Prep_Sheet SHALL display the existing launch/menu-based selector and workflow
3. WHEN "Catering" or "Cake" is selected on the Prep_Sheet, THE Prep_Sheet SHALL display a date picker for selecting the fulfillment or pickup date
4. THE Pickup_List SHALL display an order type selector with options for "Launch", "Catering", and "Cake"
5. WHEN "Launch" is selected on the Pickup_List, THE Pickup_List SHALL display the existing launch/menu-based selector and QR scanning workflow
6. WHEN "Catering" or "Cake" is selected on the Pickup_List, THE Pickup_List SHALL display a date picker and list orders for the selected date
