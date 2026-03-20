# Design: Weekly Launch Menus

## Overview

Replace the six-entity preorder system with a single Launch object that contains everything needed for a weekly preorder cycle. Keep Pickup Locations as a shared entity. Remove Availability Patterns, Slot Templates, and Availability Windows entirely.

## Architecture

The simplified system has three layers:

```
Staff creates Launch (CMS)
  → Launch contains: dates, products, slots, pickup config, messaging
  → API serves active Launch to storefront
  → Storefront displays menu, countdown, slot picker
```

No availability calculation engine. No pattern evaluation. The Launch IS the availability — if a Launch is active and a product is in it, it's orderable until the cutoff.

## Data Model Changes

### New: `launches` table (replaces `menu_weeks`)

```typescript
export const launches = pgTable('launches', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Menu Details (Section 1)
  title: jsonb('title').notNull().$type<{ en: string; fr: string }>(),
  introCopy: jsonb('intro_copy').notNull().$type<{ en: string; fr: string }>(),
  status: text('status', { enum: ['draft', 'active', 'archived'] }).notNull().default('draft'),
  
  // Ordering Window (Section 2)
  orderOpens: timestamp('order_opens').notNull(),
  orderCloses: timestamp('order_closes').notNull(),
  
  // Pickup (Section 3)
  pickupDate: timestamp('pickup_date').notNull(),
  pickupLocationId: uuid('pickup_location_id').references(() => pickupLocations.id),
  pickupInstructions: jsonb('pickup_instructions').$type<{ en: string; fr: string }>(),
  
  // Pickup Slots (Section 4) — stored as JSON array on the Launch
  pickupSlotConfig: jsonb('pickup_slot_config').$type<{
    startTime: string;   // HH:mm
    endTime: string;     // HH:mm
    intervalMinutes: number;
  }>(),
  pickupSlots: jsonb('pickup_slots').$type<Array<{
    id: string;          // generated UUID
    startTime: string;   // HH:mm
    endTime: string;     // HH:mm
    capacity?: number;   // optional cap
  }>>().notNull().default([]),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('launches_status_idx').on(table.status),
  pickupDateIdx: index('launches_pickup_date_idx').on(table.pickupDate),
}));
```

### New: `launch_products` table (replaces `featured_products` JSON array)

```typescript
export const launchProducts = pgTable('launch_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  launchId: uuid('launch_id').notNull().references(() => launches.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  sortOrder: integer('sort_order').notNull().default(0),
  
  // Per-menu overrides
  minQuantityOverride: integer('min_quantity_override'),
  maxQuantityOverride: integer('max_quantity_override'),
  quantityStepOverride: integer('quantity_step_override'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  launchIdIdx: index('launch_products_launch_id_idx').on(table.launchId),
  productIdIdx: index('launch_products_product_id_idx').on(table.productId),
  uniqueLaunchProduct: index('launch_products_unique').on(table.launchId, table.productId),
}));
```

### Simplified: `products` table

Remove these fields from the products table:
- `availabilityMode` 
- `assignedAvailabilityPattern`
- `inventoryMode`
- `capMode`
- `dateSelectionType`
- `slotSelectionType`
- `orderType`
- `defaultLeadTimeHours`
- `defaultLocationRestriction`

Keep these fields:
- `onlineOrderable` — master toggle for whether a product can be ordered online
- `pickupOnly` — whether the product requires in-store pickup
- `defaultMinQuantity` — default minimum order quantity
- `defaultQuantityStep` — default quantity increment
- `defaultMaxQuantity` — default maximum order quantity
- `defaultPickupRequired` — whether pickup is required by default

### Keep: `pickup_locations` table (unchanged)

### Keep: `orders` and `order_items` tables (unchanged)

### Remove: these tables entirely
- `availability_patterns`
- `slot_templates`
- `product_availability_windows`
- `slot_capacity` (slot capacity is now a simple field on each slot in the Launch JSON)

## API Endpoints

### Launches (replaces menu-weeks)

```
GET    /api/launches              — list with status filter, sorted by pickup_date desc
POST   /api/launches              — create new launch
GET    /api/launches/[id]         — get launch with products
PATCH  /api/launches/[id]         — update launch
DELETE /api/launches/[id]         — archive (soft delete)
POST   /api/launches/[id]/duplicate — duplicate a launch
GET    /api/launches/current      — get active launch for storefront
```

### Launch Products (nested under launches)

```
GET    /api/launches/[id]/products          — list products for a launch
POST   /api/launches/[id]/products          — add product(s) to launch
PATCH  /api/launches/[id]/products/[pid]    — update sort order or overrides
DELETE /api/launches/[id]/products/[pid]    — remove product from launch
PATCH  /api/launches/[id]/products/reorder  — bulk reorder
```

### Pickup Locations (unchanged)

```
GET    /api/pickup-locations
POST   /api/pickup-locations
GET    /api/pickup-locations/[id]
PATCH  /api/pickup-locations/[id]
DELETE /api/pickup-locations/[id]
```

## Admin UI Changes

### Sidebar Navigation

```
Commerce:
  Products        /admin/products
  Orders          /admin/orders
  Menus           /admin/menus          ← renamed from "Menu Weeks"
  Pickup Locations /admin/pickup-locations ← moved from "Preorder Config"
  Ingredients     /admin/ingredients

// Remove entire "Preorder Config" section
```

### Launch Editor (`/admin/menus/[id]`)

Five sections matching the operational workflow:

1. **Menu Details** — title EN/FR, intro copy EN/FR, status dropdown
2. **Ordering Window** — order opens (datetime-local), order closes (datetime-local)
3. **Pickup** — pickup date, pickup location (select), pickup instructions EN/FR
4. **Pickup Slots** — start time, end time, interval, "Generate Slots" button, editable slot list with optional capacity
5. **Products in this Menu** — product picker, drag-to-reorder list, per-product overrides (min/max/step qty)

### Launch List View (`/admin/menus`)

Columns: title, status badge, order closes, pickup date, product count
Actions: edit, duplicate, archive
Filters: status dropdown, search by title

### Duplicate Flow

1. Staff clicks "Duplicate" on a Launch
2. API creates new Launch with:
   - Copied: products + overrides, pickup location, pickup instructions, slot config, intro copy
   - Reset: status → draft, dates cleared, slots array emptied, title prefixed "Copy of "
3. Redirect to new Launch editor

## Migration Plan

### Phase 1: Add new tables
- Create `launches` table
- Create `launch_products` table

### Phase 2: Migrate data
- Convert existing `menu_weeks` rows to `launches` rows
- Convert `featured_products` JSON arrays to `launch_products` rows

### Phase 3: Remove old tables
- Drop `availability_patterns`
- Drop `slot_templates`  
- Drop `product_availability_windows`
- Drop `slot_capacity`
- Remove unused columns from `products`

### Phase 4: Remove old code
- Delete admin pages: `/admin/availability-patterns`, `/admin/slot-templates`, `/admin/availability-windows`
- Delete API routes: `/api/availability-patterns`, `/api/slot-templates`, `/api/availability-windows`, `/api/slots`
- Update sidebar navigation
- Update storefront components to use new Launch API

## Storefront Integration

The storefront reads from `GET /api/launches/current` which returns the active Launch with its products and slots. The existing `MenuWeekDisplay` and `ProductAvailabilityDisplay` components get simplified to read from this single endpoint.

- Homepage: shows active Launch title, intro copy, featured products, countdown to order close
- Order page: shows full product list from active Launch, pickup slot selector
- Product pages: show "orderable" only if product is in the active Launch and before cutoff
