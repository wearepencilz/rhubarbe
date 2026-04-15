# Performance Optimization Spec

## Problem

The storefront has multiple performance bottlenecks: no image optimization, zero server-side caching on Shopify calls, duplicate client-side fetches, large unsplit client bundles, and missing Cache-Control headers on API routes.

## Audit Findings

### 🔴 Critical — Images

- **19 raw `<img>` tags** across 13 storefront files — no optimization, no responsive sizing, no WebP/AVIF
- Only **3 files** use `next/image`, and none have `sizes` prop (defaults to 100vw, serves oversized images)
- **16 of 19 `<img>` tags** missing `loading="lazy"` — including below-fold product thumbnails, cart items, editorial images
- No `width`/`height` on any `<img>` — causes layout shift (CLS)
- `next.config.js` has AVIF+WebP enabled but it's unused since almost nothing goes through `<Image>`

### 🔴 Critical — Shopify Caching

- Every Shopify Storefront API call uses `cache: 'no-store'`, hitting Shopify on **every single request**
- Server-rendered pages (`/collections/*`, `/products/*`) make uncached Shopify calls
- `getProduct()`, `getCollection()`, `getProducts()` should use `next: { revalidate: 30 }` instead

### 🔴 Critical — Duplicate Fetches

| Endpoint | Fetched by | Duplicates |
|---|---|---|
| `/api/storefront/cake-products` | CakeCartSlotRegistrar + CakeCartPanel + CakeOrderPageClient | **3x** |
| `/api/launches/current` | WeeklyCartContext + MenuWeekHomepage + MenuWeekBanner | **3x** |
| `/api/settings` | CakeOrderPageClient + CakeCartPanel + VolumeOrderPageClient | **2-3x** |
| `/api/storefront/volume-products` | CateringCartContext + VolumeOrderPageClient | **2x** |

### 🟠 High — Missing Cache-Control Headers

Only 5 of 45 GET API routes set Cache-Control. Missing from:
- `/api/pages/translations` — fetched on **every page load** via root layout
- `/api/pages/[pageName]` — CMS page content
- `/api/stories`, `/api/ingredients`, `/api/flavours/*` — archive content
- `/api/cake-capacity` — fetched repeatedly from cart panel
- `/api/settings/taxonomies/*` — taxonomy data

### 🟠 High — Bundle Size

- `OrderPageClient.tsx` — 1,059 lines, 43KB client JS
- `VolumeOrderPageClient.tsx` — 784 lines, 38KB client JS
- `framer-motion` installed but **imported by zero files** — dead dependency
- `RichTextEditor` (Tiptap ~150-200KB) statically imported by 7 admin pages

### 🟡 Medium — Unnecessary `'use client'`

These are pure rendering with no hooks/interactivity:
- `OrderReviewSummary.tsx`, `OrderPageSkeleton.tsx`, `DietaryBadges.tsx`
- `AllergenWarning.tsx`, `HeroTagline.tsx`, `OrderTypeBadge.tsx`

---

## Requirements

### Phase 1 — Quick Wins (no architecture changes)

- [ ] 1. **Fix Shopify caching**: Change `cache: 'no-store'` to `next: { revalidate: 30 }` in `getProduct()`, `getCollection()`, `getProducts()`, `getCollections()` in `lib/shopify/index.ts`. Keep `no-store` for cart mutations and admin API.
- [ ] 2. **Add Cache-Control headers** to high-traffic API routes:
  - `/api/pages/translations` — `s-maxage=300, stale-while-revalidate=600` (content changes rarely)
  - `/api/pages/[pageName]` — `s-maxage=120, stale-while-revalidate=300`
  - `/api/cake-capacity` — `s-maxage=30, stale-while-revalidate=60`
  - `/api/settings/taxonomies/*` — `s-maxage=120, stale-while-revalidate=300`
  - `/api/stories` — `s-maxage=60, stale-while-revalidate=120`
  - `/api/ingredients` — `s-maxage=60, stale-while-revalidate=120`
  - `/api/flavours/*` — `s-maxage=60, stale-while-revalidate=120`
- [ ] 3. **Remove `framer-motion`** from package.json (unused)
- [ ] 4. **Add `minimumCacheTTL: 3600`** to `next.config.js` images config (cache optimized images for 1hr)
- [ ] 5. **Remove `'use client'`** from pure rendering components: `OrderPageSkeleton.tsx`, `HeroTagline.tsx`, `OrderTypeBadge.tsx`, `DietaryBadges.tsx`, `AllergenWarning.tsx`

### Phase 2 — Image Optimization

- [ ] 6. **Convert product card images** to `next/image` with proper `sizes`:
  - `OrderPageClient.tsx` — product grid images
  - `CakeOrderPageClient.tsx` — cake product images
  - `VolumeOrderPageClient.tsx` — catering product images
  - `ProductPageClient.tsx` — product gallery
- [ ] 7. **Convert homepage images** to `next/image`:
  - `PhotoPanels.tsx`, `StorySection.tsx`, `AboutSection.tsx`, `EditorialColumns.tsx` — add `priority` to above-fold
  - `SiteHeaderClient.tsx` — logo (small, add `priority`)
  - `SiteFooter.tsx` — logo (add `loading="lazy"`)
- [ ] 8. **Add `sizes` prop** to existing `<Image fill>` in `collections/[handle]`, `collections/all`, `ComeSeeUs.tsx`
- [ ] 9. **Add `loading="lazy"`** to all below-fold `<img>` tags that aren't converted (cart thumbnails, story images)

### Phase 3 — Deduplicate Fetches

- [ ] 10. **Deduplicate `/api/storefront/cake-products`**: Lift fetch into `CakeCartContext`, expose `products` from context. Remove independent fetches from `CakeCartPanel`, `CakeCartSlotRegistrar`, `CakeOrderPageClient`.
- [ ] 11. **Deduplicate `/api/launches/current`**: Use `WeeklyCartContext` as single source. Pass launch data to `MenuWeekDisplay` via props instead of independent fetch.
- [ ] 12. **Deduplicate `/api/settings`**: Create a shared `useSettings()` hook or context that caches the response. Replace individual fetches in page components.
- [ ] 13. **Lazy-load cart slot registrars**: Defer data fetches in `CakeCartSlotRegistrar`, `WeeklyCartSlotRegistrar`, `CateringCartSlotRegistrar` until the cart drawer is first opened (they currently fetch on mount in root layout for every page).

### Phase 4 — Bundle Splitting (lower priority)

- [ ] 14. **Dynamic import `RichTextEditor`** in all 7 admin consumers with `{ ssr: false }`
- [ ] 15. **Extract `OrderPageClient.tsx`** sub-components: product grid, filter bar, menu details bar
- [ ] 16. **Extract `VolumeOrderPageClient.tsx`** sub-components: product card, inline cart

---

## Dev Environment Note

Keep local caching minimal for development:
- Shopify `revalidate: 30` only applies in production builds (`next build && next start`). In `next dev`, Next.js doesn't cache fetch by default — no change to dev experience.
- API route `Cache-Control` headers are respected by Vercel's CDN in production but ignored by the local dev server.
- `minimumCacheTTL` only affects the Next.js image optimization cache in production.
- **No changes needed** to disable caching locally — `next dev` already bypasses all of these.

## Success Metrics

- Lighthouse Performance score > 85 on storefront pages (currently estimated ~60-70)
- Eliminate duplicate fetches (reduce from ~12 redundant calls per page to 0)
- Shopify API calls reduced by ~95% via 30s revalidation
- LCP improvement from `next/image` optimization on product pages
- CLS score improvement from proper image dimensions
