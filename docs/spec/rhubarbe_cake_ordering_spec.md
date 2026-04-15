# Cake Ordering — Comprehensive Spec
**Rhubarbe · Pencilz**
*April 2026 · v3*

---

## Overview

Three entry points, distinct intents.

| Category | Who it's for | How it resolves |
|---|---|---|
| Cakes | Anyone ordering large format, wedding, sheet, or croquembouche | Full self-serve checkout |
| Cake Tasting | Couples or event planners vetting wedding flavours | Booking, up to 3 flavours, consumes a production slot |
| Custom Cakes | Events outside the standard product range | Inquiry form, manual follow-up |

All cake orders use a single pickup location: **Rhubarbe, 1320 rue Charlevoix**. Sundays are disabled globally at the location level.

---

## 1. Product Types

| `cakeProductType` | Flavour Select | Size Input | Notes |
|---|---|---|---|
| `cake-xxl` | Single-select | Guest count | Large format celebration cake |
| `wedding-cake-tiered` | Single-select | Guest count | Sheet cake add-on available |
| `croquembouche` | Multi-select (max N) | Guest count × 3 for choux | Standardised flavour list |
| `wedding-cake-tasting` | Multi-select (max 3) | None | Consumes 1 production slot |
| `sheet-cake` | Single-select | Guest count | Add-on only, not sold standalone |
| `null` (legacy) | None | Guest count | Pricing tiers only, no flavour grid |

---

## 2. Pricing

### Grid-Based Products

Pricing is built at runtime from Shopify variants — not stored in the CMS. Each variant maps to a **flavour + size combination**. Price and lead time belong to the pairing, not to size alone.

Example:
```
Zucchini / 30 people  →  $500  ·  lead time: 7 days
Zucchini / 50 people  →  $550  ·  lead time: 14 days  ·  delivery only
Lemon / 30 people     →  $480  ·  lead time: 7 days
Lemon / 50 people     →  $530  ·  lead time: 14 days  ·  delivery only
```

Variant resolution: exact match on both `sizeValue` AND `flavourHandle`. If no matching variant exists, price is null and checkout is blocked.

**Size resolution:** customer enters a guest count. The system finds the largest available `sizeValue ≤ input`. For croquembouche, guest count is multiplied by 3 before lookup (choux per guest).

### Legacy Products (`cakeProductType = null`)

Pricing tiers table — one row per headcount threshold. Resolution: largest `minPeople ≤ input`. No flavour selection.

---

## 3. Flavour Configuration

Stored per product as a JSON array. Each flavour entry:

```
{
  handle, 
  label: { en, fr },
  description,
  sortOrder,
  active,         // false = hidden regardless of date
  endDate,        // last day ingredient is available
  allergens[]     // dairy | egg | gluten | tree-nuts | peanuts | sesame | soy | fish
}
```

**Selection modes:**
- Single-select dropdown: large format, wedding, sheet cake — auto-selects first available flavour as default
- Multi-select chips: croquembouche (max N), tasting (max 3) — **no flavour pre-selected by default; user picks freely up to the max**

**Croquembouche:** uses a standardised flavour list shared across all croquembouche products. No flavour-specific variant differences between products.

---

## 4. Allergen Display

Allergens are defined at two levels: product level (base allergens present regardless of flavour) and flavour level (allergens specific to that flavour selection). Because a flavour can both add and override allergens — a hazelnut flavour adds tree-nuts, a gluten-free flavour removes gluten from the base set — the display must reflect the current configuration.

**Rule:** Show a single consolidated allergen block. Derive it as the union of product-level allergens and the currently selected flavour's allergens. Where a flavour explicitly overrides a product-level allergen (e.g. gluten-free), the variant-level value takes precedence. Update the block live on flavour change.

Example — wedding cake (base: gluten, egg):
- Zucchini selected → **gluten, egg**
- Hazelnut selected → **gluten, egg, tree-nuts**
- Gluten-free lemon selected → **egg**

For multi-select (tasting, croquembouche), the block shows the union of all selected flavour allergens merged with the product base.

One block. Not repeated at every step.

---

## 5. Lead Time

Stored per product in `cake_lead_time_tiers`. Each tier:

| `minPeople` | `leadTimeDays` | `deliveryOnly` |
|---|---|---|
| 1 | 7 | false |
| 50 | 14 | true |

**Resolution:** largest `minPeople ≤ resolved size value` → use that tier's `leadTimeDays` and `deliveryOnly` flag.

For grid products, the resolved size (not raw guest input) is used for tier lookup. `deliveryOnly = true` disables the pickup option for that configuration.

---

## 6. Production Capacity

