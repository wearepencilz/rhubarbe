# Tasks: Catering Ordering Rules

Overhaul product management across Catering, Cake, and Menu sections with direct creation, catering type grouping, simplified allergens, ordering rules, filtering, lead time, and cross-cutting UX consistency.

## Task 1: Schema migration — add catering fields to products, cake_variants, volume_variants

Add new columns to the database schema and create the Drizzle migration.

- [ ] 1.1 Add columns to `products` table in `lib/db/schema.ts`: `cateringType` (text, nullable), `cateringDescription` (jsonb, nullable), `cateringFlavourName` (jsonb, nullable), `cateringEndDate` (timestamp, nullable), `dietaryTags` (jsonb, nullable), `temperatureTags` (jsonb, nullable)
- [ ] 1.2 Add `allergens` (jsonb, nullable) column to `cakeVariants` table in `lib/db/schema.ts`
- [ ] 1.3 Add `allergens` (jsonb, nullable) column to `volumeVariants` table in `lib/db/schema.ts`
- [ ] 1.4 Generate Drizzle migration `0023_add_catering_fields.sql` with `IF NOT EXISTS` guards and index on `catering_type`
- [ ] 1.5 Run `npm run db:migrate` to verify migration applies cleanly

## Task 2: Data migration script — backfill existing products and seed settings

Create an idempotent data migration script that backfills new columns and seeds default configuration.

- [ ] 2.1 Create `scripts/run-migration-0023-data.ts` that:
  - Sets `dietaryTags = []` and `temperatureTags = []` on existing catering products (`volumeEnabled = true`) where null
  - Copies product-level `allergens` to each `cake_variants` row for cake products (`cakeEnabled = true`)
  - Logs catering products needing manual `cateringType` assignment
- [ ] 2.2 Seed `cateringOrderingRules` into settings table (brunch: min 12/step 6, lunch: min 6/step 1, dinatoire: min 3/step 1) using `ON CONFLICT DO NOTHING`
- [ ] 2.3 Seed `cateringLeadTimeDays = 28` into settings table using `ON CONFLICT DO NOTHING`
- [ ] 2.4 Verify script is idempotent (safe to run multiple times)

## Task 3: Ordering rule engine — validation logic for catering quantities and lead time

Create the pure business logic modules for ordering rules and lead time enforcement.

- [ ] 3.1 Create `lib/catering/ordering-rules.ts` with `validateCateringQuantity(quantity, cateringType, rules)` and `validateCateringOrder(items, rules)` functions
- [ ] 3.2 Create `lib/catering/lead-time.ts` with `getEarliestCateringDate(leadTimeDays)` function
- [ ] 3.3 Create `lib/catering/menu-filter.ts` with `filterCateringMenu(products, filters)` — AND logic for dietary tags, simple match for temperature

## Task 4: Allergen simplification — direct assignment and dietary claim derivation

Replace computed allergens with direct assignment and update the derivation logic.

- [ ] 4.1 Create `lib/product-allergens.ts` → `deriveDietaryClaims(allergens: string[]): DietaryClaim[]` pure function (no ingredient traversal)
- [ ] 4.2 Remove `computeProductAllergens` function from `lib/product-allergens.ts`
- [ ] 4.3 Update all call sites of `computeProductAllergens` to use `deriveDietaryClaims` or read allergens directly

## Task 5: Volume-products query layer — extend for catering type, direct creation, active filtering

Extend the volume-products query module with new capabilities.

- [ ] 5.1 Add `createCateringProduct(data)` to `lib/db/queries/volume-products.ts` — creates product with `volumeEnabled = true` and catering-specific fields
- [ ] 5.2 Extend `listVolumeProducts()` to return new catering fields (`cateringType`, `cateringEndDate`, `dietaryTags`, `temperatureTags`, `cateringDescription`, `cateringFlavourName`)
- [ ] 5.3 Add `listActiveCateringProducts()` — excludes products where `cateringEndDate < now()`
- [ ] 5.4 Extend `updateVolumeConfig()` to accept and persist new catering fields
- [ ] 5.5 Extend `getVolumeProductById()` to return new catering fields

## Task 6: API routes — catering product CRUD and ordering validation

Update API routes for direct product creation and add validation endpoint.

