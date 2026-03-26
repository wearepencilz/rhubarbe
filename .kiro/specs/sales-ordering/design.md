# Design Document: Volume Sales Ordering

## Overview

This design extends the existing Rhubarbe platform with a volume/bulk ordering path. Rather than introducing a new "sales channel" abstraction, we extend the existing `products` table with volume-specific fields and add supporting tables for lead time tiers and volume variants. The storefront gets a standalone `/volume-order` page. Checkout reuses the existing Shopify cart flow with additional cart attributes. A new email infrastructure handles confirmation emails.

## 1. Database Schema Changes

### 1.1 Products Table Extensions

Add columns to the existing `products` table in `lib/db/schema.ts`:

```typescript
// Volume sales fields (added to products table)
volumeEnabled: boolean('volume_enabled').notNull().default(false),
volumeDescription: customJsonb<{ en: string; fr: string }>('volume_description'),
volumeInstructions: customJsonb<{ en: string; fr: string }>('volume_instructions'),
volumeMinOrderQuantity: integer('volume_min_order_quantity'),
```

### 1.2 New Table: `volume_lead_time_tiers`

Per-product lead time rules based on quantity ranges.

```typescript
export const volumeLeadTimeTiers = pgTable('volume_lead_time_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  minQuantity: integer('min_quantity').notNull(),     // lower bound of range
  leadTimeDays: integer('lead_time_days').notNull(),   // days required
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('volume_lead_time_tiers_product_id_idx').on(table.productId),
}));
```

Example data for a product:
| minQuantity | leadTimeDays |
|-------------|-------------|
| 1           | 2           |
| 11          | 4           |
| 41          | 7           |

Tier lookup: for quantity Q, find the tier with the highest `minQuantity <= Q`.

### 1.3 New Table: `volume_variants`

Volume-specific variants with bilingual labels and Shopify mapping.

```typescript
export const volumeVariants = pgTable('volume_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  label: customJsonb<{ en: string; fr: string }>('label').notNull(),
  shopifyVariantId: text('shopify_variant_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('volume_variants_product_id_idx').on(table.productId),
  sortOrderIdx: index('volume_variants_sort_order_idx').on(table.sortOrder),
}));
```

### 1.4 Orders Table Extensions

Add columns to the existing `orders` table:

```typescript
// Volume order fields (added to orders table)
orderType: text('order_type').notNull().default('launch'),  // "launch" | "volume"
fulfillmentDate: timestamp('fulfillment_date'),
allergenNotes: text('allergen_notes'),
```

Add index: `orderTypeIdx: index('orders_order_type_idx').on(table.orderType)`

Backward compatibility: all existing orders default to `orderType = "launch"`.

### 1.5 New Table: `email_templates`

Admin-configurable bilingual email templates.

