# Catering Admin — Products, Orders, Prep Sheet, Pickup List, Email Template & Settings

Six sections live under `/admin/volume-products/` with a shared tab nav.

**Tab navigation:** Products · Orders · Prep Sheet · Pickup List · Settings

---

## Orders (`/admin/volume-products/orders`)

**Purpose:** Full list of all catering orders with search and status filtering.

**Data source:** `GET /api/orders?orderType=volume` — returns all volume orders regardless of status.

**Layout:**
- Top: `CateringProductionTimeline` — a 35-day heatmap centred on the current week, showing order density per day. Supports week navigation (prev/next) and clicking a day to filter the table below.
- Below: `TableCard` with search input

**Table columns:** Order # · Customer · Order Date · Fulfillment Date · Qty · Total · Status badge

**Status colors:**
| Status | Badge color |
|---|---|
| confirmed | green |
| pending | amber |
| fulfilled | blue |
| cancelled | red |

**Interactions:**
- Search filters by order number or customer name (client-side)
- Clicking a row navigates to `/admin/orders/[id]`

---

## Prep Sheet (`/admin/volume-products/prep-sheet`)

**Purpose:** Print-ready production summary grouped by fulfillment date. Tells the kitchen what to prepare and flags allergen/special instruction notes.

**Data source:** `GET /api/orders/upcoming?orderType=volume` — upcoming orders only (not fulfilled/cancelled).

**Layout:** One section per fulfillment date, sorted ascending.

Each date section has:

**1. Production summary table**
Aggregates all items across orders for that date:
| Product | Total Qty |
|---|---|
| Brunch Platter | 48 |
| Vegetarian Option | 12 |

Products sorted alphabetically. Qty in large bold monospace.

**2. Order Notes & Allergens table** *(only rendered if at least one order has notes)*
Shows only orders that have `specialInstructions` or `allergenNotes` set:
| Order | Customer | Items | Notes |
|---|---|---|---|

- Allergen notes displayed as a red-tinted badge inline
- Special instructions displayed as plain gray text alongside
- Orders with no notes are omitted from this table entirely

**Key difference from cake prep sheet:** catering shows allergen notes prominently (order-level field) instead of event type / people count.

**Actions:** Print button (`window.print()`) in top-right corner.

---

## Pickup List (`/admin/volume-products/pickup-list`)

**Purpose:** Day-of checklist for staff to mark catering orders as fulfilled.

**Data source:** `GET /api/orders/upcoming?orderType=volume` — same as prep sheet.

**Layout:** Progress bar at top (`X/Y fulfilled`), then one section per fulfillment date.

Each date section has a table:
| Order | Customer | Items | Status | Action |
|---|---|---|---|---|

- **Allergen notes:** displayed as a red sub-line directly under the customer name (not a separate column)
- **Row styling:** fulfilled rows get a green tint; cancelled rows are dimmed
- **Fulfill button:** `PATCH /api/orders/[id]` with `{ status: 'fulfilled' }`, updates row in place, shows checkmark on success

**Key difference from cake pickup list:** no "Details" column (no event type / people count). Allergen note is surfaced under the customer name instead.

---

## Settings (`/admin/volume-products/settings`)

**Purpose:** Configure the global pickup location, delivery threshold, and per-type ordering rules and lead times for all catering orders.

**Data sources:**
- `GET /api/pickup-locations?active=true` — list of active pickup locations
- `GET /api/settings` — reads `cateringPickupLocationId`, `cateringTypeSettings`, `deliveryMinForAnyday`

**Save:** `PUT /api/settings` with the full settings object merged with updated values.

### Pickup Location

Dropdown of all active pickup locations. The selected location is used for all catering orders.

Disabled pickup days are **read-only** here — shown as red badges from the location's `disabledPickupDays`. Edit them on the pickup location page.

### Delivery

**Minimum for any-day delivery** (`deliveryMinForAnyday`, stored in cents, displayed in dollars)

