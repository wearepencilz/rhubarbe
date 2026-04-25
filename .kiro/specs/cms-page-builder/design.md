# Design Document: CMS Page Builder

## Overview

This feature replaces the hardcoded per-page editors in `/admin/pages` with a flexible, section-based page builder. Admins compose storefront pages from a library of 19 reusable section types derived from the Rhubarbe-Sections Figma file. Each section is a typed data structure stored as an ordered JSON array in the existing `pages.content` JSONB column.

The feature also renames "Stories" → "Journal" and "News" → "Recipes" across the database, API routes, admin UI, and storefront URLs with 301 redirects for old paths.

Key design decisions:
- **Discriminated union types** for sections — each section variant is identified by a `type` string literal, enabling exhaustive type checking and per-type editors/renderers
- **Reuse existing infrastructure** — the `pages` table, `customJsonb`, Drizzle ORM queries, ImageUploader, RichTextEditor, AiTranslateButton, and EditPageLayout patterns remain unchanged
- **Server Components for storefront rendering** — section renderers are async RSCs that can fetch dynamic content (journal/recipe entries) at request time
- **Client Components for admin editing** — the page builder is a client component tree with drag-and-drop, inline section editors, and bilingual fields

## Architecture

```mermaid
graph TB
    subgraph Admin["Admin UI (Client Components)"]
        PB[PageBuilder]
        SL[SectionLibrary]
        SE[SectionEditor × 19]
        PB --> SL
        PB --> SE
        SE --> IU[ImageUploader]
        SE --> RTE[RichTextEditor]
        SE --> ATB[AiTranslateButton]
    end

    subgraph API["API Routes"]
        PA["/api/pages/[pageName]<br/>GET · PUT"]
        JA["/api/journal<br/>GET · POST"]
        JD["/api/journal/[id]<br/>GET · PUT · DELETE"]
        RA["/api/recipes<br/>GET · POST"]
        RD["/api/recipes/[id]<br/>GET · PUT · DELETE"]
    end

    subgraph DB["PostgreSQL (Drizzle ORM)"]
        PT[pages table<br/>content: Section[]]
        JT[journal table<br/>(renamed from stories)]
        RT[recipes table<br/>(renamed from news)]
    end

    subgraph Storefront["Storefront (Server Components)"]
        PR[PageRenderer]
        SR[SectionRenderer × 19]
        PR --> SR
        SR -->|dynamic sections| JA
        SR -->|dynamic sections| RA
    end

    PB -->|PUT /api/pages/:name| PA
    PA --> PT
    PR -->|getByName()| PT
    JA --> JT
    RA --> RT
```

### Data Flow

1. Admin opens `/admin/pages/[pageName]` → PageBuilder fetches `GET /api/pages/[pageName]` → receives `Section[]`
2. Admin adds/edits/reorders sections → local state updates
3. Admin clicks Save → `PUT /api/pages/[pageName]` with `{ sections: Section[] }` → upserts into `pages.content`
4. Visitor requests a storefront page → `PageRenderer` RSC calls `pageQueries.getByName()` → iterates `sections` array → renders each `SectionRenderer` component
5. Dynamic sections (`content-journal`, `content-2up`) query the `journal` or `recipes` table at render time

## Components and Interfaces

### Section Type System (Discriminated Union)

All 19 section types share a common base and are discriminated by the `type` field. This lives in `lib/types/sections.ts`.

```typescript
// ── Shared primitives ──────────────────────────────────────

interface Bilingual {
  en: string;
  fr: string;
}

interface SectionImage {
  url: string;
  alt: Bilingual;
  caption?: Bilingual;
}

interface SectionBase {
  id: string;       // nanoid, stable across reorders
  type: SectionType;
}

// ── 19 section type literals ───────────────────────────────

type SectionType =
  | 'faq-simple'
  | 'faq-grouped'
  | 'image-carousel'
  | 'image-2up'
  | 'image-hero'
  | 'image-with-icons'
  | 'content-brief'
  | 'content-journal'
  | 'content-2up'
  | 'heading-articles'
  | 'heading-page'
  | 'heading-content'
  | 'quote'
  | 'text'
  | 'instructions'
  | 'two-column-text'
  | 'steps'
  | 'image-with-text'
  | 'contact-form';
```


