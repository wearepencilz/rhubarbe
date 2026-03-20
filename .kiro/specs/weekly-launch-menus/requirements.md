# Requirements: Weekly Launch Menus

## Introduction

This feature simplifies the Rhubarbe preorder system into a single operational object: the Launch (also called Menu). A Launch is the central entity that staff create each week to define what's available, when orders close, when pickup happens, and which time slots are offered.

The goal is a repeatable weekly workflow: duplicate last week's menu, update dates, confirm products, regenerate slots, publish.

## Glossary

- **Launch / Menu**: The central operational object containing all weekly preorder configuration
- **Pickup Location**: A physical location where customers collect orders (kept from existing system)
- **Pickup Slot**: A time window within a Launch for customer pickup, generated from start/end time + interval
- **Menu Product**: A product linked to a specific Launch, with optional per-menu overrides
- **Product**: The existing Shopify-linked sellable item (unchanged)

## Requirements

### Requirement 1: Launch as Central Object

**User Story:** As a staff member, I want a single "Launch" object that contains all the information needed to run a weekly preorder, so I don't have to configure multiple separate entities.

#### Acceptance Criteria

1. A Launch SHALL contain: title (EN/FR), intro copy (EN/FR), and status (draft/active/archived)
2. A Launch SHALL contain an ordering window: order open datetime and order close datetime
3. A Launch SHALL contain pickup configuration: pickup date, pickup location reference, pickup instructions (EN/FR)
4. A Launch SHALL contain pickup slot configuration: start time, end time, interval minutes, and optional capacity per slot
5. A Launch SHALL contain a list of linked products with sort order and optional per-menu overrides
6. A Launch SHALL have created/updated timestamps

### Requirement 2: Pickup Slot Generation

**User Story:** As a staff member, I want to generate pickup slots from a time range and interval, so I don't have to manually create each slot.

#### Acceptance Criteria

1. The Launch editor SHALL provide a "Generate Slots" button that creates slots from start time, end time, and interval
2. Generated slots SHALL be stored as a JSON array on the Launch record
3. Staff SHALL be able to manually edit individual slot times after generation
4. Staff SHALL be able to set an optional capacity per slot
5. Staff SHALL be able to add or remove individual slots after generation
6. Regenerating slots SHALL warn if existing slots will be replaced

### Requirement 3: Menu Products

**User Story:** As a staff member, I want to link existing products to a Launch and optionally override their settings per-menu.

#### Acceptance Criteria

1. Staff SHALL be able to add existing products to a Launch via a product picker
2. Staff SHALL be able to reorder products within a Launch via drag-and-drop
3. Staff SHALL be able to remove products from a Launch
4. Staff SHALL be able to set per-menu overrides: min quantity, max quantity, quantity step
5. Products not linked to any active Launch SHALL not appear as orderable on the storefront
6. The product picker SHALL show product name and current availability status

### Requirement 4: Duplicate Previous Menu

**User Story:** As a staff member, I want to duplicate a previous Launch to quickly set up next week's menu.

#### Acceptance Criteria

1. The Launch list view SHALL provide a "Duplicate" action on each Launch
2. Duplicating SHALL copy: linked products (with overrides), pickup location, pickup instructions, slot configuration (start/end/interval), intro copy, banner messaging
3. Duplicating SHALL NOT copy: dates (order open, order close, pickup date), status (defaults to draft), generated slots
4. After duplication, the editor SHALL open with the new draft Launch
5. The duplicated Launch title SHALL be prefixed with "Copy of "

### Requirement 5: Launch List View

**User Story:** As a staff member, I want to see all Launches in a list with key information at a glance.

#### Acceptance Criteria

1. The list SHALL display columns: title, status, order close date, pickup date, product count
2. The list SHALL support filtering by status (draft/active/archived)
3. The list SHALL support search by title
4. The list SHALL be sorted by pickup date descending (newest first)
5. The list SHALL provide actions: edit, duplicate, archive

### Requirement 6: Launch Editor Sections

**User Story:** As a staff member, I want the Launch editor organized into clear sections that match my operational workflow.

#### Acceptance Criteria

1. Section 1 "Menu Details": title EN/FR, intro copy EN/FR, status
2. Section 2 "Ordering Window": order opens datetime, order closes datetime
3. Section 3 "Pickup": pickup date, pickup location (select from existing), pickup instructions EN/FR
4. Section 4 "Pickup Slots": start time, end time, interval, generate button, slot list with optional capacity, manual add/edit/remove
5. Section 5 "Products in this Menu": product picker, drag-to-reorder, per-menu overrides (min qty, max qty, step)

### Requirement 7: Storefront Display

**User Story:** As a customer, I want to see the current week's menu with available products and pickup information.

#### Acceptance Criteria

1. The storefront SHALL display the currently active Launch on the homepage and order page
2. The storefront SHALL show a countdown to the order close datetime
3. The storefront SHALL display only products linked to the active Launch as orderable
4. The storefront SHALL show available pickup slots for the active Launch
5. When no Launch is active, the storefront SHALL show a "no current menu" message

### Requirement 8: Simplification — Entities to Remove

**User Story:** As a developer, I want to remove the over-engineered preorder entities that are replaced by the Launch model.

#### Acceptance Criteria

1. The Availability Patterns entity SHALL be removed (admin pages, API routes, schema)
2. The Slot Templates entity SHALL be removed (admin pages, API routes, schema)
3. The Availability Windows entity SHALL be removed (admin pages, API routes, schema)
4. The product availability fields SHALL be simplified: remove availability_mode, assigned_availability_pattern, inventory_mode, cap_mode, date_selection_type, slot_selection_type, order_type, default_lead_time_hours
5. The product model SHALL retain: online_orderable, pickup_only, default_min_quantity, default_quantity_step, default_max_quantity, default_pickup_required
6. The sidebar "Preorder Config" section SHALL be removed entirely
7. The "Menu Weeks" sidebar item SHALL be renamed to "Menus" (or "Launches")

### Requirement 9: Pickup Locations (Keep)

**User Story:** As a staff member, I want to continue managing pickup locations as a standalone entity since they're shared across menus.

#### Acceptance Criteria

1. Pickup Locations SHALL remain as a standalone CMS entity
2. Pickup Locations SHALL be selectable from within the Launch editor
3. The Pickup Locations admin page SHALL move from "Preorder Config" to the "Commerce" sidebar section
