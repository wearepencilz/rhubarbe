# Implementation Plan: Preorder Operations

## Overview

This implementation plan breaks down the Preorder Operations feature into discrete coding tasks. The feature extends the Rhubarbe CMS and storefront with a comprehensive preorder management system supporting B2C weekly menus and B2B rolling lead-time ordering.

The implementation follows this sequence:
1. Database setup and schema definition
2. Core data models and API endpoints
3. Availability calculation engine
4. CMS UI components for content management
5. Storefront integration (product display, cart, checkout)
6. Order operations tools for staff
7. Testing and validation

All work must be done on the `feature/preorder-operations` branch.

## Tasks

- [ ] 1. Database setup and configuration
  - Create Drizzle ORM configuration
  - Set up Vercel Postgres connection for production
  - Set up local PostgreSQL with Docker Compose
  - Configure environment variables for both environments
  - _Requirements: 14.1-14.9, 2.1_


- [ ] 2. Define database schema with Drizzle ORM
  - [ ] 2.1 Create schema file with all table definitions
    - Define products table extensions (availability_mode, assigned_availability_pattern, quantity rules, pickup rules)
    - Define availabilityPatterns table with all pattern configuration fields
    - Define pickupLocations table with bilingual content
    - Define slotTemplates table
    - Define menuWeeks table with bilingual content
    - Define productAvailabilityWindows table
    - Define orders and orderItems tables
    - Define slotCapacity table with optimistic locking (version field)
    - Add indexes for efficient querying (date, location, product_id, status)
    - _Requirements: 3.1-3.19, 4.1-4.22, 5.1-5.10, 6.1-6.8, 7.1-7.11, 8.1-8.10, 14.1-14.9_

  - [ ]* 2.2 Write property test for schema integrity
    - **Property 1: Product Schema Extensions**
    - **Validates: Requirements 3.1, 3.6-3.19**

- [ ] 3. Generate and run database migrations
  - [ ] 3.1 Generate initial migration for all preorder tables
    - Run `drizzle-kit generate:pg` to create migration files
    - Review generated SQL for correctness
    - _Requirements: 14.1-14.9_

  - [ ] 3.2 Create migration script for existing products
    - Write script to add availability fields to existing products with default values
    - Set availability_mode to 'always_available' for all existing products
    - Set online_orderable to true, pickup_only to false
    - Set default_min_quantity to 1, default_quantity_step to 1
    - Set default_pickup_required to false
    - _Requirements: 24.1-24.10_

  - [ ] 3.3 Create database client module
    - Implement db client for Vercel Postgres (production)
    - Implement db client for local PostgreSQL (development)
    - Add environment detection logic
    - _Requirements: 14.1-14.9_

  - [ ]* 3.4 Write property test for migration default values
    - **Property 20: Migration Default Values**
    - **Validates: Requirements 24.2-24.7**

- [ ] 4. Checkpoint - Database setup complete
  - Ensure all migrations run successfully
  - Verify schema in local PostgreSQL using Drizzle Studio
  - Ensure all tests pass, ask the user if questions arise


- [ ] 5. Implement API endpoints for Availability Patterns
  - [ ] 5.1 Create GET /api/availability-patterns endpoint
    - Implement list endpoint with filtering by pattern_type and active status
    - Add search by pattern_name
    - Include count of products using each pattern
    - _Requirements: 4.1-4.22, 15.1-15.4_

  - [ ] 5.2 Create POST /api/availability-patterns endpoint
    - Implement create endpoint with validation
    - Validate recurring schedule (close after open)
    - Validate time ranges (end after start)
    - Validate bilingual content (both en and fr required)
    - _Requirements: 4.1-4.22, 16.1-16.5_

  - [ ] 5.3 Create GET /api/availability-patterns/[id] endpoint
    - Implement detail endpoint
    - _Requirements: 4.1-4.22_

  - [ ] 5.4 Create PATCH /api/availability-patterns/[id] endpoint
    - Implement update endpoint with validation
    - Invalidate availability cache for affected products
    - Log configuration changes with user and timestamp
    - _Requirements: 4.1-4.22, 25.2, 26.7_

  - [ ] 5.5 Create DELETE /api/availability-patterns/[id] endpoint
    - Implement soft delete (set active to false)
    - Prevent deletion if products are using the pattern
    - _Requirements: 4.1-4.22_

  - [ ]* 5.6 Write unit tests for pattern API endpoints
    - Test CRUD operations
    - Test validation rules
    - Test error handling

- [ ] 6. Implement API endpoints for Pickup Locations
  - [ ] 6.1 Create CRUD endpoints for pickup locations
    - GET /api/pickup-locations (list with filtering by active status)
    - POST /api/pickup-locations (create with bilingual validation)
    - GET /api/pickup-locations/[id] (detail)
    - PATCH /api/pickup-locations/[id] (update)
    - DELETE /api/pickup-locations/[id] (soft delete)
    - _Requirements: 5.1-5.10, 15.5-15.8_

  - [ ] 6.2 Create PATCH /api/pickup-locations/reorder endpoint
    - Implement drag-and-drop reordering by sort_order
    - _Requirements: 15.8_

  - [ ]* 6.3 Write unit tests for pickup location API endpoints
    - Test CRUD operations
    - Test reordering logic
    - Test bilingual validation


