# Requirements Document

## Introduction

The Global Cart feature makes the unified cart drawer accessible from every page on the site, not just the page that owns a given cart type. Currently the `UnifiedCartPanel` exists with three tabs (Weekly, Catering, Cake) but the Catering and Cake tabs only render rich content when their source page is mounted, because they rely on slot registration. The global cart removes that constraint: all three cart types are readable from any page via a persistent drawer trigger.

The feature also fixes the cake ordering page so that multiple cakes can be added to the cart independently. The `CakeCartContext` already supports multiple items; the storefront page needs to call `addItem` (accumulate) instead of replacing a single selection, and the cart trigger strip needs to show the total count across all three cart types regardless of the current page.

The two parts are delivered together because they share the same cart drawer infrastructure and the same goal: a customer browsing `/cake` should be able to open the drawer, see their catering items in the Catering tab, add a second cake, and proceed — all without navigating away.

## Glossary

- **Global_Cart_Drawer**: The `UnifiedCartPanel` slide-in drawer, accessible from any page on the site via the `Cart_Trigger_Strip`.
- **Cart_Trigger_Strip**: The fixed right-side vertical strip (currently `CartModal`) that opens the `Global_Cart_Drawer`. Shows the total item count across all three cart types.
- **Cart_Tab**: One of three tabs within the `Global_Cart_Drawer`: Weekly, Catering, or Cake.
- **Weekly_Cart**: The cart for weekly/menu launch orders, stored in `localStorage` under `rhubarbe:order:cart`. Checkout via `/api/checkout`.
- **Catering_Cart**: The cart for catering/volume orders, stored in `localStorage` under `rhubarbe:volume:cart` (count key: `rhubarbe:volume:count`). Checkout via `/api/checkout/volume`.
- **Cake_Cart**: The multi-item cake cart, stored in `localStorage` under `rhubarbe:cake:cart:v2`. Managed by `CakeCartContext`. Checkout via `/api/checkout/cake`.
- **Slot_Registration**: The existing mechanism by which a page-mounted component (`CakeCartSlotRegistrar`, catering slot registrar) registers rich render functions into `CartDrawerContext`. Used when the source page is mounted; the global cart must also work when it is not.
- **Persistent_Cart_Reader**: A component or hook that reads a cart's `localStorage` data and renders it inside the `Global_Cart_Drawer` without requiring the source page to be mounted.
- **Cart_Empty_State**: The content shown in a `Cart_Tab` when that cart has no items. Must include a link to the corresponding ordering page.
- **Cake_Cart_Item**: A single cake entry in the `Cake_Cart`, identified by a unique `cartId`. Has its own product, flavour(s), size, add-ons, and computed price. Defined by `CakeCartItem` in `CakeCartContext`.
- **Shared_Cake_Fulfillment**: The single fulfillment record (`CakeFulfillment`) shared across all `Cake_Cart_Item`s: pickup/delivery date, fulfillment type, delivery address, event type, and special instructions.
- **Cake_Order_Page**: The storefront page at `/cake` (`CakeOrderPageClient`).
- **Total_Cart_Count**: The sum of `orderCount + volumeCount + cakeCount` across all three cart types, used by the `Cart_Trigger_Strip`.
- **CartDrawerContext**: The React context managing drawer open/close state, the active tab, and the slot registry.
- **CakeCartContext**: The React context managing `Cake_Cart_Item[]` and `Shared_Cake_Fulfillment`, persisted to `localStorage`.
- **OrderItemsContext**: The React context that tracks `orderCount`, `volumeCount`, and `cakeCount` by reading `localStorage` count keys.
- **Catering_Ordering_Rules**: The quantity minimums and step rules per catering type (brunch: min 12 step 6; dinatoire: min 3 step 1; lunch: min 6 step 1), as defined in the catering-ordering-rules spec.
- **Cake_Lead_Time**: The minimum advance days before a cake order date, computed per item from `leadTimeTiers` and the selected guest count, taking the maximum across all `Cake_Cart_Item`s.
- **Cake_Date_Rules**: The four simultaneous blocking conditions from spec §7.6: (1) date ≥ earliestDate (lead time), (2) date ≤ latestDate (advance booking cap), (3) date is not Sunday (location rule), (4) concurrent production count < maxCakes (capacity). All four must pass for a date to be available.
- **Production_Slot**: One unit of production capacity consumed by a cake order. A wedding cake + sheet cake add-on together consume exactly one slot. A tasting session consumes one slot. Counted against `maxCakes` using the overlap window logic in `lib/utils/cake-rules.ts`.
- **Flavour_Availability**: A flavour is available only if `active = true` AND `today + leadTimeDays ≤ flavour.endDate` (or endDate is null). This is stricter than checking whether the end date has passed — a flavour expiring in 5 days is unavailable if lead time is 7 days.
- **Consolidated_Allergens**: The union of product-level allergens and all selected flavour allergens for a `Cake_Cart_Item`. Computed by `consolidateAllergens()` in `lib/utils/cake-rules.ts`. Updated live on flavour change.
- **Cake_Ordering_Spec**: The authoritative spec at `docs/spec/rhubarbe_cake_ordering_spec.md`. Any behavior in this requirements document that contradicts the spec is a bug.