```typescript
export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateKey: text('template_key').notNull().unique(),  // e.g. "volume-order-confirmation"
  subject: customJsonb<{ en: string; fr: string }>('subject').notNull(),
  body: customJsonb<{ en: string; fr: string }>('body').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### 1.6 New Table: `email_logs`

Audit trail for all transactional emails.

```typescript
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipientEmail: text('recipient_email').notNull(),
  templateKey: text('template_key').notNull(),
  orderId: text('order_id'),
  status: text('status').notNull(),  // "sent" | "failed"
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
});
```

## 2. API Routes

### 2.1 Admin Volume Product APIs

**`GET /api/volume-products`** — List all products where `volumeEnabled = true`
- Returns: `{ id, name, image, volumeMinOrderQuantity, tierCount, status }`

**`GET /api/volume-products/[id]`** — Single volume product with tiers and variants
- Returns: product fields + `leadTimeTiers[]` + `volumeVariants[]`

**`PUT /api/volume-products/[id]`** — Update volume config
- Body: `{ volumeEnabled, volumeDescription, volumeInstructions, volumeMinOrderQuantity, leadTimeTiers[], volumeVariants[] }`
- Validates tier ordering (ascending `minQuantity`, no gaps)
- Replaces tiers and variants in a transaction

### 2.2 Storefront Volume Products API

**`GET /api/storefront/volume-products`** — Public endpoint for the volume ordering page
- Returns only products where `volumeEnabled = true` AND at least one lead time tier exists
- Response shape per product:
  ```typescript
  {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    price: number | null;
    volumeDescription: { en: string; fr: string };
    volumeInstructions: { en: string; fr: string };
    volumeMinOrderQuantity: number;
    allergens: string[];
    leadTimeTiers: Array<{ minQuantity: number; leadTimeDays: number }>;
    variants: Array<{ id: string; label: { en: string; fr: string }; shopifyVariantId: string | null }>;
  }
  ```
- Does NOT return any launch/menu/pickup data

### 2.3 Volume Checkout API

**`POST /api/checkout/volume`** — Creates a Shopify cart for a volume order

Request body:
```typescript
{
  items: Array<{
    productId: string;
    productName: string;
    variantId: string;        // volume_variants.id
    variantLabel: string;
    shopifyVariantId: string;
    quantity: number;
    price: number;
  }>;
  fulfillmentDate: string;     // ISO datetime
  allergenNote: string | null; // order-level
  locale: string;              // "en" | "fr"
}
```

Cart attributes attached to Shopify cart:
```
Order Type = volume
Fulfillment Date = <ISO date>
Allergen Note = <text>
```

Order note format:
```
Type: Volume Order
Fulfillment: March 28, 2026 at 10:00 AM
10× Lunch Box — Chef's Choice
8× Lunch Box — Vegetarian
5× Lunch Box — Vegan
Allergen concerns: No peanuts, dairy-free for 3 boxes
```

### 2.4 Webhook Handler Modifications

Modify `processShopifyOrder()` in `app/api/shopify/webhooks/orders-paid/route.ts`:

1. Check cart attributes for `Order Type`
2. If `Order Type === "volume"`:
   - Set `orderType = "volume"` on the order record
   - Extract `Fulfillment Date` → `fulfillmentDate`
   - Extract `Allergen Note` → `allergenNotes`
3. If no `Order Type` attribute → default to `"launch"` (backward compatible)
4. After storing a volume order, trigger the confirmation email sender

### 2.5 Email Template API

**`GET /api/settings/email-templates/[key]`** — Get template by key
**`PUT /api/settings/email-templates/[key]`** — Update template subject/body

## 3. Frontend Architecture

### 3.1 Volume Storefront Page

**Route:** `app/volume-order/page.tsx` (server) + `app/volume-order/VolumeOrderPageClient.tsx` (client)

Completely isolated from `/order` — no shared state, no launch dependencies.

**Page flow:**
1. Fetch volume products from `/api/storefront/volume-products`
2. Display product cards with variant quantity inputs
3. Customer selects quantities per variant → lead time recalculates → date picker updates
4. Customer picks fulfillment date/time
5. Customer enters order-level allergen note
6. Order summary → checkout button → POST `/api/checkout/volume` → redirect to Shopify

**Key client-side logic:**

```typescript
// Lead time tier lookup
function getLeadTimeDays(tiers: LeadTimeTier[], totalQuantity: number): number {
  // Find the tier with the highest minQuantity that is <= totalQuantity
  const applicable = tiers
    .filter(t => t.minQuantity <= totalQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity);
  return applicable[0]?.leadTimeDays ?? 0;
}

// Earliest fulfillment date
function getEarliestDate(leadTimeDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + leadTimeDays);
  return date;
}
```

**State shape:**
```typescript
interface VolumeOrderState {
  products: VolumeProduct[];
  cart: Map<string, number>;           // variantId → quantity
  fulfillmentDate: Date | null;
  allergenNote: string;
  checkoutLoading: boolean;
  checkoutError: string | null;
}
```

### 3.2 Navigation Links

Add bilingual link to `/volume-order` in:
- Site navigation component (alongside existing `/order` link)
- Site footer navigation

### 3.3 Admin Pages

**`app/admin/volume-products/page.tsx`** — List view
- Uses existing `DataTable` pattern
- Columns: Product Name, Min Qty, Lead Time Tiers (count), Status
- Row click → edit page

**`app/admin/volume-products/[id]/page.tsx`** — Edit view
- Uses existing `EditPageLayout` pattern
- Sections:
  - Volume toggle (enable/disable with confirmation on disable)
  - Bilingual description + instructions (`TranslationFields`)
  - Minimum order quantity input
  - Lead time tiers inline editor (add/remove rows, validate on save)
  - Variant editor (add/remove/reorder, bilingual labels, Shopify variant ID)

**`app/admin/volume-products/email-template/page.tsx`** — Email template editor
- Bilingual subject + body fields using `TranslationFields`
- Variable reference guide shown alongside editor

**Admin orders page extension:**
- Add order type filter (All / Launch / Volume) to existing orders list
- Show fulfillment date, allergen notes columns for volume orders

## 4. Email System Architecture

### 4.1 Email Service (`lib/email/send.ts`)

```typescript
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateKey?: string;
  orderId?: string;
}