- [ ] 7. Implement API endpoints for Slot Templates
  - [ ] 7.1 Create CRUD endpoints for slot templates
    - GET /api/slot-templates (list with filtering by active status)
    - POST /api/slot-templates (create with validation)
    - GET /api/slot-templates/[id] (detail)
    - PATCH /api/slot-templates/[id] (update)
    - DELETE /api/slot-templates/[id] (soft delete)
    - Validate end_time after start_time
    - Validate interval_minutes is positive
    - _Requirements: 6.1-6.8, 15.9-15.11, 16.8-16.10_

  - [ ]* 7.2 Write unit tests for slot template API endpoints
    - Test CRUD operations
    - Test time validation
    - Test interval validation

- [ ] 8. Implement API endpoints for Menu Weeks
  - [ ] 8.1 Create CRUD endpoints for menu weeks
    - GET /api/menu-weeks (list with filtering by status, sorting by launch_date)
    - POST /api/menu-weeks (create with validation)
    - GET /api/menu-weeks/[id] (detail)
    - PATCH /api/menu-weeks/[id] (update)
    - DELETE /api/menu-weeks/[id] (soft delete)
    - Validate order_cutoff_datetime before pickup_date_or_range
    - Validate bilingual content
    - _Requirements: 7.1-7.11, 15.12-15.15, 16.11-16.14_

  - [ ] 8.2 Create GET /api/menu-weeks/current endpoint
    - Return active menu week for current date
    - Cache result for 5 minutes
    - _Requirements: 7.1-7.11, 28.1-28.12_

  - [ ]* 8.3 Write unit tests for menu week API endpoints
    - Test CRUD operations
    - Test current menu week logic
    - Test date validation
    - Test caching

- [ ] 9. Implement API endpoints for Product Availability Windows
  - [ ] 9.1 Create CRUD endpoints for availability windows
    - GET /api/availability-windows (list with filtering by product and date range)
    - POST /api/availability-windows (create)
    - GET /api/availability-windows/[id] (detail)
    - PATCH /api/availability-windows/[id] (update)
    - DELETE /api/availability-windows/[id] (delete)
    - Invalidate availability cache for affected product on create/update/delete
    - _Requirements: 8.1-8.10, 15.16-15.19, 16.15-16.18, 25.3_

  - [ ]* 9.2 Write unit tests for availability window API endpoints
    - Test CRUD operations
    - Test filtering by product and date
    - Test cache invalidation


- [ ] 10. Checkpoint - Core API endpoints complete
  - Ensure all CRUD endpoints work correctly
  - Verify validation rules are enforced
  - Test with Postman or similar tool
  - Ensure all tests pass, ask the user if questions arise

- [ ] 11. Implement availability calculation engine
  - [ ] 11.1 Create core availability calculation function
    - Implement calculateAvailability(product, requestDate, location) function
    - Check availability_mode (hidden, always_available, scheduled, pattern_based)
    - Find active ProductAvailabilityWindow for date
    - Determine effective pattern (window override or product assigned)
    - Evaluate order timing (open/close logic)
    - Calculate pickup dates based on pattern rules
    - Determine allowed locations
    - Calculate slots if applicable
    - Apply quantity rules (min, max, step)
    - Generate customer-facing messages
    - _Requirements: 3.2-3.5, 11.1-11.10, 13.1-13.8_

  - [ ] 11.2 Implement order window evaluation
    - Evaluate fixed datetime logic
    - Evaluate recurring day/time logic
    - Evaluate relative lead-time logic
    - Return isOpen status and cutoff datetime
    - _Requirements: 13.1-13.4_

  - [ ] 11.3 Implement pickup date calculation
    - Calculate dates for recurring_pickup_day mode
    - Calculate dates for allowed_weekdays mode
    - Calculate dates for date_range mode
    - Apply blackout_exclusions
    - _Requirements: 13.1-13.8_

  - [ ] 11.4 Implement slot generation
    - Generate slots from SlotTemplate
    - Generate slots from custom range and interval
    - Calculate capacity for each slot
    - _Requirements: 13.5-13.8_

  - [ ]* 11.5 Write property test for availability mode display
    - **Property 2: Availability Mode Display**
    - **Validates: Requirements 3.2-3.5, 11.1-11.4**

  - [ ]* 11.6 Write property test for pattern reusability
    - **Property 3: Pattern Reusability**
    - **Validates: Requirements 1.5**

  - [ ]* 11.7 Write property test for pattern type coexistence
    - **Property 4: Pattern Type Coexistence**
    - **Validates: Requirements 1.6, 1.7**

  - [ ]* 11.8 Write property test for fixed cutoff enforcement
    - **Property 10: Fixed Cutoff Enforcement**
    - **Validates: Requirements 13.1, 13.2**

  - [ ]* 11.9 Write property test for lead time enforcement
    - **Property 11: Lead Time Enforcement**
    - **Validates: Requirements 13.3, 13.4**

  - [ ]* 11.10 Write property test for slot generation
    - **Property 12: Slot Generation**
    - **Validates: Requirements 13.5, 13.6**

  - [ ]* 11.11 Write unit tests for availability calculation
    - Test each pattern type (recurring_weekly, rolling_lead_time, one_off_scheduled)
    - Test window overrides
    - Test location restrictions
    - Test edge cases (midnight cutoffs, DST transitions)