## Requirements

### Requirement 1: Global Cart Trigger Strip Shows Total Count

**User Story:** As a customer, I want to see a cart icon or strip on every page that shows how many items I have across all order types, so that I always know my cart status regardless of which page I am browsing.

#### Acceptance Criteria

1. THE Cart_Trigger_Strip SHALL be visible on every storefront page, including `/order`, `/catering`, `/cake`, and all other non-admin pages.
2. THE Cart_Trigger_Strip SHALL display the Total_Cart_Count, which is the sum of `orderCount + volumeCount + cakeCount` from `OrderItemsContext`.
3. WHEN the Total_Cart_Count is zero, THE Cart_Trigger_Strip SHALL remain hidden (no empty strip shown).
4. WHEN the Total_Cart_Count is greater than zero, THE Cart_Trigger_Strip SHALL be visible and display the count.
5. WHEN a customer clicks the Cart_Trigger_Strip, THE Global_Cart_Drawer SHALL open.
6. THE Cart_Trigger_Strip SHALL open the Global_Cart_Drawer to the tab corresponding to the cart type with the most recently added item, or default to the tab of the current page's ordering type if no recent-add signal is available.
7. WHEN the customer is on `/order`, THE Cart_Trigger_Strip SHALL default to opening the Weekly Cart_Tab.
8. WHEN the customer is on `/catering`, THE Cart_Trigger_Strip SHALL default to opening the Catering Cart_Tab.
9. WHEN the customer is on `/cake`, THE Cart_Trigger_Strip SHALL default to opening the Cake Cart_Tab.
10. WHEN the customer is on any other page, THE Cart_Trigger_Strip SHALL default to opening the tab of the cart type with the highest item count, falling back to Weekly if all counts are equal.

### Requirement 2: Global Cart Drawer Accessible from Any Page

**User Story:** As a customer, I want to open the cart drawer from any page and see all my items across all three cart types, so that I can review my full order without navigating back to a specific ordering page.

#### Acceptance Criteria

1. THE Global_Cart_Drawer SHALL be rendered in the root layout so that it is mounted on every storefront page.
2. THE Global_Cart_Drawer SHALL display three Cart_Tabs: Weekly, Catering, and Cake.
3. WHEN a customer opens the Global_Cart_Drawer from `/cake`, THE Catering Cart_Tab SHALL display catering cart items read from `localStorage` without requiring the `/catering` page to be mounted.
4. WHEN a customer opens the Global_Cart_Drawer from `/catering`, THE Cake Cart_Tab SHALL display cake cart items read from `CakeCartContext` without requiring the `/cake` page to be mounted.
5. WHEN a customer opens the Global_Cart_Drawer from any page, THE Weekly Cart_Tab SHALL display weekly cart items read from `localStorage` key `rhubarbe:order:cart`.
6. WHEN the source page for a cart type is mounted (e.g. `/catering` is active), THE Global_Cart_Drawer SHALL prefer the Slot_Registration render (full interactive UI) over the Persistent_Cart_Reader fallback.
7. THE Global_Cart_Drawer SHALL close when the customer presses the Escape key.
8. THE Global_Cart_Drawer SHALL close when the customer clicks the backdrop overlay.

### Requirement 3: Catering Cart Readable Without Source Page Mounted

