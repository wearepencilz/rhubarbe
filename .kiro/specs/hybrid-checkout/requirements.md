# Requirements Document

## Introduction

The Hybrid Checkout feature replaces the current "create Shopify cart → immediate redirect" flow with a multi-step pre-checkout experience built in Next.js. Users complete fulfillment selection (pickup/delivery), date scheduling, address entry (for delivery), and order review within the application before being redirected to Shopify's hosted checkout exclusively for payment. This applies to all three order types: Regular Orders, Volume Orders, and Cake Orders.

## Glossary

- **Checkout_Flow**: The multi-step Next.js page sequence that collects fulfillment details and presents an order review before redirecting to Shopify for payment.
- **Fulfillment_Step**: The pre-checkout step where the user selects pickup or delivery, chooses a date, and optionally enters a delivery address.
- **Review_Step**: The pre-checkout step where the user reviews all order details (items, fulfillment info, notes) before proceeding to payment.
- **Shopify_Cart**: The cart object created via the Storefront API `cartCreate` mutation, which returns a `checkoutUrl` for hosted payment.
- **Cart_Attributes**: Key-value metadata attached to the Shopify cart (e.g., Order Type, Fulfillment Type, Pickup Date, Delivery Address).
- **Checkout_API**: The existing Next.js API routes (`/api/checkout`, `/api/checkout/volume`, `/api/checkout/cake`) that create the Shopify cart and return the `checkoutUrl`.
- **Order_Type**: One of three order categories: Regular (menu-based), Volume (catering), or Cake (custom cakes).
- **Pre_Checkout**: The set of Next.js pages that handle all user-facing steps before payment, replacing the previous immediate-redirect behavior.

## Requirements

### Requirement 1: Pre-Checkout Flow Entry Point

**User Story:** As a customer, I want the checkout button to take me to a pre-checkout flow within the site, so that I can review and configure my order before being sent to payment.

#### Acceptance Criteria

1. WHEN the customer clicks the checkout button on any order page (Regular, Volume, or Cake), THE Checkout_Flow SHALL navigate the customer to the Fulfillment_Step instead of immediately redirecting to Shopify's checkoutUrl.
2. THE Checkout_Flow SHALL preserve all cart items and previously entered order details (fulfillment type, date, allergen notes, event type, special instructions) when entering the Pre_Checkout.
3. IF the customer's cart is empty, THEN THE Checkout_Flow SHALL prevent navigation to the Pre_Checkout and display a message indicating the cart is empty.

### Requirement 2: Fulfillment Step — Pickup or Delivery Selection

**User Story:** As a customer, I want to choose between pickup and delivery during checkout, so that I can receive my order in the way that suits me.

#### Acceptance Criteria

1. THE Fulfillment_Step SHALL display a toggle allowing the customer to select either "Pickup" or "Delivery" as the fulfillment method.
2. WHILE the Order_Type is Regular, THE Fulfillment_Step SHALL default to "Pickup" and display the pickup location and slot selection already configured on the order page.
3. WHILE the Order_Type is Volume and any product in the cart has `pickupOnly` set to true, THE Fulfillment_Step SHALL disable the "Delivery" option and display a message indicating pickup is required.
4. WHILE the Order_Type is Cake and the selected cake product has `cakeDeliveryAvailable` set to false, THE Fulfillment_Step SHALL disable the "Delivery" option and display "Pickup only."
5. WHEN the customer selects "Delivery," THE Fulfillment_Step SHALL display address input fields (street, city, province/state, postal code).
6. IF the customer selects "Delivery" and leaves any required address field empty, THEN THE Fulfillment_Step SHALL display a validation error and prevent progression to the Review_Step.

### Requirement 3: Fulfillment Step — Date and Time Selection

**User Story:** As a customer, I want to pick a fulfillment date during checkout, so that I know when my order will be ready.

#### Acceptance Criteria

1. THE Fulfillment_Step SHALL display a date picker for selecting the fulfillment date.
2. WHILE the Order_Type is Regular, THE Fulfillment_Step SHALL pre-populate the date from the launch's pickup date or the customer's previously selected pickup day, and display pickup slot selection when slots are available.
3. WHILE the Order_Type is Volume, THE Fulfillment_Step SHALL enforce the lead-time-based earliest date calculated from the cart's maximum lead time across all products.
4. WHILE the Order_Type is Cake, THE Fulfillment_Step SHALL enforce the lead-time-based earliest date calculated from the selected cake product's lead time tiers and number of people.
5. THE Fulfillment_Step SHALL mark days returned by the pickup-config API (`disabledPickupDays`) as unavailable in the date picker.
6. IF the customer selects a date earlier than the calculated earliest date, THEN THE Fulfillment_Step SHALL display a warning and prevent progression to the Review_Step.

### Requirement 4: Review Step — Order Summary and Confirmation

**User Story:** As a customer, I want to review my complete order before paying, so that I can verify everything is correct.

#### Acceptance Criteria