- [ ] 12. Implement availability API endpoint
  - [ ] 12.1 Create GET /api/products/[id]/availability endpoint
    - Accept query params: date (optional, defaults to today), location (optional)
    - Call availability calculation engine
    - Return availability result with orderable status, cutoff, pickup dates, locations, slots, quantity rules, messages
    - Implement caching (60 second TTL)
    - _Requirements: 11.1-11.10, 25.1_

  - [ ]* 12.2 Write property test for complete availability information
    - **Property 6: Complete Availability Information**
    - **Validates: Requirements 11.5-11.10**

  - [ ]* 12.3 Write unit tests for availability endpoint
    - Test with different dates
    - Test with different locations
    - Test caching behavior

- [ ] 13. Implement slot capacity management
  - [ ] 13.1 Create slot capacity tracking functions
    - Implement getSlotCapacity(date, locationId, slotStart, slotEnd)
    - Implement reserveSlotCapacity(date, locationId, slotStart, slotEnd, quantity)
    - Implement releaseSlotCapacity(date, locationId, slotStart, slotEnd, quantity)
    - Use optimistic locking with version field
    - Implement retry logic with exponential backoff (max 3 retries)
    - _Requirements: 23.1-23.10, 25.8, 26.3-26.4_

  - [ ] 13.2 Create GET /api/slots/capacity endpoint
    - Accept query params: date (required), location (required)
    - Return array of SlotCapacity for all slots on that date/location
    - Cache for 30 seconds
    - _Requirements: 23.1-23.2_

  - [ ] 13.3 Create POST /api/slots/reserve endpoint
    - Accept body: date, location_id, slot_start, slot_end, quantity
    - Reserve capacity using optimistic locking
    - Return success/failure
    - _Requirements: 23.1-23.10, 25.8_

  - [ ] 13.4 Create POST /api/slots/release endpoint
    - Accept body: date, location_id, slot_start, slot_end, quantity
    - Release reserved capacity
    - Return success/failure
    - _Requirements: 17.8_

  - [ ] 13.5 Create PATCH /api/slots/adjust-capacity endpoint
    - Accept body: date, location_id, slot_start, slot_end, new_capacity, reason
    - Adjust slot capacity
    - Require authentication (staff only)
    - Log adjustment with user, reason, and timestamp
    - _Requirements: 23.5-23.10, 26.8_

  - [ ]* 13.6 Write property test for slot capacity tracking
    - **Property 14: Slot Capacity Tracking**
    - **Validates: Requirements 23.1, 23.2**

  - [ ]* 13.7 Write property test for slot reservation atomicity
    - **Property 15: Slot Reservation Atomicity**
    - **Validates: Requirements 25.8**

  - [ ]* 13.8 Write property test for slot capacity retry logic
    - **Property 23: Slot Capacity Retry Logic**
    - **Validates: Requirements 26.3, 26.4**

  - [ ]* 13.9 Write unit tests for slot capacity management
    - Test reservation success and failure
    - Test release
    - Test capacity adjustment
    - Test concurrent updates (race conditions)
    - Test retry logic


- [ ] 14. Implement caching layer
  - [ ] 14.1 Create AvailabilityCache class
    - Implement get, set, invalidate, clear methods
    - Use Map for in-memory storage
    - Track TTL for each entry
    - Implement pattern-based invalidation
    - _Requirements: 25.1-25.9_

  - [ ] 14.2 Integrate cache with availability calculation
    - Cache availability results with 60 second TTL
    - Cache slot capacity with 30 second TTL
    - Cache product lists with 120 second TTL
    - Cache menu week with 300 second TTL
    - _Requirements: 25.1-25.7_

  - [ ] 14.3 Implement cache invalidation triggers
    - Invalidate on pattern update
    - Invalidate on window create/update/delete
    - Invalidate on menu week update
    - Invalidate on slot reservation/release
    - _Requirements: 25.2-25.4_

  - [ ]* 14.4 Write property test for cache invalidation
    - **Property 21: Cache Invalidation**
    - **Validates: Requirements 25.2-25.4**

  - [ ]* 14.5 Write unit tests for caching
    - Test cache hit/miss
    - Test TTL expiration
    - Test invalidation patterns

- [ ] 15. Checkpoint - Availability engine complete
  - Ensure availability calculation works for all pattern types
  - Verify slot capacity management handles concurrent updates
  - Test caching and invalidation
  - Ensure all tests pass, ask the user if questions arise


- [ ] 16. Extend Product model and API
  - [ ] 16.1 Update Product API to include availability fields
    - Extend GET /api/products/[id] to return availability fields
    - Extend PATCH /api/products/[id] to accept availability field updates
    - Validate availability_mode enum values
    - Validate quantity rules (min >= 1, step >= 1, max >= min)
    - _Requirements: 3.1-3.19_

  - [ ]* 16.2 Write property test for Shopify integration preservation
    - **Property 5: Shopify Integration Preservation**
    - **Validates: Requirements 1.2**

  - [ ]* 16.3 Write unit tests for product API extensions
    - Test availability field updates
    - Test validation rules

- [ ] 17. Create CMS list view for Availability Patterns
  - [ ] 17.1 Create /app/admin/availability-patterns/page.tsx
    - Implement list view with DataTable component
    - Display columns: pattern_name, pattern_type, active status, product count
    - Add filtering by pattern_type and active status
    - Add search by pattern_name
    - Add create button
    - Add edit/delete actions
    - _Requirements: 15.1-15.4_

  - [ ]* 17.2 Write unit tests for pattern list view
    - Test rendering
    - Test filtering
    - Test search

