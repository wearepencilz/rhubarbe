# Design Document: Cake Ordering Revamp

## Overview

The Cake Ordering Revamp extends the existing cake ordering page to support four new product types — Large Format Cakes (XXL), Croquembouche, Tiered Wedding Cakes, and Wedding Cake Tasting Sessions — while keeping existing single-axis cake products working unchanged.

The core change is moving from a single-axis pricing model (headcount → price) to a two-axis pricing grid (size × flavour → price + Shopify variant). This enables the richer product catalog where different flavours have different prices at each size tier.

Key additions:
- `cakeProductType` discriminator on the products table to drive per-type UI and pricing logic
- `cake_pricing_grid` table replacing single-axis `cakePricingTiers` for new product types
- `cakeFlavourConfig` and `cakeTierDetailConfig` JSONB fields for flavour/tier metadata
- `cake_addon_links` table for optional add-on products (Extra Fruits, Gold/Dried Flowers)
- Flavour variant expansion beneath product cards on the storefront
- Tier detail display (layers, diameters) and visual diagram in the sidebar cart
- Croquembouche multi-flavour selection (up to `cakeMaxFlavours`)
- Tasting session as a simple fixed-price add-to-cart

The design extends the existing architecture — same admin component library, same Shopify checkout flow via `lib/shopify/cart.ts`, same tax-exempt variant resolution, same bilingual patterns. No rebuilds.

## Architecture

```mermaid
graph TD
    subgraph Storefront
        A[CakeOrderPageClient.tsx<br/>Extended with product type logic]
        B[GET /api/storefront/cake-products<br/>Returns grid + flavour + addon data]
        C[POST /api/checkout/cake<br/>Extended for grid-based variant resolution]
    end

    subgraph Admin
        D[Cake Products List<br/>app/admin/cake-products/page.tsx]
        E[Cake Product Edit<br/>app/admin/cake-products/[id]/page.tsx<br/>+ product type, flavour config,<br/>tier details, pricing grid, addons]
    end

    subgraph Data Layer
        F[DB Queries<br/>lib/db/queries/cake-products.ts<br/>+ pricing grid + addon CRUD]
        G[Schema<br/>lib/db/schema.ts<br/>+ cake_pricing_grid<br/>+ cake_addon_links<br/>+ new product fields]
        H[Shopify Cart<br/>lib/shopify/cart.ts]
        I[Tax Resolution<br/>lib/tax/find-exempt-variant.ts]
    end

    A --> B
    A --> C
    C --> H
    C --> I
    C --> F
    D --> E
    E -->|PUT /api/cake-products/[id]| F
    B --> F
    F --> G
```

### Design Decisions

1. **Two-axis pricing grid as a separate table** rather than extending `cakePricingTiers`: The existing table is single-axis (minPeople → price). Adding a flavour axis would break the existing schema contract. A new `cake_pricing_grid` table with a (`productId`, `sizeValue`, `flavourHandle`) unique constraint cleanly separates the two models. Legacy products continue using `cakePricingTiers` untouched.

2. **Product-level JSONB for flavour and tier detail config** rather than separate tables: Flavour configs and tier details are small arrays (5–10 entries) that are always loaded with the product. JSONB avoids join overhead and keeps the admin form simple — the entire config is read/written as a single field. No need for relational integrity since these are display metadata, not referenced by other tables.

3. **`cakeProductType` discriminator on the products table**: A simple nullable text field that drives conditional rendering and pricing logic. `null` means legacy behavior. This avoids a product type table and keeps the existing product model intact.

4. **Add-on linking via `cake_addon_links`**: Add-ons are themselves cake products with their own pricing grid (using `flavourHandle = 'default'`). The link table just establishes the parent-child relationship. This reuses all existing product infrastructure — no special add-on entity needed.

5. **Storefront API returns everything in one call**: The API already returns products with tiers and variants. We extend it to also return flavour config, tier details, pricing grid rows, and linked add-ons. One fetch, no waterfalls.

