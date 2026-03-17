# Janine Digital Platform - CMS Design

## Vision

Janine should act as:
1. A digital extension of the shop
2. A living archive of flavours and ingredients
3. A community layer through Golden Spoon membership
4. A test kitchen interface for experimentation

**Brand Philosophy:** Like Flamingo Estate + Noma Projects + Seasonal Gelato Shop

> Commerce is important. But the archive of flavour experimentation becomes the real brand asset.

## Navigation Structure

### Primary Navigation
- Shop
- Archive (Flavours)
- Stories
- Skip the Line
- Locations

### Right Side
- Golden Spoon
- Account
- Cart

## Data Models

### 1. Ingredients
```typescript
interface Ingredient {
  id: string;
  name: string;
  latinName?: string;
  origin: string; // e.g., "Sicily", "Jersey"
  
  // Storytelling
  story: string;
  tastingNotes: string[];
  
  // Classification
  category: "base" | "flavor" | "mix-in" | "topping" | "spice";
  
  // Sourcing
  supplier?: string;
  farm?: string;
  seasonal: boolean;
  availableMonths?: number[]; // [5,6,7,8] for May-August
  
  // Media
  images: string[];
  processingPhotos?: string[]; // "in the making" photos
  
  // Allergens
  allergens: string[]; // e.g., ["dairy", "nuts", "gluten"]
  isOrganic: boolean;
  
  // Relationships
  usedInFlavours: string[]; // Flavour IDs
  relatedStories: string[]; // Story IDs
}
```

### 2. Flavours (Enhanced Archive)
```typescript
interface Flavour {
  id: string;
  name: string;
  description: string;
  
  // Ingredients
  coreIngredients: string[]; // 2-3 main ingredient IDs
  allIngredients: string[]; // Complete ingredient list IDs
  
  // Classification
  categories: string[]; // e.g., "citrus", "chocolate", "floral"
  tastingNotes: string[];
  
  // Timeline
  seasonReleased: string; // e.g., "Spring 2026"
  releaseDate: Date;
  
  // Availability
  status: "active" | "seasonal" | "archived" | "test-kitchen" | "coming-soon";
  availableAs: ("soft-serve" | "pint" | "affogato")[];
  
  // Collaboration
  collaborators?: {
    type: "chef" | "artist" | "farm" | "restaurant";
    name: string;
    id: string;
  }[];
  
  // Batches
  batches: string[]; // Batch IDs
  currentBatch?: string;
  
  // Shopify Link
  shopifyProductId?: string;
  shopifyHandle?: string;
  
  // Media
  images: string[];
  makingPhotos?: string[]; // "in the making" process photos
  
  // Community
  averageRating?: number;
  totalRatings: number;
  
  // Relationships
  relatedStories: string[];
}
```

### 3. Batches (Test Kitchen)
```typescript
interface Batch {
  id: string; // e.g., "SC-BOCD-1007A"
  flavourId: string;
  
  // Metadata
  date: Date;
  batchNumber: string;
  type: "soft-serve" | "pint" | "test";
  
  // Recipe
  ingredients: {
    ingredientId: string;
    amount: string;
    ratio?: string;
  }[];
  
  // Process
  notes: string;
  processingNotes?: string;
  temperature?: string;
  technique?: string;
  
  // Evaluation
  rating?: number;
  tastingNotes?: string[];
  finalDecision: "approved" | "needs-adjustment" | "rejected" | "testing";
  adjustments?: string;
  
  // Team
  createdBy: string;
  testedBy?: string[];
  
  // Media
  photos?: string[]; // Process documentation
}
```

### 4. Stories (Editorial)
```typescript
interface Story {
  id: string;
  title: string;
  slug: string;
  
  // Content
  content: string; // Rich text
  excerpt: string;
  
  // Classification
  category: "founders" | "ethos" | "collaboration" | "journal" | "event" | "test-kitchen" | "heritage";
  
  // Relationships
  relatedFlavours: string[];
  relatedIngredients: string[];
  collaborators?: string[];
  
  // Media
  featuredImage: string;
  gallery?: string[];
  
  // Publishing
  publishedAt: Date;
  author: string;
}
```

## CMS Structure

```
/admin
├── /ingredients          # Ingredient library management
│   ├── list             # All ingredients with search/filter
│   ├── create           # Add new ingredient
│   └── [id]/edit        # Edit ingredient with provenance
│
├── /flavours            # Flavour archive (not just products)
│   ├── list             # All flavours with status badges
│   ├── create           # Create new flavour
│   ├── [id]/edit        # Edit flavour, link ingredients & Shopify
│   └── sync             # Sync with Shopify products
│
├── /batches             # Test kitchen batch tracking
│   ├── list             # All batches with filters
│   ├── create           # Document new batch
│   └── [id]/edit        # Update batch notes and decision
│
├── /stories             # Editorial content management
│   ├── list             # All stories by category
│   ├── create           # Create new story
│   └── [id]/edit        # Edit story, link flavours/ingredients
│
├── /golden-spoon        # Loyalty program management
│   ├── members          # Member list and details
│   ├── benefits         # Manage benefits and tiers
│   └── events           # Exclusive events
│
├── /locations           # Store locations
│   ├── list             # All locations
│   ├── create           # Add new location
│   └── [id]/edit        # Edit location details
│
├── /qr-codes            # QR code generator
│   ├── generate         # Generate QR for any content
│   └── library          # Previously generated codes
│
└── /settings            # Global settings
    └── edit             # Company info, featured flavours
```

## API Endpoints