- [ ] 18. Create CMS editor form for Availability Patterns
  - [ ] 18.1 Create /app/admin/availability-patterns/[id]/page.tsx
    - Use EditPageLayout component
    - Organize fields into sections: Basic Info, Order Timing, Pickup Rules, Slot Configuration, Quantity Rules, Customer Messaging
    - Implement bilingual fields using TranslationFields component
    - Add inline help text for complex fields
    - Validate recurring schedule (close after open)
    - Validate time ranges (end after start)
    - Add save/cancel actions
    - _Requirements: 16.1-16.5_

  - [ ] 18.2 Create /app/admin/availability-patterns/create/page.tsx
    - Reuse editor form component
    - Set default values for new patterns
    - _Requirements: 16.1-16.5_

  - [ ]* 18.3 Write unit tests for pattern editor form
    - Test form rendering
    - Test validation
    - Test save/cancel actions


- [ ] 19. Create CMS list view and editor for Pickup Locations
  - [ ] 19.1 Create /app/admin/pickup-locations/page.tsx
    - Implement list view with DataTable component
    - Display columns: internal_name, public_label, active status, sort_order
    - Add filtering by active status
    - Implement drag-and-drop reordering
    - Add create button
    - Add edit/delete actions
    - _Requirements: 15.5-15.8_

  - [ ] 19.2 Create /app/admin/pickup-locations/[id]/page.tsx and create/page.tsx
    - Use EditPageLayout component
    - Implement bilingual fields for public_label and pickup_instructions
    - Add all location fields (address, contact_details, map_link, etc.)
    - _Requirements: 16.6-16.7_

  - [ ]* 19.3 Write unit tests for pickup location UI
    - Test list view rendering
    - Test drag-and-drop reordering
    - Test editor form

- [ ] 20. Create CMS list view and editor for Slot Templates
  - [ ] 20.1 Create /app/admin/slot-templates/page.tsx
    - Implement list view with DataTable component
    - Display columns: name, start_time, end_time, interval_minutes, default_per_slot_capacity, active status
    - Add filtering by active status
    - Add create button
    - Add edit/delete actions
    - _Requirements: 15.9-15.11_

  - [ ] 20.2 Create /app/admin/slot-templates/[id]/page.tsx and create/page.tsx
    - Use EditPageLayout component
    - Add time pickers for start_time and end_time
    - Validate end_time after start_time
    - Validate interval_minutes is positive
    - _Requirements: 16.8-16.10_

  - [ ]* 20.3 Write unit tests for slot template UI
    - Test list view rendering
    - Test editor form
    - Test time validation

- [ ] 21. Create CMS list view and editor for Menu Weeks
  - [ ] 21.1 Create /app/admin/menu-weeks/page.tsx
    - Implement list view with DataTable component
    - Display columns: internal_title, week_label, launch_date, order_cutoff_datetime, pickup_date_or_range, status
    - Add filtering by status
    - Add sorting by launch_date
    - Add create button
    - Add edit/delete actions
    - _Requirements: 15.12-15.15_

  - [ ] 21.2 Create /app/admin/menu-weeks/[id]/page.tsx and create/page.tsx
    - Use EditPageLayout component
    - Implement product picker for featured_products
    - Implement bilingual rich text editors for menu_intro_copy
    - Add date/datetime pickers
    - Validate order_cutoff_datetime before pickup_date_or_range
    - _Requirements: 16.11-16.14_

  - [ ]* 21.3 Write unit tests for menu week UI
    - Test list view rendering
    - Test editor form
    - Test date validation


- [ ] 22. Create CMS list view and editor for Product Availability Windows
  - [ ] 22.1 Create /app/admin/availability-windows/page.tsx
    - Implement list view with DataTable component
    - Display columns: product name, date_range_or_pickup_date, override_pattern, disable_product_for_period
    - Add filtering by product
    - Add filtering by date range
    - Add create button
    - Add edit/delete actions
    - _Requirements: 15.16-15.19_

  - [ ] 22.2 Create /app/admin/availability-windows/[id]/page.tsx and create/page.tsx
    - Use EditPageLayout component
    - Implement product picker
    - Implement pattern picker for override_pattern
    - Implement location picker for location_restriction_override
    - Add date/datetime pickers
    - _Requirements: 16.15-16.18_

  - [ ]* 22.3 Write unit tests for availability window UI
    - Test list view rendering
    - Test editor form
    - Test pickers

- [ ] 23. Add Availability tab to Product editor
  - [ ] 23.1 Create Availability tab component
    - Add tab to existing Product editor alongside Content, Ingredients, Shopify, Media, Relationships tabs
    - Display Selling Mode section: online_orderable, pickup_only, availability_mode, assigned_availability_pattern
    - Display Order Rules section: default_min_quantity, default_quantity_step, default_max_quantity, inventory_mode, cap_mode
    - Display Pickup Rules section: default_pickup_required, default_location_restriction, date_selection_type, slot_selection_type
    - Display Availability Instances section: list all ProductAvailabilityWindows for current product
    - Add actions to add, duplicate, or archive windows
    - _Requirements: 9.1-9.6_

  - [ ]* 23.2 Write unit tests for Availability tab
    - Test tab rendering
    - Test field updates
    - Test window management

