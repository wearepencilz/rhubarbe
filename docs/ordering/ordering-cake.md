# Cake Ordering

## Overview

Custom cake orders with per-product lead times, production capacity limits, flavour selection, tiered pricing, and optional add-ons. Supports pickup and delivery.

**Order type:** `cake` · **Page:** `/cake` · **Checkout:** `POST /api/checkout/cake`

---

## Product Types

| `cakeProductType` | Pricing | Flavour Select | Size Input | Example |
|---|---|---|---|---|
| `null` (legacy) | Pricing tiers (people → price) | None | Headcount | Simple birthday cake |
| `cake-xxl` | Pricing grid (size × flavour) | Single-select dropdown | Guest count | XXL celebration cake |
| `wedding-cake-tiered` | Pricing grid (size × flavour) | Single-select dropdown | Guest count | Tiered wedding cake |
| `croquembouche` | Pricing grid (choux × flavour) | Multi-select chips (max N) | Guest count (×3 for choux) | Croquembouche tower |
| `wedding-cake-tasting` | Fixed price (first grid row) | Single-select dropdown | None | Tasting box |
| `sheet-cake` | Pricing grid (size × flavour) | Single-select dropdown | Guest count | Sheet cake (addon only) |

---

## Pricing

### Legacy Products (`cakeProductType = null`)

Table: `cake_pricing_tiers` — one row per people threshold.

| `minPeople` | `priceInCents` | `shopifyVariantId` |
|---|---|---|
| 10 | 4500 | `gid://shopify/...` |
| 20 | 7500 | `gid://shopify/...` |

Resolution: find the tier with the largest `minPeople ≤ input`, use its price and variant.

### Grid-Based Products

**At runtime, the pricing grid is built from Shopify variants** — not stored in the CMS.

`GET /api/storefront/cake-products` calls Shopify's Storefront API to fetch all variants for each product, then builds a grid:

- **Option 1** → `sizeValue` (numeric part extracted, e.g. "30 guests" → "30")
- **Option 2** → `flavourHandle` (slugified, e.g. "Pistachio" → "pistachio")
- Single-option products use `flavourHandle = "default"`

Resolution via `resolvePricingGridPrice(grid, sizeValue, flavourHandle)`:
- Exact match on both `sizeValue` AND `flavourHandle`
- Returns `{ priceInCents, shopifyVariantId }` or `null`

**If a size/flavour combination has no matching Shopify variant, the price is null and checkout is blocked.**

### Size Resolution

Customer enters a guest count. `resolveNearestSize()` finds the largest grid `sizeValue ≤ input`.

For croquembouche: input is multiplied by 3 (choux per guest) before lookup.

---

## Flavour Config

Stored on the product as `cakeFlavourConfig` JSON array:

```
{ handle, label: {en,fr}, description, pricingTierGroup, sortOrder, active, endDate, allergens[] }
```

- **Single-select**: XXL, wedding, sheet cake — dropdown
- **Multi-select**: Croquembouche, tasting — chip buttons, max = `cakeMaxFlavours` (default 3)
- **endDate filtering**: Flavours past their `endDate` are hidden from the storefront
- Only `active: true` flavours are shown

---

## Lead Time Tiers

Table: `cake_lead_time_tiers`

| `minPeople` | `leadTimeDays` | `deliveryOnly` |
|---|---|---|
| 1 | 7 | false |
| 50 | 14 | true |

Resolution: largest `minPeople ≤ input` → that tier's `leadTimeDays`.

- For grid products, the resolved size (not guest input) is used as the "people" count
- `deliveryOnly = true` forces delivery mode on the client (no pickup option)
- Earliest date = today + leadTimeDays

---

## Production Capacity

Setting: `cakeCapacity.maxCakes` in global settings (default 7).

`GET /api/cake-capacity?from=YYYY-MM-DD&to=YYYY-MM-DD&leadTime=N`

For each candidate date D with lead time L, counts existing cake orders whose production window overlaps:
- Existing order window: `[E - E_lead, E]`
- Candidate window: `[D - L, D]`
- Overlap condition: `E >= D - L AND E - E_lead <= D`

If `conflicts >= maxCakes`, the date is blocked on the calendar.

Server-side re-check at checkout — returns 409 if capacity exceeded.

---

## Add-Ons

Table: `cake_addon_links` — links parent product → addon product.

Two addon types:
1. **Regular add-ons** (e.g. flowers, topper): priced at the main cake's resolved size tier
2. **Sheet cake add-ons** (`cakeProductType = 'sheet-cake'`): has its own guest count input, flavour selector, and pricing grid. Regular add-ons can also be toggled independently for the sheet cake at its own size tier.

---

## Tier Details

Stored as `cakeTierDetailConfig` JSON on the product:

```
{ sizeValue, layers, diameters, label: {en,fr} }
```

Looked up by resolved size. Displayed as a visual tier diagram in the cart sidebar.

---

## Checkout (`POST /api/checkout/cake`)

1. **Validation**: items required, pickupDate required
2. **Capacity check**: server-side re-check against `maxCakes` setting
3. **Variant resolution**:
   - Grid items: resolve via `getCakePricingGrid()` + `resolvePricingGridPrice()`
   - Legacy items: resolve via Shopify Admin `getProductVariantId()`
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
3. Set `cakeProductType` (or leave null for legacy)
4. **Shopify product must have variants** matching the size × flavour grid
5. Add at least one lead time tier
6. Configure flavour config (for grid-based products)
7. Optionally add tier detail config (layers/diameters)
8. Optionally link add-on products
9. Set `cakeCapacity.maxCakes` in Cake Settings
10. Assign a pickup location in Cake Settings

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
