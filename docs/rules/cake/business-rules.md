# Cake Ordering — Business Rules

> Authoritative spec: `docs/spec/rhubarbe_cake_ordering_spec.md`

## Product Types

| `cakeProductType` | Flavour | Size Input | Pricing | Standalone? |
|---|---|---|---|---|
| `null` (legacy) | None | Headcount | Pricing tiers (people → price) | Yes |
| `cake-xxl` | Single-select | Guest count | Grid (size × flavour) | Yes |
| `wedding-cake-tiered` | Single-select | Guest count | Grid (size × flavour) | Yes |
| `croquembouche` | Multi-select (max N) | Guests × 3 choux | Grid (choux × flavour) | Yes |
| `wedding-cake-tasting` | Multi-select (max 3) | None (fixed) | First grid row | Yes |
| `sheet-cake` | Single-select | Guest count | Grid (size × flavour) | No — addon only |

## Pricing Rules

- **Grid products**: pricing grid built at runtime from Shopify variants. Not stored in CMS.
- **Variant mapping**: Option 1 → `sizeValue` (numeric extracted), Option 2 → `flavourHandle` (slugified). Single-option products use `flavourHandle = "default"`.
- **Resolution**: exact match on `sizeValue` AND `flavourHandle`. No match = no price = checkout blocked.
- **Size resolution**: `resolveNearestSize()` — largest grid `sizeValue ≤ input`.
- **Croquembouche**: guest input × 3 before size lookup.
- **Legacy**: pricing tiers table, largest `minPeople ≤ input`.

## Lead Time

Table: `cake_lead_time_tiers` (per product).

- Resolution: largest `minPeople ≤ resolved size` → `leadTimeDays`.
- Grid products use resolved size (not raw guest input) for tier lookup.
- `deliveryOnly = true` disables pickup for that configuration.
- Earliest date = today + leadTimeDays.

## Production Capacity

- Global setting: `cakeCapacity.maxCakes` (default 7).
- A date is blocked when overlapping production count ≥ maxCakes.
- Overlap: candidate window `[D - L, D]` vs existing `[E - E_lead, E]`. Overlap when `E >= D - L AND E - E_lead <= D`.
- Wedding + sheet cake = 1 slot (single order).
- Tasting = 1 slot.
- Client-side check (calendar) + server-side re-check (checkout, returns 409).

## Date Rules (spec §7.6)

A date is available if and only if ALL of:
1. `date >= today + leadTimeDays` (lead time)
2. `date <= today + maxAdvanceDays` (advance cap, default 365)
3. `date` is not on a disabled pickup day (Sunday by default)
4. Production count < maxCakes (capacity)

## Flavour Rules

- Only `active: true` flavours shown.
- `endDate` filtering: hidden if `today + leadTimeDays > endDate`.
- Before size selected: filter against shortest lead time for the product.
- After size selected: re-filter against resolved lead time. If selected flavour removed → clear selection.

## Allergens

- Consolidated union: product-level allergens + selected flavour allergens.
- Single block, updated live on flavour change.
- Multi-select (tasting, croquembouche): union of all selected.

## Add-Ons

- **Regular**: priced at main cake's resolved size tier.
- **Sheet cake** (`sheet-cake` type): own guest count, flavour, pricing grid. Regular add-ons can also apply at sheet cake tier.
- Wedding + sheet = 1 production slot.

## Fulfillment

- Pickup or delivery (toggle available).
- `deliveryOnly` flag per lead time tier disables pickup.
- Single pickup location: configured in Cake Settings.
- Sundays disabled at location level.