**Global setting:** `maxCakes = 7` (configurable in admin).

A date is blocked when accepting a new order would push the concurrent production count on any day within that order's window to or above `maxCakes`.

**Overlap logic:** for a candidate order with pickup date D and lead time L, the production window is `[D - L, D]`. An existing order with pickup date E and lead time E_L has window `[E - E_L, E]`. These two windows overlap when:

```
E >= D - L  AND  E - E_L <= D
```

If the count of overlapping existing orders `>= maxCakes`, date D is blocked.

This check runs:
1. Client-side when the customer opens the date picker (to grey out unavailable dates)
2. Server-side at checkout as a re-check (returns 409 if capacity exceeded between calendar load and submission)

**Wedding + sheet cake:** treated as a single cake against the capacity limit. One production slot, one lead time. Not two.

**Cake tasting:** consumes one production slot. Subject to the same capacity check as a full cake order.

---

## 7. Date Rules — Full Specification

This section is the authoritative reference for date logic. All of these conditions must be tested explicitly.

### 7.1 Earliest Available Date

```
earliestDate = today + leadTimeDays
```

Lead time is resolved from the flavour + size variant (or lead time tier for legacy). The calendar must not allow selection of any date before this.

**If size has not yet been selected**, use the shortest lead time available for that product type to pre-filter flavours (see 7.3). The calendar is not shown until both flavour and size are confirmed.

### 7.2 Latest Available Date

```
latestDate = today + maxAdvanceBookingDays
```

Default: **365 days**. Configurable per product — e.g. wedding cakes may be set to 180 days. The calendar must not allow selection beyond this date.

### 7.3 Flavour End Date Filtering

A flavour with an `endDate` must be hidden if the earliest possible pickup date for the current configuration falls after that date.

```
if (today + leadTimeDays > flavour.endDate) → hide flavour
```

This is stricter than checking `endDate < today`. A flavour that expires in 5 days is unavailable if lead time is 7 days — even though the end date hasn't passed yet.

**Before size is selected:** filter flavours against the shortest lead time available for that product. This prevents showing a flavour that will become unavailable once size is chosen.

**After size is selected:** re-filter against the resolved lead time for that size. Flavours that no longer qualify are removed. If the previously selected flavour is removed, the selection is cleared and the customer is prompted to re-select.

### 7.4 Capacity Blocking

Dates where concurrent production would reach or exceed `maxCakes` are blocked. See section 6 for overlap logic.

### 7.5 Sunday Blocking

Sundays are disabled at the pickup location level. No cake order — regardless of type — can have a Sunday pickup or delivery date.

### 7.6 Combined Blocking Logic

A date is available if and only if all of the following are true:

```
date >= earliestDate                   (lead time)
date <= latestDate                     (advance booking cap)
date is not Sunday                     (location rule)
concurrent production count < maxCakes (capacity)
```

Failing any one condition blocks the date. These are not prioritised — all four apply simultaneously.

### 7.7 Test Cases (Required)

| # | Scenario | Expected result |
|---|---|---|
| T1 | Customer selects a date within lead time | Date is unavailable |
| T2 | Customer selects a date beyond max advance booking window | Date is unavailable |
| T3 | Customer selects a Sunday | Date is unavailable |
| T4 | 7 orders already in production on a given day | Date is blocked (at capacity) |
| T5 | 6 orders in production — new order fits | Date is available |
| T6 | Flavour endDate is 5 days away, lead time is 7 days | Flavour is hidden |
| T7 | Flavour endDate is 10 days away, lead time is 7 days | Flavour is shown |
| T8 | Flavour endDate is yesterday | Flavour is hidden |
| T9 | Size not yet selected — flavour end date within shortest lead time | Flavour is hidden |
| T10 | Size is upgraded — new lead time pushes past flavour end date | Flavour selection is cleared |
| T11 | Delivery-only size selected | Pickup option is disabled, delivery dates shown |
| T12 | Wedding + sheet cake combo | Counted as 1 slot against capacity, not 2 |
| T13 | Tasting booking on a date at max capacity | Date is blocked |
| T14 | Server-side capacity check at checkout after calendar was loaded | 409 returned if capacity exceeded |
| T15 | Legacy product, no flavour selection | Lead time resolved from tier, not variant |

---

## 8. Add-Ons

Two add-on types, both linked via `cake_addon_links`:

**Regular add-ons** (e.g. flowers, topper): priced at the main cake's resolved size tier. No separate guest count input.

**Sheet cake add-on** (`cakeProductType = 'sheet-cake'`): has its own guest count input, flavour selector, and pricing grid. Regular add-ons can also be applied to the sheet cake at its own size tier. The wedding + sheet combination is one production slot (see section 6).

