---
inclusion: fileMatch
fileMatchPattern: "{app/api/**,app/admin/**,lib/db/**,types/**}"
description: CMS content types, entity relationships, lifecycle rules, and API routes.
---

# CMS Content Model

## Content Types

### Ingredient
The provenance-first building block. Inspired by Ffern and Noma.

Key fields: `name`, `latinName`, `origin`, `category`, `story`, `tastingNotes`, `supplier`, `farm`, `seasonal`, `allergens`, `images`

Categories: `base | flavor | mix-in | topping | spice`

### Flavour
The core archive entity. Lives independently of Shopify.

Key fields: `name`, `description`, `coreIngredients[]`, `allIngredients[]`, `categories[]`, `tastingNotes[]`, `seasonReleased`, `status`, `availableAs[]`, `collaborators[]`, `batches[]`, `shopifyProductId`, `images`, `averageRating`

Status values: `active | seasonal | archived | test-kitchen | coming-soon`

### Batch
Test kitchen record. Belongs to a flavour, not a product.

Key fields: `id` (e.g. `SC-BOCD-1007A`), `flavourId`, `date`, `ingredients[]` (with ratios), `notes`, `processingNotes`, `rating`, `finalDecision`, `photos`

Decision values: `approved | needs-adjustment | rejected | testing`

### Journal
Editorial content layer (renamed from Stories). Body content uses the section-based page builder.

Key fields: `title` (bilingual), `slug`, `content` (contains `sections: Section[]`, `intro`, `wordBy`, `wordByRole`), `category`, `tags[]`, `coverImage`, `status`, `publishedAt`

Categories: `founders | ethos | collaboration | journal | event | test-kitchen | heritage`

### Recipe
Culinary content (renamed from News). Body content uses the section-based page builder.

Key fields: `title`, `slug`, `content` (contains `sections: Section[]`), `category`, `coverImage`, `status`, `publishedAt`

### Page
Composable pages built from sections via the page builder.

Key fields: `pageName` (unique), `content` (contains `sections: Section[]`), `updatedAt`

Predefined pages: `home`, `about`, `journal`, `recipes`. Custom pages created via admin.

### FAQ
Centrally managed FAQ items grouped by topic. Referenced by FAQ sections in the page builder.

Key fields: `topic`, `question` (bilingual), `answer` (bilingual), `sortOrder`

### Launch Event
Marketing campaigns and drops.

Key fields: `name`, `date`, `status`, `featuredFlavours[]`, `featuredProducts[]`, `relatedStories[]`, `image`

Status values: `upcoming | active | past`

### Settings
Global site config — one record.

Key fields: `companyName`, `logo`, `featuredProducts[]`, `flavourOfTheWeek`, `socialLinks`

---

## Relationships

| From | To | Type | Rule |
|---|---|---|---|
| Ingredient | Flavour | many-to-many | An ingredient can appear in many flavours |
| Flavour | Batch | one-to-many | A flavour has many batch iterations |
| Flavour | Shopify Product | one-to-many | A flavour may map to multiple products (pint, soft serve kit) |
| Flavour | Journal | many-to-many | Journal entries can feature multiple flavours |
| Ingredient | Journal | many-to-many | Journal entries can feature multiple ingredients |
| Launch Event | Flavour | many-to-many | An event can feature multiple flavours |
| Launch Event | Journal | many-to-many | An event can link to journal entries |

## Lifecycle Rules

- A flavour's archive status is independent of its Shopify product status. An archived flavour can still have an active Shopify product (e.g. a returning seasonal).
- Batches belong to flavours, not Shopify products.
- Deleting an ingredient should be blocked if it is referenced by any active flavour.
- Stories are published independently — they don't require a linked flavour or ingredient.

## Storage

| Environment | Storage |
|---|---|
| Development | JSON files in `public/data/` |
| Production | Vercel KV (or Upstash Redis) |
| Images (dev) | `public/uploads/` |
| Images (prod) | Vercel Blob |

## API Routes (CMS)

All require auth except GET endpoints:

```
GET/POST        /api/ingredients
PUT/DELETE      /api/ingredients/[id]

GET/POST        /api/flavours
PUT/DELETE      /api/flavours/[id]

GET/POST        /api/batches
PUT/DELETE      /api/batches/[id]

GET/POST        /api/journal
GET/PUT/DELETE  /api/journal/[id]

GET/POST        /api/recipes
GET/PUT/DELETE  /api/recipes/[id]

GET             /api/pages
GET/PUT/DELETE  /api/pages/[pageName]

GET/POST        /api/faqs
GET             /api/faqs/topics
PUT/DELETE      /api/faqs/[id]

GET/POST        /api/launch-events
PUT/DELETE      /api/launch-events/[id]

GET/PUT         /api/settings

POST            /api/upload
POST            /api/products/sync   # Shopify sync
```