#### FAQ Sections

```typescript
interface FaqSimpleSection extends SectionBase {
  type: 'faq-simple';
  title: Bilingual;
  items: { question: Bilingual; answer: Bilingual }[];
}

interface FaqGroupedSection extends SectionBase {
  type: 'faq-grouped';
  title: Bilingual;
  groups: {
    heading: Bilingual;
    items: { question: Bilingual; answer: Bilingual }[];
  }[];
}
```

#### Image Sections

```typescript
interface ImageCarouselSection extends SectionBase {
  type: 'image-carousel';
  title: Bilingual;
  description: Bilingual;
  images: SectionImage[]; // 3 images: 2 small stacked + 1 large
}

interface Image2UpSection extends SectionBase {
  type: 'image-2up';
  images: [SectionImage, SectionImage]; // exactly 2
}

interface ImageHeroSection extends SectionBase {
  type: 'image-hero';
  image: SectionImage;
}

interface ImageWithIconsSection extends SectionBase {
  type: 'image-with-icons';
  backgroundImage: SectionImage;
  overlayImage: SectionImage; // SVG overlay
}
```

#### Dynamic Content Sections

```typescript
interface ContentJournalSection extends SectionBase {
  type: 'content-journal';
  title: Bilingual;
  maxEntries: number; // default 3
}

interface ContentBriefSection extends SectionBase {
  type: 'content-brief';
  title: Bilingual;
  items: {
    image: SectionImage;
    label: Bilingual;  // e.g. "01."
    body: Bilingual;
  }[];
}

interface Content2UpSection extends SectionBase {
  type: 'content-2up';
  title: Bilingual;
  source: 'journal' | 'recipes';
  maxEntries: number; // default 2
}
```

#### Heading Sections

```typescript
interface HeadingArticlesSection extends SectionBase {
  type: 'heading-articles';
  title: Bilingual;
  tabs: { label: Bilingual }[];
}

interface HeadingPageSection extends SectionBase {
  type: 'heading-page';
  title: Bilingual;
}

interface HeadingContentSection extends SectionBase {
  type: 'heading-content';
  title: Bilingual;
  category: Bilingual;
  date: string; // ISO date
}
```

#### Text Sections

```typescript
interface QuoteSection extends SectionBase {
  type: 'quote';
  text: Bilingual;
}

interface TextSection extends SectionBase {
  type: 'text';
  title: Bilingual;
  body: Bilingual; // rich text HTML
}

interface InstructionsSection extends SectionBase {
  type: 'instructions';
  title: Bilingual;
  steps: Bilingual[]; // ordered instruction steps
}

interface TwoColumnTextSection extends SectionBase {
  type: 'two-column-text';
  title: Bilingual;
  columnLeft: Bilingual;
  columnRight: Bilingual;
}

interface StepsSection extends SectionBase {
  type: 'steps';
  steps: {
    label: Bilingual; // e.g. "01"
    body: Bilingual;
  }[];
}
```

#### Mixed Sections

```typescript
interface ImageWithTextSection extends SectionBase {
  type: 'image-with-text';
  image: SectionImage;
  title: Bilingual;
  body: Bilingual;
  backgroundColor: string; // hex color
}

interface ContactFormSection extends SectionBase {
  type: 'contact-form';
  title: Bilingual;
  phone: Bilingual;
  email: Bilingual;
  socialLinks: Bilingual;
}
```

#### Union Type

```typescript
type Section =
  | FaqSimpleSection
  | FaqGroupedSection
  | ImageCarouselSection
  | Image2UpSection
  | ImageHeroSection
  | ImageWithIconsSection
  | ContentJournalSection
  | ContentBriefSection
  | Content2UpSection
  | HeadingArticlesSection
  | HeadingPageSection
  | HeadingContentSection
  | QuoteSection
  | TextSection
  | InstructionsSection
  | TwoColumnTextSection
  | StepsSection
  | ImageWithTextSection
  | ContactFormSection;
```

