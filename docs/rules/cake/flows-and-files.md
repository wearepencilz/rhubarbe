# Cake Ordering — User Flows & File Map

## User Flows

### Self-Serve Cake Order

```
/cake page loads
  │
  ├─ GET /api/storefront/cake-products
  │    → products table (CMS metadata)
  │    → Shopify Storefront API (builds pricing grid from variants)
  │    → cake_lead_time_tiers table
  │    → cake_addon_links table
  │
  ├─ Customer selects cake type (product card)
  │
  ├─ Flavour selection appears (if grid-based or tasting)
  │    ├─ Inactive flavours hidden
  │    ├─ endDate filtering: hidden if today + min lead time > endDate
  │    └─ Allergen block renders on selection
  │
  ├─ Customer enters guest count
  │    ├─ resolveNearestSize() finds grid tier
  │    ├─ resolvePricingGridPrice() gets price + Shopify variant
  │    ├─ Lead time resolves from tier
  │    ├─ deliveryOnly flag checked
  │    └─ Re-filter flavours against resolved lead time
  │        └─ If selected flavour removed → clear + prompt
  │
  ├─ [Wedding only] Sheet cake add-on prompt
  │    ├─ Own guest count, flavour, pricing grid
  │    └─ 1 production slot combined
  │
  ├─ [Optional] Regular add-ons (priced at main cake tier)
  │
  ├─ Date picker
  │    ├─ GET /api/cake-capacity → blocked dates
  │    ├─ Earliest = today + leadTimeDays
  │    ├─ Latest = today + maxAdvanceDays
  │    ├─ Sundays disabled (from pickup location)
  │    └─ Capacity-blocked dates greyed out
  │
  └─ Checkout
       ├─ POST /api/checkout/cake
       │    ├─ Server-side capacity re-check (409 if full)
       │    ├─ Variant resolution (grid or legacy)
       │    ├─ Tax variant resolution
       │    └─ Shopify cart creation → checkoutUrl
       │
       ├─ Redirect to Shopify checkout
       │
       └─ Shopify webhook: orders-paid
            ├─ Order created in DB (orderType: 'cake')
            ├─ fulfillmentDate + leadTimeDays stored
            └─ Confirmation email sent
```

### Cake Tasting

```
Same page, tasting product type
  ├─ Multi-select up to 3 flavours
  ├─ Fixed price (first grid row)
  ├─ Consumes 1 production slot
  └─ Same date rules + checkout flow
```

## File Map

### Storefront (Customer-Facing)

| File | Role |
|---|---|
| `app/cake/page.tsx` | Page wrapper |
| `app/cake/CakeOrderPageClient.tsx` | Full storefront UI (1700+ lines) |
| `app/cake/loading.tsx` | Loading skeleton |
| `app/cake/checkout/page.tsx` | Checkout page wrapper |

### APIs

| File | Role |
|---|---|
| `app/api/storefront/cake-products/route.ts` | Public: returns cake products + Shopify pricing grid |
| `app/api/cake-capacity/route.ts` | Public: returns blocked dates for date picker |
| `app/api/checkout/cake/route.ts` | Checkout: capacity re-check + Shopify cart creation |
| `app/api/cake-products/route.ts` | Admin: list/create cake products |
| `app/api/cake-products/[id]/route.ts` | Admin: get/update cake product |
| `app/api/cake-products/[id]/sync-from-shopify/route.ts` | Admin: sync variants from Shopify |
| `app/api/cake-products/import-from-shopify/route.ts` | Admin: bulk import |

### Admin (CMS)

| File | Role |
|---|---|
| `app/admin/cake-products/page.tsx` | Product list |
| `app/admin/cake-products/[id]/page.tsx` | Product editor (tiers, flavours, add-ons, grid) |
| `app/admin/cake-products/create/page.tsx` | Create new cake product |
| `app/admin/cake-products/settings/page.tsx` | maxCakes + pickup location |
| `app/admin/cake-products/orders/page.tsx` | Orders list + Gantt timeline |
| `app/admin/cake-products/prep-sheet/page.tsx` | Prep sheet view |
| `app/admin/cake-products/pickup-list/page.tsx` | Pickup list view |
| `app/admin/cake-products/email-template/page.tsx` | Confirmation email template |
| `app/admin/cake-products/layout.tsx` | Tab navigation |

### Shared Logic

| File | Role |
|---|---|
| `lib/utils/cake-rules.ts` | Pure testable business logic |
| `lib/utils/cake-rules.test.ts` | 41 spec-driven tests |
| `lib/utils/order-helpers.ts` | Shared: pricing grid, tier lookup, date helpers |
| `lib/checkout/configs/cake.ts` | Checkout config (payload builder, earliest date) |
| `lib/checkout/types.ts` | CakeCartItem type |
| `lib/email/cake-order-confirmation.ts` | Confirmation email builder |

### Database

| File | Role |
|---|---|
| `lib/db/queries/cake-products.ts` | All cake DB queries |
| `lib/db/schema.ts` | Tables: `cake_lead_time_tiers`, `cake_pricing_tiers`, `cake_pricing_grid`, `cake_addon_links`, `cake_variants` |

### Components

| File | Role |
|---|---|
| `app/admin/components/CakeProductionTimeline.tsx` | Gantt chart (orders page) |
| `components/CartFulfillmentSection.tsx` | Shared fulfillment UI (date picker, delivery toggle) |
| `components/OrderCartPanel.tsx` | Mobile cart slide-in |

## Steering & Docs

| File | Role |
|---|---|
| `.kiro/steering/cake-ordering-rules.md` | Auto-surfaces on cake file edits |
| `docs/spec/rhubarbe_cake_ordering_spec.md` | Authoritative spec (v3) |
| `docs/ordering/ordering-cake.md` | Technical ordering flow doc |
| `docs/rules/cake/business-rules.md` | Business rules reference |
| `docs/rules/cake/testing.md` | Test infrastructure + coverage map |
| `docs/rules/cake/flows-and-files.md` | This file |
