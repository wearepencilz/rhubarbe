# Requirements: Three-Layer CMS Architecture

## Overview

Restructure the Janine CMS around a clean 3-layer model that separates product formats, flavours, and sellable offerings. This architecture prevents content duplication, enables flexible menu management, and supports complex product relationships like twists, combos, and seasonal drops.

## Problem Statement

The current CMS treats flavours and products as a single entity, leading to:
- Duplication when the same flavour appears in multiple formats (soft serve, pint, sandwich)
- Difficulty managing twist combinations without creating fake "combo flavours"
- Confusion between flavour content (story, ingredients) and operational data (price, inventory)
- Limited flexibility for bundles, pairings, and seasonal collections

## Core Architecture

### Layer 1: Formats (Product Structure)
Defines the sellable structure/container.

**Examples:**
- Soft serve (cup/cone)
- Twist soft serve
- Sorbet
- Pint
- Ice cream sandwich
- Tasting
- Combo

**Answers:** "What kind of thing is this?"

### Layer 2: Flavours (Flavour Entity)
The actual flavour, independent of format.

**Examples:**
- Pistachio
- Blood orange
- Cardamom
- Olive oil
- Goat cheese
- Lemon sorbet

**Answers:** "What flavour is in it?"

### Layer 3: Offerings (Menu Items)
The actual sellable item shown on site/menu.

**Examples:**
- Pistachio soft serve
- Blood orange + cardamom twist
- Lemon sorbet pint
- Goat cheese tasting
- Focaccia + soft serve combo
- Ice cream sandwich with tahini-date gelato

**Answers:** "What is available right now, in what form, at what price?"

---

## User Stories

### US-1: Manage Product Formats
**As an** administrator  
**I want to** define and manage product formats (soft serve, twist, pint, sandwich, etc.)  
**So that** I can establish the structural templates for all sellable items

**Acceptance Criteria:**
- Can create formats with name, slug, category, and description
- Can specify if format requires flavours (min/max count)
- Can define if format allows flavour mixing (e.g., twist requires 2 flavours)
- Can set default size options and serving style
- Can configure if format supports add-ons
- Can assign formats to menu sections
- Can upload format icon/image

### US-2: Manage Flavours as Reusable Entities
**As an** administrator  
**I want to** create and manage flavours independently of formats  
**So that** I can reuse the same flavour across multiple product types without duplication

**Acceptance Criteria:**
- Can create flavours with name, slug, type (gelato/sorbet/special)
- Can set base style (dairy/non-dairy/fruit/cheese/other)
- Can add description, short description, and flavour story
- Can link ingredients and key notes
- Can specify allergens and dietary tags
- Can set colour and upload image
- Can mark season and availability status (active/upcoming/archived)
- Can configure format eligibility flags:
  - Can be used in twist? yes/no
  - Can be sold as pint? yes/no
  - Can be used in sandwich? yes/no
- Can set sort order and featured status

### US-3: Create Menu Offerings from Formats and Flavours
**As an** administrator  
**I want to** create sellable menu items by combining formats with flavours  
**So that** I can manage what's actually available to customers

**Acceptance Criteria:**
- Can create offering with internal and public names
- Can select format (links to Formats collection)
- Can select primary flavour(s) based on format requirements
- Can select secondary flavours if format allows
- Can add description and short card copy
- Can upload offering-specific image
- Can set price and compare-at price
- Can set availability window (start/end dates)
- Can set status (draft/scheduled/active/sold out/archived)
- Can specify location if relevant
- Can add tags (seasonal, weekly, featured, limited, collab)
- Can link to Shopify SKU
- Can configure inventory tracking
- Can set online orderability and pickup-only flags

### US-4: Manage Twist Combinations Properly
**As an** administrator  
**I want to** create twist offerings by pairing two flavours  
**So that** I can avoid creating fake "combo flavour" entries

**Acceptance Criteria:**
- Twist format requires exactly 2 flavours
- Can select any two flavours marked as "twist eligible"
- Can optionally add twist-specific display name (e.g., "Sicilian Twist")
- Can add twist-specific hero copy and image
- System prevents selecting flavours not marked as twist-eligible
- Can reuse same flavours in different twist combinations
- Can change twist combinations weekly without affecting base flavours

### US-5: Manage Pints with Inventory
**As an** administrator  
**I want to** manage pints as packaged products with inventory tracking  
**So that** I can handle stock, batches, and preorders properly

**Acceptance Criteria:**
- Pint format links to one (or optionally two) flavours
- Can specify packaged volume
- Can track inventory quantity
- Can add batch code and restock date
- Can set shelf life notes
- Can mark as "local pickup only"
- Can enable/disable preorder availability
- Can set freezer pickup rules

