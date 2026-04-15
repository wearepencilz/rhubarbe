# Menu Admin — Menus, Orders, Prep Sheet & Pickup List

All four sections live under `/admin/menus/` with a shared tab nav. The data source is the `orders` table filtered by `orderType = 'launch'`, and the `launches` table for menu management.

**Tab navigation** (shown on `/admin/menus` and all sub-pages, hidden on individual menu edit pages):
Menus · Orders · Prep Sheet · Pickup List

---

## Menus (`/admin/menus`)

**Purpose:** Manage weekly preorder menus (called "launches" internally).

**Data source:** `GET /api/launches?status=<filter>` — filterable by status.

**Layout:** `TableCard` with status filter dropdown and "New Menu" button.

**Table columns:** Title (EN + FR) · Status · Order Window · Pickup · Products · Actions

**Status values and colors:**
| Status | Badge color |
|---|---|
| active | green |
| draft | amber |
| archived | gray |

**Order Window column:** Shows `Opens [date time]` / `Closes [date time]` as two stacked lines.

**Pickup column:** Shows single date (`pickupDate`) or a date range (`pickupWindowStart – pickupWindowEnd`) when a window is configured.

**Row actions (inline, stop propagation):**
- **Edit** (pencil) → `/admin/menus/[id]`
- **Duplicate** → `POST /api/launches/[id]/duplicate` → creates a draft copy, navigates to new menu
- **Archive** (trash) → confirmation modal → `DELETE /api/launches/[id]` → sets status to archived

**Row click:** navigates to `/admin/menus/[id]`

---

## Orders (`/admin/menus/orders`)

**Purpose:** Full list of all menu/launch orders with search.

**Data source:** `GET /api/orders?orderType=launch` — all launch orders regardless of status.

**Table columns:** Order # · Customer · Order Date · Pickup Date · Qty · Total · Status badge

Note: uses `pickupDate` (not `fulfillmentDate`) — menu orders are tied to a specific launch pickup date, not a customer-chosen fulfillment date.

**Status colors:** same as cake and catering (confirmed=green, pending=amber, fulfilled=blue, cancelled=red).

**Interactions:**
- Search filters by order number or customer name (client-side)
- Clicking a row navigates to `/admin/orders/[id]`

---

## Prep Sheet (`/admin/menus/prep-sheet`)

**Purpose:** Print-ready production summary grouped by menu (launch), not by date. Tells the kitchen what to prepare per menu and flags special instructions.

**Data source:** `GET /api/orders/upcoming?orderType=launch`

**Key difference from cake/catering:** grouped by **menu title** (`launchTitle`), not by fulfillment date. Each menu is its own section since a launch has a fixed pickup date.

**Layout:** One section per menu, sorted by fulfillment date ascending.

Each menu section has:

**Section header:** `{menuTitle} — {pickupDate} · {N} orders`

**Print button** per menu section (not a single global print).

**1. Production summary table**
Aggregates all items across orders for that menu:
| Product | Total Qty |
|---|---|
| Pistachio Soft Serve | 24 |
| Chocolate Dip | 18 |

Products sorted alphabetically. Qty in large bold monospace. Shows "No orders for this menu yet" when empty.

**2. Order Notes table** *(only rendered if at least one order has `specialInstructions`)*
| Order | Customer | Items | Notes |
|---|---|---|---|

Notes displayed as plain gray text. No allergen field — menu orders don't have a separate allergen note.

---

## Pickup List (`/admin/menus/pickup-list`)

**Purpose:** Day-of checklist for staff to mark menu orders as fulfilled. Has QR scan mode for fast fulfillment.

**Data source:** `GET /api/orders/upcoming?orderType=launch`

**Key difference from cake/catering:** grouped by **menu**, then sub-grouped by **pickup slot** within each menu. This reflects the time-slot structure of weekly launches.

**Layout:**
- Progress bar + fulfill count at top
- **Scan QR** toggle button
- One section per menu → one sub-section per pickup slot

**Grouping logic:**
1. Orders grouped by `launchTitle`
2. Within each menu, grouped by `items[0].pickupSlot` (`startTime – endTime`)
3. Orders with no slot grouped under "No slot"
4. Menus sorted by fulfillment date; slots sorted alphabetically by time string

**Table columns per slot:** Order # · Customer · Items · Status · Action

**QR Scan Mode:**
- Toggle button activates a full-width text input that auto-focuses
- On Enter, parses the scanned value in three ways:
  1. URL pattern: extracts UUID from `/orders/[uuid]`
  2. Order number pattern: matches `#1234` or `1234`
  3. Raw UUID: direct ID match
- If found and not fulfilled → calls `fulfillOrder()` immediately
- If already fulfilled → shows error toast "Already fulfilled"
- If not found → shows error toast "No order matching…"
- Input clears after each scan

**Fulfill button:** `PATCH /api/orders/[id]` `{ status: 'fulfilled' }`, updates row in place, shows checkmark.

**Row styling:** fulfilled = green tint, cancelled = dimmed.

---

## Shared Data Patterns

| Concern | Source |
|---|---|
| Menu list | `GET /api/launches?status=<filter>` |
| Create menu | `GET /admin/menus/create` |
| Edit menu | `GET /admin/menus/[id]` |
| Duplicate menu | `POST /api/launches/[id]/duplicate` |
| Archive menu | `DELETE /api/launches/[id]` |
| Order list | `GET /api/orders?orderType=launch` |
| Upcoming orders | `GET /api/orders/upcoming?orderType=launch` |
| Fulfill an order | `PATCH /api/orders/[id]` `{ status: 'fulfilled' }` |

---

## Differences from Cake and Catering Admin

| Concern | Menu | Cake | Catering |
|---|---|---|---|
| Has a menu management tab | Yes (Menus tab) | No | No |
| Orders page date field | `pickupDate` (launch-fixed) | `fulfillmentDate` | `fulfillmentDate` |
| Prep sheet grouping | By menu (launch title) | By fulfillment date | By fulfillment date |
| Prep sheet print | Per menu section | Single global button | Single global button |
| Prep sheet notes | `specialInstructions` only | Event type + people count | Allergen notes + special instructions |
| Pickup list grouping | Menu → pickup slot | Date only | Date only |
| Pickup list QR scan | Yes | No | No |
| Settings page | No | Yes (location + maxCakes) | Yes (location + per-type rules) |
| Production timeline | No | Yes (Gantt on orders page) | No |
