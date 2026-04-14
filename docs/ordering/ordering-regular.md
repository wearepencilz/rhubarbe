# Regular (Menu/Launch) Ordering

## Overview

Regular orders are weekly preorder menus. A staff member creates a "launch" (menu) in the admin, assigns products to it, sets an ordering window and pickup details. Customers browse the active menu, add items to cart, and check out through Shopify.

**Order type identifier:** `launch`
**Storefront page:** `/order` → `OrderPageClient.tsx`
**Checkout API:** `POST /api/checkout`
**Config:** `lib/checkout/configs/regular.ts`

---

## Data Model

### Launch (Menu)

Table: `launches`

| Field | Type | Purpose |
|---|---|---|
| `title` | `{ en, fr }` | Bilingual menu name |
| `slug` | `text` | URL-friendly identifier |
| `status` | `draft \| active \| archived` | Only `active` launches are visible |
| `orderOpens` | `timestamp` | When customers can start ordering |
| `orderCloses` | `timestamp` | Ordering cutoff |
| `allowEarlyOrdering` | `boolean` | If true, menu is visible before `orderOpens` |
| `pickupDate` | `timestamp` | The pickup day |
| `pickupLocationId` | `uuid` | FK → `pickup_locations` |
| `pickupWindowStart` | `timestamp` | Multi-day pickup window start (optional) |
| `pickupWindowEnd` | `timestamp` | Multi-day pickup window end (optional) |
| `pickupInstructions` | `{ en, fr }` | Bilingual pickup instructions |
| `pickupSlotConfig` | `json` | `{ startTime, endTime, intervalMinutes }` for generating slots |
| `pickupSlots` | `json[]` | Generated slots: `{ id, startTime, endTime, capacity? }` |

### Launch Products

Table: `launch_products`

| Field | Type | Purpose |
|---|---|---|
| `launchId` | `uuid` | FK → `launches` |
| `productId` | `text` | FK → `products.id` |
| `productName` | `text` | Denormalized name |
| `sortOrder` | `integer` | Display order on storefront |
| `minQuantityOverride` | `integer` | Per-menu min qty override |
| `maxQuantityOverride` | `integer` | Per-menu max qty override |
| `quantityStepOverride` | `integer` | Per-menu step override |

### Pickup Locations

Table: `pickup_locations`

| Field | Type | Purpose |
|---|---|---|
| `internalName` | `text` | Admin label |
| `publicLabel` | `{ en, fr }` | Customer-facing name |
| `address` | `text` | Street address |
| `pickupInstructions` | `{ en, fr }` | Bilingual instructions |
| `disabledPickupDays` | `number[]` | JS day-of-week (0=Sun…6=Sat) where pickup is unavailable |
| `active` | `boolean` | Only active locations are selectable |
| `sortOrder` | `integer` | Display order |

---

## Storefront Flow

### 1. Fetching the Active Menu

`GET /api/launches/current` returns all launches where:
- `status = 'active'`
- `orderCloses >= now()`

Each launch is enriched with:
- Full product data from the `products` table
- Live Shopify prices fetched via Admin API (not cached in CMS)
- Shopify inventory levels
- Product category taxonomy labels

### 2. Product Display

Products are displayed in a grid, grouped by category. Each product shows:
- Name, image, price (from Shopify)
- Dietary badges and allergen warnings
- Availability status (in stock / low stock / sold out from Shopify inventory)
- Quantity selector with min/max/step constraints

### 3. Cart Behavior

- Cart is local state (not persisted to server)
- Multiple products can be added
- Quantity respects `minQuantityOverride`, `maxQuantityOverride`, `quantityStepOverride` from launch_products
- Cart shows subtotal calculated from Shopify prices × quantities

### 4. Fulfillment

- **Pickup only** — delivery is disabled for regular orders (`supportsFulfillmentToggle: false`)
- Pickup date comes from the launch's `pickupDate` (preset, not user-selectable)
- If `pickupWindowStart`/`pickupWindowEnd` are set, customer can pick a day within the window
- If `pickupSlots` are configured, customer selects a time slot
- Pickup location is set by the launch (not user-selectable)

---

## Checkout Flow

