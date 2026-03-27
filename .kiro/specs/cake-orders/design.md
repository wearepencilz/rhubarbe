# Design Document: Cake Orders

## Overview

The Cake Orders feature adds a dedicated ordering flow for custom cakes, closely mirroring the existing Volume Orders architecture. It spans the full stack: database schema (Drizzle ORM + PostgreSQL), admin CRUD pages, public storefront page, API routes, and Shopify checkout integration — all with bilingual EN/FR support.

The key architectural differences from Volume Orders:
- Lead time tiers are keyed on **number of people** (not quantity)
- Fulfillment is **pickup-only** (no delivery toggle)
- Additional order metadata: **event type** dropdown and **special instructions** textarea
- A single **number of people** input drives lead time calculation (instead of per-variant quantity sums)

The feature reuses the same shared admin components (EditPageLayout, TranslationFields, AdminLocaleSwitcher, Table/TableCard, Badge, Button, ConfirmModal), the same Shopify cart creation helper (`lib/shopify/cart.ts`), and the same convention-based tax-exempt variant resolution (`lib/tax/find-exempt-variant.ts`).

## Architecture

The cake orders feature follows the same layered architecture as volume orders:

```mermaid
graph TD
    subgraph Storefront
        A[Cake Order Page<br/>app/cake-order/CakeOrderPageClient.tsx]
        B[Storefront API<br/>GET /api/storefront/cake-products]
        C[Checkout API<br/>POST /api/checkout/cake]
    end

    subgraph Admin
        D[List Page<br/>app/admin/cake-products/page.tsx]
        E[Edit Page<br/>app/admin/cake-products/[id]/page.tsx]
        F[Email Template Page<br/>app/admin/cake-products/email-template/page.tsx]
        G[Admin API<br/>/api/cake-products]
    end

    subgraph Data Layer
        H[DB Queries<br/>lib/db/queries/cake-products.ts]
        I[Schema<br/>lib/db/schema.ts]
        J[Shopify Cart<br/>lib/shopify/cart.ts]
    end

    A --> B
    A --> C
    C --> J
    C --> H
    D --> G
    E --> G
    F -->|PUT /api/settings/email-templates/cake-order-confirmation| G
    G --> H
    B --> H
    H --> I
```

### Design Decisions

1. **Separate tables for cake tiers/variants** (not reusing volume tables): Keeps concerns isolated, allows independent schema evolution, and avoids coupling cake and volume features.

2. **New product-level fields** (`cakeEnabled`, `cakeDescription`, `cakeInstructions`, `cakeMinPeople`): Follows the same pattern as `volumeEnabled` etc. on the `products` table. This avoids a separate products table while keeping cake config co-located with the product.

3. **Pickup-only enforcement**: Hardcoded at both the API level (checkout always sets `Fulfillment Type = "pickup"`) and the UI level (no delivery toggle rendered). This is simpler than a configurable toggle since cakes are inherently pickup-only.

4. **Number of people as lead time driver**: Unlike volume orders where the sum of variant quantities drives lead time, cake orders use a single "number of people" input. This is a UX simplification — the customer specifies the party size once, and that value determines the lead time across all items.

5. **Reuse of `orders` table**: Cake orders use `orderType = "cake"` in the existing `orders` table. Cake-specific metadata (number of people, event type) is stored in the Shopify order note/attributes and extracted during webhook processing. The existing `allergenNotes` field is repurposed for special instructions.

## Components and Interfaces

### Database Layer

**New schema additions in `lib/db/schema.ts`:**
- `cakeEnabled`, `cakeDescription`, `cakeInstructions`, `cakeMinPeople` fields on `products` table
- `cakeLeadTimeTiers` table (mirrors `volumeLeadTimeTiers` with `minPeople` instead of `minQuantity`)
- `cakeVariants` table (mirrors `volumeVariants`)

**New queries module `lib/db/queries/cake-products.ts`:**
- `listCakeProducts()` — all cake-enabled products with tier count
- `listNonCakeProducts()` — candidates for enabling
- `getCakeProductById(id)` — single product with tiers + variants
- `updateCakeConfig(id, data)` — update cake fields on product
- `getCakeLeadTimeTiers(productId)` — tiers ordered by minPeople
- `setCakeLeadTimeTiers(productId, tiers)` — replace tiers (transactional)
- `getCakeVariants(productId)` — variants ordered by sortOrder
- `setCakeVariants(productId, variants)` — replace variants (transactional)