### Ingredients
- `GET /api/ingredients` - List all with filters
- `GET /api/ingredients/[id]` - Get single with full details
- `POST /api/ingredients` - Create
- `PUT /api/ingredients/[id]` - Update
- `DELETE /api/ingredients/[id]` - Delete (check relationships)

### Flavours
- `GET /api/flavours` - List with filters (status, seasonal, category)
- `GET /api/flavours/[id]` - Get single with full ingredient details
- `POST /api/flavours` - Create
- `PUT /api/flavours/[id]` - Update relationships & metadata
- `DELETE /api/flavours/[id]` - Delete
- `POST /api/flavours/sync` - Sync from Shopify
- `PUT /api/flavours/[id]/status` - Update status

### Batches
- `GET /api/batches` - List all batches
- `GET /api/batches?flavourId=[id]` - Get batches for flavour
- `POST /api/batches` - Create new batch
- `PUT /api/batches/[id]` - Update batch
- `DELETE /api/batches/[id]` - Delete batch

### Stories
- `GET /api/stories` - List all stories
- `GET /api/stories?category=[category]` - Filter by category
- `GET /api/stories/[id]` - Get single story
- `POST /api/stories` - Create story
- `PUT /api/stories/[id]` - Update story
- `DELETE /api/stories/[id]` - Delete story

### Golden Spoon
- `GET /api/golden-spoon/members` - List members
- `GET /api/golden-spoon/members/[id]` - Get member details
- `PUT /api/golden-spoon/members/[id]` - Update member
- `POST /api/golden-spoon/points` - Award points
- `POST /api/golden-spoon/redeem` - Redeem points

### Ratings
- `GET /api/ratings?flavourId=[id]` - Get ratings for flavour
- `POST /api/ratings` - Submit rating
- `PUT /api/ratings/[id]` - Update rating
- `GET /api/ratings/user/[userId]` - Get user's ratings

### QR Codes
- `POST /api/qr-codes/generate` - Generate QR code
- `GET /api/qr-codes` - List generated codes

### Locations
- `GET /api/locations` - List all locations
- `GET /api/locations/[id]` - Get single location
- `POST /api/locations` - Create location
- `PUT /api/locations/[id]` - Update location
- `DELETE /api/locations/[id]` - Delete location

## Key Features

1. **Ingredient Library** - Provenance storytelling with sourcing details, allergen tracking, seasonal availability
2. **Flavour Archive** - Complete history of all flavours (active, seasonal, archived, test kitchen)
3. **Shopify Integration** - Link CMS flavours to Shopify products for enhanced product pages
4. **Batch Tracking** - Document test kitchen experiments and iterations
5. **Stories** - Editorial layer for brand storytelling and collaborations
6. **Golden Spoon** - Loyalty program with points, benefits, and exclusive access
7. **Ratings & Favourites** - Community engagement and personalization
8. **QR Code System** - Connect physical products to digital content
9. **Click & Collect** - Order ahead and skip the line
10. **Seasonal Management** - Define availability windows and seasonal drops

## Architecture Recommendation

### Headless CMS (Sanity/Contentful/Strapi)
Use for:
- Ingredients
- Flavours
- Batches
- Stories
- Collaborators

**Why:** Richer relational data, flavour archive independent of commerce lifecycle, editorial flexibility

### Shopify
Use for:
- Products and inventory
- Cart and checkout
- Subscriptions
- Order management

### Next.js API Routes
Use for:
- Shopify ↔ CMS relationship mapping
- Golden Spoon membership logic
- Ratings aggregation
- QR code generation
- Click & Collect scheduling

## Testing Requirements

### CMS Testing
- Save patterns (CRUD operations)
- Relationship integrity (ingredient → flavour, flavour → Shopify)
- Data validation
- Image uploads
- Shopify sync reliability

### Integration Testing
- Shopify product linking
- QR code generation and scanning
- Rating system
- Golden Spoon points
- Click & Collect workflow

See `.kiro/steering/janine-testing.md` for complete testing strategy.

## Implementation Priorities

### Phase 1: MVP (High Priority)
- Shopify shop integration
- Ingredient library
- Flavour archive with Shopify linking
- Basic stories section
- Locations
- Settings
- QR code generator

### Phase 2: Community (Medium Priority)
- Golden Spoon loyalty program
- Flavour ratings and favourites
- Click & Collect ordering
- Batch tracking (test kitchen)
- Events and tastings

### Phase 3: Enhancement (Future)
- Flavour recommendation engine
- Community voting
- AI flavour suggestions
- Mobile app

## Frontend Display Examples

### Flavour Page
- Hero image with "in the making" photos
- Core ingredients (2-3) with images and links
- Complete ingredient list with allergen badges
- Tasting notes
- Batch history
- Collaborator credits
- Related stories
- Community ratings
- "Available as" (soft serve, pint, etc.)
- Seasonal availability
- Link to Shopify product for purchase

### Ingredient Page
- Hero image
- Origin story and provenance
- Latin name
- Tasting notes
- Supplier/farm information
- Seasonal availability
- Used in flavours (linked)
- Related stories
- Processing photos

### Homepage
- Featured flavours carousel
- Current flavour of the week spotlight
- Seasonal drops
- Upcoming events
- Recent stories
- Shop CTA

### Archive
- Grid view of all flavours
- Filter by: season, status, ingredient, category
- Search by name
- Sort by: date, rating, popularity
- Status badges (active, seasonal, archived)

### Stories
- Featured story hero
- Category navigation
- Story grid
- Related flavours and ingredients inline
