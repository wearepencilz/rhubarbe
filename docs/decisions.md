# Architectural Decision Log

Record of significant design and technology decisions. Newest first.

## How to Use This Log

When making a decision that changes architecture, introduces a dependency, or sets a precedent, add an entry here. Format:

```
### ADR-NNN: Title
**Date:** YYYY-MM-DD | **Status:** accepted / superseded / deprecated
**Context:** Why the decision was needed.
**Decision:** What was decided.
**Consequences:** What changed, what to watch out for.
```

---

## Decisions

### ADR-014: Typography Token System
**Date:** 2026-04-25 | **Status:** accepted
**Context:** The storefront had 155+ arbitrary pixel font sizes across 23 files. Admin had no way to adjust type. Sizes were inconsistent and unresponsive.
**Decision:** Created a 19-token type scale in `lib/design/tokens.ts` with desktop/mobile values, 3 font stacks, and a `typeStyle()` helper. Added an admin editor at `/admin/design`. Tokens inject as CSS custom properties via `DesignTokensStyle` server component. Mobile responsiveness is automatic via media query swap at 767px.
**Consequences:** New storefront pages must use `typeStyle()` — no arbitrary `text-[Xpx]` or raw Tailwind text classes. PageRenderer sections are fully tokenized. Legacy pages still use raw values (migration ongoing). Steering rule enforces this.

### ADR-013: CMS Page Builder with Section System
**Date:** 2026-04-25 | **Status:** accepted
**Context:** Pages (home, about, journal, recipes) were hardcoded layouts. Content changes required code deploys.
**Decision:** Built a section-based page builder. Pages store a `sections: Section[]` array. 18 section types (hero, text, FAQ, image-with-text, quote, etc.) render via `PageRenderer`. Admin gets a drag-and-drop section editor with a section library. Journal and Recipe entities also use the section system for body content.
**Consequences:** New page layouts are composable without code changes. Section types are extensible. The `PageRenderer` is the single rendering path for all section-based content.

### ADR-012: Auth Migration — NextAuth → Clerk
**Date:** 2026-04-24 | **Status:** accepted
**Context:** NextAuth with credentials provider was fragile — no password reset, no MFA, no user management UI. Rolling our own user system was maintenance overhead.
**Decision:** Migrated to Clerk for authentication. Removed the custom user table and NextAuth config. Admin login uses Clerk's `SignIn` component at `/admin/login/[[...sign-in]]`. Middleware checks Clerk session for `/admin/*` routes.
**Consequences:** Removed `lib/auth.ts`, custom user CRUD, and the users admin page (now managed in Clerk dashboard). Simplified middleware. Added `@clerk/nextjs` dependency.

### ADR-011: Cake Ordering — Pure Logic Module with Spec-Driven Tests
**Date:** 2026-03-27 | **Status:** accepted
**Context:** Cake ordering has complex rules (lead times, capacity, date blocking, pricing grids, sheet cake add-ons). Logic was scattered across UI components and API routes.
**Decision:** Extracted all cake ordering logic into `lib/utils/cake-rules.ts` — a pure, testable module. Wrote 41 tests in `cake-rules.test.ts` covering every spec section. The authoritative spec lives at `docs/spec/rhubarbe_cake_ordering_spec.md`.
**Consequences:** Any cake rule change must update the spec, the rules module, and the tests together. Steering rule (`cake-ordering-rules.md`) enforces this. UI and API routes call into the rules module rather than implementing logic directly.

### ADR-010: Three Separate Ordering Flows
**Date:** 2026-03 | **Status:** accepted
**Context:** Regular orders, cake orders, and catering/volume orders have fundamentally different UX, pricing, and fulfillment rules.
**Decision:** Three independent ordering paths: `/order` (regular), `/cake` (cake), `/catering` (volume). Each has its own page client, checkout route, and cart context. A global cart component manages all three contexts with persistent state.
**Consequences:** Cart state is split across three contexts. Checkout routes are separate (`/api/checkout`, `/api/checkout/cake`, `/api/checkout/volume`). Admin orders page shows all types with an `OrderTypeBadge`.

### ADR-009: Shopify as Commerce Layer, CMS as Content Layer
**Date:** 2026-03 | **Status:** accepted
**Context:** Needed to decide where products, pricing, and editorial content live.
**Decision:** Shopify owns all commerce (products, pricing, inventory, checkout, payments). The CMS owns all content (flavours, ingredients, batches, stories, launches). Next.js API routes handle the integration. A flavour's archive status is independent of its Shopify product status.
**Consequences:** Never store prices in the CMS. Never store editorial content in Shopify metafields. Product pages fetch pricing live from Shopify. The `shopifyProductId` field on flavours is the only link between systems. Steering rule (`skill-shopify-cms-integration.md`) enforces boundaries.

