---
inclusion: manual
description: Skill — End-to-end guide for adding a new CMS content type (schema + queries + API + admin UI).
---

# Skill: CMS Entity Creator

Use this skill when adding a brand new content type to the CMS end-to-end.

## Checklist

When creating a new entity, you need all of these:

1. **Schema** — `lib/db/schema.ts` (add table definition)
2. **Query module** — `lib/db/queries/[entity].ts`
3. **API routes** — `app/api/[entity]/route.ts` + `app/api/[entity]/[id]/route.ts`
4. **Admin list page** — `app/admin/[entity]/page.tsx`
5. **Admin edit page** — `app/admin/[entity]/[id]/page.tsx`
6. **Admin create page** — `app/admin/[entity]/create/page.tsx`
7. **Navigation** — Add link in `app/admin/components/AdminSidebar.tsx`
8. **Types** — Add interface in `types/index.ts` if needed
9. **Migration** — Generate with `npx drizzle-kit generate`

## Step-by-Step

### 1. Define the Schema

Add to `lib/db/schema.ts`:

```typescript
export const [entities] = pgTable('[entities]', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  status: text('status').notNull().default('active'),
  // ... entity-specific fields
  // Use customJsonb<T>() for arrays/objects
  tags: customJsonb<string[]>('tags'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('[entities]_slug_idx').on(table.slug),
}));
```

Required columns for every entity:
- `id` — uuid, primary key, defaultRandom
- `createdAt` — timestamp, defaultNow
- `updatedAt` — timestamp, defaultNow

### 2. Create Query Module

Follow the pattern in `lib/db/queries/ingredients.ts`:
- `list(filters?)` — returns all rows, applies in-memory filters
- `getById(id)` — single row or null
- `getByName(name)` — for duplicate checking (if applicable)
- `create(data)` — insert + returning
- `update(id, data)` — set + returning, always update `updatedAt`
- `remove(id)` — delete + returning, return boolean

Use the `skill-api-route-scaffold` skill for the detailed query template.

### 3. Create API Routes

Use the `skill-api-route-scaffold` skill for the full template. Key points:
- GET is public, POST/PUT/DELETE require auth
- Use `ErrorResponse` type from `@/types`
- Check for duplicates on create/update
- Return 201 on create, 200 on update/delete

### 4. Create Admin Pages

Use the `skill-admin-crud-page` skill for the full template. Key points:
- List page: search, filters, table, delete confirmation
- Edit page: `EditPageLayout` wrapper, `SectionCard` groups, `set()` helper
- Create page: same as edit but POST, redirect after creation

### 5. Add Navigation

In `app/admin/components/AdminSidebar.tsx`, add a nav item:

```tsx
{ label: '[Entity Name]', href: '/admin/[entities]', icon: IconName }
```

### 6. Run Migration

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

## Relationship Rules

When the new entity relates to existing entities:

| Relationship | Implementation |
|---|---|
| One-to-many | Foreign key column on the child table |
| Many-to-many | `customJsonb<string[]>` storing IDs (this project's convention) |
| Belongs-to | UUID foreign key column |

## Lifecycle Rules

- Deleting an entity should be blocked if it's referenced by active records (check in the DELETE handler)
- Status values should follow existing patterns: `active | archived | draft` (or entity-specific like `upcoming | active | past`)
- Stories and editorial content publish independently — no required links

## Content Translation Pattern

If the entity needs French/English translations, use the `ContentTranslations` interface from `@/types`:

```typescript
translations: customJsonb<{ en: string; fr: string }>('translations'),
```

And use `TranslationFields` component in the admin UI.