1. THE Review_Step SHALL display a summary of all cart items including product name, variant label, quantity, and line price.
2. THE Review_Step SHALL display the selected fulfillment method (Pickup or Delivery).
3. THE Review_Step SHALL display the selected fulfillment date and, for Regular orders, the pickup slot if one was chosen.
4. WHEN the fulfillment method is "Delivery," THE Review_Step SHALL display the entered delivery address.
5. WHILE the Order_Type is Volume, THE Review_Step SHALL display the allergen note if one was provided.
6. WHILE the Order_Type is Cake, THE Review_Step SHALL display the number of people, event type, and special instructions if provided.
7. THE Review_Step SHALL display the estimated subtotal.
8. THE Review_Step SHALL provide a "Back" button that returns the customer to the Fulfillment_Step with all previously entered data preserved.
9. THE Review_Step SHALL provide a "Proceed to Payment" button that initiates Shopify cart creation and redirects to the Shopify checkoutUrl.

### Requirement 5: Shopify Cart Creation and Payment Redirect

**User Story:** As a customer, I want to be redirected to Shopify's secure payment page after confirming my order, so that my payment is handled safely.

#### Acceptance Criteria

1. WHEN the customer clicks "Proceed to Payment" on the Review_Step, THE Checkout_API SHALL create a Shopify_Cart with all cart line items, Cart_Attributes (order type, fulfillment type, fulfillment date, pickup location, delivery address, event type, number of people), and a formatted order note.
2. WHEN the fulfillment method is "Delivery," THE Checkout_API SHALL include the delivery address as Cart_Attributes with keys "Delivery Street," "Delivery City," "Delivery Province," and "Delivery Postal Code."
3. WHEN the Shopify_Cart is created successfully, THE Checkout_Flow SHALL redirect the customer to the Shopify_Cart's checkoutUrl.
4. IF the Shopify_Cart creation fails, THEN THE Checkout_Flow SHALL display the error message returned by the Checkout_API and keep the customer on the Review_Step.
5. WHILE the "Proceed to Payment" request is in progress, THE Review_Step SHALL disable the payment button and display a loading indicator.

### Requirement 6: Cart Data Persistence Across Pre-Checkout Steps

**User Story:** As a customer, I want my checkout data to be preserved if I navigate between steps or refresh the page, so that I don't lose my progress.

#### Acceptance Criteria

1. THE Checkout_Flow SHALL persist all fulfillment selections (fulfillment type, date, time, address, notes) across step navigation within the Pre_Checkout.
2. IF the customer refreshes the browser during the Pre_Checkout, THEN THE Checkout_Flow SHALL restore the cart items and fulfillment selections from persisted state.
3. WHEN the customer navigates back to the order page from the Pre_Checkout, THE Checkout_Flow SHALL preserve the cart contents so the customer can modify items and return.

### Requirement 7: Order-Type-Specific Attribute Mapping

**User Story:** As a store operator, I want each order type's specific details to be passed as Shopify cart attributes, so that I can process orders correctly.

#### Acceptance Criteria

1. WHILE the Order_Type is Regular, THE Checkout_API SHALL include Cart_Attributes for "Menu," "Menu ID," "Pickup Date," "Pickup Location," "Pickup Address," and "Pickup Slot" (when applicable).
2. WHILE the Order_Type is Volume, THE Checkout_API SHALL include Cart_Attributes for "Order Type" (value: "volume"), "Volume Product," "Fulfillment Date," "Fulfillment Type," and "Allergen Note" (when provided).
3. WHILE the Order_Type is Cake, THE Checkout_API SHALL include Cart_Attributes for "Order Type" (value: "cake"), "Cake Product," "Pickup Date," "Fulfillment Type," "Number of People," "Event Type," "Calculated Price," and "Special Instructions" (when provided).
4. THE Checkout_API SHALL continue to apply convention-based tax variant resolution (quantity threshold and always-exempt rules) before creating the Shopify_Cart.

### Requirement 8: Bilingual Support

**User Story:** As a customer browsing in French or English, I want the pre-checkout pages to display in my selected language, so that I can understand all checkout steps.

#### Acceptance Criteria

1. THE Checkout_Flow SHALL render all labels, buttons, validation messages, and order summary text in the customer's active locale (English or French).
2. THE Checkout_API SHALL format the Shopify cart note in the customer's active locale, consistent with the existing note formatting behavior.

### Requirement 9: Mobile Responsiveness

**User Story:** As a customer on a mobile device, I want the pre-checkout flow to be usable on small screens, so that I can complete my order from my phone.

#### Acceptance Criteria

1. THE Checkout_Flow SHALL render the Fulfillment_Step and Review_Step in a single-column layout on viewports narrower than 768px.
2. THE Checkout_Flow SHALL render the Fulfillment_Step and Review_Step in a two-column layout (details + sidebar summary) on viewports 768px and wider.
3. THE Checkout_Flow SHALL ensure all interactive elements (buttons, inputs, date picker, address fields) meet a minimum touch target size of 44×44 CSS pixels on mobile viewports.
