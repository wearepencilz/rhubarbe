# Janine Digital Platform - Overview

## Vision Statement

Janine is an artisan ice cream shop platform that balances commerce, discovery, story, and experimentation. Like Flamingo Estate + Noma Projects + Seasonal Gelato Shop.

> Commerce is important. But the archive of flavour experimentation becomes the real brand asset.

## Four Pillars

1. **Digital Extension of Shop** - Order ahead, explore flavours, engage with brand
2. **Living Archive** - Document every flavour, batch, and ingredient
3. **Community Layer** - Golden Spoon loyalty, ratings, events
4. **Test Kitchen Interface** - Experimentation workflow and batch tracking

## Core Features

### High Priority (MVP)
- ✅ Shopify shop integration
- ✅ Ingredient library with provenance
- ✅ Flavour archive with Shopify linking
- ✅ Stories (editorial content)
- ✅ Locations
- ✅ Settings
- ✅ QR code generator
- ✅ Click & Collect ordering

### Medium Priority
- Golden Spoon loyalty program
- Flavour ratings and favourites
- Batch tracking (test kitchen)
- Events and tastings

### Future
- Flavour recommendation engine
- Community voting
- AI flavour suggestions
- Mobile app

## Technical Architecture

### Hybrid Approach

**Shopify** → Products, inventory, checkout, subscriptions
**Headless CMS** (Sanity/Contentful/Strapi) → Ingredients, flavours, batches, stories
**Next.js API Routes** → Relationship mapping, loyalty, ratings, QR codes

### Why This Split?
- Richer relational data in CMS
- Flavour archive independent of commerce lifecycle
- Editorial flexibility
- Test kitchen workflow separate from live products

## Key Data Models

### Ingredient
- Name, origin, story, tasting notes
- Category, allergens, seasonal availability
- Supplier/farm information
- Used in flavours (relationships)
- Images and processing photos

### Flavour
- Name, description, tasting notes
- Core ingredients (2-3) + all ingredients
- Status (active, seasonal, archived, test-kitchen, coming-soon)
- Batch history
- Shopify product link
- Collaborators
- Community ratings
- "In the making" photos

### Batch
- Batch ID (e.g., SC-BOCD-1007A)
- Flavour link
- Ingredient ratios
- Process notes
- Tasting evaluation
- Final decision (approved, needs adjustment, rejected)
- Process photos

### Story
- Title, content, excerpt
- Category (founders, ethos, collaboration, journal, event, test-kitchen, heritage)
- Related flavours and ingredients
- Featured image and gallery
- Publication date

### Golden Spoon Member
- Membership tier
- Points tracking
- Flavours tried and favourites
- Ratings history
- Referral code

## Navigation Structure

### Primary
- Shop
- Archive (Flavours)
- Stories
- Skip the Line
- Locations

### Right Side
- Golden Spoon
- Account
- Cart

## CMS Admin Structure

```
/admin
├── /ingredients       # Library with provenance
├── /flavours         # Archive with Shopify linking
├── /batches          # Test kitchen tracking
├── /stories          # Editorial content
├── /golden-spoon     # Loyalty management
├── /locations        # Store locations
├── /qr-codes         # QR generator
└── /settings         # Global settings
```

## Physical + Digital Integration

### QR Code System
Placed on:
- Shop menus
- Cups and cones
- Packaging
- Event materials

Links to:
- Flavour pages
- Ingredient provenance
- Stories
- Ordering

### In-Store Flow
1. Walk in
2. Scan QR menu
3. See flavour details
4. Order online
5. Pick up (Skip the Line)

## Seasonal Commerce

### Spring/Summer
- Ice cream (pints, soft serve)
- Affogato
- Cold drinks

### Fall/Winter
- Chocolate bars
- Hot chocolate
- Pantry items
- Gift sets

## Testing Requirements

### Must Test
- ✅ CMS save patterns (CRUD)
- ✅ Relationship integrity (ingredient → flavour, flavour → Shopify)
- ✅ Shopify sync reliability
- ✅ QR code generation
- ✅ Rating system
- ✅ Golden Spoon points
- ✅ Image uploads

## Key Relationships

- **Ingredient → Flavour** - One ingredient in many flavours
- **Flavour → Batch** - One flavour has many iterations
- **Flavour → Shopify Product** - CMS flavour linked to commerce
- **Story → Flavour/Ingredient** - Editorial linked to products
- **Collaborator → Flavour** - Track partnerships

## Documentation

Detailed documentation in `.kiro/steering/`:
- `janine-vision.md` - Core philosophy and pillars
- `janine-features.md` - Complete feature specifications
- `janine-architecture.md` - Technical architecture and data models
- `janine-testing.md` - Comprehensive testing strategy
- `janine-experience.md` - Physical + digital integration

## Next Steps

1. Review and approve architecture
2. Choose CMS platform (Sanity recommended)
3. Set up Shopify integration
4. Build MVP features
5. Implement testing strategy
6. Launch Phase 1

---

**Brand Philosophy:** The archive of flavour experimentation becomes the real brand asset - not just the commerce layer. Every batch, every ingredient, every collaboration is documented and becomes part of the brand story.