- [ ] 24. Checkpoint - CMS UI complete
  - Ensure all list views display correctly
  - Verify all editor forms work and validate properly
  - Test creating, editing, and deleting all content types
  - Ensure all tests pass, ask the user if questions arise


- [ ] 25. Implement storefront product availability display
  - [ ] 25.1 Create ProductAvailabilityDisplay component
    - Display orderable status indicator
    - Display cutoff datetime countdown
    - Display pickup date selector (if applicable)
    - Display location selector (if applicable)
    - Display time slot selector (if applicable)
    - Display quantity controls with min/max/step validation
    - Show availability messages in user's selected language
    - _Requirements: 11.5-11.10, 27.1-27.3_

  - [ ] 25.2 Integrate ProductAvailabilityDisplay into product detail page
    - Add component to /app/products/[handle]/ProductPageClient.tsx
    - Fetch availability data from /api/products/[id]/availability
    - Handle loading and error states
    - _Requirements: 11.1-11.10_

  - [ ]* 25.3 Write unit tests for ProductAvailabilityDisplay
    - Test rendering for different availability modes
    - Test date/location/slot selectors
    - Test quantity controls
    - Test language switching

- [ ] 26. Implement cart validation and integration
  - [ ] 26.1 Create CartAvailabilityValidator component
    - Validate cart contents against current availability rules
    - Check cutoff times for each product
    - Validate quantities (min, max, step)
    - Verify slot capacity
    - Group items by pickup date and location
    - Show warnings for expired items
    - _Requirements: 12.1-12.9, 17.1-17.10_

  - [ ] 26.2 Extend cart state to include pickup details
    - Add pickup_date, pickup_location_id, pickup_slot to cart items
    - Persist cart state in session storage
    - _Requirements: 17.1-17.4_

  - [ ] 26.3 Implement add to cart validation
    - Validate product is orderable
    - Validate cutoff has not passed
    - Validate quantity rules
    - Validate location is allowed
    - Validate slot has capacity
    - Reserve slot capacity on successful add
    - _Requirements: 12.1-12.8_

  - [ ] 26.4 Implement cart item removal with slot release
    - Release slot capacity when item is removed
    - _Requirements: 17.8_

  - [ ]* 26.5 Write property test for add to cart validation
    - **Property 8: Add to Cart Validation**
    - **Validates: Requirements 12.1, 12.2, 12.6, 12.7**

  - [ ]* 26.6 Write property test for quantity validation
    - **Property 7: Quantity Validation**
    - **Validates: Requirements 12.3, 12.4, 12.5**

  - [ ]* 26.7 Write property test for cart pickup grouping
    - **Property 16: Cart Pickup Grouping**
    - **Validates: Requirements 17.6**

  - [ ]* 26.8 Write property test for slot capacity release
    - **Property 17: Slot Capacity Release**
    - **Validates: Requirements 17.8**

  - [ ]* 26.9 Write unit tests for cart validation
    - Test add to cart (valid and invalid cases)
    - Test quantity validation
    - Test slot reservation
    - Test item removal and slot release


- [ ] 27. Implement checkout flow
  - [ ] 27.1 Create CheckoutPickupSummary component
    - Display summary of all products grouped by pickup date and location
    - Display total price
    - Display pickup instructions for each location
    - Require customer contact information (name, email, phone)
    - Provide optional special instructions field
    - _Requirements: 18.1-18.5_

  - [ ] 27.2 Implement checkout validation
    - Revalidate all availability rules before processing payment
    - Check if any product is no longer orderable
    - Display which products are invalid if validation fails
    - Reject order if validation fails
    - _Requirements: 18.6-18.7_

  - [ ] 27.3 Implement order creation on successful payment
    - Create order record with all pickup details
    - Decrement slot capacity for reserved slots
    - Send order confirmation email to customer
    - _Requirements: 18.8-18.10_

  - [ ]* 27.4 Write property test for checkout validation
    - **Property 9: Checkout Validation**
    - **Validates: Requirements 12.8, 12.9, 18.6, 18.7**

  - [ ]* 27.5 Write unit tests for checkout flow
    - Test checkout summary rendering
    - Test validation (all valid, some invalid, all invalid)
    - Test order creation
    - Test email sending

- [ ] 28. Implement order confirmation
  - [ ] 28.1 Create order confirmation page
    - Display order number
    - Display all ordered products with quantities
    - Display pickup date, location, and time slot for each product
    - Display pickup instructions for each location
    - Display customer contact information
    - Display special instructions
    - _Requirements: 19.1-19.7_

  - [ ] 28.2 Create order confirmation email template
    - Include all information from confirmation page
    - Include calendar attachment for pickup date/time
    - Use customer's selected language
    - _Requirements: 19.8-19.10, 27.5_

  - [ ]* 28.3 Write unit tests for order confirmation
    - Test confirmation page rendering
    - Test email template
    - Test calendar attachment generation


