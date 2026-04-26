# Cake Admin — Products, Orders, Prep Sheet, Pickup List, Email Template & Settings

Six sections live under `/admin/cake-products/` with a shared tab nav.

**Tab navigation:** Products · Orders · Prep Sheet · Pickup List · Settings

The root page (`/admin/cake-products`) is the **Products** list. Orders and operational views are on sub-tabs.

---

## Products (`/admin/cake-products`)

**Purpose:** Manage all cake products — grouped by type (Cakes, Tasting, Add-Ons).

**Data source:** `GET /api/cake-products` — returns all cake-enabled products.

**Layout:** Grouped `TableCard` sections by product type, with "Import from Shopify" and "Create Cake Product" buttons.

**Table columns per group:** Product (image + name) · Min People · Tiers · Status badge · Edit action

**Groups:** Cakes (cake-xxl, sheet-cake, wedding-cake-tiered, croquembouche) · Tasting (wedding-cake-tasting) · Add-Ons (cake-addon) · Uncategorized (null type)

**Interactions:**
- Clicking a row navigates to `/admin/cake-products/[id]` (edit page)
- "Import from Shopify" opens a multi-select Shopify product picker
- "Create Cake Product" navigates to `/admin/cake-products/create`

---

## Orders (`/admin/cake-products/orders`)

**Purpose:** Full list of all cake orders with search and status filtering.

**Data source:** `GET /api/orders?orderType=cake` — returns all cake orders regardless of status.

**Layout:**
- Top: `CakeProductionTimeline` Gantt chart (see below)
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

### Production Timeline

Embedded at the top of the orders page. SVG Gantt chart showing all active (non-cancelled, non-fulfilled) cake orders as horizontal production windows.

- **X axis:** days, month-by-month view with ±7 day overflow padding
- **Each order:** a line from `fulfillmentDate − leadTimeDays` (prep start) to `fulfillmentDate` (delivery dot)
- **Row packing:** orders are packed into non-overlapping rows sorted by delivery date
- **Capacity bar:** colored rectangles at the bottom showing concurrent production load per day
  - Gray = has orders, below limit
  - Amber = one below `maxCakes`
  - Red = at or over `maxCakes`
- **Tooltip on hover:** order number, customer, people count, event type, delivery date, prep window
- **Click:** navigates to `/admin/orders/[id]`
- **Navigation:** prev month / today / next month buttons

---

## Prep Sheet (`/admin/cake-products/prep-sheet`)

**Purpose:** Print-ready production summary grouped by fulfillment date. Tells the kitchen what to make and for whom.

**Data source:** `GET /api/orders/upcoming?orderType=cake` — upcoming orders only (not fulfilled/cancelled).

**Layout:** One section per fulfillment date, sorted ascending.

Each date section has two tables:

**1. Production summary table**
Aggregates all items across orders for that date:
| Product | Total Qty |
|---|---|
| Wedding Cake Tiered | 2 |
| Croquembouche | 1 |

Products sorted alphabetically. Qty displayed in large bold monospace.

**2. Order details table**
One row per order:
| Order | Customer | Items | Event | # People |
|---|---|---|---|---|

- Items: `2× Wedding Cake Tiered, 1× Sheet Cake`
- Event and # People parsed from `specialInstructions` via `parseCakeMetadata()`

**Actions:** Print button (`window.print()`) in top-right corner.

---

## Pickup List (`/admin/cake-products/pickup-list`)

**Purpose:** Day-of checklist for staff to mark orders as fulfilled at pickup.

**Data source:** `GET /api/orders/upcoming?orderType=cake` — same as prep sheet.

**Layout:** Progress bar at top (`X/Y fulfilled`), then one section per fulfillment date.

Each date section has a table:
| Order | Customer | Items | Details | Status | Action |
|---|---|---|---|---|---|

- **Details:** event type + people count (e.g. `Birthday · 30 ppl`), parsed from `specialInstructions`
- **Status badge:** confirmed (green) / pending (amber) / fulfilled (green) / cancelled (red)
- **Row styling:** fulfilled rows get a green tint; cancelled rows are dimmed
- **Fulfill button:** PATCH `/api/orders/[id]` with `{ status: 'fulfilled' }`, updates row in place, shows checkmark on success

---

## Settings (`/admin/cake-products/settings`)

**Purpose:** Configure the global pickup location and production capacity limit for all cake orders.

**Data sources:**
- `GET /api/pickup-locations?active=true` — list of active pickup locations
- `GET /api/settings` — reads `cakePickupLocationId` and `cakeCapacity.maxCakes`

**Save:** `PUT /api/settings` with the full settings object merged with updated values.

### Pickup Location

Dropdown of all active pickup locations. The selected location is used for all cake orders.

Disabled pickup days are **read-only** here — they're shown as red badges pulled from the selected location's `disabledPickupDays` array. To change them, follow the link to the pickup location editor.

### Production Capacity

**Max simultaneous cakes** (`cakeCapacity.maxCakes`, default: 7)

Controls how many cakes can be in production at the same time. A date is blocked on the storefront when accepting a new order would push the concurrent production count on any day within that order's window to or above this number.

The overlap window logic: for a candidate order with pickup date D and lead time L, the production window is `[D − L, D]`. An existing order with pickup date E and lead time E_L overlaps when `E >= D − L AND E − E_L <= D`. This check runs client-side (date picker) and server-side (checkout re-check, returns 409).

Lead time is set per product in the product editor — not here.

---

## Shared Data Patterns

| Concern | Source |
|---|---|
| Product list | `GET /api/cake-products` |
| Order list | `GET /api/orders?orderType=cake` |
| Upcoming orders | `GET /api/orders/upcoming?orderType=cake` |
| Fulfill an order | `PATCH /api/orders/[id]` `{ status: 'fulfilled' }` |
| Capacity settings | `GET/PUT /api/settings` → `cakeCapacity.maxCakes` |
| Pickup location | `GET/PUT /api/settings` → `cakePickupLocationId` |
| Event/people metadata | Parsed from `order.specialInstructions` via `parseCakeMetadata()` in `lib/utils/parse-cake-metadata.ts` |

---

## Email Template (`/admin/cake-products/email-template`)

**Purpose:** Edit the bilingual (EN/FR) confirmation email sent to customers after a cake order is paid.

**Template key:** `cake-order-confirmation`

**Available variables:** `{{orderNumber}}`, `{{customerName}}`, `{{pickupDate}}`, `{{numberOfPeople}}`, `{{eventType}}`, `{{variantBreakdown}}`, `{{specialInstructions}}`, `{{totalQuantity}}`

Uses `TranslationFields` for bilingual subject/body editing with `AdminLocaleSwitcher`.

---

## Allergen Consolidation

Allergens are consolidated from two levels: **product-level** (base allergens, always present) and **flavour-level** (per selected flavour). The UI shows the union of both. For multi-select products (tasting, croquembouche), all selected flavour allergens are merged with the product base.

---

## Server-Side Validations (Checkout)

`POST /api/checkout/cake` performs these server-side checks before creating a Shopify cart:

1. **Sunday blocking** — returns 400 if pickup date falls on a Sunday
2. **Lead time** — resolves lead time from `cake_lead_time_tiers` based on resolved size; returns 400 if pickup date is too soon
3. **Max advance days** — reads `maxAdvanceDays` from the product; returns 400 if pickup date exceeds the limit
4. **Production capacity** — re-checks concurrent production count against `maxCakes`; returns 409 if capacity exceeded
