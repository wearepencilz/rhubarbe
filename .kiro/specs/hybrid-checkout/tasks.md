# Implementation Plan: Hybrid Checkout

## Overview

Implement a multi-step pre-checkout flow (Fulfillment → Review → Shopify Payment) for all three order types (Regular, Volume, Cake). Uses a strategy pattern with `OrderTypeConfig` to isolate per-order-type constraints, a shared `CheckoutFlowContainer` orchestrator, and persists state to localStorage. Existing checkout APIs are reused unchanged except for adding delivery address attributes.

## Tasks

- [x] 1. Define shared types and OrderTypeConfig interface
  - [x] 1.1 Create `lib/checkout/types.ts` with `FulfillmentState`, `DeliveryAddress`, `CheckoutStep`, `CartItemUnion`, `RegularCartItem`, `VolumeCartItem`, `CakeCartItem`, and `ValidationResult` interfaces
    - Include all fields from the design: fulfillmentType, date, pickupSlotId, pickupDay, address, allergenNote, eventType, specialInstructions, numberOfPeople
    - _Requirements: 1.2, 2.1, 2.5, 3.1, 6.1_
  - [x] 1.2 Create `lib/checkout/order-type-config.ts` with the `OrderTypeConfig` interface
    - Define supportsFulfillmentToggle, isDeliveryDisabled, deliveryDisabledReason, getEarliestDate, getDisabledPickupDays, hasPresetDate, checkoutEndpoint, buildCheckoutPayload, getOrderSpecificFields
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3_

- [x] 2. Implement the three OrderTypeConfig strategies
  - [x] 2.1 Create `lib/checkout/configs/regular.ts` — `regularOrderConfig`
    - supportsFulfillmentToggle: false (pickup only)
    - hasPresetDate: true (launch-based dates)
    - checkoutEndpoint: `/api/checkout`
    - buildCheckoutPayload maps launchId, launchTitle, pickupDate, pickupLocationName, pickupLocationAddress, pickupSlot
    - getOrderSpecificFields returns menu name, pickup location, pickup slot
    - _Requirements: 2.2, 3.2, 7.1_
  - [x] 2.2 Create `lib/checkout/configs/volume.ts` — `volumeOrderConfig`
    - supportsFulfillmentToggle: true
    - isDeliveryDisabled checks pickupOnly flag on cart items
    - getEarliestDate computes max lead time across cart products
    - checkoutEndpoint: `/api/checkout/volume`
    - buildCheckoutPayload maps items, fulfillmentDate, fulfillmentType, allergenNote
    - getOrderSpecificFields returns allergen note, serves estimate
    - _Requirements: 2.3, 3.3, 7.2_
  - [x] 2.3 Create `lib/checkout/configs/cake.ts` — `cakeOrderConfig`
    - supportsFulfillmentToggle: true
    - isDeliveryDisabled checks cakeDeliveryAvailable flag
    - getEarliestDate computes lead time from tier + numberOfPeople
    - checkoutEndpoint: `/api/checkout/cake`
    - buildCheckoutPayload maps items, pickupDate, numberOfPeople, eventType, specialInstructions, fulfillmentType, calculatedPrice
    - getOrderSpecificFields returns numberOfPeople, eventType, specialInstructions
    - _Requirements: 2.4, 3.4, 7.3_
  - [x] 2.4 Write unit tests for the three config implementations
    - Test isDeliveryDisabled logic for volume (pickupOnly) and cake (cakeDeliveryAvailable)
    - Test getEarliestDate for volume lead-time tiers and cake lead-time tiers
    - Test buildCheckoutPayload produces correct shape for each order type
    - _Requirements: 2.2, 2.3, 2.4, 3.3, 3.4, 7.1, 7.2, 7.3_

- [x] 3. Implement FulfillmentToggle and AddressForm components
  - [x] 3.1 Create `components/checkout/FulfillmentToggle.tsx`
    - Pickup/Delivery toggle matching existing Volume/Cake inline cart pattern
    - Accept value, onChange, deliveryDisabled, deliveryDisabledMessage, locale props
    - Bilingual labels (Cueillette/Pickup, Livraison/Delivery)
    - _Requirements: 2.1, 8.1, 9.3_
  - [x] 3.2 Create `components/checkout/AddressForm.tsx`
    - Fields: street, city, province, postalCode
    - Display validation errors per field
    - Bilingual labels and placeholders
    - _Requirements: 2.5, 2.6, 8.1, 9.3_

- [x] 4. Implement FulfillmentStep component
  - [x] 4.1 Create `components/checkout/FulfillmentStep.tsx`
    - Receives config, cartItems, fulfillment state, onFulfillmentChange, onNext, locale
    - Renders FulfillmentToggle (hidden/locked per config.supportsFulfillmentToggle)
    - Renders DatePickerField with minValue from config.getEarliestDate() and isDateUnavailable from config.getDisabledPickupDays()
    - Renders pickup slot selector for Regular orders when launch has slots
    - Renders AddressForm when fulfillmentType is "delivery"
    - Validates on "Continue to Review": date required, date >= earliest, address fields required for delivery, slot required for Regular with slots
    - Shows validation errors inline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.1, 9.1, 9.2_