### Section Category Registry

Used by the Section Library UI to group available section types:

```typescript
const SECTION_CATEGORIES = {
  'FAQ':             ['faq-simple', 'faq-grouped'],
  'Image':           ['image-carousel', 'image-2up', 'image-hero', 'image-with-icons'],
  'Dynamic Content': ['content-journal', 'content-brief', 'content-2up'],
  'Heading':         ['heading-articles', 'heading-page', 'heading-content'],
  'Text':            ['quote', 'text', 'instructions', 'two-column-text', 'steps'],
  'Mixed':           ['image-with-text', 'contact-form'],
} as const;
```

Each entry also carries a label, icon, and description for the library picker UI, following the same pattern as `BLOCK_TYPES` in the existing `StoryBlockBuilder`.

### Admin Component Architecture

```
app/admin/pages/[pageName]/page.tsx        ← PageBuilder (client component)
├── SectionLibrary.tsx                      ← Modal/popover with 19 types grouped by category
├── SectionCard.tsx                         ← Collapsible card wrapper (header + editor)
│   ├── SectionCardHeader.tsx               ← Type icon, label, summary, collapse/expand, delete, drag handle
│   └── SectionEditor.tsx                   ← Switch on section.type → per-type editor
│       ├── FaqSimpleEditor.tsx
│       ├── FaqGroupedEditor.tsx
│       ├── ImageCarouselEditor.tsx
│       ├── Image2UpEditor.tsx
│       ├── ImageHeroEditor.tsx
│       ├── ImageWithIconsEditor.tsx
│       ├── ContentJournalEditor.tsx
│       ├── ContentBriefEditor.tsx
│       ├── Content2UpEditor.tsx
│       ├── HeadingArticlesEditor.tsx
│       ├── HeadingPageEditor.tsx
│       ├── HeadingContentEditor.tsx
│       ├── QuoteEditor.tsx
│       ├── TextEditor.tsx
│       ├── InstructionsEditor.tsx
│       ├── TwoColumnTextEditor.tsx
│       ├── StepsEditor.tsx
│       ├── ImageWithTextEditor.tsx
│       └── ContactFormEditor.tsx
└── BilingualField.tsx                      ← Reusable EN/FR side-by-side field with flags + warning
```

Key patterns:
- **Drag-and-drop**: Use `@dnd-kit/core` + `@dnd-kit/sortable` (lightweight, React 18 compatible, already a common choice for Next.js projects)
- **BilingualField**: A new component wrapping two inputs side-by-side with 🇫🇷/🇬🇧 flags, a visual warning when one language is empty, and an AiTranslateButton per section
- **Section editors** reuse existing `ImageUploader`, `RichTextEditor`, and `Input`/`Textarea` from the admin UI kit
- **Collapse/expand** toggle on each SectionCard so admins can focus on one section at a time

### Storefront Renderer Architecture

```
components/sections/
├── PageRenderer.tsx                        ← RSC: reads Page_Record, maps sections to components
├── SectionRenderer.tsx                     ← Switch on section.type → per-type renderer
├── faq/
│   ├── FaqSimple.tsx                       ← Client component (accordion interactivity)
│   └── FaqGrouped.tsx
├── image/
│   ├── ImageCarousel.tsx
│   ├── Image2Up.tsx
│   ├── ImageHero.tsx
│   └── ImageWithIcons.tsx
├── content/
│   ├── ContentJournal.tsx                  ← RSC: fetches journal entries
│   ├── ContentBrief.tsx
│   └── Content2Up.tsx                      ← RSC: fetches journal or recipe entries
├── heading/
│   ├── HeadingArticles.tsx
│   ├── HeadingPage.tsx
│   └── HeadingContent.tsx
├── text/
│   ├── Quote.tsx
│   ├── TextBlock.tsx
│   ├── Instructions.tsx
│   ├── TwoColumnText.tsx
│   └── Steps.tsx
└── mixed/
    ├── ImageWithText.tsx
    └── ContactForm.tsx                     ← Client component (form submission)
```

