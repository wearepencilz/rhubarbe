# Rhubarbe Catering Ordering Spec

*v1 · April 2026*

---

## Overview

Catering orders are volume orders for events. Three product types exist, each with distinct ordering rules. All logic is pure and testable via `lib/catering/`.

---

## 1. Product Types (Catering Types)

| `cateringType` | Display Name | Scope | Min Qty | Step | Notes |
|---|---|---|---|---|---|
| `brunch` | Brunch / Buffet | Per variant | 12 | 6 | Valid: 12, 18, 24, 30, … |
| `lunch` | Lunch | Per order | 6 | 1 | Valid: 6, 7, 8, 9, … |
| `dinatoire` | Dînatoire | Per order | 3 | 1 | Valid: 3, 4, 5, 6, … |

---

## 2. Ordering Rules

Rules are stored in `settings` under key `cateringOrderingRules` and enforced by `lib/catering/ordering-rules.ts`.

### 2.1 Scope

- **`variant`** (brunch): each variant quantity is validated independently. A variant with qty 0 is skipped.
- **`order`** (lunch, dinatoire): the basket total across all variants of that type is validated.

### 2.2 Validation

```
variant-scope: qty === 0 OR (qty >= variantMinimum AND (qty - variantMinimum) % increment === 0)
order-scope:   total >= orderMinimum AND (total - orderMinimum) % increment === 0
```

**Any change that contradicts these rules is a bug.** If rules need updating, update this spec alongside the code.

---

## 3. Lead Time

Stored in `settings` under key `cateringLeadTimeDays`. Default: **28 days**.

- Earliest date = `today + leadTimeDays` at local midnight.
- Enforced client-side in the date picker and server-side at checkout.
- Logic: `lib/catering/lead-time.ts` → `getEarliestCateringDate(leadTimeDays)`.

---

## 4. Menu Filtering

Catering products carry `dietaryTags` and `temperatureTags`. Filtering is client-side.

- **Dietary**: AND logic — product must match ALL selected tags.
- **Temperature**: simple match — product must include the selected tag.
- Both filters active: product must satisfy both.
- Logic: `lib/catering/menu-filter.ts` → `filterCateringMenu(products, filters)`.

### 4.1 Dietary Tags

`vegetarian` | `vegan` | `gluten-free` | `dairy-free` | `nut-free`

### 4.2 Temperature Tags

`hot` | `cold`

---

## 5. Catering Type Inference (Order Records)

When a catering order is synced from Shopify, `cateringType` is written from the `Catering Types` cart attribute. For legacy orders without this attribute, `inferCateringTypeQuantities()` in `lib/db/queries/orders.ts` parses `specialInstructions` line items (`N× Product name`) to derive per-type quantities.

**Inference rules (in priority order):**
1. Contains `petit-déjeuner`, `breakfast`, `brunch`, `buffet` → `brunch`
2. Contains `lunch box`, `lunch` → `lunch`
3. Default → `dinatoire`

---

## 6. Key Files

| File | Role |
|---|---|
| `docs/spec/rhubarbe_catering_ordering_spec.md` | This spec (authoritative) |
| `lib/catering/ordering-rules.ts` | Pure ordering rule validation |
| `lib/catering/lead-time.ts` | Lead time computation |
| `lib/catering/menu-filter.ts` | Menu filter engine |
| `lib/catering/catering-rules.test.ts` | Tests for all above |
| `lib/db/queries/orders.ts` | `inferCateringTypeQuantities` |
| `app/catering/VolumeOrderPageClient.tsx` | Storefront UI |
| `app/api/checkout/volume/route.ts` | Checkout + writes `Catering Types` attribute |
| `contexts/CateringCartContext.tsx` | Persistent cart state |
| `components/CateringCartPanel.tsx` | Cart UI (always mounted) |
| `app/admin/components/CateringProductionTimeline.tsx` | Admin fulfillment timeline |

---

## 7. Run the Tests

```bash
npx vitest run lib/catering/catering-rules.test.ts
```