### API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/cake-products` | GET | Admin | List cake-enabled products (or candidates with `?candidates=true`) |
| `/api/cake-products` | POST | Admin | Enable cake ordering on a product |
| `/api/cake-products/[id]` | GET | Admin | Get single cake product with tiers/variants |
| `/api/cake-products/[id]` | PUT | Admin | Update cake config, tiers, variants |
| `/api/storefront/cake-products` | GET | Public | Storefront product listing with tiers/variants |
| `/api/checkout/cake` | POST | Public | Create Shopify cart with cake metadata |

### Admin Pages

| Page | Path | Description |
|------|------|-------------|
| Cake Products List | `/admin/cake-products` | Table of cake-enabled products with Add Product modal |
| Cake Product Edit | `/admin/cake-products/[id]` | Configure cake settings, tiers, descriptions |
| Cake Email Template | `/admin/cake-products/email-template` | Customize cake order confirmation email |

### Storefront Page

| Page | Path | Description |
|------|------|-------------|
| Cake Order | `/cake-order` | Product grid + inline cart sidebar + checkout |

### Shared Components Used

- `EditPageLayout` — page chrome with save/cancel/dirty-state bar
- `TranslationFields` — bilingual EN/FR field editing
- `AdminLocaleSwitcher` — locale toggle for admin
- `Table`, `TableCard` — data table with header/badge
- `Badge` — status badges
- `Button` — primary/secondary actions
- `ConfirmModal` — disable confirmation dialog
- `DatePickerField` — date selection (dynamic import, no SSR)
- `useToast` — success/error notifications

### Storefront Client Components

- `CakeOrderPageClient` — main page component (mirrors `VolumeOrderPageClient`)
- `CakeProductCard` — product card with variant inputs, lead time display
- `CakeInlineCart` — sidebar cart with event type, number of people, date picker, special instructions

## Data Models

### Products Table Extensions

```typescript
// New fields on the existing `products` table
cakeEnabled: boolean('cake_enabled').notNull().default(false),
cakeDescription: customJsonb<{ en: string; fr: string }>('cake_description'),
cakeInstructions: customJsonb<{ en: string; fr: string }>('cake_instructions'),
cakeMinPeople: integer('cake_min_people'),
```

### Cake Lead Time Tiers Table

```typescript
export const cakeLeadTimeTiers = pgTable('cake_lead_time_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  minPeople: integer('min_people').notNull(),
  leadTimeDays: integer('lead_time_days').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('cake_lead_time_tiers_product_id_idx').on(table.productId),
}));
```

### Cake Variants Table

```typescript
export const cakeVariants = pgTable('cake_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  label: customJsonb<{ en: string; fr: string }>('label').notNull(),
  shopifyVariantId: text('shopify_variant_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('cake_variants_product_id_idx').on(table.productId),
  sortOrderIdx: index('cake_variants_sort_order_idx').on(table.sortOrder),
}));
```

### Checkout Request Shape

```typescript
interface CakeCheckoutRequest {
  items: Array<{
    productId: string;
    productName: string;
    variantId: string;
    variantLabel: string;
    shopifyVariantId: string;
    shopifyProductId?: string;
    quantity: number;
    price: number;
  }>;
  pickupDate: string;        // ISO date string
  numberOfPeople: number;
  eventType: string;          // "birthday" | "wedding" | "corporate" | "other"
  specialInstructions: string | null;
  locale: string;             // "en" | "fr"
}
```

### Shopify Cart Attributes (Cake Order)

```
Order Type: "cake"
Cake Product: <productId>
Pickup Date: <ISO date>
Fulfillment Type: "pickup"
Number of People: <number>
Event Type: <eventType>
Special Instructions: <text> (if provided)
```

### Order Note Format

```
Type: Cake Order / Commande de gâteau
Pickup: January 15, 2025
People: 25
Event: Birthday / Anniversaire
2× Chocolate Cake — Large
Special instructions: Nut-free please
```

