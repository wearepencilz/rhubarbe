# Draft Orders

> **Status:** Spec draft. No implementation yet.
> **Scope:** Replace `createCart` (Storefront) → hosted checkout with `draftOrderCreate` (Admin) → invoice URL across all three ordering flows.
> **Spirit:** Keep real Shopify products and variants as the source of truth for pricing and SKUs. The only thing we're taking back from Shopify is the checkout's delivery/shipping/pickup UI, which we already handle ourselves in Next.js.

---

## Problem statement

The three ordering flows funnel through `createCart` → Shopify-hosted checkout. That checkout exposes shipping methods, delivery options, and pickup pickers we don't use. We work around it by:

1. Setting all our products to "no shipping required" so the shipping step disappears.
2. Cramming pickup date, fulfillment type, lead time, flavour selections, event details, and allergen notes into freeform `cart attributes` that the webhook later re-parses.
3. Maintaining duplicate `Tax=true` / `Tax=false` variants so we can swap mid-checkout to apply the pâtisserie threshold rule.
4. Having no path for staff-mediated orders. Custom cakes and wedding inquiries currently mean manual order entry or off-Shopify payment links.

The fundamental tension: Shopify's checkout assumes it owns fulfillment. We own fulfillment. Cart attributes are how we're currently smuggling our fulfillment data past Shopify's checkout.

Draft Orders flip this around. The Admin API treats line items, custom attributes, and notes as structured data. Shopify's invoice/payment page only handles payment. Our pickup/delivery picker, our date logic, our capacity system stay where they belong.

---

## Goal

```
Next.js (cart + fulfillment UI as today)
  → POST /api/checkout/[type]
    → existing validation (capacity, lead time, ordering rules)
    → resolve real Shopify variants (as today)
    → draftOrderCreate via Admin API
    → return invoiceUrl
  → redirect to Shopify-hosted invoice page (payment only)
  → Shopify converts paid draft → order
  → orders/paid webhook → orders table
```

Same products. Same variants. Same prices on those variants. New checkout transport.

---

## What stays exactly the same

- **Every product in Shopify stays a real product** with real variants and real prices. Cake size × flavour grids, catering variants, weekly menu items — untouched.
- **Variant resolution logic.** Cake grid lookup (`sizeValue` + `flavourHandle` exact match). Volume variant resolution. `getProductVariantId()` for menu items. All unchanged.
- **Pricing comes from Shopify variants.** Draft order lines reference `variantId` and let Shopify carry the price. We do **not** pass `originalUnitPrice` unless we have to (see "Tax handling" below).
- **Live price fetching, inventory polling, the products table, the launches table, the catering settings.** All unchanged.
- **Server-side validation.** Capacity, lead time tiers, Sunday blocks, ordering rules, max advance days, variant resolution errors — all run before draft creation, same as before cart creation today.
- **Frontend payloads to `/api/checkout/*`.** Request bodies don't change.
- **Confirmation emails.**
- **`orders` and `order_items` schema.** Plus one new column: `draftOrderId`.

---

## What changes

### Cart attributes → Draft Order custom attributes (structured)

Same data, structured location. Shopify Draft Orders support both order-level `customAttributes` and per-line `customAttributes` natively.

**Order-level** (was: cart attributes):
- `Order Type: cake | volume | launch`
- `Fulfillment Type: pickup | delivery`
- `Fulfillment Date: YYYY-MM-DD`
- `Pickup Location` / `Pickup Address` / `Pickup Slot`
- `Delivery Address` (split into structured fields)
- `Lead Time Days`
- `Allergen Note`
- `Event Type`
- `Menu` / `Menu ID` (launch only)

**Per-line** (new — currently impossible with cart attributes):
- Cakes: `Flavour`, `Number of People`, `Tier Detail`
- Cake add-ons: `Add-on of: <parent line ref>` (links sheet cake or topper to its parent cake line)
- Tasting: `Selected Flavours: a, b, c`
- Catering: `Catering Type: brunch | lunch | dinatoire`

The webhook reads these as structured fields on the order, not as a parseable note string.

### `cart attributes` order summary string → `note`

The human-readable order summary we currently build for the cart's `note` field stays. Same content, same place. Staff in Shopify Admin still see "30 ppl Zucchini cake, pickup Saturday, allergen note: tree nuts."