`PageRenderer` is the top-level RSC used by storefront page routes:

```typescript
// components/sections/PageRenderer.tsx
export default async function PageRenderer({ pageName }: { pageName: string }) {
  const page = await pageQueries.getByName(pageName);
  const sections: Section[] = page?.content?.sections ?? [];

  return (
    <div>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
```

`SectionRenderer` switches on `section.type` and renders the matching component. Unrecognized types are silently skipped (Requirement 11.3).


## Data Models

### Pages Table (Existing — Schema Change)

The existing `pages` table remains unchanged structurally. The `content` JSONB column's type annotation is updated to reflect the new section array format:

```typescript
// lib/db/schema.ts — updated type for pages.content
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageName: text('page_name').notNull().unique(),
  content: customJsonb<{ sections: Section[] }>('content').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

The `content` column transitions from an untyped `Record<string, unknown>` to `{ sections: Section[] }`. Existing page records (home, about, etc.) that use the old flat-object format will be migrated to the new structure via a data migration script.

### Journal Table (Renamed from Stories)

```typescript
// lib/db/schema.ts — renamed table
export const journal = pgTable('journal', {
  id: uuid('id').primaryKey().defaultRandom(),
  legacyId: text('legacy_id'),
  slug: text('slug').unique(),
  title: customJsonb<{ en: string; fr: string }>('title'),
  subtitle: customJsonb<{ en: string; fr: string }>('subtitle'),
  content: customJsonb<unknown>('content'),
  category: text('category'),
  tags: customJsonb<string[]>('tags'),
  coverImage: text('cover_image'),
  status: text('status'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('journal_slug_idx').on(table.slug),
  statusIdx: index('journal_status_idx').on(table.status),
  categoryIdx: index('journal_category_idx').on(table.category),
}));
```

No column changes — only the table name and index names change.

### Recipes Table (Renamed from News, Extended)

```typescript
// lib/db/schema.ts — renamed + extended table
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  legacyId: text('legacy_id'),
  slug: text('slug').unique(),                          // NEW
  title: text('title'),
  content: customJsonb<unknown>('content'),
  category: text('category'),                           // NEW
  coverImage: text('cover_image'),                      // NEW
  status: text('status').default('published'),           // NEW
  publishedAt: timestamp('published_at'),                // NEW
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('recipes_slug_idx').on(table.slug),
  statusIdx: index('recipes_status_idx').on(table.status),
  categoryIdx: index('recipes_category_idx').on(table.category),
}));
```

New columns: `slug`, `category`, `coverImage`, `status`, `publishedAt`. The migration sets `status = 'published'` and generates slugs from existing titles for all current rows.

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/pages/[pageName]` | GET | Returns `{ sections: Section[] }` for a page |
| `/api/pages/[pageName]` | PUT | Upserts the section array (auth required) |
| `/api/journal` | GET | List all journal entries |
| `/api/journal` | POST | Create a journal entry (auth required) |
| `/api/journal/[id]` | GET | Get a single journal entry by ID or slug |
| `/api/journal/[id]` | PUT | Update a journal entry (auth required) |
| `/api/journal/[id]` | DELETE | Delete a journal entry (auth required) |
| `/api/recipes` | GET | List all recipes |
| `/api/recipes` | POST | Create a recipe (auth required) |
| `/api/recipes/[id]` | GET | Get a single recipe by ID or slug |
| `/api/recipes/[id]` | PUT | Update a recipe (auth required) |
| `/api/recipes/[id]` | DELETE | Delete a recipe (auth required) |

The existing `/api/stories` and `/api/news` routes are removed. The new routes follow the same patterns (auth check, Drizzle queries, JSON responses).

### Migration Strategy

The rename migrations are executed as Drizzle migration SQL files in `lib/db/migrations/`.

#### Migration 1: Stories → Journal