### ADR-008: Drizzle ORM with Postgres
**Date:** 2026-03 | **Status:** accepted
**Context:** Started with JSON files in `public/data/` for dev storage. Needed a real database for production.
**Decision:** Adopted Drizzle ORM with PostgreSQL (Vercel Postgres). Schema defined in `lib/db/schema.ts`. Migrations via `drizzle-kit`. UUID primary keys with `defaultRandom()`. JSON columns use `customJsonb<T>()` from `lib/db/custom-types`.
**Consequences:** All entities use the same schema pattern (uuid PK, createdAt, updatedAt). Many-to-many relationships use JSON arrays of IDs (not join tables) — this is a deliberate simplicity trade-off. Build command runs migrations before `next build`.

### ADR-007: Untitled UI for Admin Design System
**Date:** 2026-03 | **Status:** accepted
**Context:** Admin UI needed a consistent, accessible component library. Didn't want to build from scratch or use a heavy framework.
**Decision:** Adopted Untitled UI React as a copy-paste component library. Components live in `app/admin/components/ui/`. Tailwind-only styling, no custom CSS. React Aria for accessibility primitives.
**Consequences:** Admin pages use Untitled UI patterns exclusively. Storefront has its own design language. The admin is exempt from the typography token system. Steering rule (`admin-ui-rules.md`) documents patterns.

### ADR-006: Taxonomy System for Categorization
**Date:** 2026-03 | **Status:** accepted
**Context:** Categories, tags, and classification values were hardcoded across multiple entities. Adding a new category required code changes.
**Decision:** Built a centralized taxonomy system. Taxonomies are grouped (Ingredients, Flavours, Formats & Modifiers, Launches, Stories) and managed at `/admin/taxonomies`. Entities reference taxonomy values via `TaxonomySelect` and `TaxonomyTagPicker` components.
**Consequences:** New categories are added via admin UI, not code. Taxonomy values are stored as strings in entity fields (not foreign keys). The taxonomies page uses a sidebar layout — do not revert to the old tab-based layout.

### ADR-005: Bilingual Content (EN/FR)
**Date:** 2026-03 | **Status:** accepted
**Context:** Rhubarbe is a Montreal-based business. Content needs to be in both English and French.
**Decision:** Bilingual fields use `{ en: string; fr: string }` objects stored as JSON. Admin uses `TranslationFields` and `BilingualField` components. An AI translate button assists with translations. A `LanguageSwitcher` component handles storefront locale.
**Consequences:** Any user-facing text field that appears on the storefront should be bilingual. Internal-only fields (admin labels, notes) can be single-language.

### ADR-004: Vercel for Hosting and Infrastructure
**Date:** 2026-03 | **Status:** accepted
**Context:** Needed hosting that integrates tightly with Next.js and provides managed services.
**Decision:** Vercel for hosting. Vercel Postgres for database. Vercel Blob for image storage (prod). Vercel KV for caching/sessions. Single Next.js app — no separate servers.
**Consequences:** Build command is `tsx scripts/migrate.ts && next build`. Environment variables must be set in Vercel dashboard. Steering rule (`skill-deploy-vercel.md`) documents the pre-deployment checklist.

### ADR-003: Next.js App Router (Single App)
**Date:** 2026-03 | **Status:** accepted
**Context:** Needed a framework that handles both the public storefront and the admin CMS.
**Decision:** Single Next.js 14.2 app using App Router. Storefront at `/`, admin at `/admin/*`, API at `/api/*`. Middleware protects admin routes. Server Components by default, `'use client'` only when needed.
**Consequences:** No separate CMS server. All business logic lives in API routes. Admin and storefront share the same deployment. TypeScript throughout (JSX in some older files).

### ADR-002: Flavour Archive as Core Brand Asset
**Date:** 2026-03 | **Status:** accepted
**Context:** Most ice cream shops treat flavours as just product variants. Rhubarbe's identity is built on the history of flavour experimentation.
**Decision:** The flavour archive is a first-class CMS entity, independent of Shopify products. Flavours have their own lifecycle (active, seasonal, archived, test-kitchen, coming-soon), ingredient relationships, batch history, and editorial content. An archived flavour can still have an active Shopify product.
**Consequences:** Flavour status and Shopify product status are decoupled. The CMS model (`cms-model.md`) documents all entity relationships. Batches belong to flavours, not products.

### ADR-001: Headless CMS — Build vs Buy
**Date:** 2026-03 | **Status:** accepted
**Context:** Needed a CMS for the flavour archive, ingredient library, and editorial content. Evaluated Sanity, Contentful, and building custom.
**Decision:** Build a custom headless CMS within the Next.js app. The content model is too specific (flavour batches, ingredient provenance, test kitchen records) for a generic CMS without heavy customization.
**Consequences:** More upfront work but full control over the data model and admin UX. No vendor lock-in. No monthly CMS fees. Trade-off: we maintain the admin UI ourselves.