- [ ] 29. Implement Menu Week storefront display
  - [ ] 29.1 Create MenuWeekDisplay component for homepage
    - Display current active menu week
    - Display public_title, week_label, order_cutoff_datetime, pickup_date_or_range
    - Display menu_intro_copy
    - Display featured_products with images and prices
    - Provide link to full order page
    - Use customer's selected language
    - _Requirements: 28.1-28.8, 27.1-27.4_

  - [ ] 29.2 Create MenuWeekBanner component for order page
    - Display banner_messaging
    - Display countdown to order cutoff
    - Display message when cutoff has passed
    - _Requirements: 28.9-28.12_

  - [ ]* 29.3 Write unit tests for menu week display
    - Test homepage component rendering
    - Test order page banner
    - Test countdown logic
    - Test language switching

- [ ] 30. Implement product filtering on storefront
  - [ ] 30.1 Create ProductFilterPanel component
    - Add filter for products available for specific pickup date
    - Add filter for products available at specific pickup location
    - Add filter for products with immediate availability
    - Add filter for products in current menu week
    - Add filter for B2B catering products
    - Display number of products matching filters
    - Provide "Clear all filters" action
    - Preserve filter selections in URL params
    - _Requirements: 29.1-29.10_

  - [ ] 30.2 Integrate ProductFilterPanel into product listing pages
    - Update product listings to respect filters
    - Display message when no products match filters
    - _Requirements: 29.6-29.10_

  - [ ]* 30.3 Write property test for product filter accuracy
    - **Property 26: Product Filter Accuracy**
    - **Validates: Requirements 29.1-29.6**

  - [ ]* 30.4 Write unit tests for product filtering
    - Test each filter type
    - Test filter combinations
    - Test clear filters
    - Test URL param persistence

- [ ] 31. Checkpoint - Storefront integration complete
  - Ensure product availability displays correctly
  - Verify cart validation works
  - Test complete checkout flow
  - Test menu week display
  - Test product filtering
  - Ensure all tests pass, ask the user if questions arise


- [ ] 32. Implement order management API endpoints
  - [ ] 32.1 Create GET /api/orders endpoint
    - Support filtering by pickup_date, pickup_location, status
    - Support search by order_number or customer_name
    - Return paginated results
    - _Requirements: 20.1-20.6_

  - [ ] 32.2 Create GET /api/orders/[id] endpoint
    - Return complete order details including items, pickup details, customer info
    - _Requirements: 20.7-20.8_

  - [ ] 32.3 Create PATCH /api/orders/[id] endpoint
    - Support status updates (mark as fulfilled, cancel)
    - Log status changes with timestamp
    - Require authentication (staff only)
    - _Requirements: 20.9-20.12_

  - [ ]* 32.4 Write unit tests for order management API
    - Test list endpoint with filters
    - Test detail endpoint
    - Test status updates

- [ ] 33. Create CMS Order Operations View
  - [ ] 33.1 Create /app/admin/orders/page.tsx
    - Implement list view with DataTable component
    - Display columns: order_number, customer_name, order_date, pickup_date, pickup_location, status, total
    - Add filtering by pickup_date, pickup_location, status
    - Add search by order_number or customer_name
    - Add view details action
    - _Requirements: 10.1-10.7, 20.1-20.6_

  - [ ] 33.2 Create /app/admin/orders/[id]/page.tsx
    - Display all order information
    - Display order items with products, quantities, pickup details
    - Display customer information
    - Display special instructions
    - Provide action to mark as fulfilled
    - Provide action to cancel order
    - Provide action to send custom email
    - Display status change history
    - _Requirements: 20.7-20.12_

  - [ ]* 33.3 Write unit tests for order operations UI
    - Test list view rendering
    - Test filtering and search
    - Test detail view
    - Test status update actions


- [ ] 34. Implement prep sheet generation
  - [ ] 34.1 Create GET /api/orders/prep-sheet endpoint
    - Accept query params: start_date, end_date, location (optional)
    - Return prep sheet data: products grouped by category/type, total quantities, breakdown by pickup date, special instructions
    - _Requirements: 21.1-21.10_

  - [ ] 34.2 Create PrepSheetGenerator component
    - Provide form for selecting date range and location filter
    - Display preview of prep sheet
    - Provide print function
    - Provide export as PDF function
    - Provide export as CSV function
    - _Requirements: 21.1-21.10_

  - [ ] 34.3 Integrate PrepSheetGenerator into Order Operations View
    - Add "Generate Prep Sheet" button to /app/admin/orders/page.tsx
    - _Requirements: 10.3, 21.1-21.10_

  - [ ]* 34.4 Write property test for prep sheet accuracy
    - **Property 18: Prep Sheet Accuracy**
    - **Validates: Requirements 21.5, 21.6, 21.7**

  - [ ]* 34.5 Write unit tests for prep sheet generation
    - Test data aggregation
    - Test filtering by location
    - Test export formats

- [ ] 35. Implement pickup list generation
  - [ ] 35.1 Create GET /api/orders/pickup-list endpoint
    - Accept query params: date, location
    - Return pickup list data: orders grouped by time slot, customer names, order numbers, products, quantities, special instructions
    - _Requirements: 22.1-22.11_

  - [ ] 35.2 Create PickupListGenerator component
    - Provide form for selecting date and location
    - Display pickup list grouped by time slot
    - Support sorting by customer name or time slot
    - Provide print function
    - Provide export as PDF function
    - _Requirements: 22.1-22.11_

  - [ ] 35.3 Integrate PickupListGenerator into Order Operations View
    - Add "Generate Pickup List" button to /app/admin/orders/page.tsx
    - _Requirements: 10.3, 22.1-22.11_

  - [ ]* 35.4 Write property test for pickup list accuracy
    - **Property 19: Pickup List Accuracy**
    - **Validates: Requirements 22.4-22.8**

  - [ ]* 35.5 Write unit tests for pickup list generation
    - Test data grouping by slot
    - Test sorting
    - Test export formats


