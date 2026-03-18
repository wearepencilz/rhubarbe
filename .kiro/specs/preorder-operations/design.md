# Design Document: Preorder Operations

## Overview

The Preorder Operations feature extends the Rhubarbe CMS and storefront with a comprehensive system for managing B2C weekly preorder menus and B2B rolling lead-time ordering. The system introduces six new content types, extends the existing Product model, and provides operational tools for staff to manage availability, pickup logistics, and order fulfillment.

### Key Objectives

- Enable reusable scheduling patterns to eliminate manual re-entry of availability rules
- Support both fixed weekly cutoffs (B2C) and rolling lead-time requirements (B2B)
- Provide structured pickup location and time slot management
- Surface operational data to staff through dedicated order operations views
- Maintain separation between product content and operational selling rules
- Preserve the existing Product model as the canonical sellable item

### Scope

This feature encompasses:
- Six new CMS content types (Availability Patterns, Pickup Locations, Slot Templates, Menu Weeks, Product Availability Windows, Order Operations View)
- Product model extensions with an Availability tab
- Storefront integration for availability display, cart, and checkout
- Order management and operations tools for staff
- Availability calculation engine with caching
- Validation logic for order placement
- Internationalization support (French/English)

## Architecture

### System Components

The preorder system consists of four primary layers:

1. **Data Layer**: PostgreSQL database with Vercel Postgres (production) and local PostgreSQL (development)
2. **API Layer**: RESTful endpoints following the existing `/api/*` structure
3. **CMS Layer**: Admin UI components for content management at `/admin/*`
4. **Storefront Layer**: Public-facing components for product browsing and ordering

### Database Architecture

**Production**: Vercel Postgres
- Managed PostgreSQL database on Vercel
- Automatic connection pooling
- Built-in connection management
- Serverless-friendly

**Development**: Local PostgreSQL
- Docker Compose setup for local development
- Same schema as production
- Seed data for testing
- Migration parity with production

**Migration Strategy**:
- Use Drizzle ORM for schema management and migrations
- Version-controlled migration files
- Automatic migration on deployment
- Rollback support

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      CMS Admin Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Patterns    │  │  Locations   │  │  Menu Weeks  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Availability Calculation Engine                      │   │
│  │  - Pattern evaluation                                 │   │
│  │  - Window overrides                                   │   │
│  │  - Slot capacity tracking                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storefront Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Product     │  │  Cart        │  │  Checkout    │      │
│  │  Display     │  │  Validation  │  │  Flow        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

**Existing Systems:**
- Product model (extended with availability fields)
- Shopify integration (products remain linked)
- Authentication system (for CMS access)
- Image upload system (for content images)
- Translation system (bilingual content)

**New Systems:**
- Availability calculation engine
- Slot capacity management
- Order operations reporting
- Pickup logistics tracking

## Components and Interfaces

### Data Models

#### Product Extensions

```typescript
// Extensions to existing Product type
interface ProductAvailabilityExtensions {
  // Selling Mode
  availability_mode: 'always_available' | 'scheduled' | 'pattern_based' | 'hidden';
  assigned_availability_pattern?: string; // Reference to AvailabilityPattern.id
  
  // Order Rules
  default_min_quantity: number; // Default: 1
  default_quantity_step: number; // Default: 1
  default_max_quantity?: number;
  inventory_mode?: 'unlimited' | 'tracked' | 'capped';
  cap_mode?: 'per_slot' | 'daily_total' | 'weekly_total';
  
  // Pickup Rules
  default_pickup_required: boolean;
  default_location_restriction?: string[]; // Array of PickupLocation.id
  date_selection_type: 'none' | 'single_date' | 'date_range' | 'recurring_day';
  slot_selection_type: 'none' | 'required' | 'optional';
  
  // Classification
  order_type?: 'weekly_menu' | 'b2b_catering' | 'signature_cake' | 'special_launch';
  
  // Lead Time
  default_lead_time_hours?: number;
}
```

#### AvailabilityPattern

```typescript
interface AvailabilityPattern {
  id: string; // UUID
  pattern_name: string;
  slug: string; // Unique URL-friendly identifier
  internal_description: string;
  active: boolean;
  
  // Pattern Configuration
  pattern_type: 'recurring_weekly' | 'rolling_lead_time' | 'one_off_scheduled' | 'manual_custom';
  
  // Order Timing
  order_open_logic: 'always_open' | 'fixed_datetime' | 'recurring_open_day_time' | 'relative_to_pickup';
  order_close_logic: 'fixed_datetime' | 'recurring_close_day_time' | 'relative_lead_time_hours' | 'relative_lead_time_days';
  
  // Recurring schedule fields (when applicable)
  recurring_open_day?: number; // 0-6 (Sunday-Saturday)
  recurring_open_time?: string; // HH:mm format
  recurring_close_day?: number; // 0-6
  recurring_close_time?: string; // HH:mm format
  
  // Fixed datetime fields (when applicable)
  fixed_open_datetime?: string; // ISO 8601
  fixed_close_datetime?: string; // ISO 8601
  
  // Lead time fields (when applicable)
  lead_time_hours?: number;
  lead_time_days?: number;
  
  // Pickup Configuration
  pickup_required: boolean;
  allowed_locations?: string[]; // Array of PickupLocation.id
  pickup_date_mode: 'recurring_pickup_day' | 'allowed_weekdays' | 'date_range' | 'blackout_exclusions';
  
  // Pickup date configuration
  recurring_pickup_day?: number; // 0-6
  allowed_weekdays?: number[]; // Array of 0-6
  pickup_date_range_start?: string; // ISO 8601 date
  pickup_date_range_end?: string; // ISO 8601 date
  blackout_dates?: string[]; // Array of ISO 8601 dates
  
  // Slot Configuration
  slot_template?: string; // Reference to SlotTemplate.id
  custom_slot_range_start?: string; // HH:mm format
  custom_slot_range_end?: string; // HH:mm format
  interval_minutes?: number;
  capacity_per_slot?: number;
  slot_limit_mode: 'no_limit' | 'per_slot_capacity' | 'total_daily_capacity';
  total_daily_capacity?: number;
  
  // Quantity Rules
  min_quantity: number; // Default: 1
  quantity_step: number; // Default: 1
  max_quantity?: number;
  
  // Customer-Facing Content (Bilingual)
  preorder_label: {
    en: string;
    fr: string;
  };
  order_cutoff_message: {
    en: string;
    fr: string;
  };
  pickup_instruction_text: {
    en: string;
    fr: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

#### PickupLocation

```typescript
interface PickupLocation {
  id: string; // UUID
  internal_name: string;
  public_label: {
    en: string;
    fr: string;
  };
  address: string;
  pickup_instructions: {
    en: string;
    fr: string;
  };
  contact_details: string;
  active: boolean;
  sort_order: number;
  map_or_directions_link?: string;
  operational_notes_for_staff: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

#### SlotTemplate

```typescript
interface SlotTemplate {
  id: string; // UUID
  name: string;
  internal_description: string;
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  interval_minutes: number;
  default_per_slot_capacity: number;
  active: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

#### MenuWeek

```typescript
interface MenuWeek {
  id: string; // UUID
  internal_title: string;
  public_title: {
    en: string;
    fr: string;
  };
  week_label: string; // e.g., "Week of Jan 15"
  launch_date: string; // ISO 8601 date
  order_cutoff_datetime: string; // ISO 8601 datetime
  pickup_date_or_range: {
    type: 'single' | 'range';
    start_date: string; // ISO 8601 date
    end_date?: string; // ISO 8601 date (for range)
  };
  featured_products: string[]; // Array of Product.id
  menu_intro_copy: {
    en: string; // Rich text
    fr: string; // Rich text
  };
  banner_messaging: {
    en: string;
    fr: string;
  };
  status: 'active' | 'scheduled' | 'archived';
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

#### ProductAvailabilityWindow

```typescript
interface ProductAvailabilityWindow {
  id: string; // UUID
  product: string; // Reference to Product.id
  date_range_or_pickup_date: {
    type: 'range' | 'single';
    start_date: string; // ISO 8601 date
    end_date?: string; // ISO 8601 date (for range)
  };
  override_pattern?: string; // Reference to AvailabilityPattern.id
  disable_product_for_period: boolean;
  
  // Overrides
  min_quantity_override?: number;
  capacity_override?: number;
  location_restriction_override?: string[]; // Array of PickupLocation.id
  custom_cutoff_override?: string; // ISO 8601 datetime
  
  notes: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

#### Order (Extended)

```typescript
interface Order {
  id: string; // UUID
  order_number: string; // Human-readable order number
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  special_instructions?: string;
  