When the cart total meets or exceeds this threshold, all days become available — the closed days from the pickup location are unblocked. Useful for large orders that justify delivery on any day.

### Per-Type Ordering Rules

Three sections, one per catering type: **Buffet (brunch)**, **Lunch**, **Dînatoire**.

Each type has independently configurable:

**Scope** — toggle between:
- `Per Variant`: each variant's quantity must independently meet the minimum and increment rules
- `Per Order`: the total quantity across all variants must meet the minimum and increment rules

**Order Minimum** — active when scope is `Per Order`. Minimum total quantity across all variants.

**Variant Minimum** — active when scope is `Per Variant`. Minimum quantity per individual variant (0 = not ordered, or ≥ minimum).

**Increment** — quantity step after the minimum. Validation: `(qty − minimum) % increment === 0`.

**Unit Label** — `quantity` or `people`. Controls the label shown on the quantity selector on the storefront.

**Lead Time Tiers** — inline tier editor. Each tier: `minQuantity` + `leadTimeDays`. Resolution: largest `minQuantity ≤ total cart quantity` → that tier's lead days. Earliest available date = today + max lead time across all cart items.

**Max Advance Booking** — optional cap in days. Limits how far ahead a customer can book. Null = no limit.

**Defaults (before any admin customisation):**
| Type | Scope | Min | Variant Min | Increment |
|---|---|---|---|---|
| brunch | variant | — | 12 | 6 |
| lunch | order | 6 | — | 1 |
| dinatoire | order | 3 | — | 1 |

---

## Shared Data Patterns

| Concern | Source |
|---|---|
| Order list | `GET /api/orders?orderType=volume` |
| Upcoming orders | `GET /api/orders/upcoming?orderType=volume` |
| Fulfill an order | `PATCH /api/orders/[id]` `{ status: 'fulfilled' }` |
| Pickup location | `GET/PUT /api/settings` → `cateringPickupLocationId` |
| Ordering rules | `GET/PUT /api/settings` → `cateringTypeSettings` (keyed by type) |
| Delivery threshold | `GET/PUT /api/settings` → `deliveryMinForAnyday` (cents) |
| Ordering rule logic | `lib/catering/ordering-rules.ts` |
| Lead time logic | `lib/catering/lead-time.ts` |

---

## Email Template (`/admin/volume-products/email-template`)

**Purpose:** Edit the bilingual (EN/FR) confirmation email sent to customers after a catering order is paid.

**Template key:** `volume-order-confirmation`

**Available variables:** `{{orderNumber}}`, `{{customerName}}`, `{{fulfillmentDate}}`, `{{fulfillmentTime}}`, `{{variantBreakdown}}`, `{{allergenNote}}`, `{{totalQuantity}}`

Uses `TranslationFields` for bilingual subject/body editing with `AdminLocaleSwitcher`.

---

## Dietary Filter Logic

The storefront dietary filter uses **AND logic**: a product must match **all** selected dietary tags to appear. For example, selecting both "vegetarian" and "gluten-free" shows only products tagged with both.

---

## Server-Side Lead Time Validation

`POST /api/checkout/volume` validates lead time server-side: for each cart item, it resolves the applicable lead time tier based on quantity and returns 400 if the fulfillment date is too soon.

## Differences from Cake Admin

| Concern | Cake | Catering |
|---|---|---|
| Orders page | Includes production timeline Gantt | Includes 35-day production heatmap |
| Prep sheet notes | Event type + # people (parsed from `specialInstructions`) | Allergen notes + special instructions (separate DB fields) |
| Pickup list details | Event type + people count column | Allergen note under customer name |
| Settings: capacity | `maxCakes` production limit with overlap window | No capacity concept |
| Settings: ordering rules | Per-product lead time tiers only | Per-type scope, minimum, increment, lead time tiers, advance cap |
| Settings: delivery | No delivery threshold | `deliveryMinForAnyday` unlocks all days |
