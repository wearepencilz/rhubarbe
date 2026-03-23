# Implementation Plan: JSON to PostgreSQL Migration

## Overview

Incrementally migrate ~15 JSON file entities to PostgreSQL using Drizzle ORM. Work follows 7 migration groups, each using the same pattern: define schema → generate migration → seed data → swap API routes → verify. TypeScript throughout, matching the existing codebase.

## Tasks

- [x] 1. Migrate Taxonomies
  - [x] 1.1 Add `taxonomy_values` table to `lib/db/schema.ts`
    - UUID PK, `category`, `label`, `value`, `description`, `sort_order`, `archived`, timestamps
    - Unique index on `(category, value)`, index on `category`
    - Run `npx drizzle-kit generate` to create the migration SQL
    - _Requirements: 7.1, 7.2_
  - [x] 1.2 Create `lib/db/seeds/seed-taxonomies.ts`
    - Read `public/data/taxonomies.json`, flatten category→values into rows
    - Use `insert().onConflictDoNothing()` for idempotent seeding
    - Preserve original `id` as `legacy_id` if present, map `sortOrder` → `sort_order`
    - _Requirements: 7.1, 2.1_
  - [x] 1.3 Create `lib/db/queries/taxonomies.ts` and swap API routes
    - Query helpers: `getByCategory`, `create`, `update`, `delete`, `reorder`
    - Update `app/api/settings/taxonomies/` routes to use Drizzle instead of `lib/db.js`
    - Update any admin components that call taxonomy endpoints if needed
    - _Requirements: 7.2, 3.3_
  - [x] 1.4 Write property test for taxonomy category filtering
    - **Property 4: Taxonomy category filtering**
    - **Validates: Requirements 7.2**

- [x] 2. Migrate Ingredients
  - [x] 2.1 Add `ingredients` table to `lib/db/schema.ts`
    - All columns per design: UUID PK, `legacy_id`, name, latin_name, category fields, jsonb arrays for allergens/roles/descriptors/tasting_notes/texture/process/attributes/used_as/available_months, booleans, supplier fields, status, timestamps
    - Indexes on `legacy_id`, `name`, `category`
    - Run `npx drizzle-kit generate`
    - _Requirements: 9.1, 9.2_
  - [x] 2.2 Create `lib/db/seeds/seed-ingredients.ts`
    - Read `public/data/ingredients.json`, map fields, generate UUIDs, store original ID in `legacy_id`
    - Normalize jsonb arrays, coerce types
    - _Requirements: 9.1, 2.1, 2.2_
  - [x] 2.3 Create `lib/db/queries/ingredients.ts` and swap API routes
    - Query helpers: filtered list (by category, allergen, seasonal), by-id, create, update, delete
    - Update `app/api/ingredients/` routes and `app/api/ingredients/[id]/` route
    - _Requirements: 10.2, 3.3_
  - [x] 2.4 Write property tests for ingredients
    - **Property 1: Seed data round-trip** (ingredients subset)
    - **Property 5: Ingredient filter equivalence**
    - **Validates: Requirements 9.1, 10.2**