- [ ] 36. Implement slot capacity monitoring UI
  - [ ] 36.1 Create SlotCapacityManager component
    - Display current capacity for each slot
    - Display remaining capacity
    - Show warning when slot reaches 80% capacity
    - Show alert when slot reaches 100% capacity
    - Provide action to manually adjust capacity (with reason field)
    - Provide action to temporarily close a slot
    - Provide action to reopen a closed slot
    - Display capacity adjustment history
    - _Requirements: 23.1-23.10_

  - [ ] 36.2 Integrate SlotCapacityManager into Order Operations View
    - Add "Manage Slot Capacity" section to /app/admin/orders/page.tsx
    - _Requirements: 10.5, 23.1-23.10_

  - [ ]* 36.3 Write unit tests for slot capacity monitoring
    - Test capacity display
    - Test warnings and alerts
    - Test capacity adjustment
    - Test slot close/reopen

- [ ] 37. Checkpoint - Order operations complete
  - Ensure order list and detail views work correctly
  - Verify prep sheet generation
  - Verify pickup list generation
  - Test slot capacity monitoring
  - Ensure all tests pass, ask the user if questions arise


- [ ] 38. Implement internationalization
  - [ ] 38.1 Create translation management utilities
    - Implement bilingual content validation (both en and fr required)
    - Implement fallback logic (missing fr → use en)
    - _Requirements: 27.6-27.10_

  - [ ] 38.2 Integrate translations into storefront components
    - Apply language to availability labels and messages
    - Apply language to cutoff messages
    - Apply language to pickup instructions
    - Apply language to menu week content
    - Apply language to error messages
    - _Requirements: 27.1-27.5_

  - [ ] 38.3 Integrate translations into email templates
    - Use customer's selected language for order confirmations
    - Include both languages in pickup instructions
    - _Requirements: 27.5_

  - [ ]* 38.4 Write property test for language display
    - **Property 24: Language Display**
    - **Validates: Requirements 27.1-27.5**

  - [ ]* 38.5 Write property test for translation fallback
    - **Property 25: Translation Fallback**
    - **Validates: Requirements 27.10**

  - [ ]* 38.6 Write unit tests for internationalization
    - Test language switching
    - Test fallback logic
    - Test bilingual validation

- [ ] 39. Implement error handling and logging
  - [ ] 39.1 Create error logging system
    - Define ErrorLog interface
    - Implement logging for availability calculation failures
    - Implement logging for slot capacity failures
    - Implement logging for order validation failures
    - Implement logging for configuration changes
    - Implement logging for capacity adjustments
    - _Requirements: 26.1-26.10_

  - [ ] 39.2 Implement error fallback behavior
    - Fall back to unavailable when availability calculation fails
    - Retry slot capacity updates up to 3 times
    - Display user-friendly error messages
    - _Requirements: 26.1-26.6_

  - [ ] 39.3 Create error log view in CMS
    - Create /app/admin/error-logs/page.tsx
    - Display recent errors with filtering by type and severity
    - Provide action to export error logs for date range
    - _Requirements: 26.9-26.10_

  - [ ]* 39.4 Write property test for error fallback behavior
    - **Property 22: Error Fallback Behavior**
    - **Validates: Requirements 26.1, 26.2**

  - [ ]* 39.5 Write unit tests for error handling
    - Test error logging
    - Test fallback behavior
    - Test retry logic
    - Test error log view


- [ ] 40. Implement accessibility features
  - [ ] 40.1 Add keyboard navigation to preorder controls
    - Ensure all interactive elements are keyboard accessible
    - Add focus indicators
    - Implement skip links
    - _Requirements: 30.1, 30.5, 30.7_

  - [ ] 40.2 Add ARIA labels and screen reader support
    - Add ARIA labels to all interactive elements
    - Implement screen reader announcements for availability status changes
    - Ensure error messages are announced to screen readers
    - _Requirements: 30.2, 30.3, 30.6_

  - [ ] 40.3 Ensure color contrast and visual accessibility
    - Verify sufficient color contrast for all text and controls
    - Test with accessibility tools (axe, Lighthouse)
    - _Requirements: 30.4_

  - [ ] 40.4 Make date/time/location selectors keyboard accessible
    - Ensure date picker is keyboard accessible
    - Ensure time slot selector is keyboard accessible
    - Ensure location selector is keyboard accessible
    - _Requirements: 30.8, 30.9, 30.10_

  - [ ]* 40.5 Write unit tests for accessibility
    - Test keyboard navigation
    - Test ARIA labels
    - Test screen reader announcements
    - Test focus management

- [ ] 41. Create seed data for development
  - [ ] 41.1 Create seed script
    - Create sample availability patterns (B2C weekly, B2B lead-time)
    - Create sample pickup locations
    - Create sample slot templates
    - Create sample menu weeks
    - Create sample product availability windows
    - Assign patterns to sample products
    - _Requirements: 14.1-14.9_

  - [ ] 41.2 Add seed command to package.json
    - Add `npm run db:seed` command
    - _Requirements: 14.1-14.9_