**UX placement for wedding cakes:** surface the sheet cake add-on immediately after size selection, before general add-ons. Frame it as a cost-saving option. "Add a sheet cake for extra guests at a lower per-head cost." Do not bury it in the general add-ons list.

---

## 9. Tier Detail Display

Products can store `cakeTierDetailConfig` — layers, diameters, and a label per size value. When present, this is displayed as a visual tier diagram in the cart sidebar after size selection. Informational only, no ordering logic attached.

---

## 10. User Flows

### 10.1 Self-Serve Cake Order

```
Entry: Cake category page
  |
  ├── Select cake type
  |
  ├── Select flavour
  |     ├── Inactive flavours hidden
  |     ├── End-dated flavours hidden if today + min lead time > endDate
  |     └── Allergen block renders on selection
  |
  ├── Select size (headcount)
  |     ├── Price resolves to flavour + size combination
  |     ├── Delivery-only flag shown if applicable
  |     └── Re-filter flavours against resolved lead time
  |         └── If selected flavour no longer qualifies → clear + prompt re-selection
  |
  ├── [Wedding only] Sheet cake add-on prompt
  |     ├── Own guest count, flavour, pricing grid
  |     └── Counts as one production slot combined
  |
  ├── [Optional] Other add-ons
  |     └── Priced at resolved size tier
  |
  ├── Select pickup / delivery date
  |     ├── Calendar opens to earliest available date (today + lead time)
  |     ├── Blocked: within lead time / Sunday / at capacity / beyond advance booking cap
  |     └── Delivery-only: pickup option removed
  |
  └── Add to cart → Checkout → server-side capacity re-check
```

### 10.2 Cake Tasting

```
Entry: Cake Tasting page
  |
  ├── Select up to 3 flavours (multi-select chips)
  |     ├── Same active/end-date filtering
  |     └── Consolidated allergen block (union of all selected)
  |
  ├── Select tasting date
  |     └── Same date rules as cake orders — consumes 1 production slot
  |
  └── Add to cart → Checkout
```

### 10.3 Custom Cake Inquiry

```
Entry: Custom Cakes page
  |
  ├── Brief copy: weddings, large events, non-standard requests
  |
  ├── Form:
  |     Occasion type
  |     Estimated guests
  |     Target date
  |     Flavour ideas / inspiration
  |     Dietary restrictions
  |     Name + email + phone
  |
  └── Submit → Acknowledgement + email confirmation
              → Team follows up within [X] business days
```

---

## 11. Checkout

`POST /api/checkout/cake`

1. Validate required fields: items, pickup date
2. Server-side capacity re-check — returns 409 if exceeded
3. Variant resolution:
   - Grid products: resolve via pricing grid (exact flavour + size match)
   - Legacy products: resolve via headcount tier
   - Unresolvable → 422
4. Shopify cart created with attributes: `Order Type`, `Pickup Date`, `Fulfillment Type`, `Number of People`, `Event Type`, `Lead Time Days`, `Selected Flavours`, `Calculated Price`
5. Delivery address attributes added if delivery
6. Returns `{ checkoutUrl }` → redirect to Shopify

---

## 12. Admin Setup Checklist

1. Create product in CMS, link to Shopify product
2. Set `cakeEnabled = true`
3. Set `cakeProductType`
4. Shopify product must have variants matching the size × flavour grid (exact handles)
5. Add lead time tiers (at minimum one)
6. Configure flavour config — active state, end dates, allergens, sort order
7. Set max advance booking days (default 365)
8. Optionally add tier detail config (layers/diameters)
9. Optionally link add-on products
10. Set `cakeCapacity.maxCakes` in global cake settings (default 7)
11. Assign pickup location, confirm Sunday disabled

---

## 13. UX Writing

**Capacity messaging:** "We're fully booked for that date." Not "date unavailable."

**Delivery-only sizes:** "This size is delivered only — we can't safely send it home with you."

**Flavour end dates:** Hide quietly. If a label is needed: "Seasonal — not currently available." Never show the end date itself.

**Sheet cake add-on (wedding):** "Add a sheet cake for extra guests at a lower per-head cost." One sentence, placed after size selection.

**Tasting entry point:** "Not sure which flavour yet? Book a tasting."

**Flavour cleared after size change:** "Your previous flavour selection is no longer available at this size. Please choose again."

---

## 14. Open Questions

- Custom cake inquiry — target response time (needed for acknowledgement copy)
- Croquembouche — does each bouche size carry its own lead time, or is it fixed?

---

*Spec status: v3 · Blended from UX spec + technical implementation doc*