6. **Client-side price resolution**: The pricing grid is small enough to send to the client. Price lookup is a simple `(sizeValue, flavourHandle)` map lookup in the component. No server round-trips for price changes.

## Components and Interfaces

### Database Layer

**New fields on `products` table:**
- `cakeProductType` — text, nullable. Values: `cake-xxl`, `croquembouche`, `wedding-cake-tiered`, `wedding-cake-tasting`, `null`
- `cakeFlavourConfig` — JSONB array of flavour objects
- `cakeTierDetailConfig` — JSONB array of tier detail objects
- `cakeMaxFlavours` — integer, nullable (default 2 for croquembouche)

**New table `cake_pricing_grid`:**
- Maps (productId, sizeValue, flavourHandle) → priceInCents + shopifyVariantId
- Unique constraint on (productId, sizeValue, flavourHandle)

**New table `cake_addon_links`:**
- Maps parentProductId → addonProductId with sortOrder
- Unique constraint on (parentProductId, addonProductId)

**Extended queries in `lib/db/queries/cake-products.ts`:**
- `getCakePricingGrid(productId)` — all grid rows ordered by sizeValue, flavourHandle
- `setCakePricingGrid(productId, rows)` — replace grid rows (transactional)
- `getCakeAddonLinks(productId)` — linked add-on product IDs with sort order
- `setCakeAddonLinks(productId, links)` — replace addon links (transactional)
- `getCakeProductById(id)` — extended to include pricing grid and addon links

### API Routes

| Route | Method | Change | Description |
|-------|--------|--------|-------------|
| `/api/cake-products/[id]` | GET | Extended | Returns pricing grid, addon links, new fields |
| `/api/cake-products/[id]` | PUT | Extended | Accepts pricing grid, addon links, product type, flavour config, tier details |
| `/api/storefront/cake-products` | GET | Extended | Returns flavour config, tier details, pricing grid, addon products |
| `/api/checkout/cake` | POST | Extended | Resolves Shopify variant from pricing grid for grid-based products |

### Admin Edit Page Extensions

The existing `app/admin/cake-products/[id]/page.tsx` gains new sections:

- **Product Type selector** — dropdown for `cakeProductType`
- **Flavour Config editor** — list editor for `cakeFlavourConfig` entries with bilingual label/description fields
- **Tier Detail editor** — list editor for `cakeTierDetailConfig` entries (sizeValue, layers, diameters, label)
- **Pricing Grid editor** — table with sizes as columns, flavours as rows, price + Shopify variant ID per cell
- **Add-on Links editor** — product picker to link/unlink add-on products
- **Max Flavours input** — shown when product type is `croquembouche`

### Storefront Page Extensions

The existing `app/cake/CakeOrderPageClient.tsx` gains:

- **Flavour variant expansion** — when a product card is selected, a flavour list expands beneath it (radio for XXL/wedding, multi-select for croquembouche)
- **Tier detail display** — sidebar shows layers and diameters for the selected size
- **Visual tier diagram** — SVG/CSS stacked layer visualization
- **Add-on toggles** — sidebar shows linked add-ons with prices resolved from selected size
- **Product type branching** — tasting session renders as simple add-to-cart; legacy products use existing single-axis flow

### Shared Utilities

**New helper in `lib/utils/order-helpers.ts`:**
- `resolvePricingGridPrice(grid, sizeValue, flavourHandle)` — looks up price from the grid array. Returns `{ priceInCents, shopifyVariantId } | null`.

This is a pure function used by both the storefront client (price display) and the checkout API (variant resolution).

## Data Models

### Products Table Extensions

```typescript
// New fields on the existing `products` table
cakeProductType: text('cake_product_type'),  // 'cake-xxl' | 'croquembouche' | 'wedding-cake-tiered' | 'wedding-cake-tasting' | null
cakeFlavourConfig: customJsonb<CakeFlavourEntry[]>('cake_flavour_config'),
cakeTierDetailConfig: customJsonb<CakeTierDetailEntry[]>('cake_tier_detail_config'),
cakeMaxFlavours: integer('cake_max_flavours'),
```