**User Story:** As a customer, I want to see my catering cart items in the cart drawer even when I am not on the catering page, so that I can review my catering order from anywhere on the site.

#### Acceptance Criteria

1. THE Persistent_Cart_Reader for the Catering_Cart SHALL read catering cart data from `localStorage` key `rhubarbe:volume:cart` when no catering slot is registered in `CartDrawerContext`.
2. WHEN the Catering_Cart has items, THE Catering Cart_Tab SHALL display each item with: product name, variant label (if any), quantity, and line price.
3. WHEN the Catering_Cart has items, THE Catering Cart_Tab SHALL display the order-level allergen note if one is present.
4. WHEN the Catering_Cart has items, THE Catering Cart_Tab SHALL display the selected fulfillment date and time if set.
5. WHEN the Catering_Cart has items and no catering slot is registered, THE Catering Cart_Tab SHALL display a link to `/catering` with a message indicating the customer must go to the catering page to modify the order or check out.
6. WHEN the Catering_Cart is empty and no catering slot is registered, THE Cart_Empty_State SHALL display a link to `/catering` with bilingual text inviting the customer to browse catering products.
7. WHEN the catering slot is registered (customer is on `/catering`), THE Catering Cart_Tab SHALL render the full interactive catering cart UI via Slot_Registration.

### Requirement 4: Weekly Cart Readable Without Source Page Mounted

**User Story:** As a customer, I want to see my weekly menu cart items in the cart drawer even when I am not on the order page, so that I can review my weekly order from anywhere.

#### Acceptance Criteria

1. THE Persistent_Cart_Reader for the Weekly_Cart SHALL read cart data from `localStorage` key `rhubarbe:order:cart` when no weekly slot is registered in `CartDrawerContext`.
2. WHEN the Weekly_Cart has items and no weekly slot is registered, THE Weekly Cart_Tab SHALL display each item with: product name, variant label (if any), price, and quantity.
3. WHEN the Weekly_Cart has items and no weekly slot is registered, THE Weekly Cart_Tab SHALL display the estimated subtotal.
4. WHEN the Weekly_Cart has items and no weekly slot is registered, THE Weekly Cart_Tab SHALL display a message indicating the customer must go to `/order` to select a pickup date and slot, and SHALL display a link to `/order`.
5. WHEN the Weekly_Cart is empty and no weekly slot is registered, THE Cart_Empty_State SHALL display a link to `/order` with bilingual text inviting the customer to browse the weekly menu.
6. WHEN the weekly slot is registered (customer is on `/order`), THE Weekly Cart_Tab SHALL render the full interactive weekly cart UI via Slot_Registration.

### Requirement 5: Cake Cart Readable Without Source Page Mounted

**User Story:** As a customer, I want to see my cake cart items in the cart drawer even when I am not on the cake page, so that I can review my cake order from anywhere.

#### Acceptance Criteria

1. THE Persistent_Cart_Reader for the Cake_Cart SHALL read cart data from `CakeCartContext` (which is hydrated from `localStorage` key `rhubarbe:cake:cart:v2`) on every page, since `CakeCartContext` is provided at the root layout level.
2. WHEN the Cake_Cart has items and no cake slot is registered, THE Cake Cart_Tab SHALL display each `Cake_Cart_Item` with: product name, selected flavour(s), guest count (size), and computed price if available.
3. WHEN the Cake_Cart has items and no cake slot is registered, THE Cake Cart_Tab SHALL display the `Shared_Cake_Fulfillment` date if set.
4. WHEN the Cake_Cart has items and no cake slot is registered, THE Cake Cart_Tab SHALL display the global estimated total across all items.
5. WHEN the Cake_Cart has items and no cake slot is registered, THE Cake Cart_Tab SHALL display a link to `/cake` with a message indicating the customer must go to the cake page to edit items, select a date, and check out.
6. WHEN the Cake_Cart is empty, THE Cart_Empty_State SHALL display a link to `/cake` with bilingual text inviting the customer to browse cakes.
7. WHEN the cake slot is registered (customer is on `/cake`), THE Cake Cart_Tab SHALL render the full interactive `CakeCartPanel` UI via Slot_Registration.

### Requirement 6: Cart Tab Item Counts and Badges