### US-6: Manage Sandwiches and Tastings
**As an** administrator  
**I want to** create sandwiches and tastings with proper component relationships  
**So that** I can manage complex products with multiple elements

**Acceptance Criteria:**
- Sandwich format links to flavour filling
- Can select cookie/shell type from Components collection
- Can add optional inclusions (crumbs, jam, etc.)
- Tasting format can pull from both Flavours and Components/Pairings
- Can create Components collection for:
  - Focaccia
  - Goat cheese
  - Olive oil
  - Jam
  - Toppings
  - Tasting notes

### US-7: Manage Bundles and Combos
**As an** administrator  
**I want to** create bundle offerings with choice rules  
**So that** customers can order combos like "focaccia + soft serve"

**Acceptance Criteria:**
- Can create bundle with name, slug, and description
- Can specify included items (e.g., 1 focaccia + 1 soft serve)
- Can define choice rules:
  - Choose 1 focaccia type
  - Choose 1 soft serve flavour
  - Twist allowed? yes/no
  - Sorbet allowed? yes/no
  - Premium surcharge? yes/no
- Can set bundle price (vs. sum of individual prices)
- Can set availability window
- Can add upsell copy and image
- Can map to POS system

### US-8: Manage Seasonal Collections and Drops
**As an** administrator  
**I want to** group offerings into seasonal collections  
**So that** I can create editorial storytelling around menu launches

**Acceptance Criteria:**
- Can create seasonal collection with name and slug
- Can add collection description and hero image
- Can link multiple offerings to collection
- Can set collection availability dates
- Can feature collection on homepage
- Can create collections like:
  - Opening Week
  - Citrus Drop
  - Late Summer Favourites
  - January Blood Orange Series

### US-9: View Flavour Usage Across Formats
**As an** administrator  
**I want to** see where a flavour is being used  
**So that** I can understand dependencies before archiving or editing

**Acceptance Criteria:**
- Can view list of all offerings using a specific flavour
- Can see format breakdown (e.g., "Used in 3 soft serves, 2 pints, 1 twist")
- Can filter offerings by flavour
- System warns before archiving flavour that's in active offerings
- Can see historical usage for archived flavours

### US-10: Manage Format-Specific Rules
**As an** administrator  
**I want to** configure format-specific constraints  
**So that** the system enforces proper product structure

**Acceptance Criteria:**
- Twist format enforces exactly 2 flavours
- Single-flavour formats enforce exactly 1 flavour
- Sandwich format requires component selection
- Tasting format allows flexible component mixing
- Bundle format requires choice rule configuration
- System validates offerings against format rules before publishing

---

## Functional Requirements

### FR-1: Collections Structure
The CMS must implement these core collections:

**Essential:**
1. Formats
2. Flavours
3. Offerings (Menu Items)
4. Bundles/Combos

**Strongly Recommended:**
5. Components/Pairings
6. Seasonal Collections

### FR-2: Flavour Reusability
- A single flavour can be used in unlimited offerings
- Flavour content (story, ingredients, image) is defined once
- Offerings reference flavours, not duplicate them
- Editing a flavour updates all offerings using it

### FR-3: Format Constraints
- Formats define structural rules (min/max flavours, component requirements)
- System enforces format rules when creating offerings
- Invalid offerings cannot be published

### FR-4: Twist Logic
- Twists are relationships between 2 flavours within a format
- No "fake combo flavours" like "Pistachio x Blood Orange Twist"
- Twist offerings can have custom display names and merchandising
- Internal structure remains: Format=Twist, Flavour A + Flavour B

### FR-5: Inventory Management
- Pints track inventory quantity
- Made-to-order items (soft serve) do not track inventory
- Batch codes and restock dates for packaged products
- Sold-out status updates automatically based on inventory

### FR-6: Bundle Choice Rules
- Bundles define allowed choices and restrictions
- Choice rules prevent invalid combinations
- Premium surcharges apply automatically
- POS integration maps bundle choices correctly

### FR-7: Seasonal Collections
- Collections group offerings for editorial presentation
- Collections have availability windows
- Offerings can belong to multiple collections
- Collections support hero images and storytelling copy

---

## Non-Functional Requirements

### NFR-1: Performance
- Offering list page loads in < 500ms
- Flavour search returns results in < 200ms
- Format selection updates UI instantly

### NFR-2: Data Integrity
- Referential integrity between offerings and flavours
- Cascade warnings when deleting referenced entities
- Validation prevents orphaned offerings

### NFR-3: Usability
- Intuitive format → flavour → offering workflow
- Visual indicators for format requirements
- Clear error messages for validation failures
- Drag-and-drop for flavour ordering in twists

### NFR-4: Scalability
- Support 100+ flavours
- Support 50+ formats
- Support 500+ active offerings
- Support 20+ seasonal collections

