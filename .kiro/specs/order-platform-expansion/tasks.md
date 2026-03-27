# Implementation Plan: Order Platform Expansion

## Overview

Extend the admin order management system to support differentiated views, details, and operational tools for launch, catering (volume), and cake order types. Implementation builds incrementally: shared components → data layer → API → UI pages.

## Tasks

- [x] 1. Create shared UI components
  - [x] 1.1 Create `OrderTypeBadge` component
    - Create `app/admin/components/OrderTypeBadge.tsx`
    - Render a `Badge` with color mapping: launch → blue, volume → purple, cake → pink
    - Accept `orderType: 'launch' | 'volume' | 'cake'` prop
    - _Requirements: 2.2_

  - [x] 1.2 Create `OrderTypeSelector` component
    - Create `app/admin/components/OrderTypeSelector.tsx`
    - Render tab/select with options: "Launch", "Catering", "Cake"
    - Accept `value` and `onChange` props
    - _Requirements: 9.1, 9.4_

  - [ ]* 1.3 Write property test for badge color uniqueness
    - **Property 3: Badge color uniqueness**
    - **Validates: Requirements 2.2**

- [x] 2. Extend data layer and API
  - [x] 2.1 Add `listByDate` query function
    - Add `listByDate(date: string, orderType: string)` to `lib/db/queries/orders.ts`
    - Filter by `fulfillmentDate` (date match) and `orderType`
    - Return orders with items, same shape as `listByLaunch`
    - _Requirements: 5.2, 6.2, 7.2_

  - [x] 2.2 Update `list` query to include `launchTitle`
    - Modify `list()` in `lib/db/queries/orders.ts` to return `launchTitle` field
    - _Requirements: 8.4_

  - [x] 2.3 Update `getById` query for order-type-specific fields
    - Modify `getById()` in `lib/db/queries/orders.ts` to return `orderType`, `fulfillmentDate`, `allergenNotes`, `launchTitle`
    - For cake orders: parse `specialInstructions` as JSON to extract `numberOfPeople` and `eventType`, with fallback to null on parse failure
    - _Requirements: 8.1, 8.2_

  - [x] 2.4 Create `GET /api/orders/by-date` endpoint
    - Create `app/api/orders/by-date/route.ts`
    - Accept `date` and `orderType` query params
    - Return 400 for invalid date or invalid orderType
    - Call `listByDate` and return orders with items
    - _Requirements: 5.2, 6.2, 7.2, 8.3_

  - [x] 2.5 Update `GET /api/orders/:id` response shape
    - Modify `app/api/orders/[id]/route.ts` to return enhanced detail including `orderType`, `fulfillmentDate`, `allergenNotes`, `launchTitle`, and parsed cake metadata
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ]* 2.6 Write property test for cake metadata parsing round trip
    - **Property 10: Cake metadata parsing round trip**
    - **Validates: Requirements 8.2**

  - [ ]* 2.7 Write property test for API orderType filter invariant
    - **Property 11: API orderType filter invariant**
    - **Validates: Requirements 8.3**

  - [ ]* 2.8 Write property test for API response shape completeness
    - **Property 9: API response shape completeness**
    - **Validates: Requirements 8.1, 8.4**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update orders list page
  - [x] 4.1 Add `OrderTypeBadge` to orders table rows
    - Import and render `OrderTypeBadge` on each row in `app/admin/orders/page.tsx`
    - Show badge for all filter modes including "all"
    - _Requirements: 2.1, 2.3_

  - [x] 4.2 Implement order-type-specific table columns
    - When filter is "launch" or "all": show pickup date, pickup location columns
    - When filter is "volume": show fulfillment date, fulfillment type, total qty, allergen notes columns
    - When filter is "cake": show pickup date, # people, event type, total qty columns
    - Always show: order #, customer, date, status, total
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 4.3 Write property test for order grouping by type
    - **Property 7: Order grouping by type**
    - **Validates: Requirements 7.3**

- [x] 5. Update order detail page
  - [x] 5.1 Add order-type badge and type-specific fields to detail interface
    - Update `OrderDetail` interface in `app/admin/orders/[id]/page.tsx` to include `orderType`, `fulfillmentDate`, `allergenNotes`, `launchTitle`, `numberOfPeople`, `eventType`
    - Render `OrderTypeBadge` next to status badge in header
    - _Requirements: 4.1_

  - [x] 5.2 Implement conditional detail sections per order type
    - Launch: show launch/menu title, pickup date, location, time slot (existing behavior)
    - Volume: show fulfillment date, fulfillment type, allergen notes in highlighted section
    - Cake: show pickup date, # people, event type, special instructions in highlighted section
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Expand prep sheet page
  - [x] 6.1 Add `OrderTypeSelector` and date picker to prep sheet
    - Add `OrderTypeSelector` at top of `app/admin/orders/prep-sheet/page.tsx`
    - When "Launch" selected: show existing launch/menu selector (unchanged)
    - When "Catering" or "Cake" selected: show date picker input
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 6.2 Implement catering prep sheet mode
    - Fetch via `/api/orders/by-date?date=X&orderType=volume` when date selected
    - Aggregate product quantities across volume orders
    - Display allergen notes from each order alongside aggregated rows
    - Support CSV export and print
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.3 Implement cake prep sheet mode
    - Fetch via `/api/orders/by-date?date=X&orderType=cake` when date selected
    - Aggregate product quantities across cake orders
    - Display event type and # people from each order alongside aggregated rows
    - Support CSV export and print
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.4 Write property test for prep sheet quantity aggregation
    - **Property 4: Prep sheet quantity aggregation**
    - **Validates: Requirements 5.2, 6.2**

  - [ ]* 6.5 Write property test for prep sheet metadata preservation
    - **Property 5: Prep sheet metadata preservation**
    - **Validates: Requirements 5.3, 6.3**

  - [ ]* 6.6 Write property test for CSV export round trip
    - **Property 6: CSV export round trip**
    - **Validates: Requirements 5.4, 6.4**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Expand pickup/fulfillment list page
  - [x] 8.1 Add `OrderTypeSelector` and date picker to pickup list
    - Add `OrderTypeSelector` at top of `app/admin/orders/pickup-list/page.tsx`
    - When "Launch" selected: show existing launch/menu selector + QR scan (unchanged)
    - When "Catering" or "Cake" selected: show date picker
    - _Requirements: 9.4, 9.5, 9.6_

  - [x] 8.2 Implement catering and cake pickup list modes
    - Fetch via `/api/orders/by-date?date=X&orderType=volume` or `cake`
    - Group orders by order type within selected date
    - Show fulfillment type for volume orders, event type + # people for cake orders
    - Add "Mark Fulfilled" button for each order
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 8.3 Write property test for fulfill order status transition
    - **Property 8: Fulfill order status transition**
    - **Validates: Requirements 7.6**

- [x] 9. Verify localStorage cart persistence
  - [x] 9.1 Verify `OrderItemsContext` cart persistence for all order types
    - Review and verify `contexts/OrderItemsContext.tsx` handles all three localStorage keys correctly
    - Verify rehydration on mount and route change for launch, volume, and cake carts
    - Verify malformed JSON fallback returns 0 without throwing
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 9.2 Write property test for cart persistence round trip
    - **Property 1: Cart persistence round trip**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [ ]* 9.3 Write property test for malformed localStorage fallback
    - **Property 2: Malformed localStorage fallback**
    - **Validates: Requirements 1.6**

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The project uses TypeScript, Next.js App Router, Drizzle ORM, and Untitled UI components