**User Story:** As a customer, I want each tab in the cart drawer to show how many items it contains, so that I can quickly see which carts have items without switching tabs.

#### Acceptance Criteria

1. THE Global_Cart_Drawer SHALL display an item count badge on each Cart_Tab that has one or more items.
2. THE Weekly Cart_Tab badge SHALL reflect `orderCount` from `OrderItemsContext`.
3. THE Catering Cart_Tab badge SHALL reflect `volumeCount` from `OrderItemsContext`.
4. THE Cake Cart_Tab badge SHALL reflect `cakeCount` from `OrderItemsContext`, where `cakeCount` equals the number of `Cake_Cart_Item`s in `CakeCartContext`.
5. WHEN a cart type has zero items, THE Cart_Tab SHALL display no badge (or a zero badge that is visually suppressed).
6. WHEN items are added or removed from any cart, THE badge counts SHALL update without requiring a page reload.

### Requirement 7: Multiple Cakes in the Cake Cart

**User Story:** As a customer, I want to add multiple cakes to my cart at once, so that I can order different cake types or sizes for the same event in a single checkout.

#### Acceptance Criteria

1. WHEN a customer clicks "Add to cart" on a cake product card on the Cake_Order_Page, THE Cake_Cart SHALL add a new `Cake_Cart_Item` without removing or replacing any existing items.
2. THE Cake_Cart SHALL support any number of `Cake_Cart_Item`s simultaneously, each with an independent `cartId`, product, flavour selection, size, and add-on configuration.
3. WHEN the Cake_Cart already contains one or more items, THE Cake_Order_Page SHALL still allow adding additional cake items via the same "Add to cart" flow.
4. WHEN a customer adds a cake to the cart, THE Global_Cart_Drawer SHALL open automatically to the Cake Cart_Tab.
5. THE Cake_Cart_Item count displayed in the Cake Cart_Tab badge SHALL equal the number of distinct `Cake_Cart_Item`s (i.e. number of cake entries, not guest count).

### Requirement 8: Per-Item Cake Editing in the Cart

**User Story:** As a customer, I want to edit each cake in my cart individually — changing flavour, guest count, and add-ons — so that I can fine-tune each cake without starting over.

#### Acceptance Criteria

1. THE Cake Cart_Tab SHALL render each `Cake_Cart_Item` as an independent editable row using `CakeCartItemRow`.
2. WHEN a customer changes the guest count (size) for a `Cake_Cart_Item`, THE Cake_Cart SHALL update only that item's size and recompute its price; other items SHALL remain unchanged.
3. WHEN a customer toggles an add-on for a `Cake_Cart_Item`, THE Cake_Cart SHALL update only that item's `addonIds`; other items SHALL remain unchanged.
4. WHEN a customer changes the flavour selection for a `Cake_Cart_Item`, THE Cake_Cart SHALL update only that item's `flavourHandles`; other items SHALL remain unchanged.
5. WHEN a customer clicks "remove" on a `Cake_Cart_Item`, THE Cake_Cart SHALL remove only that item; other items SHALL remain in the cart.
6. IF a `Cake_Cart_Item`'s `productId` cannot be matched to a loaded product (e.g. product was removed from catalog), THEN THE Cake Cart_Tab SHALL display a placeholder row with a remove button and a message indicating the product is no longer available.
7. WHEN a customer changes the guest count (size) for a `Cake_Cart_Item` such that the resolved lead time increases and the previously selected flavour's `endDate` is now before `today + newLeadTimeDays`, THE Cake_Cart SHALL clear that item's flavour selection and display the message "Your previous flavour selection is no longer available at this size. Please choose again." (spec §7.3, §13).
8. THE Cake Cart_Tab SHALL display only Flavour_Availability-filtered flavours for each `Cake_Cart_Item`: flavours with `active = false` are hidden, and flavours whose `endDate < today + resolvedLeadTimeDays` are hidden (spec §3, §7.3). Before a size is selected for an item, flavours are filtered against the shortest lead time available for that product.
9. THE Cake Cart_Tab SHALL display a single Consolidated_Allergens block per `Cake_Cart_Item`, showing the union of product-level allergens and all selected flavour allergens. The block SHALL update live when the flavour selection changes (spec §4).

### Requirement 9: Shared Cake Fulfillment