### Client Side

1. Customer clicks checkout
2. `regularOrderConfig.buildCheckoutPayload()` builds the request:
   - `items[]` — each with `productId`, `productName`, `shopifyProductId`, `shopifyVariantId`, `quantity`, `price`
   - `launchId`, `launchTitle`
   - `pickupDate`, `pickupLocationName`, `pickupLocationAddress`
   - `pickupSlot` (if selected)
   - `locale`

### Server Side (`POST /api/checkout`)

1. **Variant resolution**: For each item, resolve the Shopify variant ID:
   - Use `shopifyVariantId` from the cart if present
   - Otherwise call `getProductVariantId()` via Shopify Admin API
   - Items without a resolvable variant are skipped (listed in `skippedItems`)

2. **Tax resolution**: For each resolved item:
   - Fetch `taxConfig` from the products table (`taxBehavior`, `taxThreshold`, `taxUnitCount`)
   - **Category-based**: If tax settings have `thresholdCategories`, check if the product's Shopify collections match. If the category total exceeds the threshold, swap to the tax-exempt variant
   - **Quantity-based**: If `taxBehavior = 'quantity_threshold'` and `quantity × taxUnitCount >= taxThreshold`, swap to the exempt variant
   - **Always exempt**: If `taxBehavior = 'always_exempt'`, always use the exempt variant
   - Exempt variants are found via `findExemptVariant()` which looks for a variant with `Tax=false` option

3. **Cart creation**: Creates a Shopify Storefront cart via `createCart()` with:
   - `lines[]` — resolved `merchandiseId` + `quantity`
   - `attributes[]` — Menu, Menu ID, Pickup Date, Pickup Location, Pickup Address, Pickup Slot
   - `note` — human-readable order summary

4. **Response**: Returns `{ checkoutUrl, cartId, skippedItems }`
   - Client redirects to `checkoutUrl` (Shopify checkout)

---

## Post-Checkout (Webhook)

`POST /api/shopify/webhooks/orders-paid`

When Shopify payment completes:
1. Verifies HMAC signature
2. Extracts cart attributes (`Menu`, `Menu ID`, `Pickup Date`, `Pickup Location`, `Order Type`)
3. Determines `orderType` from the `Order Type` attribute (defaults to `launch`)
4. Creates an order record in the `orders` table with:
   - `orderType: 'launch'`
   - `launchId`, `launchTitle`
   - `status: 'confirmed'`, `paymentStatus: 'paid'`
   - Customer info from Shopify
   - Pricing in cents from Shopify
5. Creates `order_items` records from Shopify line items
6. Strips structured data from the order note, keeping only genuine customer notes as `specialInstructions`

---

## Admin Setup Requirements

To create a working regular order menu:

1. **Products must exist** in the CMS with a linked `shopifyProductId`
2. **Shopify products must be published** to the Storefront sales channel
3. **Create a launch** at `/admin/menus/create`:
   - Set title (bilingual), status = `active`
   - Set `orderOpens` and `orderCloses` dates
   - Set `pickupDate` and assign a pickup location
   - Optionally configure pickup window and time slots
4. **Add products** to the launch with sort order and optional quantity overrides
5. **Shopify webhook** must be configured: `orders/paid` → `/api/shopify/webhooks/orders-paid`

---

## Key Dependencies

```
OrderPageClient.tsx
  → GET /api/launches/current
    → launches table + products table + Shopify Admin API (prices, inventory)
  → POST /api/checkout
    → Shopify Storefront API (createCart)
    → Tax resolution (findExemptVariant, resolveCategoryVariants)
  → Shopify Checkout (external)
  → Shopify Webhook → POST /api/shopify/webhooks/orders-paid
    → orders table + order_items table
```

## Constraints & Business Rules

- Shopify owns all pricing — prices are fetched live, never stored in CMS
- Orders can only be placed while `orderOpens <= now <= orderCloses`
- Products without a Shopify link are skipped at checkout (warning shown)
- Products not published to Storefront channel cause a 422 error
- Tax exempt variant swapping is transparent to the customer
- No delivery option — pickup only
- One launch can have one pickup location
- Pickup slots are optional; if configured, customer must select one