### Checkout transport

`createCart` (Storefront) → `draftOrderCreate` (Admin). That's the actual code change. Everything around it is preserved.

### `skippedItems` becomes a hard failure

Today, items with unresolvable variants are silently dropped and returned in `skippedItems`. With draft orders, we should refuse to create the draft if any item is unresolvable. A draft is a higher-trust object than a cart. Surface the error to the customer; don't proceed.

---

## Tax handling (the one thing that needs care)

The pâtisserie threshold rule (1–5 taxable, 6+ exempt) currently works via duplicate `Tax=false` variants and runtime swapping. With draft orders we have two options:

**Option A — keep the variant swap.** It already works. Draft orders accept any variant. Nothing to change. We retain the catalog bloat but don't introduce risk.

**Option B — drop the duplicates, apply tax exemption via line `taxable: false`.** Shopify Draft Orders accept a `taxable` boolean per line. Set it to `false` when the threshold rule says exempt. Cleaner catalog, requires verification that QC GST/QST behave correctly under this flag.

Recommendation: ship v1 with **Option A** to keep the variant resolution logic 100% identical. Move to Option B in a follow-up after verification with the actual tax setup. Reduces switchover risk.

This means: real products, real variants, real prices stay the source of truth. The variant swap stays. Only the checkout transport changes in v1.

---

## Why this works for Rhubarbe specifically

The current architecture already does the hard part right: a custom cart in Next.js, real products in Shopify, fulfillment logic owned by us. The Storefront `createCart` step is the awkward seam. It exists only to get the customer to a Shopify payment page, but it imports Shopify's checkout assumptions along the way (shipping, taxes via variant trickery, attribute size limits, no per-line custom data).

Draft orders are the right transport for this exact split:
- Customer never sees Shopify's pickup or delivery pickers (we already collected that data).
- Customer sees Shopify's hosted payment page (we want this — payments are not our problem).
- Staff get a real Shopify Order at the end, with structured attributes the kitchen can read.

The cart attributes approach was always a workaround. Draft orders are the supported pattern.

---

## What this also unlocks (later, not v1)

Not part of the migration, but worth flagging because the architecture supports them once we're on draft orders:

- **Custom cake / wedding inquiries → invoice.** Staff build a draft in Shopify Admin (or eventually a CMS screen), set price, send invoice URL.
- **Deposits.** Draft orders support partial collection in some Shopify configurations.
- **Order edits before payment.** Staff can adjust a draft (add a flavour change, fix a guest count) before the customer pays.

These are a separate spec. Do not build them in v1.

---

## Per-flow notes

### Cakes (`/cake` → `POST /api/checkout/cake`)

- Main cake: one line, real variant from the size × flavour grid, line attributes for `Flavour`, `Number of People`, `Tier Detail`.
- Add-ons: one line per add-on, real variant, line attribute `Add-on of: <parent variant SKU or line index>`.
- Sheet cake add-on: real variant from its own grid, full line attributes (its own flavour and guest count).
- Tasting: real variant for the tasting product, line attribute `Selected Flavours: a, b, c`. Still consumes one production slot.

Validation order (unchanged): items present → fulfillment date → Sunday block → lead time → max advance days → capacity → variant resolution → draft creation.

### Catering (`/catering` → `POST /api/checkout/volume`)

- One line per cart entry, real variant, line attribute `Catering Type`.
- Order-level note attributes include `Catering Types` (deduped list).
- Skipped items now block draft creation instead of silently dropping.

Validation (unchanged): items → fulfillment date → per-item lead time (max across lines) → Sunday block (with any-day delivery override) → ordering rules → variant resolution → draft creation.

### Weekly menu (`/order` → `POST /api/checkout`)

- One line per cart product, real variant, no per-line attributes needed.
- Order-level note attributes carry menu and pickup data.

Validation (unchanged): order window open → variant resolution → slot capacity if relevant → draft creation.

---

## API shape

### `POST /api/checkout/[type]` — request unchanged

Frontend keeps sending the same payload it sends today.

### Response

```json
{
  "invoiceUrl": "https://rhubarbemtl.myshopify.com/...",
  "draftOrderId": "gid://shopify/DraftOrder/123"
}
```