  // Order Items
  items: OrderItem[];
  
  // Pricing
  subtotal: number; // In cents
  tax: number; // In cents
  total: number; // In cents
  
  // Status
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  
  // Timestamps
  order_date: string; // ISO 8601 datetime
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number; // In cents
  subtotal: number; // In cents
  
  // Pickup Details
  pickup_date: string; // ISO 8601 date
  pickup_location_id: string;
  pickup_location_name: string;
  pickup_slot?: {
    start_time: string; // HH:mm
    end_time: string; // HH:mm
  };
}
```

#### SlotCapacity (Runtime State)

```typescript
interface SlotCapacity {
  date: string; // ISO 8601 date
  location_id: string;
  slot_start: string; // HH:mm
  slot_end: string; // HH:mm
  capacity: number;
  reserved: number;
  available: number;
  
  // Metadata
  last_updated: string; // ISO 8601 datetime
}
```

### API Endpoints

#### Availability Patterns

```
GET    /api/availability-patterns
POST   /api/availability-patterns
GET    /api/availability-patterns/[id]
PATCH  /api/availability-patterns/[id]
DELETE /api/availability-patterns/[id]
```

#### Pickup Locations

```
GET    /api/pickup-locations
POST   /api/pickup-locations
GET    /api/pickup-locations/[id]
PATCH  /api/pickup-locations/[id]
DELETE /api/pickup-locations/[id]
PATCH  /api/pickup-locations/reorder (for drag-and-drop)
```

#### Slot Templates

```
GET    /api/slot-templates
POST   /api/slot-templates
GET    /api/slot-templates/[id]
PATCH  /api/slot-templates/[id]
DELETE /api/slot-templates/[id]
```

#### Menu Weeks

```
GET    /api/menu-weeks
POST   /api/menu-weeks
GET    /api/menu-weeks/[id]
PATCH  /api/menu-weeks/[id]
DELETE /api/menu-weeks/[id]
GET    /api/menu-weeks/current (get active menu week)
```

#### Product Availability Windows

```
GET    /api/availability-windows
POST   /api/availability-windows
GET    /api/availability-windows/[id]
PATCH  /api/availability-windows/[id]
DELETE /api/availability-windows/[id]
GET    /api/availability-windows?product=[id] (filter by product)
```

#### Availability Calculation

```
GET    /api/products/[id]/availability
  Query params:
    - date: ISO 8601 date (optional, defaults to today)
    - location: location_id (optional)
  Response:
    {
      orderable: boolean,
      cutoff_datetime: string | null,
      pickup_dates: string[],
      locations: PickupLocation[],
      slots: SlotCapacity[],
      min_quantity: number,
      quantity_step: number,
      max_quantity: number | null,
      messages: {
        cutoff: string,
        pickup: string
      }
    }
```

#### Slot Capacity

```
GET    /api/slots/capacity
  Query params:
    - date: ISO 8601 date (required)
    - location: location_id (required)
  Response: SlotCapacity[]

POST   /api/slots/reserve
  Body:
    {
      date: string,
      location_id: string,
      slot_start: string,
      slot_end: string,
      quantity: number
    }

POST   /api/slots/release
  Body:
    {
      date: string,
      location_id: string,
      slot_start: string,
      slot_end: string,
      quantity: number
    }

PATCH  /api/slots/adjust-capacity
  Body:
    {
      date: string,
      location_id: string,
      slot_start: string,
      slot_end: string,
      new_capacity: number,
      reason: string
    }
```

#### Order Operations

```
GET    /api/orders
  Query params:
    - pickup_date: ISO 8601 date
    - pickup_location: location_id
    - status: order status
    - search: order number or customer name

GET    /api/orders/[id]

PATCH  /api/orders/[id]
  Body: { status: string }

GET    /api/orders/prep-sheet
  Query params:
    - start_date: ISO 8601 date
    - end_date: ISO 8601 date
    - location: location_id (optional)
  Response: PrepSheet data

GET    /api/orders/pickup-list
  Query params:
    - date: ISO 8601 date
    - location: location_id
  Response: PickupList data
```

### CMS UI Components

#### List Views

All list views follow the existing pattern established in `app/admin/products/page.tsx`:

- Use `TableCard.Root` and `Table` components from Untitled UI
- Implement filtering with `Select` components
- Support search functionality
- Include create/edit/delete actions
- Show loading states with spinner
- Display empty states with call-to-action

#### Editor Forms

All editor forms follow the existing pattern:

- Use `EditPageLayout` component for consistent structure
- Organize fields into logical sections with headings
- Implement bilingual fields using `TranslationFields` component
- Use appropriate input components (text, select, date, time, rich text)
- Include inline validation and error messages
- Show save/cancel actions in header

#### Specialized Components

**AvailabilityScheduler**: Visual calendar-based interface for configuring availability patterns (similar to existing `AvailabilityScheduler.tsx`)

**SlotCapacityManager**: Real-time view of slot capacity with adjustment controls

**PrepSheetGenerator**: Form for selecting date range and filters, with preview and export options

**PickupListGenerator**: Form for selecting date and location, with sortable output

### Storefront Components

#### ProductAvailabilityDisplay

Shows availability information on product detail pages:
- Orderable status indicator
- Cutoff datetime countdown
- Pickup date selector
- Location selector
- Time slot selector (if applicable)
- Quantity controls with validation

#### CartAvailabilityValidator

Validates cart contents against current availability rules:
- Checks cutoff times
- Validates quantities
- Verifies slot capacity
- Groups items by pickup date/location
- Shows warnings for expired items

#### CheckoutPickupSummary

Displays pickup details during checkout:
- Groups items by pickup date and location
- Shows pickup instructions
- Displays time slots
- Includes special instructions field

## Data Models

### Database Schema

The system uses PostgreSQL with Drizzle ORM for type-safe database access and migrations.

#### Database Setup

**Production (Vercel Postgres)**:
```typescript
// lib/db/client.ts
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

**Development (Local PostgreSQL)**:
```typescript
// lib/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/rhubarbe';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

**Docker Compose for Local Development**:
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: rhubarbe
      POSTGRES_USER: rhubarbe
      POSTGRES_PASSWORD: rhubarbe_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Schema Definition (Drizzle ORM)

```typescript
// lib/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';

// Products table (extends existing)
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Existing fields (from current system)
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  shopifyProductId: text('shopify_product_id'),
  shopifyProductHandle: text('shopify_product_handle'),
  // ... other existing fields
  