- [x] 5. Checkpoint — Verify fulfillment step renders correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement ReviewStep and OrderReviewSummary
  - [x] 6.1 Create `components/checkout/OrderReviewSummary.tsx`
    - Renders cart items: product name, variant label, quantity, line price
    - Renders subtotal
    - Renders fulfillment method, date, pickup slot (Regular), delivery address (when delivery)
    - Renders order-type-specific fields via config.getOrderSpecificFields()
    - Bilingual labels
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 8.1_
  - [x] 6.2 Create `components/checkout/ReviewStep.tsx`
    - Receives config, cartItems, fulfillment state, onBack, locale
    - Renders OrderReviewSummary
    - "Back" button returns to FulfillmentStep preserving state
    - "Proceed to Payment" button calls config.checkoutEndpoint with config.buildCheckoutPayload()
    - Handles loading state (disable button, show spinner) and error state (display error, stay on page)
    - On success, clears checkout state from localStorage and redirects to checkoutUrl
    - _Requirements: 4.8, 4.9, 5.1, 5.3, 5.4, 5.5, 8.1_

- [x] 7. Implement CheckoutFlowContainer orchestrator
  - [x] 7.1 Create `components/checkout/CheckoutFlowContainer.tsx`
    - Accepts orderType prop ('regular' | 'volume' | 'cake')
    - Reads cart items from localStorage using the appropriate key per order type
    - Guards empty cart — redirects back to order page with message
    - Manages currentStep state ('fulfillment' | 'review')
    - Persists FulfillmentState to localStorage under `rhubarbe:checkout:state` via usePersistedState
    - Passes the correct OrderTypeConfig to FulfillmentStep and ReviewStep
    - Responsive layout: single-column on mobile, two-column (flow + sidebar summary) on desktop
    - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 9.1, 9.2_

- [x] 8. Checkpoint — Verify checkout flow container wires steps together
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create checkout route pages and wire to order pages
  - [x] 9.1 Create `app/order/checkout/page.tsx` — server component that renders CheckoutFlowContainer with orderType="regular"
    - Pass launch data (pickupDate, pickupSlots, pickupLocation) as props or fetch client-side
    - _Requirements: 1.1, 3.2_
  - [x] 9.2 Create `app/volume-order/checkout/page.tsx` — server component that renders CheckoutFlowContainer with orderType="volume"
    - _Requirements: 1.1, 3.3_
  - [x] 9.3 Create `app/cake-order/checkout/page.tsx` — server component that renders CheckoutFlowContainer with orderType="cake"
    - _Requirements: 1.1, 3.4_
  - [x] 9.4 Update `OrderPageClient.tsx` checkout handler to navigate to `/order/checkout` instead of calling `/api/checkout` directly
    - Preserve cart items in localStorage before navigation
    - _Requirements: 1.1, 1.2, 6.3_
  - [x] 9.5 Update `VolumeOrderPageClient.tsx` checkout handler to navigate to `/volume-order/checkout` instead of calling `/api/checkout/volume` directly
    - Preserve cart and fulfillment state in localStorage before navigation
    - _Requirements: 1.1, 1.2, 6.3_
  - [x] 9.6 Update `CakeOrderPageClient.tsx` checkout handler to navigate to `/cake-order/checkout` instead of calling `/api/checkout/cake` directly
    - Preserve cart and fulfillment state in localStorage before navigation
    - _Requirements: 1.1, 1.2, 6.3_

- [x] 10. Add delivery address attributes to checkout APIs
  - [x] 10.1 Update `/api/checkout/volume/route.ts` to accept and include delivery address as Cart_Attributes when fulfillmentType is "delivery"
    - Add "Delivery Street", "Delivery City", "Delivery Province", "Delivery Postal Code" attributes
    - Append delivery address to the order note
    - _Requirements: 5.2, 7.2_
  - [x] 10.2 Update `/api/checkout/cake/route.ts` to accept and include delivery address as Cart_Attributes when fulfillmentType is "delivery"
    - Add "Delivery Street", "Delivery City", "Delivery Province", "Delivery Postal Code" attributes
    - Append delivery address to the order note
    - _Requirements: 5.2, 7.3_

- [x] 11. Checkpoint — Verify end-to-end flow for all three order types
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Add bilingual translations and mobile polish
  - [x] 12.1 Add checkout-related translation keys to the i18n translation files for both English and French
    - Labels: "Continue to Review", "Back", "Proceed to Payment", "Pickup", "Delivery", "Fulfillment", step titles, validation messages, address field labels
    - _Requirements: 8.1, 8.2_
  - [x] 12.2 Verify responsive layout and touch targets across all checkout components
    - Single-column layout below 768px, two-column at 768px+
    - All interactive elements meet 44×44px minimum touch target on mobile
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Existing checkout APIs are reused unchanged except for delivery address attributes (task 10)
- The design uses TypeScript throughout — all new files are `.ts` or `.tsx`