**User Story:** As a customer, I want a single pickup/delivery date and fulfillment configuration that applies to all my cakes, so that I don't have to set the date separately for each cake.

#### Acceptance Criteria

1. THE Cake_Cart SHALL maintain a single `Shared_Cake_Fulfillment` record that applies to all `Cake_Cart_Item`s in the cart.
2. THE `Shared_Cake_Fulfillment` SHALL include: pickup/delivery date, fulfillment type (pickup or delivery), delivery address, event type, and special instructions.
3. WHEN the customer changes the fulfillment date, THE Cake_Cart SHALL update the `Shared_Cake_Fulfillment` and apply the new date to the checkout for all items.
4. THE Cake_Lead_Time enforced on the date picker SHALL be the maximum lead time across all `Cake_Cart_Item`s, computed from each item's product `leadTimeTiers` and selected guest count using `resolveLeadTimeDays()` from `lib/utils/cake-rules.ts`. For legacy products (`cakeProductType = null`), lead time is resolved from the pricing tier, not from a variant.
5. IF any `Cake_Cart_Item` has a `deliveryOnly` flag (from its resolved lead time tier), THEN THE Cake_Cart SHALL force `fulfillmentType` to `delivery` for the entire order and disable the pickup option (spec §5, §7.11).
6. THE `Shared_Cake_Fulfillment` date picker SHALL enforce all four Cake_Date_Rules simultaneously (spec §7.6):
   - Dates earlier than `today + maxLeadTimeDays` SHALL be blocked (lead time rule).
   - Dates later than `today + maxAdvanceDays` SHALL be blocked (advance booking cap, default 365 days).
   - Sundays SHALL always be blocked regardless of fulfillment type or order total (location rule — spec §7.5).
   - Dates where concurrent production would reach or exceed `maxCakes` SHALL be blocked (capacity rule — spec §6).
7. WHEN all `Cake_Cart_Item`s are removed from the cart, THE `Shared_Cake_Fulfillment` SHALL reset to its default empty state.

### Requirement 10: Global Cake Estimated Total

**User Story:** As a customer, I want to see a single estimated total for my entire cake order, so that I know the combined cost before checking out.

#### Acceptance Criteria

1. THE Cake Cart_Tab SHALL display a global estimated total equal to the sum of `computedPrice` across all `Cake_Cart_Item`s that have a resolved price.
2. WHEN a `Cake_Cart_Item` has no resolved price (e.g. size not yet entered), THE global total SHALL exclude that item's price and display a note indicating the total is partial.
3. THE global estimated total SHALL update in real time as the customer changes sizes, flavours, or add-ons for any item.
4. THE global estimated total SHALL be displayed above the `Shared_Cake_Fulfillment` section and the checkout button.
5. THE Cake Cart_Tab footer checkout button SHALL display the global estimated total alongside the checkout label.

### Requirement 11: Cake Cart Checkout Integrity

**User Story:** As a customer, I want the cake checkout to include all my cake items with their individual configurations, so that the bakery receives the complete order.

#### Acceptance Criteria

1. WHEN a customer initiates checkout from the Cake Cart_Tab, THE Checkout_API at `/api/checkout/cake` SHALL receive all `Cake_Cart_Item`s with their individual `productId`, `flavourHandles`, `size`, `addonIds`, `addonSizes`, `sheetCakeFlavour`, `sheetCakeAddonIds`, and `computedPrice`.
2. THE Checkout_API SHALL resolve a Shopify variant ID for each `Cake_Cart_Item` from the pricing grid using `sizeValue` and `flavourHandle` via `resolvePricingGridPrice()`. For legacy products, variant resolution uses the headcount pricing tier.
3. THE Checkout_API SHALL include the `Shared_Cake_Fulfillment` fields (date, fulfillment type, delivery address, event type, special instructions) as Shopify cart attributes applied to the entire order (spec §11).
4. IF any `Cake_Cart_Item` has a null or unresolvable `computedPrice`, THEN THE Cake Cart_Tab SHALL disable the checkout button and display a validation message indicating all items must have a valid size and flavour selection.
5. IF the `Shared_Cake_Fulfillment` date is not set, THEN THE Cake Cart_Tab SHALL disable the checkout button and display a message prompting the customer to select a date.
6. THE Checkout_API SHALL perform a server-side capacity re-check using `isDateBlockedByCapacity()` from `lib/utils/cake-rules.ts` before creating the Shopify cart. IF capacity is exceeded at submission time (e.g. another order was placed after the calendar was loaded), THE Checkout_API SHALL return a **409** status (not 422) — consistent with spec §11 test case T14.
7. IF any line item's Shopify variant ID cannot be resolved, THE Checkout_API SHALL return a **422** status (spec §11).
8. A `Cake_Cart_Item` that is a wedding cake with a sheet cake add-on SHALL count as a single Production_Slot against capacity — not two slots (spec §6, §7.12).
9. A `Cake_Cart_Item` with `cakeProductType = 'wedding-cake-tasting'` SHALL count as one Production_Slot against capacity (spec §6, §7.13).