  // New availability fields
  availabilityMode: text('availability_mode', { 
    enum: ['always_available', 'scheduled', 'pattern_based', 'hidden'] 
  }).notNull().default('always_available'),
  assignedAvailabilityPattern: uuid('assigned_availability_pattern').references(() => availabilityPatterns.id),
  
  // Order rules
  defaultMinQuantity: integer('default_min_quantity').notNull().default(1),
  defaultQuantityStep: integer('default_quantity_step').notNull().default(1),
  defaultMaxQuantity: integer('default_max_quantity'),
  inventoryMode: text('inventory_mode', { enum: ['unlimited', 'tracked', 'capped'] }),
  capMode: text('cap_mode', { enum: ['per_slot', 'daily_total', 'weekly_total'] }),
  
  // Pickup rules
  defaultPickupRequired: boolean('default_pickup_required').notNull().default(false),
  defaultLocationRestriction: jsonb('default_location_restriction').$type<string[]>(),
  dateSelectionType: text('date_selection_type', { 
    enum: ['none', 'single_date', 'date_range', 'recurring_day'] 
  }).notNull().default('none'),
  slotSelectionType: text('slot_selection_type', { 
    enum: ['none', 'required', 'optional'] 
  }).notNull().default('none'),
  
  // Classification
  orderType: text('order_type', { 
    enum: ['weekly_menu', 'b2b_catering', 'signature_cake', 'special_launch'] 
  }),
  defaultLeadTimeHours: integer('default_lead_time_hours'),
  
  onlineOrderable: boolean('online_orderable').notNull().default(true),
  pickupOnly: boolean('pickup_only').notNull().default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('products_slug_idx').on(table.slug),
  availabilityModeIdx: index('products_availability_mode_idx').on(table.availabilityMode),
}));

// Availability Patterns
export const availabilityPatterns = pgTable('availability_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  patternName: text('pattern_name').notNull(),
  slug: text('slug').notNull().unique(),
  internalDescription: text('internal_description').notNull(),
  active: boolean('active').notNull().default(true),
  
  // Pattern configuration
  patternType: text('pattern_type', { 
    enum: ['recurring_weekly', 'rolling_lead_time', 'one_off_scheduled', 'manual_custom'] 
  }).notNull(),
  
  // Order timing
  orderOpenLogic: text('order_open_logic', { 
    enum: ['always_open', 'fixed_datetime', 'recurring_open_day_time', 'relative_to_pickup'] 
  }).notNull(),
  orderCloseLogic: text('order_close_logic', { 
    enum: ['fixed_datetime', 'recurring_close_day_time', 'relative_lead_time_hours', 'relative_lead_time_days'] 
  }).notNull(),
  
  // Recurring schedule
  recurringOpenDay: integer('recurring_open_day'), // 0-6
  recurringOpenTime: text('recurring_open_time'), // HH:mm
  recurringCloseDay: integer('recurring_close_day'), // 0-6
  recurringCloseTime: text('recurring_close_time'), // HH:mm
  
  // Fixed datetime
  fixedOpenDatetime: timestamp('fixed_open_datetime'),
  fixedCloseDatetime: timestamp('fixed_close_datetime'),
  
  // Lead time
  leadTimeHours: integer('lead_time_hours'),
  leadTimeDays: integer('lead_time_days'),
  
  // Pickup configuration
  pickupRequired: boolean('pickup_required').notNull().default(true),
  allowedLocations: jsonb('allowed_locations').$type<string[]>(),
  pickupDateMode: text('pickup_date_mode', { 
    enum: ['recurring_pickup_day', 'allowed_weekdays', 'date_range', 'blackout_exclusions'] 
  }).notNull(),
  
  // Pickup date configuration
  recurringPickupDay: integer('recurring_pickup_day'), // 0-6
  allowedWeekdays: jsonb('allowed_weekdays').$type<number[]>(),
  pickupDateRangeStart: timestamp('pickup_date_range_start'),
  pickupDateRangeEnd: timestamp('pickup_date_range_end'),
  blackoutDates: jsonb('blackout_dates').$type<string[]>(),
  
  // Slot configuration
  slotTemplate: uuid('slot_template').references(() => slotTemplates.id),
  customSlotRangeStart: text('custom_slot_range_start'), // HH:mm
  customSlotRangeEnd: text('custom_slot_range_end'), // HH:mm
  intervalMinutes: integer('interval_minutes'),
  capacityPerSlot: integer('capacity_per_slot'),
  slotLimitMode: text('slot_limit_mode', { 
    enum: ['no_limit', 'per_slot_capacity', 'total_daily_capacity'] 
  }).notNull().default('no_limit'),
  totalDailyCapacity: integer('total_daily_capacity'),
  
  // Quantity rules
  minQuantity: integer('min_quantity').notNull().default(1),
  quantityStep: integer('quantity_step').notNull().default(1),
  maxQuantity: integer('max_quantity'),
  
  // Bilingual content
  preorderLabel: jsonb('preorder_label').notNull().$type<{ en: string; fr: string }>(),
  orderCutoffMessage: jsonb('order_cutoff_message').notNull().$type<{ en: string; fr: string }>(),
  pickupInstructionText: jsonb('pickup_instruction_text').notNull().$type<{ en: string; fr: string }>(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('availability_patterns_slug_idx').on(table.slug),
  activeIdx: index('availability_patterns_active_idx').on(table.active),
}));

// Pickup Locations
export const pickupLocations = pgTable('pickup_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  internalName: text('internal_name').notNull(),
  publicLabel: jsonb('public_label').notNull().$type<{ en: string; fr: string }>(),
  address: text('address').notNull(),
  pickupInstructions: jsonb('pickup_instructions').notNull().$type<{ en: string; fr: string }>(),
  contactDetails: text('contact_details').notNull(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  mapOrDirectionsLink: text('map_or_directions_link'),
  operationalNotesForStaff: text('operational_notes_for_staff'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  activeIdx: index('pickup_locations_active_idx').on(table.active),
  sortOrderIdx: index('pickup_locations_sort_order_idx').on(table.sortOrder),
}));