### NFR-5: Migration
- Migrate existing flavour data to new structure
- Preserve Shopify product links
- Maintain ingredient relationships
- Zero downtime during migration

---

## Data Models

### Format
```typescript
{
  id: string
  name: string
  slug: string
  category: 'frozen' | 'food' | 'experience' | 'bundle'
  description: string
  requiresFlavours: boolean
  minFlavours: number
  maxFlavours: number
  allowMixedTypes: boolean
  canIncludeAddOns: boolean
  defaultSizes: string[]
  servingStyle: 'scoop' | 'soft-serve' | 'packaged' | 'plated'
  menuSection: string
  image?: string
  icon?: string
  createdAt: string
  updatedAt: string
}
```

### Flavour
```typescript
{
  id: string
  name: string
  slug: string
  type: 'gelato' | 'sorbet' | 'special' | 'tasting-component'
  baseStyle: 'dairy' | 'non-dairy' | 'fruit' | 'cheese' | 'other'
  description: string
  shortDescription: string
  ingredients: string[]
  keyNotes: string[]
  allergens: Allergen[]
  dietaryTags: DietaryFlag[]
  colour: string
  image?: string
  season?: string
  availabilityStatus: 'active' | 'upcoming' | 'archived'
  
  // Format eligibility
  canBeUsedInTwist: boolean
  canBeSoldAsPint: boolean
  canBeUsedInSandwich: boolean
  
  sortOrder: number
  featured: boolean
  createdAt: string
  updatedAt: string
}
```

### Offering (Menu Item)
```typescript
{
  id: string
  internalName: string
  publicName: string
  slug: string
  status: 'draft' | 'scheduled' | 'active' | 'sold-out' | 'archived'
  
  // Relationships
  formatId: string
  primaryFlavourIds: string[]
  secondaryFlavourIds?: string[]
  comboItemIds?: string[]
  componentIds?: string[]
  
  // Content
  description: string
  shortCardCopy: string
  image?: string
  
  // Pricing
  price: number
  compareAtPrice?: number
  
  // Availability
  availabilityStart?: string
  availabilityEnd?: string
  location?: string
  
  // Tags
  tags: string[] // seasonal, weekly, featured, limited, collab
  
  // Integration
  shopifyProductId?: string
  shopifySKU?: string
  posMapping?: string
  
  // Inventory (for packaged products)
  inventoryTracked: boolean
  inventoryQuantity?: number
  batchCode?: string
  restockDate?: string
  shelfLifeNotes?: string
  
  // Ordering
  onlineOrderable: boolean
  pickupOnly: boolean
  
  createdAt: string
  updatedAt: string
}
```

### Bundle/Combo
```typescript
{
  id: string
  name: string
  slug: string
  description: string
  includedItems: string[] // IDs of offerings or components
  choiceRules: {
    componentType: string
    minChoices: number
    maxChoices: number
    allowedTypes: string[]
    premiumSurcharge?: number
  }[]
  bundlePrice: number
  availability: {
    start?: string
    end?: string
  }
  upsellCopy?: string
  image?: string
  posMapping?: string
  createdAt: string
  updatedAt: string
}
```

### Component/Pairing
```typescript
{
  id: string
  name: string
  slug: string
  type: 'bread' | 'cheese' | 'topping' | 'sauce' | 'pairing'
  description: string
  allergens: Allergen[]
  dietaryTags: DietaryFlag[]
  price?: number
  image?: string
  availabilityStatus: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}
```

### Seasonal Collection
```typescript
{
  id: string
  name: string
  slug: string
  description: string
  heroImage?: string
  offeringIds: string[]
  availabilityStart?: string
  availabilityEnd?: string
  featured: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}
```

---

## Success Metrics

1. **Content Reusability**: Same flavour used in average 3+ offerings
2. **Twist Management**: Zero "fake combo flavours" created
3. **Admin Efficiency**: Time to create new offering reduced by 60%
4. **Data Integrity**: Zero orphaned offerings or broken references
5. **Menu Flexibility**: Can update weekly menu in < 15 minutes

---

## Dependencies

- Existing ingredient management system
- Shopify product catalog
- Current flavour and batch data
- Admin authentication system

---

## Constraints

- Must maintain backward compatibility with existing Shopify products
- Must preserve all existing flavour stories and ingredient data
- Migration must complete without data loss
- Admin UI must follow existing design patterns

---

## Out of Scope

- Customer-facing menu display (separate implementation)
- POS system integration (future phase)
- Inventory forecasting and analytics
- Multi-location menu management
- Customer customization interface

---

**Status**: Ready for design  
**Priority**: High  
**Estimated Effort**: 4-6 weeks  
**Next Step**: Create technical design document