### CakeFlavourEntry Type

```typescript
interface CakeFlavourEntry {
  handle: string;              // e.g. "pistachio", "banana-coffee-passion", "custom"
  label: { en: string; fr: string };
  description: { en: string; fr: string } | null;  // e.g. "gâteau banane, crémeux fruit de la passion, croustillant café"
  pricingTierGroup: string | null;  // groups flavours that share the same price column
  sortOrder: number;
  active: boolean;
}
```

### CakeTierDetailEntry Type

```typescript
interface CakeTierDetailEntry {
  sizeValue: string;     // matches pricing grid axis, e.g. "30", "50", "75", "100", "130"
  layers: number;        // e.g. 2, 3, 4
  diameters: string;     // e.g. "10/8/6"
  label: { en: string; fr: string } | null;  // optional display override
}
```

### Cake Pricing Grid Table

```typescript
export const cakePricingGrid = pgTable('cake_pricing_grid', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sizeValue: text('size_value').notNull(),        // e.g. "30", "72", "200"
  flavourHandle: text('flavour_handle').notNull(), // e.g. "pistachio", "default"
  priceInCents: integer('price_in_cents').notNull(),
  shopifyVariantId: text('shopify_variant_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('cake_pricing_grid_product_id_idx').on(table.productId),
  uniqueCell: uniqueIndex('cake_pricing_grid_unique_cell').on(table.productId, table.sizeValue, table.flavourHandle),
}));
```

### Cake Add-On Links Table

```typescript
export const cakeAddonLinks = pgTable('cake_addon_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentProductId: uuid('parent_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  addonProductId: uuid('addon_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  parentIdx: index('cake_addon_links_parent_idx').on(table.parentProductId),
  uniqueLink: uniqueIndex('cake_addon_links_unique').on(table.parentProductId, table.addonProductId),
}));
```

### Extended Storefront API Response Shape

```typescript
interface StorefrontCakeProduct {
  // Existing fields (unchanged)
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number | null;
  shopifyProductId: string | null;
  cakeDescription: { en: string; fr: string };
  cakeInstructions: { en: string; fr: string };
  cakeMinPeople: number;
  shortCardCopy: string | null;
  allergens: string[];
  cakeFlavourNotes: { en: string; fr: string } | null;
  cakeDeliveryAvailable: boolean;
  serves: string | null;
  leadTimeTiers: LeadTimeTier[];

  // Legacy pricing (null for grid-based products)
  pricingTiers: PricingTier[];

  // New fields
  cakeProductType: string | null;
  cakeFlavourConfig: CakeFlavourEntry[];       // active entries only, sorted
  cakeTierDetailConfig: CakeTierDetailEntry[];
  cakeMaxFlavours: number | null;
  pricingGrid: PricingGridRow[];               // all (size, flavour, price, variantId) rows
  addons: StorefrontCakeProduct[];             // linked add-on products with their own pricing data
}

interface PricingGridRow {
  sizeValue: string;
  flavourHandle: string;
  priceInCents: number;
  shopifyVariantId: string | null;
}
```

### Extended Checkout Request Shape

```typescript
interface CakeCheckoutRequest {
  items: Array<{
    productId: string;
    productName: string;
    shopifyProductId?: string;
    // Grid-based resolution
    sizeValue?: string;
    flavourHandle?: string;
    // Direct variant (legacy or pre-resolved)
    shopifyVariantId?: string;
    quantity: number;
    price: number;
    isAddon?: boolean;
  }>;
  pickupDate: string;
  numberOfPeople: number;
  eventType: string;
  specialInstructions: string | null;
  fulfillmentType?: 'pickup' | 'delivery';
  locale: string;
  selectedFlavours?: string[];  // for order note (croquembouche may have 2)
}
```