// Slot Templates
export const slotTemplates = pgTable('slot_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  internalDescription: text('internal_description').notNull(),
  startTime: text('start_time').notNull(), // HH:mm
  endTime: text('end_time').notNull(), // HH:mm
  intervalMinutes: integer('interval_minutes').notNull(),
  defaultPerSlotCapacity: integer('default_per_slot_capacity').notNull(),
  active: boolean('active').notNull().default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  activeIdx: index('slot_templates_active_idx').on(table.active),
}));

// Menu Weeks
export const menuWeeks = pgTable('menu_weeks', {
  id: uuid('id').primaryKey().defaultRandom(),
  internalTitle: text('internal_title').notNull(),
  publicTitle: jsonb('public_title').notNull().$type<{ en: string; fr: string }>(),
  weekLabel: text('week_label').notNull(),
  launchDate: timestamp('launch_date').notNull(),
  orderCutoffDatetime: timestamp('order_cutoff_datetime').notNull(),
  pickupDateOrRange: jsonb('pickup_date_or_range').notNull().$type<{
    type: 'single' | 'range';
    startDate: string;
    endDate?: string;
  }>(),
  featuredProducts: jsonb('featured_products').notNull().$type<string[]>(),
  menuIntroCopy: jsonb('menu_intro_copy').notNull().$type<{ en: string; fr: string }>(),
  bannerMessaging: jsonb('banner_messaging').notNull().$type<{ en: string; fr: string }>(),
  status: text('status', { enum: ['active', 'scheduled', 'archived'] }).notNull().default('scheduled'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('menu_weeks_status_idx').on(table.status),
  launchDateIdx: index('menu_weeks_launch_date_idx').on(table.launchDate),
}));

// Product Availability Windows
export const productAvailabilityWindows = pgTable('product_availability_windows', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  dateRangeOrPickupDate: jsonb('date_range_or_pickup_date').notNull().$type<{
    type: 'range' | 'single';
    startDate: string;
    endDate?: string;
  }>(),
  overridePattern: uuid('override_pattern').references(() => availabilityPatterns.id),
  disableProductForPeriod: boolean('disable_product_for_period').notNull().default(false),
  
  // Overrides
  minQuantityOverride: integer('min_quantity_override'),
  capacityOverride: integer('capacity_override'),
  locationRestrictionOverride: jsonb('location_restriction_override').$type<string[]>(),
  customCutoffOverride: timestamp('custom_cutoff_override'),
  
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('product_availability_windows_product_id_idx').on(table.productId),
}));

// Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  specialInstructions: text('special_instructions'),
  
  // Pricing (in cents)
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').notNull(),
  total: integer('total').notNull(),
  
  // Status
  status: text('status', { 
    enum: ['pending', 'confirmed', 'fulfilled', 'cancelled'] 
  }).notNull().default('pending'),
  paymentStatus: text('payment_status', { 
    enum: ['pending', 'paid', 'refunded'] 
  }).notNull().default('pending'),
  
  orderDate: timestamp('order_date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orderNumberIdx: index('orders_order_number_idx').on(table.orderNumber),
  statusIdx: index('orders_status_idx').on(table.status),
  orderDateIdx: index('orders_order_date_idx').on(table.orderDate),
}));

// Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(), // In cents
  subtotal: integer('subtotal').notNull(), // In cents
  
  // Pickup details
  pickupDate: timestamp('pickup_date').notNull(),
  pickupLocationId: uuid('pickup_location_id').notNull().references(() => pickupLocations.id),
  pickupLocationName: text('pickup_location_name').notNull(),
  pickupSlot: jsonb('pickup_slot').$type<{
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }>(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
  pickupDateIdx: index('order_items_pickup_date_idx').on(table.pickupDate),
  pickupLocationIdx: index('order_items_pickup_location_id_idx').on(table.pickupLocationId),
}));

// Slot Capacity (runtime state)
export const slotCapacity = pgTable('slot_capacity', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date').notNull(),
  locationId: uuid('location_id').notNull().references(() => pickupLocations.id),
  slotStart: text('slot_start').notNull(), // HH:mm
  slotEnd: text('slot_end').notNull(), // HH:mm
  capacity: integer('capacity').notNull(),
  reserved: integer('reserved').notNull().default(0),
  
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  version: integer('version').notNull().default(1), // For optimistic locking
}, (table) => ({
  dateLocationSlotIdx: index('slot_capacity_date_location_slot_idx').on(table.date, table.locationId, table.slotStart, table.slotEnd),
  uniqueSlot: index('slot_capacity_unique_slot').on(table.date, table.locationId, table.slotStart, table.slotEnd),
}));
```

#### Migration Files

```typescript
// drizzle/migrations/0001_add_preorder_tables.sql
-- Generated by Drizzle ORM

CREATE TABLE IF NOT EXISTS "availability_patterns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pattern_name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  -- ... all other fields
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pickup_locations" (
  -- ... schema
);

-- ... other tables

-- Add indexes
CREATE INDEX "products_availability_mode_idx" ON "products" ("availability_mode");
CREATE INDEX "availability_patterns_active_idx" ON "availability_patterns" ("active");
-- ... other indexes
```

#### Migration Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations (development)
npm run db:migrate

# Apply migrations (production - automatic on deploy)
# Vercel will run migrations automatically

# Seed database (development)
npm run db:seed

# Reset database (development only)
npm run db:reset
```

### Data Relationships

```
Product (1) ──→ (0..1) AvailabilityPattern
Product (1) ──→ (0..*) ProductAvailabilityWindow
Product (0..*) ──→ (0..*) PickupLocation (via restrictions)

AvailabilityPattern (0..1) ──→ (0..1) SlotTemplate
AvailabilityPattern (0..*) ──→ (0..*) PickupLocation

MenuWeek (0..*) ──→ (0..*) Product (featured)

Order (1) ──→ (1..*) OrderItem
OrderItem (1) ──→ (1) Product
OrderItem (1) ──→ (1) PickupLocation

SlotCapacity (1) ──→ (1) PickupLocation
```

### Availability Calculation Engine

The core logic for determining product availability:

```typescript
function calculateAvailability(
  product: Product,
  requestDate: Date,
  location?: string
): AvailabilityResult {
  // 1. Check availability_mode
  if (product.availability_mode === 'hidden') {
    return { orderable: false, reason: 'hidden' };
  }
  
  if (product.availability_mode === 'always_available') {
    return {
      orderable: true,
      cutoff_datetime: null,
      pickup_dates: ['immediate'],
      locations: getAllActiveLocations(),
      // ... default rules
    };
  }
  
  // 2. Check for active ProductAvailabilityWindow
  const window = findActiveWindow(product.id, requestDate);
  if (window?.disable_product_for_period) {
    return { orderable: false, reason: 'disabled_by_window' };
  }
  
  // 3. Determine effective pattern
  const pattern = window?.override_pattern 
    ? getPattern(window.override_pattern)
    : product.assigned_availability_pattern
      ? getPattern(product.assigned_availability_pattern)
      : null;
  
  if (!pattern) {
    return { orderable: false, reason: 'no_pattern' };
  }
  
  // 4. Evaluate order timing
  const orderWindow = evaluateOrderWindow(pattern, requestDate);
  if (!orderWindow.isOpen) {
    return { orderable: false, reason: 'outside_order_window' };
  }
  
  // 5. Calculate pickup dates
  const pickupDates = calculatePickupDates(pattern, requestDate);
  
  // 6. Determine locations
  const locations = determineLocations(pattern, window, product);
  
  // 7. Calculate slots (if applicable)
  const slots = pattern.slot_template || pattern.interval_minutes
    ? calculateSlots(pattern, pickupDates, locations)
    : [];
  
  // 8. Apply quantity rules
  const quantityRules = applyQuantityRules(pattern, window, product);
  
  return {
    orderable: true,
    cutoff_datetime: orderWindow.cutoff,
    pickup_dates: pickupDates,
    locations: locations,
    slots: slots,
    ...quantityRules,
    messages: generateMessages(pattern, orderWindow)
  };
}
```

### Slot Capacity Management

Slot capacity is tracked in real-time and uses optimistic locking to prevent race conditions:

```typescript
async function reserveSlotCapacity(
  date: string,
  locationId: string,
  slotStart: string,
  slotEnd: string,
  quantity: number
): Promise<boolean> {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Read current capacity
      const capacity = await getSlotCapacity(date, locationId, slotStart, slotEnd);
      
      // Check availability
      if (capacity.available < quantity) {
        return false;
      }
      
      // Attempt to reserve (with version check)
      const updated = await updateSlotCapacity({
        ...capacity,
        reserved: capacity.reserved + quantity,
        available: capacity.available - quantity,
        last_updated: new Date().toISOString()
      }, capacity.last_updated); // Version check
      
      if (updated) {
        return true;
      }
      
      // Retry on conflict
      attempt++;
      await sleep(100 * attempt); // Exponential backoff
    } catch (error) {
      logError('Slot reservation failed', { date, locationId, slotStart, slotEnd, quantity, error });
      attempt++;
    }
  }
  
  // Failed after retries
  notifyStaff('Slot reservation failed after retries', { date, locationId, slotStart, slotEnd });
  return false;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

**Redundant Properties:**
- Requirements 11.1-11.4 duplicate requirements 3.2-3.5 (availability mode behavior)
- Multiple requirements about quantity validation (12.3, 12.4, 12.5) can be combined into one comprehensive quantity validation property
- Multiple requirements about displaying orderable product information (11.5, 11.6, 11.7, 11.8, 11.9) can be combined into one property about complete availability information display
- Cart validation (17.7) and checkout validation (18.6) both test the same underlying validation logic

**Combined Properties:**
- All quantity validation rules (min, max, step) → Single comprehensive quantity validation property
- All availability mode display rules → Single property about correct display based on mode
- All slot capacity checks → Single property about capacity enforcement
- All cutoff enforcement → Single property about cutoff validation

**Final Property Set:**
After reflection, the testable properties are organized into these categories:
1. Availability Calculation (core engine behavior)
2. Product Display Rules (storefront visibility)
3. Order Validation (cart and checkout)
4. Slot Capacity Management (concurrency and limits)
5. Data Integrity (migrations and relationships)
6. Internationalization (language switching)
7. Report Generation (prep sheets and pickup lists)

### Property 1: Product Schema Extensions

*For any* product in the system, it should support all required availability fields (availability_mode, default_min_quantity, default_quantity_step, default_pickup_required, date_selection_type, slot_selection_type, online_orderable, pickup_only) with valid values.

**Validates: Requirements 3.1, 3.6-3.19**

### Property 2: Availability Mode Display

*For any* product, the storefront display should match its availability_mode: always_available products are always shown as orderable, hidden products are never displayed, scheduled products are shown only when an active window exists, and pattern_based products are shown based on pattern evaluation.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 11.1, 11.2, 11.3, 11.4**

### Property 3: Pattern Reusability

*For any* availability pattern, multiple products should be able to reference the same pattern, and changes to the pattern should affect all referencing products.

**Validates: Requirements 1.5**

### Property 4: Pattern Type Coexistence

*For any* set of products with different pattern types (B2C weekly, B2B lead-time), all should be able to calculate availability correctly and be orderable simultaneously on the storefront.

**Validates: Requirements 1.6, 1.7**

### Property 5: Shopify Integration Preservation

*For any* product after migration, it should retain its shopifyProductId, shopifyProductHandle, and ingredient relationships.

**Validates: Requirements 1.2**

### Property 6: Complete Availability Information

*For any* orderable product, the storefront should display all applicable availability information: cutoff datetime, pickup dates, available locations, available slots (if required), minimum quantity, and quantity step.

**Validates: Requirements 11.5, 11.6, 11.7, 11.8, 11.9, 11.10**

### Property 7: Quantity Validation

*For any* product and quantity selection, the system should reject quantities that violate the product's rules: below minimum, above maximum, or not matching the quantity step.

**Validates: Requirements 12.3, 12.4, 12.5**

### Property 8: Add to Cart Validation

*For any* product and add-to-cart attempt, the system should validate that the product is currently orderable, the cutoff has not passed, the quantity is valid, the selected location is allowed, and the selected slot has capacity.

**Validates: Requirements 12.1, 12.2, 12.6, 12.7**

### Property 9: Checkout Validation

*For any* cart at checkout time, the system should revalidate all products against current availability rules and reject the order if any product is no longer orderable, displaying which products are invalid.

**Validates: Requirements 12.8, 12.9, 18.6, 18.7**

### Property 10: Fixed Cutoff Enforcement

*For any* product with fixed cutoff logic, orders should be accepted before the cutoff datetime and rejected after the cutoff datetime.

**Validates: Requirements 13.1, 13.2**

### Property 11: Lead Time Enforcement

*For any* product with lead-time logic and pickup datetime, orders should be accepted only if placed at least the required number of hours before the pickup datetime.

**Validates: Requirements 13.3, 13.4**

### Property 12: Slot Generation

*For any* pattern with generated slot logic, the system should calculate valid pickup slots based on the pattern's start time, end time, interval, and date rules.

**Validates: Requirements 13.5, 13.6**

### Property 13: Explicit Slot Usage

*For any* pattern with explicit slot logic, the system should use the stored slot definitions from the referenced SlotTemplate.

**Validates: Requirements 13.7, 13.8**

### Property 14: Slot Capacity Tracking

*For any* slot, the available capacity should equal the total capacity minus the reserved capacity, and reservations should not exceed total capacity.

**Validates: Requirements 23.1, 23.2**

### Property 15: Slot Reservation Atomicity

*For any* concurrent slot reservation attempts, the system should handle race conditions correctly using optimistic locking, ensuring capacity is never exceeded.

**Validates: Requirements 25.8**

### Property 16: Cart Pickup Grouping

*For any* cart with multiple products, items should be grouped by pickup date and location in the cart display.

**Validates: Requirements 17.6**

### Property 17: Slot Capacity Release

*For any* product removed from cart, if it had a reserved slot, the system should release the slot capacity.

**Validates: Requirements 17.8**

### Property 18: Prep Sheet Accuracy

*For any* date range and location filter, the prep sheet should display the correct total quantity needed for each product, broken down by pickup date, with all special instructions included.

**Validates: Requirements 21.5, 21.6, 21.7**

### Property 19: Pickup List Accuracy

*For any* pickup date and location, the pickup list should display all orders for that date/location, grouped by time slot, with customer names, order numbers, products, quantities, and special instructions.

**Validates: Requirements 22.4, 22.5, 22.6, 22.7, 22.8**

### Property 20: Migration Default Values

*For any* existing product after migration, it should have availability_mode set to 'always_available', online_orderable set to true, pickup_only set to false, default_min_quantity set to 1, default_quantity_step set to 1, and default_pickup_required set to false.

**Validates: Requirements 24.2, 24.3, 24.4, 24.5, 24.6, 24.7**

### Property 21: Cache Invalidation

*For any* update to an AvailabilityPattern, ProductAvailabilityWindow, or MenuWeek, the availability cache for all affected products should be invalidated.

**Validates: Requirements 25.2, 25.3, 25.4**

### Property 22: Error Fallback Behavior

*For any* availability calculation that fails, the system should log the error and fall back to displaying the product as unavailable rather than crashing.

**Validates: Requirements 26.1, 26.2**

### Property 23: Slot Capacity Retry Logic

*For any* slot capacity update that fails due to a race condition, the system should retry up to 3 times with exponential backoff before logging an error and notifying staff.

**Validates: Requirements 26.3, 26.4**

### Property 24: Language Display

*For any* customer-selected language (French or English), all preorder labels, cutoff messages, pickup instructions, and menu week content should be displayed in that language.

**Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5**

### Property 25: Translation Fallback

*For any* missing French translation, the system should fall back to displaying the English version.

**Validates: Requirements 27.10**

### Property 26: Product Filter Accuracy

*For any* applied filters (pickup date, location, availability, menu week, B2B), the storefront should display only products that match all selected filters.

**Validates: Requirements 29.1, 29.2, 29.3, 29.4, 29.5, 29.6**

## Error Handling

### Error Categories

**Validation Errors:**
- Invalid quantity selections
- Cutoff violations
- Slot capacity exceeded
- Location restrictions violated
- Pattern configuration errors

**System Errors:**
- Availability calculation failures
- Slot capacity race conditions
- Database write failures
- Cache invalidation failures

**Integration Errors:**
- Shopify sync failures
- Payment processing failures
- Email delivery failures

### Error Handling Strategy

**User-Facing Errors:**
- Display clear, actionable error messages in the user's selected language
- Provide specific information about what went wrong and how to fix it
- Maintain form state so users don't lose their input
- Log errors for debugging while showing friendly messages to users

**System Errors:**
- Log all errors with context (product ID, pattern ID, timestamp, user action)
- Implement graceful degradation (e.g., show product as unavailable if calculation fails)
- Retry transient failures (e.g., slot capacity updates) with exponential backoff
- Notify staff of critical failures (e.g., repeated slot reservation failures)

**Error Logging:**
```typescript
interface ErrorLog {
  id: string;
  timestamp: string;
  error_type: 'validation' | 'system' | 'integration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: {
    product_id?: string;
    pattern_id?: string;
    user_id?: string;
    action?: string;
    [key: string]: any;
  };
  stack_trace?: string;
}
```

### Retry Logic

**Slot Capacity Updates:**
- Max retries: 3
- Backoff: 100ms * attempt number
- On final failure: Log error, notify staff, reject operation

**Availability Calculations:**
- Max retries: 2
- Backoff: 50ms * attempt number
- On final failure: Log error, return unavailable

**Cache Invalidation:**
- Max retries: 3
- Backoff: 200ms * attempt number
- On final failure: Log error, continue (cache will expire naturally)

## Testing Strategy

### Dual Testing Approach

The preorder system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of availability calculations
- Edge cases (midnight cutoffs, timezone boundaries, leap years)
- Error conditions (missing patterns, invalid dates, null values)
- UI component rendering and interactions
- API endpoint request/response formats
- Integration points with Shopify and existing systems

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Availability calculation correctness across random products, dates, and patterns
- Quantity validation across random values
- Slot capacity management under concurrent load
- Cache invalidation across random update sequences
- Translation completeness across random content

### Property-Based Testing Configuration

**Library:** Use `fast-check` for JavaScript/TypeScript property-based testing

**Configuration:**
- Minimum 100 iterations per property test
- Seed-based reproducibility for failed tests
- Shrinking enabled to find minimal failing examples

**Test Tagging:**
Each property test must reference its design document property:
```javascript
// Feature: preorder-operations, Property 2: Availability Mode Display
test('product display matches availability mode', () => {
  fc.assert(
    fc.property(
      productGenerator(),
      dateGenerator(),
      (product, date) => {
        const display = calculateDisplay(product, date);
        return matchesAvailabilityMode(product, display);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Generators

**Product Generator:**
```javascript
const productGenerator = () => fc.record({
  id: fc.uuid(),
  availability_mode: fc.constantFrom('always_available', 'scheduled', 'pattern_based', 'hidden'),
  assigned_availability_pattern: fc.option(fc.uuid()),
  default_min_quantity: fc.integer({ min: 1, max: 10 }),
  default_quantity_step: fc.integer({ min: 1, max: 5 }),
  default_max_quantity: fc.option(fc.integer({ min: 10, max: 100 })),
  // ... other fields
});
```

**Pattern Generator:**
```javascript
const patternGenerator = () => fc.record({
  id: fc.uuid(),
  pattern_type: fc.constantFrom('recurring_weekly', 'rolling_lead_time', 'one_off_scheduled'),
  order_close_logic: fc.constantFrom('fixed_datetime', 'recurring_close_day_time', 'relative_lead_time_hours'),
  // ... other fields based on pattern_type
});
```

**Date Generator:**
```javascript
const dateGenerator = () => fc.date({
  min: new Date('2024-01-01'),
  max: new Date('2025-12-31')
});
```

### Unit Test Coverage

**Availability Calculation:**
- Test each pattern type (recurring_weekly, rolling_lead_time, one_off_scheduled, manual_custom)
- Test each order_close_logic type
- Test window overrides
- Test location restrictions
- Test slot generation
- Test edge cases (midnight cutoffs, DST transitions, leap years)

**Validation:**
- Test quantity validation (min, max, step)
- Test cutoff validation (before, at, after cutoff)
- Test slot capacity validation (available, full, over-capacity)
- Test location validation (allowed, restricted)

**Slot Capacity:**
- Test reservation (success, failure, race condition)
- Test release (success, failure)
- Test capacity adjustment (increase, decrease, with reason)
- Test concurrent updates (optimistic locking)

**Cart and Checkout:**
- Test add to cart (valid, invalid product, invalid quantity, invalid slot)
- Test cart grouping (by date, by location)
- Test checkout validation (all valid, some invalid, all invalid)
- Test slot release on removal

**Internationalization:**
- Test language switching (French, English)
- Test translation fallback (missing French → English)
- Test bilingual content display

**Migration:**
- Test default values for existing products
- Test preservation of existing fields
- Test idempotency (running migration twice)

### Integration Tests

**Order Placement Flow:**
1. Browse products → filter by availability → select product
2. Configure quantity and pickup details → add to cart
3. Review cart → proceed to checkout
4. Enter customer information → submit payment
5. Receive confirmation → verify order created

**Staff Workflow:**
1. Create availability pattern → assign to products
2. Create menu week → feature products
3. Monitor order operations view → generate prep sheet
4. Generate pickup list → mark orders fulfilled

### End-to-End Tests

**Customer Journey:**
- Complete order placement from product selection to confirmation
- Test with different product types (B2C weekly, B2B catering, always available)
- Test with different pickup configurations (location selection, slot selection)
- Test error scenarios (cutoff passed, slot full, invalid quantity)

**Staff Journey:**
- Create and configure all content types
- Assign patterns to products
- Monitor upcoming pickups
- Generate and export reports
- Adjust slot capacity
- Manage orders

### Performance Tests

**Availability Calculation:**
- Benchmark calculation time for various pattern types
- Test with large numbers of products (1000+)
- Test with complex patterns (multiple windows, many slots)
- Verify caching effectiveness

**Slot Capacity:**
- Test concurrent reservations (10+ simultaneous requests)
- Test capacity tracking under load
- Verify optimistic locking prevents over-booking

**Database Queries:**
- Test query performance for order operations view
- Test filtering and sorting performance
- Verify indexes are effective

### Test Coverage Goals

- Minimum 80% code coverage for preorder-related code
- 100% coverage of availability calculation engine
- 100% coverage of validation logic
- 100% coverage of slot capacity management
- All 26 correctness properties implemented as property-based tests
- All edge cases covered by unit tests

## Caching Strategy

### Cache Layers

**Availability Calculation Cache:**
- Key: `availability:${productId}:${date}:${locationId}`
- TTL: 60 seconds
- Invalidation: On pattern update, window update, menu week update

**Slot Capacity Cache:**
- Key: `slot:${date}:${locationId}:${slotStart}:${slotEnd}`
- TTL: 30 seconds
- Invalidation: On reservation, release, capacity adjustment

**Product List Cache:**
- Key: `products:orderable:${date}:${filters}`
- TTL: 120 seconds
- Invalidation: On any availability-related update

**Menu Week Cache:**
- Key: `menu-week:current`
- TTL: 300 seconds (5 minutes)
- Invalidation: On menu week update

### Cache Implementation

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: string;
  ttl: number;
}

class AvailabilityCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - new Date(entry.timestamp).getTime();
    if (age > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: new Date().toISOString(),
      ttl
    });
  }
  
  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

### Cache Invalidation Rules

**Pattern Update:**
- Invalidate all availability caches for products using that pattern
- Invalidate product list caches

**Window Update:**
- Invalidate availability cache for the affected product
- Invalidate product list caches

**Menu Week Update:**
- Invalidate menu week cache
- Invalidate product list caches for featured products

**Slot Reservation/Release:**
- Invalidate slot capacity cache for affected slot
- Invalidate availability cache for products using that slot

**Manual Invalidation:**
- Provide admin action to clear all caches
- Log cache invalidation events

### Cache Warming

**Preload Strategy:**
- On server start, preload slot capacity for next 7 days
- On menu week activation, preload availability for featured products
- On pattern update, recalculate availability for affected products

**Background Jobs:**
- Hourly: Refresh slot capacity for current day
- Daily: Preload slot capacity for next 7 days
- Weekly: Clean up expired cache entries

## Deployment Considerations

### Database Migration Strategy

**Phase 1: Initial Setup**

1. **Install Dependencies**:
```bash
npm install drizzle-orm @vercel/postgres postgres
npm install -D drizzle-kit
```

2. **Configure Drizzle**:
```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

3. **Environment Variables**:
```bash
# Production (Vercel)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# Development (Local)
DATABASE_URL="postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe"
```

**Phase 2: Data Migration from JSON to PostgreSQL**

```typescript
// scripts/migrate-json-to-postgres.ts
import { db } from '@/lib/db/client';
import { products, availabilityPatterns, pickupLocations } from '@/lib/db/schema';
import * as fs from 'fs';

async function migrateFromJSON() {
  console.log('Starting migration from JSON to PostgreSQL...');
  
  // 1. Migrate Products
  const productsJSON = JSON.parse(fs.readFileSync('data/products.json', 'utf-8'));
  
  for (const product of productsJSON) {
    await db.insert(products).values({
      id: product.id,
      name: product.name,
      slug: product.slug,
      shopifyProductId: product.shopifyProductId,
      shopifyProductHandle: product.shopifyProductHandle,
      
      // Set defaults for new availability fields
      availabilityMode: 'always_available',
      defaultMinQuantity: 1,
      defaultQuantityStep: 1,
      defaultPickupRequired: false,
      dateSelectionType: 'none',
      slotSelectionType: 'none',
      onlineOrderable: true,
      pickupOnly: false,
      
      // ... other existing fields
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    }).onConflictDoNothing();
  }
  
  console.log(`Migrated ${productsJSON.length} products`);
  
  // 2. Migrate other entities (if they exist in JSON)
  // ... similar migration for other content types
  
  console.log('Migration complete!');
}

// Run migration
migrateFromJSON().catch(console.error);
```

**Phase 3: Rollback Strategy**

```typescript
// scripts/rollback-to-json.ts
import { db } from '@/lib/db/client';
import { products } from '@/lib/db/schema';
import * as fs from 'fs';

async function rollbackToJSON() {
  console.log('Rolling back to JSON...');
  
  // Export all products from PostgreSQL
  const allProducts = await db.select().from(products);
  
  // Write to JSON file
  fs.writeFileSync(
    'data/products-backup.json',
    JSON.stringify(allProducts, null, 2)
  );
  
  console.log(`Backed up ${allProducts.length} products to JSON`);
}
```

**Phase 4: Automated Migration on Deploy**

```typescript
// scripts/migrate.ts
import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import { db } from '@/lib/db/client';

async function runMigrations() {
  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  
  console.log('Migrations complete!');
}

runMigrations().catch(console.error);
```

**Package.json Scripts**:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "tsx scripts/migrate.ts",
    "db:migrate-json": "tsx scripts/migrate-json-to-postgres.ts",
    "db:rollback": "tsx scripts/rollback-to-json.ts",
    "db:seed": "tsx scripts/seed.ts",
    "db:reset": "tsx scripts/reset-db.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Local Development Setup

**1. Start PostgreSQL**:
```bash
docker-compose up -d
```

**2. Run Migrations**:
```bash
npm run db:migrate
```

**3. Seed Database** (optional):
```bash
npm run db:seed
```

**4. View Database** (Drizzle Studio):
```bash
npm run db:studio
```

### Production Deployment (Vercel)

**1. Create Vercel Postgres Database**:
- Go to Vercel Dashboard → Storage → Create Database → Postgres
- Copy connection strings to environment variables

**2. Configure Build Settings**:
```json
// vercel.json
{
  "buildCommand": "npm run db:migrate && npm run build",
  "installCommand": "npm install"
}
```

**3. Automatic Migrations**:
Migrations run automatically on each deployment via the build command.

**4. Zero-Downtime Migrations**:
- Use `ALTER TABLE` with `IF NOT EXISTS` for additive changes
- Use feature flags to enable new features after schema changes
- Never drop columns in the same deployment as code changes

### Migration Best Practices

**1. Always Additive First**:
```sql
-- Good: Add column with default
ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_mode TEXT DEFAULT 'always_available';

-- Bad: Drop column immediately
ALTER TABLE products DROP COLUMN old_field; -- Do this in a separate deployment
```

**2. Use Transactions**:
```typescript
await db.transaction(async (tx) => {
  await tx.insert(products).values(newProduct);
  await tx.insert(productAvailabilityWindows).values(window);
});
```

**3. Test Migrations Locally**:
```bash
# Reset local database
npm run db:reset

# Run migrations
npm run db:migrate

# Verify schema
npm run db:studio
```

**4. Version Control Migrations**:
- Commit all migration files to git
- Never modify existing migration files
- Create new migrations for schema changes

### Feature Flags

**Gradual Rollout:**
- `ENABLE_PREORDER_SYSTEM`: Master flag for entire feature
- `ENABLE_PATTERN_BASED_AVAILABILITY`: Enable pattern-based products
- `ENABLE_SLOT_SELECTION`: Enable time slot selection
- `ENABLE_MENU_WEEKS`: Enable menu week display

**Configuration:**
```javascript
// lib/feature-flags.js
export const featureFlags = {
  ENABLE_PREORDER_SYSTEM: process.env.ENABLE_PREORDER_SYSTEM === 'true',
  ENABLE_PATTERN_BASED_AVAILABILITY: process.env.ENABLE_PATTERN_BASED_AVAILABILITY === 'true',
  ENABLE_SLOT_SELECTION: process.env.ENABLE_SLOT_SELECTION === 'true',
  ENABLE_MENU_WEEKS: process.env.ENABLE_MENU_WEEKS === 'true',
};
```

### Monitoring

**Metrics to Track:**
- Availability calculation time (p50, p95, p99)
- Slot reservation success rate
- Slot reservation retry rate
- Cache hit rate
- Order validation failure rate
- Error rate by type
- API response times

**Alerts:**
- Availability calculation time > 500ms
- Slot reservation failure rate > 5%
- Error rate > 1%
- Cache hit rate < 80%

### Performance Optimization

**Database Indexes:**
```javascript
// Conceptual indexes for JSON-based storage
// (Implementation depends on storage backend)
{
  orders: {
    indexes: ['pickup_date', 'pickup_location_id', 'status', 'order_date']
  },
  availability_windows: {
    indexes: ['product_id', 'start_date', 'end_date']
  },
  slot_capacity: {
    indexes: ['date', 'location_id']
  }
}
```

**Query Optimization:**
- Batch availability calculations for product lists
- Preload related data (patterns, locations, windows) in single query
- Use pagination for large result sets
- Implement cursor-based pagination for order operations view

**Caching Strategy:**
- Cache availability calculations for 60 seconds
- Cache slot capacity for 30 seconds
- Cache product lists for 120 seconds
- Implement cache warming for frequently accessed data

## Security Considerations

### Authentication and Authorization

**CMS Access:**
- All CMS endpoints require authentication via NextAuth
- Only authenticated staff users can access admin pages
- Session-based authentication with secure cookies

**API Endpoints:**
- Public endpoints: Product availability, menu weeks, slot capacity (read-only)
- Protected endpoints: All create/update/delete operations, order management, capacity adjustments
- Rate limiting on public endpoints to prevent abuse

### Data Validation

**Input Validation:**
- Validate all user inputs on both client and server
- Sanitize rich text content to prevent XSS
- Validate date ranges (start before end)
- Validate time ranges (start before end)
- Validate quantity values (positive integers)
- Validate references (pattern IDs, location IDs, product IDs exist)

**Business Logic Validation:**
- Prevent slot over-booking through optimistic locking
- Prevent orders after cutoff
- Prevent invalid quantity selections
- Prevent location restriction violations

### Data Privacy

**Customer Data:**
- Store minimal customer information (name, email, phone)
- Do not store payment information (handled by Shopify)
- Provide data export for customer requests
- Implement data retention policy

**Staff Data:**
- Log all configuration changes with user ID
- Log all capacity adjustments with user ID and reason
- Implement audit trail for sensitive operations

## Internationalization

### Translation Management

**Bilingual Content Fields:**
All customer-facing content supports French and English:
- Availability pattern labels and messages
- Pickup location names and instructions
- Menu week titles and descriptions
- Error messages and validation feedback

**Translation Structure:**
```typescript
interface BilingualContent {
  en: string;
  fr: string;
}
```

**Translation Validation:**
- CMS warns if French translation is missing
- System falls back to English if French is missing
- Validation prevents publishing without both translations

### Language Switching

**Storefront:**
- Language selector in header
- Persist language preference in cookie
- Apply language to all content and messages

**Email Notifications:**
- Use customer's selected language for order confirmations
- Include both languages in pickup instructions

### Date and Time Formatting

**Locale-Aware Formatting:**
- Use `Intl.DateTimeFormat` for date display
- Use `Intl.NumberFormat` for currency display
- Display times in local timezone
- Use 24-hour format for French, 12-hour for English (configurable)

## Future Enhancements

### Phase 2 Features

**Advanced Slot Management:**
- Variable capacity by slot (different capacities for different times)
- Slot templates with day-of-week variations
- Holiday and special event slot overrides

**Inventory Integration:**
- Track ingredient inventory
- Calculate production capacity based on ingredient availability
- Automatic product disabling when ingredients run low

**Customer Accounts:**
- Order history
- Saved pickup preferences
- Favorite products
- Reorder functionality

**Staff Tools:**
- Production scheduling
- Ingredient ordering suggestions
- Sales forecasting
- Customer analytics

### Phase 3 Features

**Multi-Location Support:**
- Different product availability by location
- Location-specific pricing
- Location-specific slot templates

**Subscription Orders:**
- Weekly recurring orders
- Subscription management
- Automatic billing

**Advanced Reporting:**
- Sales analytics by product, location, time
- Customer behavior analysis
- Demand forecasting
- Waste reduction insights

---

## Summary

This design document provides a comprehensive technical specification for the Preorder Operations feature. The system extends the existing Rhubarbe CMS and storefront with:

- Six new content types for managing availability, locations, slots, and menu weeks
- Product model extensions with an Availability tab
- Availability calculation engine with caching
- Storefront integration for product display, cart, and checkout
- Order operations tools for staff
- Comprehensive validation and error handling
- Property-based testing strategy
- Internationalization support

The design maintains consistency with the existing architecture, uses the established patterns for data storage and API endpoints, and provides a solid foundation for future enhancements.