### Requirement 12: Weekly Cart Checkout from Drawer

**User Story:** As a customer, I want to be able to proceed to checkout for my weekly order from the cart drawer, so that I don't have to navigate to the order page just to check out.

#### Acceptance Criteria

1. WHEN the weekly slot is registered (customer is on `/order`), THE Weekly Cart_Tab footer SHALL render the full checkout button provided by the slot's `renderFooter()`.
2. WHEN the weekly slot is not registered and the Weekly_Cart has items, THE Weekly Cart_Tab footer SHALL display a link-style button directing the customer to `/order` to complete their order (select date, slot, and check out).
3. THE Weekly Cart_Tab SHALL not attempt to initiate checkout directly when the weekly slot is not registered, since pickup date and slot selection are required and only available on the order page.

### Requirement 13: Catering Cart Checkout from Drawer

**User Story:** As a customer, I want to be able to proceed to checkout for my catering order from the cart drawer, so that I don't have to navigate to the catering page just to check out.

#### Acceptance Criteria

1. WHEN the catering slot is registered (customer is on `/catering`), THE Catering Cart_Tab footer SHALL render the full checkout button provided by the slot's `renderFooter()`.
2. WHEN the catering slot is not registered and the Catering_Cart has items, THE Catering Cart_Tab footer SHALL display a link-style button directing the customer to `/catering` to complete their order.
3. THE Catering Cart_Tab SHALL not attempt to initiate checkout directly when the catering slot is not registered, since fulfillment date/time selection and order validation are required and only available on the catering page.

### Requirement 14: Catering Cart Data Structure in localStorage

**User Story:** As a developer, I want the catering cart to persist its full item and fulfillment data to localStorage in a defined structure, so that the Persistent_Cart_Reader can display it from any page.

#### Acceptance Criteria

1. THE Catering_Cart SHALL persist its state to `localStorage` under a defined key (`rhubarbe:volume:cart`) in a structured JSON format containing: an array of line items (each with product name, variant label, quantity, and line price in cents) and an order-level object with fulfillment date/time and allergen note.
2. WHEN the catering cart is updated (item added, quantity changed, fulfillment date set), THE Catering_Cart SHALL write the updated state to `localStorage` immediately.
3. WHEN the catering cart is cleared (after successful checkout), THE Catering_Cart SHALL remove or reset the `localStorage` entry.
4. THE Persistent_Cart_Reader for the Catering_Cart SHALL gracefully handle a missing, null, or malformed `localStorage` entry by treating the cart as empty.
5. THE `rhubarbe:volume:count` key in `localStorage` SHALL remain the source of truth for `volumeCount` in `OrderItemsContext`, and SHALL be updated whenever the catering cart item count changes.

### Requirement 15: Cart Drawer Keyboard and Accessibility

**User Story:** As a customer using a keyboard or assistive technology, I want the cart drawer to be accessible, so that I can open, navigate, and close it without a mouse.

#### Acceptance Criteria

1. THE Cart_Trigger_Strip SHALL be a focusable button element with an `aria-label` that includes the Total_Cart_Count (e.g. "Open cart, 3 items").
2. THE Global_Cart_Drawer SHALL trap focus within the drawer while it is open.
3. WHEN the Global_Cart_Drawer is open, pressing Escape SHALL close the drawer and return focus to the Cart_Trigger_Strip.
4. THE Cart_Tab buttons SHALL be keyboard-navigable using Tab and arrow keys.
5. THE Global_Cart_Drawer SHALL have `role="dialog"` and `aria-modal="true"` when open.
6. THE Global_Cart_Drawer SHALL have an `aria-label` or `aria-labelledby` referencing the drawer heading (e.g. "Cart").

