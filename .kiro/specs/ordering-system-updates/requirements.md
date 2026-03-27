# Requirements Document

## Introduction

Incremental updates to the Rhubarbe ordering system across three existing order flows (Menu Order, Catering, Cake Order). Changes address missing product fields, UX gaps in pickup/delivery selection, and data model extensions for seasonal menus. No new order flows are introduced.

## Glossary

- **Storefront**: The public-facing Next.js pages where customers browse products and place orders
- **Sidebar_Cart**: The persistent order summary panel shown alongside product grids on each order flow
- **Menu_Order**: Weekly preorder flow with Saturday pickup, backed by the `launches` table
- **Catering_Order**: Volume/catering order flow for pastries, cocktail dînatoire, and lunch boxes, backed by volume-enabled products
- **Cake_Order**: Cake order flow with per-cake pricing tiers and lead-time logic
- **Product_Card**: A UI card displaying product image, name, price, description, allergen tags, and variant selectors
- **Launch**: A weekly or seasonal menu configuration record in the `launches` table, defining ordering window, pickup date(s), and linked products
- **Pickup_Slot_Selector**: The dropdown/selector in the Sidebar_Cart where customers choose a pickup time slot
- **Date_Picker**: The calendar widget used in Catering_Order and Cake_Order for selecting fulfillment dates
- **CMS_Admin**: The admin interface under `/admin` used by staff to manage products, menus, and orders
- **Serves_Field**: A short text field (e.g. "6", "8–10") indicating how many people a product serves
- **Pricing_Tier**: A row in `cakePricingTiers` mapping a minimum headcount to a price

## Requirements

### Requirement 1: Display Serves Field on Menu Order Product Cards

**User Story:** As a customer browsing the weekly menu, I want to see how many people each product serves, so that I can decide how many to order.

#### Acceptance Criteria

1. WHEN a Menu_Order product has a non-null `serves` value, THE Storefront SHALL display a "Serves X" label on the Product_Card below the product name
2. WHEN a Menu_Order product has a null or empty `serves` value, THE Storefront SHALL omit the serves label from the Product_Card
3. THE Storefront SHALL style the serves label consistently with existing allergen tags (muted, quiet label style)

### Requirement 2: Show Next Available Date for Sold-Out Products

**User Story:** As a customer, I want to know when a sold-out product will be available again, so that I can plan future orders.

#### Acceptance Criteria

1. THE CMS_Admin SHALL provide a `next_available_date` optional date field on the product content model
2. WHEN a product is marked as sold out AND has a `next_available_date` value, THE Storefront SHALL display "Next available: [formatted date]" below the sold-out overlay
3. WHEN a product is marked as sold out AND has no `next_available_date` value, THE Storefront SHALL display only the sold-out overlay without a date
4. WHEN a product is in stock, THE Storefront SHALL not render the `next_available_date` regardless of its value

### Requirement 3: Support Multi-Day Pickup Window for Seasonal Menus

**User Story:** As a bakery operator, I want to configure a pickup date range for seasonal menus (e.g. Easter), so that customers can choose from multiple pickup days.

#### Acceptance Criteria

1. THE CMS_Admin SHALL replace the single `pickupDate` field on seasonal Launch records with `pickupWindowStart` and `pickupWindowEnd` date fields
2. WHEN a Launch has both `pickupWindowStart` and `pickupWindowEnd` set, THE Pickup_Slot_Selector SHALL generate selectable days from the inclusive date range
3. WHEN a Launch has only a single `pickupDate` (non-seasonal), THE Pickup_Slot_Selector SHALL behave as it does today with a single pickup day
4. THE Storefront SHALL display each available pickup day as a distinct selectable option in the Pickup_Slot_Selector

### Requirement 4: Show Pickup Date and Cut-Off Reminder in Menu Order Sidebar

**User Story:** As a customer placing a weekly menu order, I want to see which Saturday my order is for and when ordering closes, so that I don't miss the deadline.

#### Acceptance Criteria

1. THE Sidebar_Cart SHALL display the target pickup date explicitly (e.g. "Pickup: Saturday, March 28") for Menu_Order flows
2. THE Sidebar_Cart SHALL display an inline cut-off reminder derived from the Launch `orderCloses` timestamp (e.g. "Order by Friday at noon")
3. WHEN the ordering window has not yet opened, THE Sidebar_Cart SHALL display the opening date instead of the cut-off reminder

### Requirement 5: Add Description to Cocktail Dînatoire Items

**User Story:** As a customer browsing catering options, I want to see a short description for each cocktail dînatoire item, so that I understand what each item includes.

#### Acceptance Criteria

1. THE CMS_Admin SHALL provide a bilingual `description` short text field on the cocktail dînatoire item model (volume variant)
2. WHEN a cocktail dînatoire item has a non-empty description, THE Storefront SHALL display the description below the item name in muted style
3. WHEN a cocktail dînatoire item has no description, THE Storefront SHALL display only the item name without extra spacing

### Requirement 6: Add Description to Lunch Box Variants