async function sendEmail(options: SendEmailOptions): Promise<boolean>
```

- Uses an external provider (Resend recommended — simple API, good DX)
- API key via `RESEND_API_KEY` env var
- Validates email format before sending
- Logs to `email_logs` table on every attempt
- Retry: up to 3 attempts with exponential backoff (1s, 2s, 4s)

### 4.2 Template Interpolation (`lib/email/interpolate.ts`)

```typescript
function interpolateTemplate(template: string, variables: Record<string, string>): string
```

Supported variables for volume order confirmation:
- `{{orderNumber}}`, `{{customerName}}`
- `{{fulfillmentDate}}`, `{{fulfillmentTime}}`
- `{{variantBreakdown}}` — formatted list of variants with quantities
- `{{allergenNote}}` — omitted section if empty
- `{{totalQuantity}}`

### 4.3 Volume Order Confirmation (`lib/email/volume-order-confirmation.ts`)

```typescript
async function sendVolumeOrderConfirmation(order: OrderWithItems, locale: 'en' | 'fr'): Promise<void>
```

1. Fetch template from `email_templates` table (key: `"volume-order-confirmation"`)
2. Select locale-appropriate subject and body
3. Interpolate variables from order data
4. Call `sendEmail()`
5. Called from webhook handler after storing a volume order

### 4.4 Webhook Integration

In `processShopifyOrder()`, after successfully storing a volume order:

```typescript
if (orderType === 'volume') {
  try {
    await sendVolumeOrderConfirmation(createdOrder, locale);
  } catch (err) {
    console.error('[Webhook] Email send failed for order', created.orderNumber, err);
    // Don't fail the webhook — email failure is non-blocking
  }
}
```

## 5. Data Flow Diagram

```
Customer                    Rhubarbe                         Shopify
   │                           │                                │
   │  GET /volume-order        │                                │
   │──────────────────────────>│                                │
   │  (fetches volume products)│                                │
   │<──────────────────────────│                                │
   │                           │                                │
   │  Select variants + qty    │                                │
   │  Pick fulfillment date    │                                │
   │  Enter allergen note      │                                │
   │                           │                                │
   │  POST /api/checkout/volume│                                │
   │──────────────────────────>│  createCart() with attributes  │
   │                           │───────────────────────────────>│
   │                           │  checkoutUrl                   │
   │                           │<───────────────────────────────│
   │  redirect to Shopify      │                                │
   │<──────────────────────────│                                │
   │                           │                                │
   │  (pays on Shopify)        │                                │
   │──────────────────────────────────────────────────────────>│
   │                           │  webhook: orders/paid          │
   │                           │<───────────────────────────────│
   │                           │  store order (type=volume)     │
   │                           │  send confirmation email       │
   │  (receives email)         │                                │
   │<──────────────────────────│                                │
```

## 6. Correctness Properties

1. **Lead time tier ordering**: Tiers for a product must have strictly ascending `minQuantity` values. The API must reject saves that violate this.
2. **Minimum quantity enforcement**: The storefront must prevent checkout when any product's total variant quantity is below its `volumeMinOrderQuantity`.
3. **Date validation**: The selected fulfillment date must be >= today + applicable lead time days for the ordered quantity.
4. **Order type backward compatibility**: All existing orders without an `orderType` field must be treated as `"launch"`.
5. **Allergen note is order-level**: The allergen note is stored once per order, not per product or per variant line.
6. **Email non-blocking**: Email send failures must not cause the webhook to return an error to Shopify.
