# Admin Component Inventory

All shared components in `app/admin/components/`. Check here before building something new.

## Page Layout & Navigation

| Component | Import | Purpose |
|---|---|---|
| `EditPageLayout` | `@/app/admin/components/EditPageLayout` | Page wrapper for edit/create forms with save/delete/cancel bar and unsaved-changes detection |
| `AdminSidebar` | `@/app/admin/components/AdminSidebar` | Collapsible sidebar nav with grouped sections (General, Products, Ordering, Content, System) |

### EditPageLayout Props
```
title: string
backHref: string, backLabel: string
onSave: () => void | Promise<void>
onDelete?: () => void
onCancel: () => void
saving?: boolean, deleting?: boolean
isDirty?: boolean
children: ReactNode
```

## Tables & Data Display

| Component | Import | Purpose |
|---|---|---|
| `DataTable` | `@/app/admin/components/DataTable` | Generic table with columns, row actions, empty state, loading |

### DataTable Props
```
title: string, description?: string
createButton?: { label, href }
data: T[], columns: Column<T>[]
actions?: Action<T>[]
keyExtractor: (item: T) => string
onRowClick?: (item: T) => void
loading?: boolean
```

## Modals & Feedback

| Component | Import | Purpose |
|---|---|---|
| `ConfirmModal` | `@/app/admin/components/ConfirmModal` | Confirmation dialog (danger/warning/success/info variants) |
| `DeleteModal` | `@/app/admin/components/DeleteModal` | Delete-specific confirmation (always danger) |
| `ToastContainer` / `useToast` | `@/app/admin/components/ToastContainer` | Toast notifications — `success()`, `error()`, `warning()`, `info()` |

### ConfirmModal Props
```
isOpen: boolean, variant?: 'danger' | 'warning' | 'success' | 'info'
title: string, message: string
confirmLabel?: string, cancelLabel?: string
onConfirm: () => void, onCancel: () => void
```

## Image Upload

| Component | Import | Purpose |
|---|---|---|
| `ImageUploader` | `@/app/admin/components/ImageUploader` | Drag-and-drop image upload with preview, alt text, aspect ratio |

### ImageUploader Props
```
value?: string (URL)
onChange: (url: string) => void
onDelete?: () => void
altText?: string, onAltTextChange?: (alt: string) => void
aspectRatio?: '1:1' | '4:5' | '16:9'
label?: string
```

## Taxonomy Components

| Component | Import | Purpose | Use When |
|---|---|---|---|
| `TaxonomySelect` | `@/app/admin/components/TaxonomySelect` | Single-value dropdown with inline create | One category value (e.g. journal category) |
| `TaxonomyMultiSelect` | `@/app/admin/components/TaxonomyMultiSelect` | Multi-select dropdown with inline create | Multiple values from one category |
| `TaxonomyTagPicker` | `@/app/admin/components/TaxonomyTagPicker` | Multi-select tag pills with modal create | Tag-style multi-select (orphaned) |
| `TaxonomyTagSelect` | `@/app/admin/components/TaxonomyTagSelect` | Multi-select dropdown with tag UX | Similar to TaxonomyMultiSelect (orphaned) |
| `TagPicker` | `@/app/admin/components/TagPicker` | Searchable tag picker with pills | Free-form tags from taxonomy |

### TaxonomySelect Props
```
category: TaxonomyCategory
value: string, onChange: (value: string) => void
allowCreate?: boolean, showArchived?: boolean
label?: string, placeholder?: string
```

## Bilingual / Translation

| Component | Import | Purpose | Use When |
|---|---|---|---|
| `BilingualField` | `@/app/admin/components/BilingualField` | Side-by-side EN/FR input with missing-translation warnings | Simple bilingual text fields |
| `TranslationFields` | `@/app/admin/components/TranslationFields` | Locale-aware field renderer (shows EN or FR based on admin locale) | Complex forms with many bilingual fields |
| `AdminLocaleSwitcher` | `@/app/admin/components/AdminLocaleSwitcher` | EN/FR toggle for admin editing locale | Pages using TranslationFields |
| `AiTranslateButton` | `@/app/admin/components/AiTranslateButton` | AI-powered translation button | Alongside TranslationFields |

### BilingualField Props
```
label: string
value: { en: string; fr: string }
onChange: (value: { en: string; fr: string }) => void
multiline?: boolean, rows?: number
```

## Shopify Integration

| Component | Import | Purpose |
|---|---|---|
| `ShopifyProductPicker` | `@/app/admin/components/ShopifyProductPicker` | Modal search for Shopify products (single or multi-select) |
| `ShopifyVariantsDisplay` | `@/app/admin/components/ShopifyVariantsDisplay` | Read-only Shopify variant list with prices |
| `SyncStatusIndicator` | `@/app/admin/components/SyncStatusIndicator` | Sync status badge with resync button (orphaned) |

### ShopifyProductPicker Props
```
selectedProductId?: string
onSelect: (product: ShopifyProduct | null) => void
onSelectMultiple?: (products: ShopifyProduct[]) => void
multiSelect?: boolean
trigger?: ReactNode
```

## Product-Specific