```sql
-- Rename table
ALTER TABLE stories RENAME TO journal;

-- Rename indexes
ALTER INDEX stories_slug_idx RENAME TO journal_slug_idx;
ALTER INDEX stories_status_idx RENAME TO journal_status_idx;
ALTER INDEX stories_category_idx RENAME TO journal_category_idx;
```

#### Migration 2: News → Recipes (with new columns)

```sql
-- Add new columns before rename
ALTER TABLE news ADD COLUMN slug text UNIQUE;
ALTER TABLE news ADD COLUMN category text;
ALTER TABLE news ADD COLUMN cover_image text;
ALTER TABLE news ADD COLUMN status text DEFAULT 'published';
ALTER TABLE news ADD COLUMN published_at timestamp;

-- Backfill existing rows
UPDATE news SET
  status = 'published',
  published_at = created_at,
  slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(COALESCE(title, 'untitled-' || id::text), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));

-- Rename table
ALTER TABLE news RENAME TO recipes;

-- Rename existing index
ALTER INDEX news_legacy_id_idx RENAME TO recipes_legacy_id_idx;

-- Add new indexes
CREATE INDEX recipes_slug_idx ON recipes (slug);
CREATE INDEX recipes_status_idx ON recipes (status);
CREATE INDEX recipes_category_idx ON recipes (category);
```

#### Migration 3: Pages Content Format

A Node.js script (not SQL) iterates all `pages` rows and wraps existing content in `{ sections: [] }` format. Existing hardcoded page data (home hero, about, etc.) is preserved as-is in a `legacy` key so the old page editors can still function during the transition period.

```typescript
// lib/db/migrations/migrate-pages-content.ts
// For each page row:
//   if content is not { sections: [...] } format:
//     UPDATE pages SET content = { sections: [], legacy: <old content> }
```

#### Redirect Middleware

In `middleware.ts`, add 301 redirects:

```typescript
// /stories → /journal, /stories/[slug] → /journal/[slug]
// /news → /recipes (if public route existed)
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Section array JSON round-trip

*For any* valid `Section[]` array containing any combination of the 19 section types with arbitrary bilingual text, image references, and nested lists, serializing to JSON via `JSON.stringify` then parsing back via `JSON.parse` SHALL produce a deeply equal array — preserving all section ids, types, field values, and array ordering.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 2: Section list operations preserve data

*For any* `Section[]` array and any sequence of add, remove, and reorder operations: (a) adding a section increases the array length by exactly 1 and the new section appears in the result, (b) removing a section at a valid index decreases the array length by exactly 1 and the removed section is absent, (c) reordering (swapping two indices) preserves all section ids and the array length remains unchanged.

**Validates: Requirements 2.2, 8.4, 8.5**

### Property 3: Dynamic content queries respect max and status filters

*For any* set of journal or recipe entries with mixed `status` values (draft/published) and *for any* `maxEntries` value ≥ 1, the dynamic content query function SHALL return at most `maxEntries` results, all with `status === 'published'`, ordered by `publishedAt` descending. When no published entries exist, the result SHALL be an empty array.

**Validates: Requirements 4.2, 4.6, 4.7**

### Property 4: Section factory produces valid typed sections

*For any* of the 19 `SectionType` string literals, calling the section factory function SHALL return a section object where: (a) the `type` field equals the input type, (b) the `id` field is a non-empty string, (c) all required fields for that section type are present with default values, and (d) the result passes the Section discriminated union type check.

**Validates: Requirements 1.1, 8.3**

### Property 5: Renderer preserves order and skips unknown types

*For any* `Section[]` array potentially containing sections with unrecognized type values, the section-to-component mapping function SHALL: (a) produce output components in the same order as the valid input sections, (b) silently skip any section whose type is not one of the 19 recognized types, and (c) the count of rendered components equals the count of recognized sections in the input.

**Validates: Requirements 11.1, 11.3**

### Property 6: Locale selection correctness

*For any* `Bilingual` field value `{ en, fr }` where both strings are non-empty, and *for any* locale `'en' | 'fr'`, the locale selector function SHALL return the string matching the requested locale. When the requested locale's string is empty, it SHALL fall back to the other locale's string.

**Validates: Requirements 11.5**

### Property 7: Page registry validation and protection

*For any* string input as a page name, the page name validator SHALL accept it if and only if it matches the pattern `/^[a-z0-9]+(-[a-z0-9]+)*$/` (kebab-case). Additionally, *for any* page name in the predefined set (`home`, `about`, `contact`, `journal`, `recipes`), the delete operation SHALL be rejected.

**Validates: Requirements 15.3, 15.5**

## Error Handling

| Scenario | Handling |
|---|---|
| `GET /api/pages/[pageName]` — page not found | Return `{ sections: [] }` (empty page, not 404) |
| `PUT /api/pages/[pageName]` — invalid JSON body | Return 400 with `{ error: 'Invalid request body' }` |
| `PUT /api/pages/[pageName]` — unauthenticated | Return 401 with `{ error: 'Unauthorized' }` |
| `PUT /api/pages/[pageName]` — database error | Return 500 with `{ error: message }`, log server-side |
| Section with unrecognized `type` in storefront | Skip silently, render remaining sections |
| Dynamic section query fails (DB error) | Render empty state for that section, log error |
| Image upload fails within section editor | Display error message in the image field, preserve other section data |
| Save fails in PageBuilder | Show error toast, preserve unsaved state in local component state |
| Migration script encounters duplicate slug | Append `-{id-suffix}` to make slug unique |
| Bilingual field with one language empty | Show visual warning indicator (yellow border), do not block save |

## Testing Strategy

### Property-Based Tests (fast-check)

Library: `fast-check` (TypeScript PBT library, well-supported with Vitest)

Each property test runs a minimum of 100 iterations with random inputs.

| Test File | Property | Tag |
|---|---|---|
| `lib/types/__tests__/sections.property.test.ts` | Section[] round-trip | Feature: cms-page-builder, Property 1: Section array JSON round-trip |
| `lib/types/__tests__/sections.property.test.ts` | Section list operations | Feature: cms-page-builder, Property 2: Section list operations preserve data |
| `lib/db/queries/__tests__/dynamic-content.property.test.ts` | Dynamic content queries | Feature: cms-page-builder, Property 3: Dynamic content queries respect max and status filters |
| `lib/types/__tests__/sections.property.test.ts` | Section factory | Feature: cms-page-builder, Property 4: Section factory produces valid typed sections |
| `components/sections/__tests__/renderer.property.test.ts` | Renderer order + skip | Feature: cms-page-builder, Property 5: Renderer preserves order and skips unknown types |
| `lib/i18n/__tests__/locale-select.property.test.ts` | Locale selection | Feature: cms-page-builder, Property 6: Locale selection correctness |
| `lib/types/__tests__/page-registry.property.test.ts` | Page registry validation | Feature: cms-page-builder, Property 7: Page registry validation and protection |

### Unit Tests (Vitest)

- Section factory: verify each of the 19 types produces correct defaults
- BilingualField component: verify warning state when one language empty
- SectionEditor: verify correct editor renders for each section type
- Page name validation: verify edge cases (empty string, special chars, uppercase)
- Slug generation for recipes migration: verify title-to-slug conversion

### Integration Tests

- API routes: `GET /api/pages/home`, `PUT /api/pages/home` with section payload
- API routes: `GET /api/journal`, `POST /api/journal`, `PUT /api/journal/[id]`
- API routes: `GET /api/recipes`, `POST /api/recipes`
- 301 redirects: `/stories` → `/journal`, `/stories/[slug]` → `/journal/[slug]`
- Migration: verify data preservation after stories→journal and news→recipes renames

### E2E Tests (manual or Playwright)

- Admin: navigate to `/admin/pages/home`, add a section, reorder, save, verify persistence
- Admin: navigate to `/admin/journal`, verify listing works
- Storefront: visit a page with sections, verify all render correctly
- Storefront: visit `/stories/some-slug`, verify 301 redirect to `/journal/some-slug`