- [ ] 6.1 Update `POST /api/volume-products` to accept full product creation data (name, slug, cateringType, allergens, dietaryTags, temperatureTags, cateringDescription, cateringFlavourName, cateringEndDate) and set `volumeEnabled = true`
- [ ] 6.2 Update `PUT /api/volume-products/[id]` to accept and persist new catering fields
- [ ] 6.3 Create `POST /api/checkout/validate-catering` endpoint — validates quantities against `cateringOrderingRules` and date against `cateringLeadTimeDays` from settings

## Task 7: Admin UI — catering product create page

Build the direct product creation page for the catering section.

- [ ] 7.1 Create `app/admin/volume-products/create/page.tsx` with `EditPageLayout` (dirty-state save), catering type selector (required), product name, allergen multi-select, dietary tags, temperature tags, catering end date picker, bilingual catering description and flavour name via `TranslationFields` + `AiTranslateButton`
- [ ] 7.2 Wire form submission to `POST /api/volume-products` and redirect to edit page on success

## Task 8: Admin UI — extend catering product edit page

Add new catering fields to the existing edit page.

- [ ] 8.1 Add catering type selector (dropdown: Brunch, Lunch, Dînatoire) to `app/admin/volume-products/[id]/page.tsx`
- [ ] 8.2 Add allergen multi-select, dietary tags multi-select, temperature tags multi-select
- [ ] 8.3 Add catering end date picker with remaining-availability indicator
- [ ] 8.4 Add bilingual catering description and catering flavour name fields via `TranslationFields` + `AiTranslateButton`
- [ ] 8.5 Remove ingredient association controls from the edit page
- [ ] 8.6 Hide tasting notes field from the edit page
- [ ] 8.7 Hide tag/status editing controls when product is Shopify-linked (show read-only values instead)

## Task 9: Admin UI — catering product list page grouped by type

Update the catering product list to show type grouping and direct creation.

- [ ] 9.1 Update `app/admin/volume-products/page.tsx` to group products by `cateringType` with section headings (Brunch, Lunch, Dînatoire, Unassigned)
- [ ] 9.2 Show "Type required" badge on products with `cateringType = null`
- [ ] 9.3 Replace the "import existing product" flow with a "Create Catering Product" button linking to the create page
- [ ] 9.4 Show catering end date and expired status on list rows

## Task 10: Admin UI — catering ordering rules and lead time settings

Add admin interface for configuring ordering rules and lead time.

- [ ] 10.1 Add catering ordering rules section to `app/admin/volume-products/settings/page.tsx` — editable table of catering types with min quantity, quantity step, and bilingual labels
- [ ] 10.2 Add catering lead time days input to the same settings page
- [ ] 10.3 Wire save to `PUT /api/settings` using existing settings pattern

## Task 11: Admin UI — hide ingredients feature

Hide the ingredients module from the admin UI while preserving data.

- [ ] 11.1 Remove "Ingredients" nav item from `app/admin/components/AdminSidebar.tsx`
- [ ] 11.2 Update `app/admin/ingredients/page.tsx` to show "Feature currently unavailable" message
- [ ] 11.3 Remove ingredient association controls from cake and menu product edit pages

## Task 12: Customer-facing catering menu — type grouping, filtering, lead time, ordering rules

Update the customer-facing catering order page with new features.

- [ ] 12.1 Update `app/catering/VolumeOrderPageClient.tsx` to group products by `cateringType` with section headings
- [ ] 12.2 Add dietary and temperature filter controls using `filterCateringMenu`
- [ ] 12.3 Integrate `getEarliestCateringDate` with the date picker to disable dates within the lead time window (replace or supplement existing `getEarliestDate` logic)
- [ ] 12.4 Enforce per-type quantity rules (min quantity, step) on the quantity selector using `cateringOrderingRules` from settings
- [ ] 12.5 Show `cateringDescription` for each product (fall back to product `description` if not set)
- [ ] 12.6 Exclude products past their `cateringEndDate`

## Task 13: Consistent UX patterns across Cake and Menu product edit forms

Apply the same translation and dirty-state save patterns to cake and menu edit pages.

- [ ] 13.1 Ensure cake product edit page uses `EditPageLayout` with `isDirty` prop and `TranslationFields` + `AiTranslateButton` for all bilingual fields
- [ ] 13.2 Ensure menu product edit page uses `EditPageLayout` with `isDirty` prop and `TranslationFields` + `AiTranslateButton` for all bilingual fields
- [ ] 13.3 Add allergen multi-select to cake variant editing (per-variant allergens)
- [ ] 13.4 Add allergen multi-select to menu product editing (product-level or per-variant depending on variant presence)
