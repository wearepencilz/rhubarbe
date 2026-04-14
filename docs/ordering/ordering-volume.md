# Volume / Catering Ordering

## Overview

Bulk catering orders grouped by type (Buffet, Lunch, Dînatoire). Each type has its own ordering rules, lead times, and quantity constraints. Supports pickup and delivery.

**Order type:** `volume` · **Page:** `/catering` · **Checkout:** `POST /api/checkout/volume`

---

## Catering Types

Three types, each configured independently in Catering Settings:

| Type | Default Scope | Default Min | Default Increment | Unit Label |
|---|---|---|---|---|
| `brunch` (Buffet) | Per variant | 12 per variant | 6 | quantity |
| `lunch` | Per order | 6 total | 1 | people |
| `dinatoire` | Per order | 3 total | 1 | people |

Settings stored in `settings.cateringTypeSettings` as a JSON object keyed by type.

---

## Product Setup

A product becomes a volume product when `volumeEnabled = true` on the `products` table.

Key fields:

| Field | Purpose |
|---|---|
| `volumeEnabled` | Enables the product for catering |
| `cateringType` | `brunch \| lunch \| dinatoire` — determines which rules apply |
| `cateringDescription` | Bilingual description for the catering page |
| `cateringEndDate` | Product hidden from storefront after this date |
| `shopifyProductId` | Link to Shopify (required for checkout) |
| `pickupOnly` | If true, delivery is disabled when this product is in cart |
| `servesPerUnit` | Used to calculate "serves estimate" shown at checkout |
| `volumeUnitLabel` | `quantity \| people` — label on the quantity selector |
| `dietaryTags` | For filtering (e.g. vegetarian, gluten-free) |
| `temperatureTags` | For filtering (e.g. hot, cold) |
| `orderMinimum` | Per-product override of the type's order minimum |
| `orderScope` | Per-product override: `variant \| order` |
| `variantMinimum` | Per-product override of variant minimum |
| `increment` | Per-product override of quantity step |

---

## Variants

**Shopify is the source of truth for variants and pricing.**

`GET /api/storefront/volume-products` fetches variants from Shopify Storefront API:
- Filters out tax-only duplicate variants (`Tax=false`)
- Filters out "Default Title" single-variant products (captures their price as product price)
- Each variant becomes a selectable option with its own price

Products without Shopify variants show as single-item (product-level price).

---

## Ordering Rules

Configured per catering type in settings, overridable per product.

### Scope: `variant`
- Each variant's quantity must be 0 (not ordered) or ≥ `variantMinimum`
- After minimum, quantity must increase in steps of `increment`
- Validation: `(qty - variantMinimum) % increment === 0`

### Scope: `order`
- Total quantity across all variants must be ≥ `orderMinimum`
- After minimum, total must increase in steps of `increment`
- Validation: `(total - orderMinimum) % increment === 0`

Implemented in `lib/catering/ordering-rules.ts`.

---

## Lead Time Tiers

Configured per catering type in settings (not per product):

| `minQuantity` | `leadTimeDays` |
|---|---|
| 1 | 3 |
| 50 | 7 |

Resolution: across all cart items, find the max lead time. Largest `minQuantity ≤ item.quantity` per item → that tier's `leadTimeDays`. Earliest date = today + max lead time across all items.

Default lead time (no tiers): 28 days (`lib/catering/lead-time.ts`).

---

## Fulfillment

- **Pickup or delivery** — toggle available (`supportsFulfillmentToggle: true`)
- Delivery disabled if any cart item has `pickupOnly = true`
- Pickup location set globally in Catering Settings (`cateringPickupLocationId`)
- Closed pickup days come from the assigned pickup location's `disabledPickupDays`
- **Any-day delivery override**: if cart total ≥ `deliveryMinForAnyday` setting, closed days are unblocked
- `maxAdvanceDays` per catering type limits how far ahead orders can be placed

---

## Storefront Flow

1. `GET /api/storefront/volume-products` returns all `volumeEnabled` products where `cateringEndDate` is null or in the future
2. Products grouped by `cateringType` on the page
3. Filterable by `dietaryTags` and `temperatureTags`
4. Customer selects variant quantities per product
5. Cart persisted to localStorage
6. Quantity validation runs client-side using the product's ordering rules
7. Date picker enforces earliest date (from lead time) and closed days

---

## Checkout (`POST /api/checkout/volume`)

1. **Validation**: items required, fulfillmentDate required
2. **Variant resolution**: each item must have a `shopifyVariantId` (resolved from Shopify if missing)
3. **Tax resolution**: same category/quantity threshold logic as regular checkout
4. **Cart creation**: Shopify Storefront cart with attributes:
   - `Order Type: volume`, `Fulfillment Date`, `Fulfillment Type`
   - `Allergen Note` (if provided)
   - Delivery address attributes if delivery
5. Returns `{ checkoutUrl }` → redirect to Shopify

---

## Webhook Processing

`orders-paid` webhook creates order with:
- `orderType: 'volume'`
- `fulfillmentDate` from Fulfillment Date attribute
- `allergenNotes` from Allergen Note attribute
- Sends volume order confirmation email (non-blocking)

---

## Admin Setup Checklist

1. Create product in CMS, link to Shopify product
2. Set `volumeEnabled = true`
3. Set `cateringType` (brunch/lunch/dinatoire)
4. **Shopify product must have variants** (or a single default variant for fixed-price items)
5. Shopify product must be published to Storefront channel
6. Configure ordering rules per type in Catering Settings (or override per product)
7. Configure lead time tiers per type in Catering Settings
8. Assign a pickup location in Catering Settings
9. Set `deliveryMinForAnyday` threshold if needed

---

## Key Dependencies

```
/catering → GET /api/storefront/volume-products
              → products table (volumeEnabled, cateringType, ordering rules)
              → Shopify Storefront API (variant prices at runtime)
              → settings (cateringTypeSettings, closedPickupDays, deliveryMinForAnyday)
            → POST /api/checkout/volume
              → Shopify Storefront API (createCart)
              → Tax resolution
            → Shopify Checkout → orders-paid webhook → orders table
```

---

## Differences from Cake Orders

| Concern | Cake | Volume |
|---|---|---|
| Cart model | Single product selection | Multi-product, multi-variant quantities |
| Pricing source | Shopify variant grid (size × flavour) | Shopify variant prices directly |
| Lead time basis | Number of people (per product) | Total quantity (per catering type) |
| Capacity limit | maxCakes with production window overlap | None |
| Fulfillment | Pickup or delivery (per lead time tier) | Pickup or delivery (per product pickupOnly flag) |
| Quantity rules | None (one cake per order) | Min/increment per variant or per order total |
