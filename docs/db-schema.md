# Database Schema Reference

Source: `lib/db/schema.ts` · Drizzle ORM · PostgreSQL (Vercel Postgres)

All tables use UUID primary keys with `defaultRandom()`. Timestamps use `defaultNow()`. JSON columns use `customJsonb<T>()` from `lib/db/custom-types`.

## Tables at a Glance

| Table | Purpose | FK Parent |
|---|---|---|
| `products` | All sellable items (regular, cake, volume, catering) | — |
| `volume_lead_time_tiers` | Volume product lead time rules by quantity | products |
| `cake_lead_time_tiers` | Cake lead time rules by people count | products |
| `cake_pricing_tiers` | Cake tiered pricing by people count | products |
| `cake_pricing_grid` | Cake 2-axis pricing (size × flavour) | products |
| `cake_addon_links` | Parent cake → add-on product links | products × 2 |
| `cake_variants` | Cake-specific variants with bilingual labels | products |
| `volume_variants` | Volume-specific variants with bilingual labels | products |
| `product_ingredients` | Product ↔ ingredient join table | products, ingredients |
| `ingredients` | Gelato ingredients with provenance | — |
| `launches` | Weekly preorder menus | pickup_locations |
| `launch_products` | Products linked to a launch | launches |
| `orders` | All order types (launch, volume, cake) | — |
| `order_items` | Line items within an order | — (text refs) |
| `pickup_locations` | Collection points | — |
| `taxonomy_values` | Categorization values (grouped by category) | — |
| `journal` | Editorial content (bilingual, section-based) | — |
| `recipes` | Recipe content (section-based) | — |
| `faqs` | FAQ items grouped by topic | — |
| `pages` | CMS pages (section-based content) | — |
| `settings` | Key-value global config | — |
| `users` | Admin accounts (legacy — now using Clerk) | — |
| `requests` | Customer order requests | — |
| `email_templates` | Bilingual email templates | — |
| `email_logs` | Transactional email audit trail | — |

## Products

The widest table — a single `products` table serves regular, cake, volume, and catering products. Product type is determined by field combinations, not a discriminator column.

### Core Fields
| Column | Type | Notes |
|---|---|---|
| `name` | text | Required |
| `slug` | text | Unique |
| `shopify_product_id` | text | Shopify link |
| `shopify_product_handle` | text | |
| `description` | text | |
| `category` | text | |
| `price` | integer | Cents |
| `image` | text | URL |
| `status` | text | |
| `allergens` | jsonb string[] | |
| `tags` | jsonb string[] | |
| `translations` | jsonb | `{ field: { en, fr } }` |

### Sync Fields
| Column | Type | Notes |
|---|---|---|
| `sync_status` | text | synced / pending / error |
| `last_synced_at` | timestamp | |
| `sync_error` | text | |

### Order Rules
| Column | Type | Notes |
|---|---|---|
| `default_min_quantity` | integer | Default 1 |
| `default_quantity_step` | integer | Default 1 |
| `default_max_quantity` | integer | Nullable |
| `default_pickup_required` | boolean | |
| `online_orderable` | boolean | |
| `pickup_only` | boolean | |

### Volume / Catering Fields
| Column | Type | Notes |
|---|---|---|
| `volume_enabled` | boolean | |
| `volume_description` | jsonb `{en,fr}` | |
| `volume_min_order_quantity` | integer | |
| `volume_unit_label` | text | 'quantity' or 'people' |
| `catering_type` | text | brunch / lunch / dinatoire |
| `catering_description` | jsonb `{en,fr}` | |
| `catering_end_date` | timestamp | Expiry for seasonal items |
| `dietary_tags` | jsonb string[] | |
| `temperature_tags` | jsonb string[] | |
| `order_minimum` | integer | Min total qty |
| `order_scope` | text | 'variant' or 'order' |
| `variant_minimum` | integer | Min per variant |
| `increment` | integer | Step size |
| `serves_per_unit` | integer | |

### Cake Fields
| Column | Type | Notes |
|---|---|---|
| `cake_enabled` | boolean | |
| `cake_product_type` | text | cake-xxl / croquembouche / wedding-cake-tiered / wedding-cake-tasting |
| `cake_description` | jsonb `{en,fr}` | |
| `cake_min_people` | integer | |
| `cake_max_people` | integer | |
| `cake_flavour_config` | jsonb `CakeFlavourEntry[]` | Handle, label, pricing tier, active, endDate |
| `cake_tier_detail_config` | jsonb `CakeTierDetailEntry[]` | Size, layers, diameters |
| `cake_max_flavours` | integer | |
| `cake_delivery_available` | boolean | |

### Tax Fields
| Column | Type | Notes |
|---|---|---|
| `tax_behavior` | text | always_taxable (default) |
| `tax_threshold` | integer | Unit count threshold |
| `tax_unit_count` | integer | |
| `shopify_tax_exempt_variant_id` | text | |

## Cake Child Tables

All cascade-delete on parent product.

### `cake_lead_time_tiers`
| Column | Type | Notes |
|---|---|---|
| `product_id` | uuid FK | |
| `min_people` | integer | Tier threshold |
| `lead_time_days` | integer | |
| `delivery_only` | boolean | If true, no pickup at this tier |

### `cake_pricing_tiers`
| Column | Type | Notes |
|---|---|---|
| `product_id` | uuid FK | |
| `min_people` | integer | Tier threshold |
| `price_in_cents` | integer | |
| `shopify_variant_id` | text | |

