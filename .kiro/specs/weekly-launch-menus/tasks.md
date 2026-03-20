# Tasks: Weekly Launch Menus

## Phase 1: Database — Add New Tables

- [x] 1. Create `launches` table in schema
  - Add to `lib/db/schema.ts`
  - Fields: title (jsonb bilingual), introCopy (jsonb bilingual), status (draft/active/archived), orderOpens, orderCloses, pickupDate, pickupLocationId (FK), pickupInstructions (jsonb bilingual), pickupSlotConfig (jsonb), pickupSlots (jsonb array), timestamps
  - Indexes on status and pickupDate
  - _Requirements: 1.1–1.6_

- [x] 2. Create `launch_products` table in schema
  - Add to `lib/db/schema.ts`
  - Fields: launchId (FK cascade), productId (FK), sortOrder, minQuantityOverride, maxQuantityOverride, quantityStepOverride, createdAt
  - Indexes on launchId, productId, unique composite
  - _Requirements: 3.1–3.6_

- [x] 3. Generate and run migration
  - Run drizzle-kit to generate migration for new tables
  - Test migration against local PostgreSQL
  - _Requirements: 1.1–1.6, 3.1–3.6_

## Phase 2: Launch API

- [x] 4. Create Launch CRUD API routes
  - `GET /api/launches` — list with status filter, sorted by pickup_date desc
  - `POST /api/launches` — create with validation (order closes before pickup date, bilingual fields)
  - `GET /api/launches/[id]` — return launch with joined products
  - `PATCH /api/launches/[id]` — update with validation
  - `DELETE /api/launches/[id]` — soft delete (set status to archived)
  - _Requirements: 1.1–1.6, 5.1–5.5_

- [x] 5. Create Launch current endpoint
  - `GET /api/launches/current` — return the active launch for storefront
  - Return launch with products and pickup location details
  - Cache for 5 minutes
  - _Requirements: 7.1–7.5_

- [x] 6. Create Launch duplicate endpoint
  - `POST /api/launches/[id]/duplicate`
  - Copy: products + overrides, pickup location, pickup instructions, slot config, intro copy
  - Reset: status → draft, dates cleared, slots emptied, title prefixed "Copy of "
  - Return new launch ID
  - _Requirements: 4.1–4.5_

- [x] 7. Create Launch Products sub-API
  - `GET /api/launches/[id]/products` — list products for launch with sort order
  - `POST /api/launches/[id]/products` — add product(s) to launch
  - `PATCH /api/launches/[id]/products/[pid]` — update overrides or sort order
  - `DELETE /api/launches/[id]/products/[pid]` — remove product from launch
  - `PATCH /api/launches/[id]/products/reorder` — bulk reorder
  - _Requirements: 3.1–3.6_

## Phase 3: Launch Admin UI

- [x] 8. Create Launch list view at `/admin/menus/page.tsx`
  - DataTable with columns: title, status badge, order closes, pickup date, product count
  - Status filter dropdown, search by title
  - Actions: edit, duplicate, archive
  - Sorted by pickup date descending
  - _Requirements: 5.1–5.5_

- [x] 9. Create Launch editor at `/admin/menus/[id]/page.tsx`
  - Section 1: Menu Details — title EN/FR, intro copy EN/FR, status
  - Section 2: Ordering Window — order opens, order closes (datetime-local)
  - Section 3: Pickup — pickup date, pickup location select, pickup instructions EN/FR
  - Section 4: Pickup Slots — start time, end time, interval, generate button, editable slot list with capacity
  - Section 5: Products — product picker, drag-to-reorder, per-product overrides
  - _Requirements: 2.1–2.6, 3.1–3.6, 6.1–6.5_

- [x] 10. Create Launch create page at `/admin/menus/create/page.tsx`
  - Reuse editor component with `id='create'`
  - _Requirements: 6.1–6.5_

## Phase 4: Remove Old Entities

- [x] 11. Remove Availability Patterns
  - Delete `app/admin/availability-patterns/` directory
  - Delete `app/api/availability-patterns/` directory
  - Remove `availabilityPatterns` from schema
  - _Requirements: 8.1_

- [x] 12. Remove Slot Templates
  - Delete `app/admin/slot-templates/` directory
  - Delete `app/api/slot-templates/` directory
  - Remove `slotTemplates` from schema
  - _Requirements: 8.2_

- [x] 13. Remove Availability Windows
  - Delete `app/admin/availability-windows/` directory
  - Delete `app/api/availability-windows/` directory
  - Remove `productAvailabilityWindows` from schema
  - _Requirements: 8.3_

- [x] 14. Remove Slot Capacity table
  - Remove `slotCapacity` from schema
  - Delete any `/api/slots/` routes
  - _Requirements: 8.3_

- [x] 15. Simplify Product schema
  - Remove: availabilityMode, assignedAvailabilityPattern, inventoryMode, capMode, dateSelectionType, slotSelectionType, orderType, defaultLeadTimeHours, defaultLocationRestriction
  - Keep: onlineOrderable, pickupOnly, defaultMinQuantity, defaultQuantityStep, defaultMaxQuantity, defaultPickupRequired
  - _Requirements: 8.4, 8.5_

- [x] 16. Remove old Menu Weeks
  - Delete `app/admin/menu-weeks/` directory
  - Delete `app/api/menu-weeks/` directory
  - Remove `menuWeeks` from schema
  - _Requirements: 8.1_

- [x] 17. Update sidebar navigation
  - Remove "Preorder Config" section entirely
  - Rename "Menu Weeks" to "Menus" under Commerce
  - Move "Pickup Locations" to Commerce section
  - _Requirements: 8.6, 8.7, 9.3_

- [x] 18. Generate migration for removals
  - Drop removed tables
  - Drop removed product columns
  - Run migration against local PostgreSQL
  - _Requirements: 8.1–8.7_

## Phase 5: Storefront Updates

- [x] 19. Update storefront to use Launch API
  - Update `MenuWeekDisplay` to fetch from `/api/launches/current`
  - Update `ProductAvailabilityDisplay` to check active Launch membership
  - Update order page to show products from active Launch
  - Show pickup slot selector from Launch slots
  - Show countdown to order close
  - _Requirements: 7.1–7.5_

## Phase 6: Cleanup

- [x] 20. Remove dead code and unused imports
  - Remove availability calculation engine if it exists
  - Remove any references to removed entities in components
  - Clean up unused types and interfaces
  - Run type check to verify no broken references

- [ ] 21. Verify and test
  - Verify all admin pages load without errors
  - Verify Launch CRUD works end-to-end
  - Verify duplicate flow works
  - Verify slot generation works
  - Verify storefront displays active Launch