### Wedding Cake Tier Details Reference

| Size (people) | Layers | Diameters (inches) |
|---------------|--------|---------------------|
| 30            | 2      | 8/5                 |
| 50            | 2      | 10/6                |
| 75            | 3      | 10/8/6              |
| 100           | 3      | 12/9/6              |
| 130           | 4      | 12/10/8/6           |



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Price resolution routing by product type

*For any* cake product, if `cakeProductType` is `null` then price resolution SHALL use the existing `cakePricingTiers` (single-axis: headcount → price), and if `cakeProductType` is non-null (except `wedding-cake-tasting`) then price resolution SHALL use the `cake_pricing_grid` (two-axis: sizeValue × flavourHandle → price).

**Validates: Requirements 1.5, 2.4, 9.1**

### Property 2: Pricing grid lookup correctness

*For any* pricing grid and any (sizeValue, flavourHandle) pair, `resolvePricingGridPrice(grid, sizeValue, flavourHandle)` SHALL return the matching `{ priceInCents, shopifyVariantId }` entry if one exists, or `null` if no entry matches. This applies to both regular flavour lookups and add-on lookups (where `flavourHandle = 'default'`).

**Validates: Requirements 3.3, 7.3, 8.3**

### Property 3: Pricing grid completeness validation

*For any* set of active flavour handles and available size values, the admin validation function SHALL return the exact set of missing (sizeValue, flavourHandle) combinations that lack a price entry in the pricing grid.

**Validates: Requirements 4.5**

### Property 4: Croquembouche flavour selection limit

*For any* croquembouche product with `cakeMaxFlavours = N` and any sequence of flavour toggle actions, the number of selected flavours SHALL never exceed N.

**Validates: Requirements 6.4**

### Property 5: Size options derived from pricing grid

*For any* pricing grid, the set of available size options SHALL equal the set of distinct `sizeValue` entries in that grid.

**Validates: Requirements 5.2**

### Property 6: Cart serialization round-trip

*For any* valid cart state (selected product, flavour(s), size, add-ons, computed price), serializing to the `rhubarbe:cake:cart` localStorage key and deserializing SHALL produce an equivalent cart state.

**Validates: Requirements 8.1**

### Property 7: Cart cascading removal

*For any* cart containing a main product and any number of associated add-on items, removing the main product SHALL result in a cart with zero items (main product and all add-ons removed).

**Validates: Requirements 8.2**

### Property 8: Order note completeness

*For any* checkout request with a product name, selected flavour(s), size, add-ons, and special instructions, the generated order note string SHALL contain all of: the product name, each selected flavour name, the size value, each add-on name, and the special instructions text (when non-null).

**Validates: Requirements 8.5, 8.6**

### Property 9: Unresolvable variant produces 422

*For any* checkout request where at least one line item's (sizeValue, flavourHandle) pair has no matching `shopifyVariantId` in the pricing grid, the checkout API SHALL return a 422 status code.

**Validates: Requirements 8.7**

### Property 10: Tier detail lookup by size

*For any* `cakeTierDetailConfig` array and any `sizeValue`, looking up the tier detail SHALL return the entry whose `sizeValue` matches, with the correct `layers` and `diameters` values, or null if no entry matches.

**Validates: Requirements 7.4**

## Error Handling

| Scenario | Behavior | HTTP Status |
|----------|----------|-------------|
| Pricing grid lookup finds no match for (size, flavour) | Return null, UI shows no price | N/A (client) |
| Checkout with unresolvable Shopify variant | Return error listing unresolvable items | 422 |
| Checkout with no items | Return "No items in cart" | 400 |
| Checkout with missing pickup date | Return "Pickup date is required" | 400 |
| Admin saves pricing grid with missing cells | Validation error before save, toast message | N/A (client) |
| Admin saves lead time tiers with non-ascending minPeople | Validation error, 400 from API | 400 |
| Storefront API fails to fetch Shopify variants | Continue without pricing data, log error | 200 (degraded) |
| Product has no pricing data (no tiers, no grid) | Excluded from storefront API response | N/A (filtered) |
| Croquembouche flavour selection exceeds max | UI prevents selection, shows limit message | N/A (client) |
| Legacy product with null cakeProductType | Falls through to existing single-axis logic | N/A |