- [x] 3. Checkpoint — Taxonomies & Ingredients
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npx drizzle-kit migrate` to apply pending migrations
  - Run seed scripts and verify data in the database

- [x] 4. Expand Products table & add product_ingredients
  - [x] 4.1 Add missing columns to `products` table in `lib/db/schema.ts`
    - Add: `legacy_id`, `description`, `category`, `price`, `currency`, `image`, `serves`, `allergens` (jsonb), `tags` (jsonb), `key_notes` (jsonb), `tasting_notes`, `status`, `title`, `short_card_copy`, `inventory_tracked`, `availability_mode`, `date_selection_type`, `slot_selection_type`, `variants` (jsonb), `variant_type`, `sync_status`, `last_synced_at`, `sync_error`
    - Add `product_ingredients` join table with FK to products and ingredients
    - Run `npx drizzle-kit generate`
    - _Requirements: 6.1, 6.3_
  - [x] 4.2 Create `lib/db/seeds/seed-products-expand.ts`
    - Read `public/data/products.json`, update existing product rows with new columns
    - Populate `product_ingredients` join table, resolving ingredient references via `legacy_id`
    - Log warnings for unresolved ingredient references
    - _Requirements: 6.2, 6.3, 2.1_
  - [x] 4.3 Swap product API routes to use expanded Drizzle queries
    - Update `app/api/products/` and `app/api/products/[id]/` routes
    - Include product_ingredients joins in queries where needed
    - _Requirements: 6.2, 3.3_
  - [x] 4.4 Write property test for product-ingredient relational integrity
    - **Property 6: Product-ingredient relational integrity**
    - **Validates: Requirements 6.3**

- [x] 5. Migrate Users
  - [x] 5.1 Add `users` table to `lib/db/schema.ts`
    - UUID PK, `legacy_id`, `name`, `email` (unique), `username` (unique), `password_hash`, `salt`, `role`, `active`, timestamps
    - Run `npx drizzle-kit generate`
    - _Requirements: 8.1_
  - [x] 5.2 Create `lib/db/seeds/seed-users.ts`
    - Read `public/data/users.json`, preserve `password_hash` and `salt` byte-identical
    - Store original hex ID in `legacy_id`
    - _Requirements: 8.1, 8.3, 2.1_
  - [x] 5.3 Create `lib/db/queries/users.ts` and swap auth routes
    - Query helpers: `byUsername`, `byEmail`, `byId`, `list`, `create`, `update`
    - Update `app/api/auth/[...nextauth]/` to query Postgres instead of `lib/db.js`
    - Update `app/api/settings/` user-related routes if any
    - Replace `lib/users.ts` usage with new query helpers
    - _Requirements: 8.2, 8.3, 3.3_
  - [x] 5.4 Write property test for credential preservation
    - **Property 2: Credential preservation**
    - **Validates: Requirements 8.3**

- [x] 6. Checkpoint — Products & Users
  - Ensure all tests pass, ask the user if questions arise.
  - Run migrations and seed scripts for groups 4 and 5

- [x] 7. Migrate Pages & Settings
  - [x] 7.1 Add `pages` and `settings` tables to `lib/db/schema.ts`
    - `pages`: UUID PK, `page_name` (unique), `content` (jsonb), `updated_at`
    - `settings`: UUID PK, `key` (unique), `value` (jsonb), `updated_at`
    - Run `npx drizzle-kit generate`
    - _Requirements: 11.1, 12.1_
  - [x] 7.2 Create `lib/db/seeds/seed-pages-settings.ts`
    - Read `public/data/pages.json` — one row per page name with full content as jsonb
    - Read `public/data/settings.json` — one row per setting key
    - _Requirements: 11.1, 12.1, 2.1_
  - [x] 7.3 Swap pages and settings API routes
    - Update `app/api/pages/[pageName]/` route
    - Update `app/api/settings/` route
    - _Requirements: 11.2, 12.2, 3.3_

- [x] 8. Migrate Stories, News & Requests
  - [x] 8.1 Add `stories`, `news`, and `requests` tables to `lib/db/schema.ts`
    - Per design data models: bilingual fields via `customJsonb`, jsonb arrays for tags/content
    - Run `npx drizzle-kit generate`
    - _Requirements: 4.1, 5.1, 1.1_
  - [x] 8.2 Create `lib/db/seeds/seed-stories-news-requests.ts`
    - Read `public/data/stories.json`, `news.json`, `requests.json`
    - Map fields, preserve `legacy_id`, handle bilingual content
    - _Requirements: 4.1, 5.1, 1.1, 2.1_
  - [x] 8.3 Swap stories, news, and requests API routes
    - Update `app/api/stories/`, `app/api/news/`, `app/api/requests/` and their `[id]` sub-routes
    - _Requirements: 4.2, 5.2, 1.2, 3.3_
  - [x] 8.4 Write property test for API response shape invariant
    - **Property 3: API response shape invariant**
    - **Validates: Requirements 3.3**

- [x] 9. Checkpoint — All entities migrated
  - Ensure all tests pass, ask the user if questions arise.
  - Run all pending migrations and seed scripts
  - Verify every API route returns data from Postgres

- [x] 10. Cleanup — Remove JSON adapter and archive files
  - [x] 10.1 Remove `lib/db.js` and all its imports
    - Search codebase for `import { db } from '@/lib/db'` or `from '@/lib/db.js'` and remove/replace any remaining references
    - Remove `lib/users.ts` if fully replaced by `lib/db/queries/users.ts`
    - _Requirements: 3.1, 3.2_
  - [x] 10.2 Archive JSON data files
    - Move `public/data/*.json` entity files to `public/data/backups/` (keep as reference)
    - Do NOT remove JSON files used by other systems (e.g., bundles, components, seasonal-collections if not migrated)
    - _Requirements: 3.1_
  - [x] 10.3 Write property test for seed data round-trip (full suite)
    - **Property 1: Seed data round-trip** (all entity types)
    - **Validates: Requirements 2.1, 2.2, 6.2, 9.1, 9.2, 10.3**

- [x] 11. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify no remaining imports of `lib/db.js` in the codebase
  - Confirm all API routes serve data from PostgreSQL

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each migration group follows: schema → migration → seed → API swap → verify
- JSON files are preserved in `public/data/backups/` as rollback safety net
- Property tests use `fast-check` with Vitest
- All seed scripts use `onConflictDoNothing()` for idempotent re-runs