- [ ] 42. Integration testing
  - [ ]* 42.1 Write integration test for order placement flow
    - Test complete flow: browse products → filter → select → add to cart → checkout → confirm
    - Test with different product types (B2C weekly, B2B catering, always available)
    - Test with different pickup configurations
    - Test error scenarios (cutoff passed, slot full, invalid quantity)
    - _Requirements: 31.3_

  - [ ]* 42.2 Write integration test for staff workflow
    - Test creating and configuring all content types
    - Test assigning patterns to products
    - Test monitoring upcoming pickups
    - Test generating reports
    - Test adjusting slot capacity
    - Test managing orders
    - _Requirements: 31.6_

  - [ ]* 42.3 Write integration test for slot capacity management
    - Test concurrent reservations
    - Test capacity tracking under load
    - Test optimistic locking prevents over-booking
    - _Requirements: 31.4, 31.8_

- [ ] 43. End-to-end testing
  - [ ]* 43.1 Write E2E test for customer journey
    - Test complete order placement from product selection to confirmation
    - Test with different product types
    - Test with different pickup configurations
    - Test error scenarios
    - _Requirements: 31.5_

  - [ ]* 43.2 Write E2E test for staff journey
    - Test complete staff workflow from pattern creation to order fulfillment
    - _Requirements: 31.6_

- [ ] 44. Performance testing
  - [ ]* 44.1 Benchmark availability calculation performance
    - Test calculation time for various pattern types
    - Test with large numbers of products (1000+)
    - Test with complex patterns
    - Verify caching effectiveness
    - _Requirements: 25.1-25.10_

  - [ ]* 44.2 Test slot capacity under load
    - Test concurrent reservations (10+ simultaneous requests)
    - Test capacity tracking under load
    - Verify optimistic locking prevents over-booking
    - _Requirements: 25.8_

  - [ ]* 44.3 Test database query performance
    - Test query performance for order operations view
    - Test filtering and sorting performance
    - Verify indexes are effective
    - Ensure no slow queries exceeding 500ms
    - _Requirements: 25.5-25.7, 25.10_


- [ ] 45. Documentation
  - [ ] 45.1 Create database setup documentation
    - Document local PostgreSQL setup with Docker Compose
    - Document Vercel Postgres setup
    - Document migration commands
    - Document seed data commands
    - _Requirements: 14.1-14.9_

  - [ ] 45.2 Create API documentation
    - Document all API endpoints with request/response examples
    - Document authentication requirements
    - Document rate limiting
    - _Requirements: All API-related requirements_

  - [ ] 45.3 Create CMS user guide
    - Document how to create and manage availability patterns
    - Document how to create and manage pickup locations
    - Document how to create and manage slot templates
    - Document how to create and manage menu weeks
    - Document how to create and manage product availability windows
    - Document how to use the Availability tab in Product editor
    - Document how to use Order Operations View
    - Document how to generate prep sheets and pickup lists
    - Document how to manage slot capacity
    - _Requirements: All CMS-related requirements_

  - [ ] 45.4 Create deployment guide
    - Document deployment process to Vercel
    - Document environment variable configuration
    - Document migration strategy
    - Document rollback procedures
    - _Requirements: 2.1-2.3, 14.1-14.9_

- [ ] 46. Final checkpoint - Feature complete
  - Ensure all functionality works end-to-end
  - Verify all tests pass (unit, integration, E2E, property-based)
  - Verify test coverage meets 80% minimum
  - Review all documentation
  - Test on both local and staging environments
  - Ensure all tests pass, ask the user if questions arise

- [ ] 47. Code review and merge preparation
  - Review all code for quality and consistency
  - Ensure all TypeScript types are properly defined
  - Ensure all error handling is in place
  - Ensure all logging is implemented
  - Ensure all accessibility requirements are met
  - Prepare pull request description with feature overview and testing notes
  - _Requirements: 2.1-2.3_


## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration and E2E tests validate complete workflows
- All work must be done on the `feature/preorder-operations` branch
- The implementation uses TypeScript throughout
- Database uses PostgreSQL with Drizzle ORM
- Production uses Vercel Postgres, development uses local PostgreSQL with Docker Compose
- All customer-facing content supports French and English
- All API endpoints follow the existing `/api/*` structure
- All CMS UI follows the existing admin patterns and components
- Caching is implemented with configurable TTLs and pattern-based invalidation
- Slot capacity uses optimistic locking to prevent race conditions
- Error handling includes logging, fallback behavior, and user-friendly messages
- Accessibility is a first-class requirement with keyboard navigation, ARIA labels, and screen reader support

## Test Coverage Summary

The feature includes comprehensive testing:

- **26 Property-Based Tests**: Validate universal correctness properties across all inputs
- **Unit Tests**: Cover all functions, components, and API endpoints
- **Integration Tests**: Validate complete workflows (order placement, staff operations, slot capacity)
- **E2E Tests**: Validate customer and staff journeys from start to finish
- **Performance Tests**: Benchmark availability calculation, slot capacity under load, and database queries
- **Accessibility Tests**: Verify keyboard navigation, ARIA labels, and screen reader support

Target: Minimum 80% code coverage for preorder-related code, with 100% coverage for availability calculation engine, validation logic, and slot capacity management.
