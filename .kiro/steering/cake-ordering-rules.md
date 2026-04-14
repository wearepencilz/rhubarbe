---
inclusion: fileMatch
fileMatchPattern: "{app/cake/**,app/api/cake-*/**,app/api/checkout/cake/**,app/api/storefront/cake-*/**,app/admin/cake-*/**,lib/utils/cake-rules*,lib/utils/order-helpers*,lib/checkout/configs/cake*,lib/db/queries/cake-*}"
description: Cake ordering spec, rules module, and test requirements — must be checked on any cake-related change.
---

# Cake Ordering — Change Checklist

When modifying any cake-related file, you MUST:

## 1. Check the Spec

The authoritative spec is at `docs/spec/rhubarbe_cake_ordering_spec.md`. It defines:
- Product types (§1): legacy, cake-xxl, wedding-cake-tiered, croquembouche, wedding-cake-tasting, sheet-cake
- Pricing rules (§2): grid-based from Shopify variants, legacy tiers
- Flavour config (§3): active state, endDate filtering against lead time
- Allergen display (§4): consolidated union of product + flavour allergens
- Lead time (§5): tier resolution, deliveryOnly flag
- Production capacity (§6): maxCakes, overlap window logic, wedding+sheet = 1 slot
- Date rules (§7): earliest, latest, Sunday blocking, capacity blocking — all four must apply simultaneously
- Add-ons (§8): regular add-ons at main tier, sheet cake with own size/flavour/grid
- Checkout (§11): server-side capacity re-check, variant resolution

**Any change that contradicts the spec is a bug.** If the spec needs updating, update it alongside the code.

## 2. Run the Cake Tests

```bash
npx vitest run lib/utils/cake-rules.test.ts
```

This file contains 41 tests covering spec §7.7 test cases T1–T15 plus all supporting logic:
- Lead time resolution + delivery-only
- Date availability (lead time, advance cap, Sunday, capacity)
- Production capacity overlap counting
- Flavour filtering by endDate vs lead time
- Allergen consolidation
- Size resolution + croquembouche choux conversion
- Pricing grid resolution
- End-to-end order scenarios

## 3. Update Tests When Adding/Changing Rules

The pure logic lives in `lib/utils/cake-rules.ts`. If you change behavior in:
- `CakeOrderPageClient.tsx` → verify the corresponding rule in `cake-rules.ts` matches
- `app/api/checkout/cake/route.ts` → verify capacity check and variant resolution logic
- `app/api/cake-capacity/route.ts` → verify overlap logic matches `countConflicts()` in cake-rules
- `app/api/storefront/cake-products/route.ts` → verify grid building matches `resolvePricingGridPrice()`
- `lib/utils/order-helpers.ts` → run both `order-helpers.test.ts` and `cake-rules.test.ts`

If you add a new rule or change existing behavior, **add or update a test case** in `cake-rules.test.ts`.

## 4. Key Files

| File | Role |
|---|---|
| `docs/spec/rhubarbe_cake_ordering_spec.md` | Authoritative spec |
| `lib/utils/cake-rules.ts` | Pure testable logic |
| `lib/utils/cake-rules.test.ts` | 41 spec-driven tests |
| `lib/utils/order-helpers.ts` | Shared helpers (pricing grid, tier lookup) |
| `app/cake/CakeOrderPageClient.tsx` | Storefront UI |
| `app/api/checkout/cake/route.ts` | Checkout + server-side capacity |
| `app/api/cake-capacity/route.ts` | Capacity API |
| `app/api/storefront/cake-products/route.ts` | Product + pricing API |
| `app/admin/cake-products/settings/page.tsx` | maxCakes + pickup location config |