### Requirement 16: Cake Ordering Rules Compliance

**User Story:** As a developer, I want the global cart's cake logic to comply with all rules in the authoritative cake ordering spec, so that the multi-item cart does not introduce regressions in date, capacity, flavour, or allergen behavior.

#### Acceptance Criteria

1. THE Cake Cart_Tab SHALL use `resolveLeadTimeDays()`, `isDeliveryOnly()`, `getEarliestDate()`, `getLatestDate()`, `isDateAvailable()`, `isDateBlockedByCapacity()`, `filterAvailableFlavours()`, `consolidateAllergens()`, `resolveNearestSize()`, and `guestsToChoux()` from `lib/utils/cake-rules.ts` for all cake ordering logic — no inline reimplementations (spec §7.7).
2. THE Cake Cart_Tab SHALL apply `guestsToChoux()` (guests × 3) before size resolution for `croquembouche` products (spec §1, §2).
3. THE Cake Cart_Tab SHALL apply `resolveNearestSize()` (largest available `sizeValue ≤ input`) for all grid-based products before pricing grid lookup (spec §2).
4. WHEN a `Cake_Cart_Item` has no size selected yet, THE Cake Cart_Tab SHALL filter that item's flavours using `shortestLeadTime()` across the product's lead time tiers (spec §7.3, §7.9).
5. THE Cake Cart_Tab SHALL enforce the `cakeMaxFlavours` limit per `Cake_Cart_Item` for `croquembouche` products, preventing selection beyond the configured maximum (spec §1).
6. THE Cake Cart_Tab SHALL enforce `cakeMaxFlavours = 3` for `wedding-cake-tasting` products (spec §1).
7. THE `Shared_Cake_Fulfillment` date picker SHALL use the capacity overlap window logic from `countConflicts()` in `lib/utils/cake-rules.ts` — not a simple date equality check — when determining blocked dates (spec §6).
8. THE Checkout_API SHALL use `isDateBlockedByCapacity()` from `lib/utils/cake-rules.ts` for the server-side capacity re-check, using the same overlap window logic as the client-side date picker (spec §6, §11).

### Requirement 17: Correctness Properties and Test Coverage

**User Story:** As a developer, I want the global cart's cake logic covered by property-based and unit tests, so that the multi-item cart behavior is verifiable and regressions are caught automatically.

#### Acceptance Criteria

1. THE test suite SHALL include a property test verifying that for any set of `Cake_Cart_Item`s, the `Shared_Cake_Fulfillment` date picker blocks exactly the dates that fail at least one of the four Cake_Date_Rules — no more, no fewer.
2. THE test suite SHALL include a property test verifying that for any `Cake_Cart_Item` with a size change, if the new resolved lead time pushes `today + leadTimeDays` past a selected flavour's `endDate`, that flavour is removed from the item's `flavourHandles`.
3. THE test suite SHALL include a property test verifying that for any set of `Cake_Cart_Item`s, the global estimated total equals the sum of `computedPrice` across items with a non-null price, and items with null price are excluded from the total.
4. THE test suite SHALL include a property test verifying that for any multi-item cake checkout request, the server-side capacity re-check counts a wedding cake + sheet cake add-on as exactly one Production_Slot.
5. THE test suite SHALL include a unit test verifying that adding a second cake to the cart via `addItem()` does not modify or remove the first item (isolation guarantee).
6. THE test suite SHALL include a unit test verifying that removing one `Cake_Cart_Item` by `cartId` leaves all other items unchanged.
7. THE test suite SHALL include a unit test verifying that when all items are removed, `Shared_Cake_Fulfillment` resets to the default empty state.
8. ALL existing tests in `lib/utils/cake-rules.test.ts` (41 tests covering spec §7.7 cases T1–T15) SHALL continue to pass without modification after implementing the global cart feature.
9. THE test suite SHALL run `npx vitest run lib/utils/cake-rules.test.ts` as part of the implementation verification for any task that touches cake ordering logic.