| Component | Import | Purpose |
|---|---|---|
| `VariantEditor` | `@/app/admin/components/VariantEditor` | Editable variant list with bilingual labels, prices, reordering |
| `FlavourIngredientSelector` | `@/app/admin/components/FlavourIngredientSelector` | Ingredient picker with auto-calculated allergens |
| `ProductAvailabilityTab` | `@/app/admin/components/ProductAvailabilityTab` | Pickup-only toggle and order quantity rules |
| `TaxShippingSection` | `@/app/admin/components/TaxShippingSection` | Tax behavior config with Shopify tax variant creation |

## AI Assistants

| Component | Import | Purpose |
|---|---|---|
| `AiAutofillButton` | `@/app/admin/components/AiAutofillButton` | AI-powered ingredient field autofill |
| `AiTranslateButton` | `@/app/admin/components/AiTranslateButton` | AI-powered EN↔FR translation |

## Order Management

| Component | Import | Purpose |
|---|---|---|
| `OrderTypeSelector` | `@/app/admin/components/OrderTypeSelector` | Segmented control for Menu/Catering/Cake |
| `OrderTypeBadge` | `@/app/admin/components/OrderTypeBadge` | Colored badge for order type |
| `CakeProductionTimeline` | `@/app/admin/components/CakeProductionTimeline` | Gantt-style cake order timeline |
| `CateringProductionTimeline` | `@/app/admin/components/CateringProductionTimeline` | 35-day heatmap for catering volume |

## Page Builder

| Component | Import | Purpose |
|---|---|---|
| `PageBuilderLive` | `@/app/admin/components/builder/PageBuilderLive` | Full live page builder with drag-and-drop, viewport switching |
| `LiveSectionRenderer` | `@/app/admin/components/builder/LiveSectionRenderer` | Renders sections as live-editable previews |
| `SectionWrapper` | `@/app/admin/components/builder/SectionWrapper` | Sortable wrapper with hover toolbar |
| `SectionEditor` | `@/app/admin/components/SectionEditor` | Form-based section editor (18+ section types) |
| `SectionLibrary` | `@/app/admin/components/SectionLibrary` | Modal overlay to browse and add section types |
| `EditableText` | `@/app/admin/components/builder/EditableText` | Inline contentEditable for bilingual text |
| `EditableImage` | `@/app/admin/components/builder/EditableImage` | Click-to-upload image in builder |
| `FaqLivePreview` | `@/app/admin/components/builder/FaqLivePreview` | Live FAQ preview with topic selection |

## Content Editors

| Component | Import | Purpose |
|---|---|---|
| `RichTextEditor` | `@/app/admin/components/RichTextEditor` | TipTap-based rich text with bold/italic/list toolbar |
| `StoryBlockBuilder` | `@/app/admin/components/StoryBlockBuilder` | Block-based content builder (orphaned — superseded by page builder) |

## UI Primitives (`app/admin/components/ui/`)

These are Untitled UI components. Use them for all form elements and basic UI.

| Component | Import | Purpose |
|---|---|---|
| `Button` | `@/app/admin/components/ui/button` | Primary/secondary/tertiary/danger, sm/md/lg |
| `Input` | `@/app/admin/components/ui/input` | Input with label, hint, validation |
| `Textarea` | `@/app/admin/components/ui/textarea` | Textarea with label, hint, validation |
| `Select` | `@/app/admin/components/ui/select` | Single-select dropdown |
| `MultiSelect` | `@/app/admin/components/ui/multi-select` | Multi-select with search and tags |
| `Checkbox` | `@/app/admin/components/ui/checkbox` | Checkbox with label and hint |
| `Modal` | `@/app/admin/components/ui/modal` | Dialog (sm/md/lg) with footer slot |
| `Badge` | `@/app/admin/components/ui/badge` | Status badge (info/success/error/warning/purple/pink/gray) |
| `DatePicker` | `@/app/admin/components/ui/date-picker` | Date picker |
| `DateRangePicker` | `@/app/admin/components/ui/date-range-picker` | Date range picker |
| `Tooltip` | `@/app/admin/components/ui/tooltip` | React Aria tooltip |
| Nav components | `@/app/admin/components/ui/nav/*` | NavItem, NavList, NavSections, BadgeWithDot |

## Orphaned Components

These exist but have no active imports. Consider removing or using them:

| Component | Original Purpose |
|---|---|
| `DeleteModal` | Simplified delete confirmation (use ConfirmModal with variant="danger" instead) |
| `TaxonomyTagPicker` | Tag-style multi-select (TaxonomyMultiSelect is preferred) |
| `TaxonomyTagSelect` | Another multi-select variant |
| `FlavourSelector` | Grid-based flavour picker |
| `FlavourUsagePanel` | Shows which products use a flavour |
| `RelatedItems` | Linked badge list |
| `TableFilters` | Filter bar with search/select |
| `BaseStyleSelector` | Flavour base style radio group |
| `AvailabilityScheduler` | Date range + location picker |
| `InventoryPanel` | Stock tracking form |
| `TwistBuilder` | Two-flavour combination selector |
| `StoryBlockBuilder` | Block content builder (superseded by page builder) |
| `SyncStatusIndicator` | Shopify sync status badge |