## Testing Strategy

### Unit Tests

- **`resolvePricingGridPrice`**: Test with specific grids — exact match, no match, add-on with `default` handle, empty grid.
- **Grid completeness validation**: Test with complete grid, partial grid, empty grid, inactive flavours excluded.
- **Tier detail lookup**: Test with matching size, non-matching size, empty config.
- **Order note generation**: Test with all fields populated, optional fields null, croquembouche with 2 flavours, legacy single-axis item.
- **Price resolution routing**: Test legacy product uses pricingTiers, XXL uses grid, tasting uses fixed price.
- **Cart cascading removal**: Test removing main product clears add-ons, removing add-on keeps main product.
- **Admin validation**: Test non-ascending lead time tiers rejected, missing grid cells identified.

### Property-Based Tests

Property-based tests use `fast-check` (already available in the project's test toolchain via Vitest). Each property test runs a minimum of 100 iterations.

- **Property 1** (Price resolution routing): Generate random products with random `cakeProductType` values (including null). Verify the correct pricing path is selected.
  - Tag: `Feature: cake-ordering-revamp, Property 1: Price resolution routing by product type`

- **Property 2** (Pricing grid lookup): Generate random pricing grids (varying sizes, flavours, prices) and random lookup keys. Verify lookup returns the correct entry or null.
  - Tag: `Feature: cake-ordering-revamp, Property 2: Pricing grid lookup correctness`

- **Property 3** (Grid completeness validation): Generate random sets of active flavours and sizes, and random partial grids. Verify the validation function returns exactly the missing cells.
  - Tag: `Feature: cake-ordering-revamp, Property 3: Pricing grid completeness validation`

- **Property 4** (Croquembouche flavour limit): Generate random flavour lists and maxFlavours values (1–5), simulate random sequences of toggle actions. Verify selection count never exceeds max.
  - Tag: `Feature: cake-ordering-revamp, Property 4: Croquembouche flavour selection limit`

- **Property 5** (Size options from grid): Generate random pricing grids with varying sizeValues. Verify derived sizes equal the distinct set.
  - Tag: `Feature: cake-ordering-revamp, Property 5: Size options derived from pricing grid`

- **Property 6** (Cart round-trip): Generate random cart states with varying products, flavours, sizes, add-ons. Serialize and deserialize. Verify equality.
  - Tag: `Feature: cake-ordering-revamp, Property 6: Cart serialization round-trip`

- **Property 7** (Cascading removal): Generate random carts with 0–5 add-ons. Remove main product. Verify empty cart.
  - Tag: `Feature: cake-ordering-revamp, Property 7: Cart cascading removal`

- **Property 8** (Order note completeness): Generate random checkout requests with varying products, flavours, sizes, add-ons, instructions. Verify note contains all expected strings.
  - Tag: `Feature: cake-ordering-revamp, Property 8: Order note completeness`

- **Property 9** (Unresolvable variant 422): Generate random grids and checkout items where at least one item has no grid match. Verify 422 response.
  - Tag: `Feature: cake-ordering-revamp, Property 9: Unresolvable variant produces 422`

- **Property 10** (Tier detail lookup): Generate random tier detail configs and size values. Verify correct entry returned or null.
  - Tag: `Feature: cake-ordering-revamp, Property 10: Tier detail lookup by size`

### Integration Tests

- Storefront API returns both legacy and new products in the same response with correct shapes.
- Checkout API handles mixed cart with legacy and grid-based items.
- Admin PUT endpoint persists pricing grid, flavour config, tier details, and addon links correctly.
- Unique constraint on pricing grid rejects duplicate (productId, sizeValue, flavourHandle) entries.