**User Story:** As a customer browsing catering options, I want to see a short description for each lunch box variant, so that I can choose the right option.

#### Acceptance Criteria

1. THE CMS_Admin SHALL provide a bilingual `description` short text field on the lunch box variant model (volume variant)
2. WHEN a lunch box variant has a non-empty description, THE Storefront SHALL display the description below the variant name in muted style
3. WHEN a lunch box variant has no description, THE Storefront SHALL display only the variant name without extra spacing


### Requirement 7: Display Estimated Serving Count in Catering Sidebar

**User Story:** As a customer building a catering order, I want to see approximately how many people my order serves, so that I can order the right amount.

#### Acceptance Criteria

1. THE CMS_Admin SHALL provide a `serves_per_unit` integer field on each catering product model
2. THE Sidebar_Cart SHALL calculate and display "Serves approx. X people" by summing (quantity × serves_per_unit) across all catering items in the cart
3. WHEN the cart is empty or all items have zero quantity, THE Sidebar_Cart SHALL omit the serves estimate
4. WHEN a catering item quantity changes, THE Sidebar_Cart SHALL update the serves estimate dynamically without page reload

### Requirement 8: Block Sundays in Catering Date Picker

**User Story:** As a bakery operator, I want Sundays disabled in the catering date picker, so that customers cannot select a day we don't fulfill catering orders.

#### Acceptance Criteria

1. THE Date_Picker in Catering_Order SHALL disable all Sundays as non-selectable dates
2. THE Date_Picker SHALL display an explanatory note: "We don't take catering orders on Sundays"
3. IF a customer attempts to select a Sunday via keyboard navigation, THEN THE Date_Picker SHALL prevent the selection and keep the previous valid date

### Requirement 9: Add Description to Cake Product Cards

**User Story:** As a customer browsing cakes, I want to see a description and flavour notes for each cake, so that I can choose the right cake for my event.

#### Acceptance Criteria

1. THE CMS_Admin SHALL provide a bilingual `description` long text field on the cake product model (using existing `cakeDescription` jsonb field)
2. THE CMS_Admin SHALL provide a bilingual `flavour_notes` optional short text field on the cake product model for grid card teasers
3. WHEN a cake product has a non-empty `cakeDescription`, THE Storefront SHALL display the description below the cake name in the expanded card view
4. WHEN a cake product has non-empty `flavour_notes`, THE Storefront SHALL display the flavour notes on the grid card as a teaser line

### Requirement 10: Highlight Active Pricing Tier Dynamically for Cake Orders

**User Story:** As a customer configuring a cake order, I want to see which pricing tier applies as I change the headcount, so that I understand the cost.

#### Acceptance Criteria

1. WHEN the headcount input value changes, THE Storefront SHALL highlight the active Pricing_Tier row that applies to the current headcount
2. WHEN the headcount input value changes, THE Sidebar_Cart SHALL update the "Est. total" dynamically to reflect the active Pricing_Tier price
3. THE Storefront SHALL visually distinguish the active Pricing_Tier from inactive tiers using a highlight style (e.g. background color or border)

### Requirement 11: Add Delivery Option to Cake Order Flow

**User Story:** As a customer ordering a cake, I want to choose between pickup and delivery, so that I can have the cake delivered to my event.

#### Acceptance Criteria

1. THE Sidebar_Cart in Cake_Order SHALL display a Pickup/Delivery toggle matching the existing Catering_Order pattern
2. WHEN Delivery is selected, THE Sidebar_Cart SHALL display an address input field
3. WHEN Delivery is selected for a cake product where `delivery_available` is false in the CMS, THE Storefront SHALL display a message indicating delivery is not available for that cake and prevent order submission
4. WHEN Pickup is selected, THE Sidebar_Cart SHALL hide the address field and use the standard pickup date selection

### Requirement 12: Consistent Serves Field Across All Product Types

**User Story:** As a customer, I want to see serving information displayed consistently across menu products, seasonal products, and cakes, so that I can compare products easily.

#### Acceptance Criteria

1. THE Storefront SHALL display the `serves` field as a quiet label near the price on Menu_Order Product_Cards, seasonal product cards, and Cake_Order product cards
2. THE Storefront SHALL use identical label styling for the serves field across all three order flows
3. WHEN the `serves` field is null or empty for any product type, THE Storefront SHALL omit the label without leaving blank space

### Requirement 13: Show Pickup/Delivery Date Confirmation in Sidebar

**User Story:** As a customer, I want to see my selected pickup or delivery date confirmed in the sidebar, so that I have confidence my order details are correct.

#### Acceptance Criteria

1. WHEN a customer selects a pickup date or delivery date in any order flow, THE Sidebar_Cart SHALL display the selected date as a persistent confirmation line
2. THE Sidebar_Cart SHALL display the date confirmation in all three order flows (Menu_Order, Catering_Order, Cake_Order)
3. WHEN the customer changes the selected date, THE Sidebar_Cart SHALL update the confirmation line immediately