Frontend redirects to `invoiceUrl`. From the customer's view: identical UX, except the payment page no longer has a delivery/pickup step (which is what we want).

### `draftOrderCreate` payload (illustrative, cake order)

```graphql
mutation {
  draftOrderCreate(input: {
    lineItems: [
      {
        variantId: "gid://shopify/ProductVariant/...",  # real variant from Shopify
        quantity: 1,
        customAttributes: [
          { key: "Flavour", value: "Zucchini" },
          { key: "Number of People", value: "50" },
          { key: "Tier Detail", value: "3 layers, 8/10/12 inch" }
        ]
      }
    ],
    note: "Zucchini cake for 50, delivery Saturday May 15, allergen note: tree nuts",
    customAttributes: [
      { key: "Order Type", value: "cake" },
      { key: "Fulfillment Type", value: "delivery" },
      { key: "Fulfillment Date", value: "2026-05-15" },
      { key: "Lead Time Days", value: "14" },
      { key: "Delivery Address", value: "..." },
      { key: "Event Type", value: "wedding" }
    ],
    email: "customer@example.com",
    tags: ["cake", "delivery"]
  }) {
    draftOrder { id, invoiceUrl }
  }
}
```

Note: no `originalUnitPrice`. The variant's price is the price.

---

## Webhook changes

`orders/paid` endpoint stays. Handler:

1. Reads `note_attributes` (structured, was the same data as cart attributes).
2. Reads line `properties` for line-specific data (flavour, guest count, add-on parent).
3. Determines `orderType` from `Order Type` note attribute.
4. Writes `orders` and `order_items` as today, plus `draftOrderId` for traceability.
5. Sends confirmation emails.

Net: simpler, because line-specific data comes through line properties instead of being reconstructed from a single attribute blob.

---

## What to remove

- `createCart` (Storefront) calls in all three checkout routes.
- The order-summary string assembly that exists only to fit cart-attribute size limits.
- Cart-attribute parsing in the webhook (replaced by structured note_attributes / line properties).

**Keep:**
- All real products, all real variants, all real Shopify prices.
- Tax-exempt duplicate variant logic (for v1; revisit in a follow-up).
- All variant resolution logic.

---

## Out of scope (v1)

- Drop tax-exempt variants in favour of `taxable: false` on lines.
- Staff-built drafts via a CMS UI.
- Deposit / partial payment flows.
- Wedding cake "send a custom invoice after consultation" workflow.

---

## Open questions

1. **Invoice URL expiry.** Confirm draft order invoice URLs don't expire before the customer pays, or define a resend path.
2. **Admin API rate limits.** Cost-based throttling on Admin is stricter than Storefront. Likely fine at current order volume; flag for catering high season.
3. **Tax-exempt variant verification.** Test that QC GST/QST applies correctly when a draft order references a `Tax=false` variant. Should be identical to current cart behaviour, but verify before switchover.
4. **Tasting bookings.** Stay in this flow as a draft + low-cost line, or split out as a non-commerce booking object? Lean toward keeping in this flow for v1.
5. **Skipped item policy.** Confirm: any unresolvable item blocks draft creation. (Lean yes — drafts are higher-stakes than carts.)

---

## Migration plan

1. Build `ShopifyAdminClient` (auth, retry, error shape mirroring the Storefront client).
2. Add `draftOrderId` column to `orders`. Nullable, backfilled null for legacy orders.
3. Implement the `draftOrderCreate` path behind a feature flag in `/order` (simplest flow).
4. Shadow mode: build the draft payload, log it, but still create the Storefront cart. Compare structured output against current cart attributes.
5. Flip flag on `/order`. Watch a week.
6. Repeat for `/cake`, then `/catering`.
7. Remove `createCart` code paths and old webhook attribute parsing.

Each flow flips independently. Rollback is a feature flag.

---

## Key dependencies

```
/[order|cake|catering] → POST /api/checkout/[type]
  → existing validation (capacity, lead time, ordering rules — unchanged)
  → existing variant resolution (real Shopify variants — unchanged)
  → ShopifyAdminClient.draftOrderCreate
    → returns { invoiceUrl, draftOrderId }
  → frontend redirects to invoiceUrl
  → Shopify hosted invoice page → payment
  → orders/paid webhook
    → reads structured note_attributes + line properties
    → writes orders + order_items (with draftOrderId)
```
