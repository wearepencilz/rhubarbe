# Cake Ordering

> **Authoritative spec:** `docs/spec/rhubarbe_cake_ordering_spec.md` (v3)
> This document is a technical reference summary. For full rules including date logic, allergen display, UX copy, and test cases, see the spec.

## Overview

Three entry points, distinct intents.

| Category | Who it's for | How it resolves |
|---|---|---|
| Cakes | Anyone ordering large format, wedding, sheet, or croquembouche | Full self-serve checkout |
| Cake Tasting | Couples or event planners vetting wedding flavours | Booking, up to 3 flavours, consumes a production slot |
| Custom Cakes | Events outside the standard product range | Inquiry form, manual follow-up |

All cake orders use a single pickup location: **Rhubarbe, 1320 rue Charlevoix**. Sundays are disabled globally at the location level.

**Order type:** `cake` · **Page:** `/cake` · **Checkout:** `POST /api/checkout/cake`

---

## Product Types

| `cakeProductType` | Flavour Select | Size Input | Notes |
|---|---|---|---|
| `cake-xxl` | Single-select dropdown | Guest count | Large format celebration cake |
| `wedding-cake-tiered` | Single-select dropdown | Guest count | Sheet cake add-on available |
| `croquembouche` | Multi-select chips (max N) | Guest count × 3 for choux | Standardised flavour list |
| `wedding-cake-tasting` | Multi-select chips (max 3) | None | Consumes 1 production slot |
| `sheet-cake` | Single-select dropdown | Guest count | Add-on only, not sold standalone |
| `null` (legacy) | None | Guest count | Pricing tiers only, no flavour grid |

---

## Pricing

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

Table: `cake_pricing_tiers` — one row per headcount threshold. Resolution: largest `minPeople ≤ input`. No flavour selection.

---

## Flavour Config

Stored on the product as `cakeFlavourConfig` JSON array:

```
{ handle, label: {en,fr}, description, sortOrder, active, endDate, allergens[] }
```

- `allergens[]` values: `dairy | egg | gluten | tree-nuts | peanuts | sesame | soy | fish`
- **Single-select**: XXL, wedding, sheet cake — dropdown
- **Multi-select**: Croquembouche (max N), tasting (max 3) — chip buttons
- `active: false` → hidden regardless of date
- **endDate filtering**: A flavour is hidden if `today + leadTimeDays > flavour.endDate` — stricter than checking if the date has passed. See spec §7.3 for full logic.

---

## Allergen Display

Allergens exist at two levels: product-level (base, always present) and flavour-level (per selection). The UI shows **one consolidated block** — the union of product-level and selected flavour allergens. Where a flavour overrides a product allergen (e.g. gluten-free flavour), the flavour value takes precedence. Updates live on flavour change.

For multi-select (tasting, croquembouche): union of all selected flavour allergens merged with the product base.

See spec §4 for examples.

---

## Lead Time Tiers

Table: `cake_lead_time_tiers`

| `minPeople` | `leadTimeDays` | `deliveryOnly` |
|---|---|---|
| 1 | 7 | false |
| 50 | 14 | true |

Resolution: largest `minPeople ≤ resolved size value` → that tier's `leadTimeDays` and `deliveryOnly` flag.

- For grid products, the **resolved size** (not raw guest input) is used for tier lookup
- `deliveryOnly = true` disables the pickup option for that configuration
- Earliest date = `today + leadTimeDays`

---

## Production Capacity

Setting: `cakeCapacity.maxCakes` in global settings (default **7**).

`GET /api/cake-capacity?from=YYYY-MM-DD&to=YYYY-MM-DD&leadTime=N`

For each candidate date D with lead time L, counts existing cake orders whose production window overlaps:
- Existing order window: `[E - E_lead, E]`
- Candidate window: `[D - L, D]`
- Overlap condition: `E >= D - L AND E - E_lead <= D`

If `conflicts >= maxCakes`, the date is blocked on the calendar.

Server-side re-check at checkout — returns 409 if capacity exceeded.

**Wedding + sheet cake:** one production slot, not two. **Cake tasting:** consumes one production slot.

---

## Date Rules (Summary)

A date is available if and only if **all four** conditions are true simultaneously:

```
date >= today + leadTimeDays           (lead time)
date <= today + maxAdvanceBookingDays  (advance booking cap, default 365)
date is not Sunday                     (location rule)
concurrent production count < maxCakes (capacity)
```

**See spec §7 for the full specification including test cases T1–T15.**

---

## Add-Ons

Table: `cake_addon_links` — links parent product → addon product.

Two addon types:
1. **Regular add-ons** (e.g. flowers, topper): priced at the main cake's resolved size tier. No separate guest count input.
2. **Sheet cake add-on** (`cakeProductType = 'sheet-cake'`): has its own guest count input, flavour selector, and pricing grid. Regular add-ons can also be toggled independently for the sheet cake at its own size tier.

**UX placement (wedding cakes):** surface the sheet cake add-on immediately after size selection, before general add-ons. "Add a sheet cake for extra guests at a lower per-head cost."

---

## Tier Details

Stored as `cakeTierDetailConfig` JSON on the product:

```
{ sizeValue, layers, diameters, label: {en,fr} }
```

Looked up by resolved size. Displayed as a visual tier diagram in the cart sidebar. Informational only — no ordering logic attached.

---

## Checkout (`POST /api/checkout/cake`)

1. **Validation**: items required, pickupDate required
2. **Capacity check**: server-side re-check against `maxCakes` setting — returns 409 if exceeded
3. **Variant resolution**:
   - Grid items: resolve via pricing grid (exact flavour + size match)
   - Legacy items: resolve via headcount tier
   - Unresolvable → 422 error
4. **Tax resolution**: same category/quantity threshold logic as regular checkout
5. **Cart creation**: Shopify Storefront cart with attributes:
   - `Order Type: cake`, `Pickup Date`, `Fulfillment Type`, `Number of People`, `Event Type`, `Lead Time Days`, `Selected Flavours`, `Calculated Price`
   - Delivery address attributes if delivery
6. Returns `{ checkoutUrl }` → redirect to Shopify

---

## Webhook Processing

`orders-paid` webhook creates order with:
- `orderType: 'cake'`
- `fulfillmentDate` from Pickup Date attribute
- `leadTimeDays` from Lead Time Days attribute
- `specialInstructions` includes Number of People + Event Type + order note
- Sends cake confirmation email (non-blocking)

---

## Admin Setup Checklist

1. Create product in CMS, link to Shopify product
2. Set `cakeEnabled = true`
3. Set `cakeProductType`
4. Shopify product must have variants matching the size × flavour grid (exact handles)
5. Add at least one lead time tier
6. Configure flavour config — active state, end dates, allergens, sort order
7. Set max advance booking days (default 365)
8. Optionally add tier detail config (layers/diameters)
9. Optionally link add-on products
10. Set `cakeCapacity.maxCakes` in Cake Settings (default 7)
11. Assign pickup location, confirm Sunday disabled

---

## UX Writing

| Context | Copy |
|---|---|
| Capacity blocked | "We're fully booked for that date." |
| Delivery-only size | "This size is delivered only — we can't safely send it home with you." |
| Flavour end date | Hide quietly. If label needed: "Seasonal — not currently available." Never show the date. |
| Sheet cake add-on | "Add a sheet cake for extra guests at a lower per-head cost." |
| Tasting entry point | "Not sure which flavour yet? Book a tasting." |
| Flavour cleared after size change | "Your previous flavour selection is no longer available at this size. Please choose again." |

---

## Key Dependencies

```
/cake → GET /api/storefront/cake-products
         → products table (CMS metadata)
         → Shopify Storefront API (variant prices — builds pricing grid at runtime)
         → cake_lead_time_tiers table
         → cake_addon_links table
       → GET /api/cake-capacity (blocked dates)
         → orders table (conflict count)
         → settings.cakeCapacity.maxCakes
       → POST /api/checkout/cake
         → Shopify Storefront API (createCart)
         → Server-side capacity re-check
       → Shopify Checkout → orders-paid webhook → orders table
```

---

## Open Questions

- Custom cake inquiry — target response time (needed for acknowledgement copy)
- Croquembouche — does each bouche size carry its own lead time, or is it fixed?