### `cake_pricing_grid`
Two-axis pricing: size × flavour → price. Unique constraint on `(product_id, size_value, flavour_handle)`.

| Column | Type | Notes |
|---|---|---|
| `product_id` | uuid FK | |
| `size_value` | text | e.g. "10", "20" |
| `flavour_handle` | text | |
| `price_in_cents` | integer | |
| `shopify_variant_id` | text | |

### `cake_addon_links`
Links parent cake products to add-on products. Unique on `(parent_product_id, addon_product_id)`.

### `cake_variants` / `volume_variants`
Same structure — bilingual label, Shopify variant ID, sort order, active flag, optional allergens.

## Launches (Weekly Menus)

| Column | Type | Notes |
|---|---|---|
| `title` | jsonb `{en,fr}` | |
| `slug` | text | Unique |
| `intro_copy` | jsonb `{en,fr}` | |
| `status` | enum | draft / active / archived |
| `order_opens` | timestamp | |
| `order_closes` | timestamp | |
| `pickup_date` | timestamp | |
| `pickup_location_id` | uuid FK | → pickup_locations |
| `pickup_slots` | jsonb | Generated slot array |
| `pickup_slot_config` | jsonb | Start/end/interval config |

### `launch_products`
| Column | Type | Notes |
|---|---|---|
| `launch_id` | uuid FK | Cascade delete |
| `product_id` | text | **Not a uuid FK** — legacy slug-based IDs |
| `product_name` | text | Denormalized |
| `sort_order` | integer | |
| `min_quantity_override` | integer | Per-menu override |
| `max_quantity_override` | integer | |

## Orders

| Column | Type | Notes |
|---|---|---|
| `order_number` | text | Unique, human-readable |
| `shopify_order_id` | text | Unique, nullable |
| `order_type` | text | launch / volume / cake |
| `status` | enum | pending / confirmed / fulfilled / cancelled |
| `payment_status` | enum | pending / paid / refunded |
| `subtotal` / `tax` / `total` | integer | Cents |
| `fulfillment_date` | timestamp | For volume/cake orders |
| `catering_type` | text | For volume orders |
| `launch_id` | text | For launch orders |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| `order_id` | uuid | **No FK constraint** |
| `product_id` | uuid | **No FK constraint** |
| `quantity` | integer | |
| `unit_price` / `subtotal` | integer | Cents |
| `pickup_date` | timestamp | |
| `pickup_location_id` | uuid | |
| `pickup_slot` | jsonb | `{startTime, endTime}` |

## Content Tables

### `journal`
Bilingual editorial content. Body uses section-based page builder (`content.sections`).

| Column | Type | Notes |
|---|---|---|
| `title` / `subtitle` | jsonb `{en,fr}` | |
| `content` | jsonb | Contains `sections: Section[]` |
| `category` | text | founders / ethos / collaboration / etc. |
| `tags` | jsonb string[] | |
| `cover_image` | text | |
| `status` | text | |
| `published_at` | timestamp | |

### `recipes`
Same pattern as journal but simpler — title is plain text, not bilingual.

### `pages`
| Column | Type | Notes |
|---|---|---|
| `page_name` | text | Unique key (home, about, etc.) |
| `title` | jsonb `{en,fr}` | |
| `slug_en` / `slug_fr` | text | URL slugs |
| `content` | jsonb | Contains `sections: Section[]` |

### `faqs`
| Column | Type | Notes |
|---|---|---|
| `topic` | text | Grouping key |
| `question` | jsonb `{en,fr}` | |
| `answer` | jsonb `{en,fr}` | |
| `sort_order` | integer | |

## Supporting Tables

### `ingredients`
Wide table with provenance, sensory, and sourcing fields. Key jsonb arrays: `allergens`, `roles`, `descriptors`, `tasting_notes`, `texture`, `process`, `attributes`, `used_as`, `available_months`.

### `taxonomy_values`
Centralized categorization. Unique on `(category, value)`. Categories include ingredient types, flavour categories, dietary tags, etc.

### `pickup_locations`
Bilingual labels and instructions. `disabled_pickup_days` is a jsonb number array (0=Sunday, 6=Saturday).

### `settings`
Key-value store. Notable keys: `typographyTokens`, `fontStacks`, `companyName`, `featuredProducts`, `socialLinks`.

### `email_templates` / `email_logs`
Templates keyed by `template_key` with bilingual subject/body. Logs track send status per recipient.

### `users`
Legacy table — auth now handled by Clerk (ADR-012). Table still exists but is not actively used for authentication.

### `requests`
Customer order requests (traiteur, gateaux). Simple form submissions with status tracking.

## Relationships Diagram

```
products ──┬── volume_lead_time_tiers (1:N, cascade)
           ├── cake_lead_time_tiers   (1:N, cascade)
           ├── cake_pricing_tiers     (1:N, cascade)
           ├── cake_pricing_grid      (1:N, cascade)
           ├── cake_addon_links       (N:M self-ref via parent+addon)
           ├── cake_variants          (1:N, cascade)
           ├── volume_variants        (1:N, cascade)
           └── product_ingredients    (N:M → ingredients, cascade both sides)

launches ──┬── launch_products (1:N, cascade)
           └── pickup_locations (N:1, FK)

orders ──── order_items (1:N, no FK constraint)
```

Many-to-many relationships (products↔ingredients) use a proper join table. Other M:M relationships (e.g. journal↔flavours) use jsonb string arrays storing IDs — this is a deliberate simplicity trade-off (ADR-008).
