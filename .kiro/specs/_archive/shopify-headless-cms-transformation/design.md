# Design Document: Shopify Headless CMS Transformation

## Overview

This design document specifies the technical architecture for transforming the existing Pencilz React portfolio/CMS application into a bilingual (EN/FR) headless Shopify storefront. The system will be built on Next.js 14+ with App Router, integrate with Shopify's Storefront API for e-commerce functionality, implement a custom CMS for marketing content, and support advanced features including pre-order products and ice cream scheduling with slot-based fulfillment.

### System Goals

- Migrate from React/Vite/Express stack to Next.js with Shopify integration
- Support bilingual content (English/French) with locale-based routing
- Enable standard e-commerce, pre-order products, and ice cream scheduling
- Provide custom CMS for marketing and editorial content management
- Implement open-source search (Meilisearch or Typesense)
- Deploy to Vercel with optimized performance and SEO

### Key Architectural Decisions

1. **Next.js Boilerplate**: Start with Vercel's Next.js Commerce boilerplate (https://github.com/vercel/commerce) which provides proven patterns for Shopify integration, cart management, and performance optimization.

2. **Database for CMS**: Use PostgreSQL with Prisma ORM for the custom CMS, hosted on Vercel Postgres for seamless integration.

3. **Search Engine**: Use Meilisearch (self-hosted on Railway or Fly.io) for its superior developer experience, built-in typo tolerance, and excellent performance characteristics.

4. **State Management**: Use React Context for cart state and Zustand for complex UI state (slot selection, filters).

5. **Styling**: Continue with Tailwind CSS, leveraging the boilerplate's design system as a foundation.

6. **Image Hosting**: Use Cloudinary for CMS assets with Next.js Image optimization.

### Migration Strategy

The migration will follow a phased approach:

**Phase 1: Project Setup & Foundation (P0)**
- Disconnect from current repository and connect to new repository
- Clone and configure Next.js Commerce boilerplate
- Set up Shopify Storefront API integration
- Configure bilingual routing structure
- Set up development environment and deployment pipeline

**Phase 2: Core E-commerce (P0)**
- Implement product catalog pages (PLP, PDP)
- Build shopping cart with Shopify integration
- Implement checkout flow
- Add search functionality with Meilisearch

**Phase 3: Custom CMS (P0)**
- Design and implement CMS database schema
- Build CMS admin interface
- Implement content APIs
- Add authentication and authorization

**Phase 4: Advanced Features (P0)**
- Implement pre-order product support
- Build ice cream scheduling system
- Add slot capacity management
- Implement cart validation rules

**Phase 5: Polish & Launch (P1)**
- Performance optimization
- SEO implementation
- Analytics integration
- Final testing and deployment


## Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end
    
    subgraph "Next.js Application - Vercel"
        AppRouter[App Router]
        Pages[Page Components]
        API[API Routes]
        Middleware[Middleware - Locale Detection]
    end
    
    subgraph "External Services"
        Shopify[Shopify Storefront API]
        ShopifyCheckout[Shopify Checkout]
        Meilisearch[Meilisearch - Search Engine]
        Cloudinary[Cloudinary - Image CDN]
    end
    
    subgraph "Data Layer - Vercel Postgres"
        CMS_DB[(CMS Database)]
    end
    
    Browser --> AppRouter
    AppRouter --> Middleware
    Middleware --> Pages
    Pages --> API
    API --> Shopify
    API --> CMS_DB
    API --> Meilisearch
    Pages --> Cloudinary
    Pages --> ShopifyCheckout
    
    subgraph "Background Jobs"
        Webhooks[Shopify Webhooks]
        Indexer[Search Indexer]
    end
    
    Webhooks --> API
    API --> Indexer
    Indexer --> Meilisearch
```

### Application Structure

```
/
├── app/                          # Next.js App Router
│   ├── [locale]/                # Locale-based routing (en, fr)
│   │   ├── page.tsx             # Home page
│   │   ├── collections/
│   │   │   └── [handle]/
│   │   │       └── page.tsx     # Collection (PLP)
│   │   ├── products/
│   │   │   └── [handle]/
│   │   │       └── page.tsx     # Product (PDP)
│   │   ├── cart/
│   │   │   └── page.tsx         # Cart page
│   │   ├── search/
│   │   │   └── page.tsx         # Search results
│   │   ├── [slug]/
│   │   │   └── page.tsx         # Static CMS pages
│   │   └── layout.tsx           # Locale layout
│   ├── api/                     # API routes
│   │   ├── shopify/             # Shopify proxy endpoints
│   │   ├── cms/                 # CMS CRUD endpoints
│   │   ├── search/              # Search endpoints
│   │   ├── slots/               # Slot management
│   │   └── webhooks/            # Webhook handlers
│   ├── cms/                     # CMS admin interface
│   │   ├── login/
│   │   ├── dashboard/
│   │   └── [...sections]/       # CMS section pages
│   └── layout.tsx               # Root layout
├── components/
│   ├── cart/                    # Cart components
│   ├── product/                 # Product components
│   ├── search/                  # Search components
│   ├── scheduling/              # Ice cream scheduling
│   ├── cms/                     # CMS admin components
│   └── ui/                      # Shared UI components
├── lib/
│   ├── shopify/                 # Shopify API client
│   ├── cms/                     # CMS data access
│   ├── search/                  # Search client
│   ├── slots/                   # Slot management logic
│   └── utils/                   # Utilities
├── prisma/
│   └── schema.prisma            # Database schema
├── public/
│   └── locales/                 # Translation files
└── types/                       # TypeScript types
```

### Technology Stack

**Frontend Framework**
- Next.js 14+ with App Router
- React 18+ with Server Components
- TypeScript for type safety

**Styling**
- Tailwind CSS 3.4+
- Headless UI for accessible components
- Framer Motion for animations

**State Management**
- React Context for cart state
- Zustand for UI state (filters, slot selection)
- React Hook Form for form management

**Data Fetching**
- Server Components for initial data
- SWR for client-side data fetching
- React Query for complex data synchronization

**E-commerce Integration**
- Shopify Storefront API (GraphQL)
- Shopify Checkout (hosted)

**Search**
- Meilisearch (self-hosted)
- Meilisearch JS SDK

**CMS Database**
- PostgreSQL (Vercel Postgres)
- Prisma ORM

**Image Management**
- Cloudinary for CMS assets
- Next.js Image component for optimization

**Authentication**
- NextAuth.js for CMS admin authentication

**Deployment**
- Vercel for hosting
- Vercel Edge Functions for API routes
- Vercel Cron Jobs for scheduled tasks

**Analytics**
- Google Analytics 4 or Vercel Analytics

### Routing Architecture

The application uses Next.js App Router with locale-based routing:

**URL Structure**
```
/en/                              # English home
/fr/                              # French home
/en/collections/[handle]          # English collection
/fr/collections/[handle]          # French collection
/en/products/[handle]             # English product
/fr/products/[handle]             # French product
/en/cart                          # English cart
/fr/cart                          # French cart
/en/search?q=[query]              # English search
/fr/search?q=[query]              # French search
/en/[slug]                        # English static page
/fr/[slug]                        # French static page
/cms/*                            # CMS admin (no locale)
```

**Locale Detection & Redirection**
- Root path `/` redirects to `/en/` or `/fr/` based on:
  1. User's previous locale preference (cookie)
  2. Accept-Language header
  3. Default to `/en/`
- Middleware handles locale detection and redirection
- Language switcher preserves current page path

### API Architecture

**Shopify Integration Layer**
- GraphQL client with automatic retry and rate limiting
- Server-side caching with stale-while-revalidate strategy
- Type-safe queries using GraphQL Code Generator

**CMS API Layer**
- RESTful API routes for CRUD operations
- Authentication middleware for protected routes
- Draft/publish workflow support

**Search API Layer**
- Proxy to Meilisearch with error handling
- Query transformation and result formatting
- Autocomplete and full-text search endpoints

**Slot Management API**
- Real-time capacity checking
- Slot reservation and validation
- Integration with Shopify cart attributes


## Components and Interfaces

### Page Components

**Home Page (`app/[locale]/page.tsx`)**
- Server Component that fetches CMS home content and featured collections
- Renders hero section, featured collections grid, feature tiles, promotional banner
- Uses Shopify API to fetch collection metadata
- Implements lazy loading for below-the-fold content

**Collection Page (`app/[locale]/collections/[handle]/page.tsx`)**
- Server Component that fetches collection products from Shopify
- Client Component for filters, sorting, and pagination
- Displays CMS landing content if configured
- Product grid with availability badges (In Stock, Pre-order, Sold Out)
- Filter sidebar: Availability, Size (if applicable)
- Sort options: Featured, Price Low-High, Price High-Low, Newest

**Product Page (`app/[locale]/products/[handle]/page.tsx`)**
- Server Component that fetches product details from Shopify
- Client Component for variant selection and add-to-cart
- Image gallery with zoom functionality
- Variant selector (size, color, etc.)
- Availability display with pre-order badge and date
- Pre-order disclaimer text
- Add to cart button with loading state
- Ice cream products trigger scheduling modal

**Cart Page (`app/[locale]/cart/page.tsx`)**
- Client Component for cart management
- Line items with image, title, variant, price, quantity controls
- Pre-order labels and fulfillment dates
- Ice cream slot display and edit functionality
- "Items may ship separately" message for mixed pre-order carts
- Cart validation messages
- Checkout button with validation

**Search Page (`app/[locale]/search/page.tsx`)**
- Server Component for initial search results
- Client Component for filters and sorting
- Search results grid with product cards
- Availability filter
- Sort by relevance or availability
- Empty state with suggestions

**Static Page (`app/[locale]/[slug]/page.tsx`)**
- Server Component that fetches CMS page content
- Rich text rendering with proper HTML structure
- SEO metadata from CMS

**404 Page (`app/[locale]/not-found.tsx`)**
- Static error page with locale-specific messaging
- Navigation links to home and search
- Maintains header and footer

### Shared Components

**Navigation (`components/navigation/Navigation.tsx`)**
```typescript
interface NavigationProps {
  locale: 'en' | 'fr';
  links: NavigationLink[];
  cartCount: number;
}

interface NavigationLink {
  label: string;
  href: string;
  children?: NavigationLink[];
}
```
- Responsive navigation with mobile menu
- Search input with autocomplete
- Cart icon with item count badge
- Language switcher
- Fetches navigation structure from CMS

**Footer (`components/footer/Footer.tsx`)**
```typescript
interface FooterProps {
  locale: 'en' | 'fr';
  sections: FooterSection[];
}

interface FooterSection {
  title: string;
  links: { label: string; href: string }[];
}
```
- Multi-column footer layout
- Newsletter signup (optional)
- Social media links
- Fetches footer content from CMS

**Language Switcher (`components/locale/LanguageSwitcher.tsx`)**
```typescript
interface LanguageSwitcherProps {
  currentLocale: 'en' | 'fr';
  currentPath: string;
}
```
- Toggle between EN/FR
- Preserves current page path
- Updates locale cookie

**Product Card (`components/product/ProductCard.tsx`)**
```typescript
interface ProductCardProps {
  product: {
    handle: string;
    title: string;
    price: string;
    compareAtPrice?: string;
    image: string;
    availability: 'in_stock' | 'preorder' | 'sold_out';
    preorderDate?: string;
  };
  locale: 'en' | 'fr';
}
```
- Product image with lazy loading
- Title and price display
- Availability badge
- Pre-order date if applicable
- Link to product page

### Cart Components

**Cart Provider (`components/cart/CartProvider.tsx`)**
```typescript
interface CartContextValue {
  cart: Cart | null;
  addItem: (variantId: string, quantity: number, attributes?: CartAttribute[]) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

interface Cart {
  id: string;
  lines: CartLine[];
  cost: {
    subtotal: string;
    total: string;
  };
  attributes: CartAttribute[];
}

interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
    };
    image: string;
    price: string;
  };
  attributes: CartAttribute[];
  isPreorder: boolean;
  preorderDate?: string;
  isIceCream: boolean;
  slot?: IceCreamSlot;
}

interface CartAttribute {
  key: string;
  value: string;
}
```
- Manages cart state with Shopify Cart API
- Persists cart ID in localStorage
- Handles locale switching without losing cart
- Validates cart before checkout

**Cart Line Item (`components/cart/CartLineItem.tsx`)**
```typescript
interface CartLineItemProps {
  line: CartLine;
  locale: 'en' | 'fr';
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
}
```
- Product image and details
- Quantity selector
- Remove button
- Pre-order badge and date
- Ice cream slot display with edit button

**Cart Summary (`components/cart/CartSummary.tsx`)**
```typescript
interface CartSummaryProps {
  cart: Cart;
  locale: 'en' | 'fr';
  onCheckout: () => void;
}
```
- Subtotal and total display
- Mixed shipment message
- Validation errors
- Checkout button

### Scheduling Components

**Ice Cream Scheduling Modal (`components/scheduling/SchedulingModal.tsx`)**
```typescript
interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSlotSelected: (slot: IceCreamSlot) => void;
  productId: string;
  locale: 'en' | 'fr';
}

interface IceCreamSlot {
  date: string;
  timeWindow: string;
  location: string;
  remainingCapacity: number;
}
```
- Triggered when adding ice cream product to cart
- Date picker with available dates
- Time window selector with capacity indicators
- Location display (single location for MVP)
- Validation and error messages

**Slot Selector (`components/scheduling/SlotSelector.tsx`)**
```typescript
interface SlotSelectorProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  availableDates: string[];
  selectedTimeWindow: string | null;
  onTimeWindowSelect: (window: string) => void;
  availableTimeWindows: TimeWindow[];
  locale: 'en' | 'fr';
}

interface TimeWindow {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  remainingCapacity: number;
  isAvailable: boolean;
}
```
- Calendar view for date selection
- Time window grid with capacity badges
- Disabled states for unavailable slots
- Real-time capacity updates

**Slot Display (`components/scheduling/SlotDisplay.tsx`)**
```typescript
interface SlotDisplayProps {
  slot: IceCreamSlot;
  locale: 'en' | 'fr';
  onEdit?: () => void;
  editable?: boolean;
}
```
- Compact slot information display
- Edit button for cart page
- Formatted date and time

### Search Components

**Search Input (`components/search/SearchInput.tsx`)**
```typescript
interface SearchInputProps {
  locale: 'en' | 'fr';
  placeholder?: string;
  onSearch?: (query: string) => void;
}
```
- Debounced input with autocomplete
- Keyboard navigation for suggestions
- Mobile-optimized interface

**Search Autocomplete (`components/search/SearchAutocomplete.tsx`)**
```typescript
interface SearchAutocompleteProps {
  query: string;
  locale: 'en' | 'fr';
  onSelect: (suggestion: SearchSuggestion) => void;
}

interface SearchSuggestion {
  type: 'product' | 'collection' | 'query';
  title: string;
  handle?: string;
  image?: string;
}
```
- Dropdown with product and query suggestions
- Product thumbnails
- Highlighted matching text

**Search Results Grid (`components/search/SearchResultsGrid.tsx`)**
```typescript
interface SearchResultsGridProps {
  results: SearchResult[];
  locale: 'en' | 'fr';
  totalResults: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

interface SearchResult {
  handle: string;
  title: string;
  price: string;
  image: string;
  availability: 'in_stock' | 'preorder' | 'sold_out';
}
```
- Product grid layout
- Pagination controls
- Empty state

### CMS Admin Components

**CMS Layout (`app/cms/layout.tsx`)**
- Protected route wrapper with authentication check
- Admin navigation sidebar
- Logout button

**CMS Dashboard (`app/cms/dashboard/page.tsx`)**
- Overview of content status
- Quick links to content sections
- Recent changes log

**Content Editor (`components/cms/ContentEditor.tsx`)**
```typescript
interface ContentEditorProps {
  content: CMSContent;
  locale: 'en' | 'fr';
  onSave: (content: CMSContent) => Promise<void>;
  onPublish: (content: CMSContent) => Promise<void>;
}

interface CMSContent {
  id: string;
  type: 'home' | 'collection_landing' | 'static_page' | 'global_settings';
  status: 'draft' | 'published';
  data: Record<string, any>;
  updatedAt: string;
}
```
- Rich text editor (TipTap or similar)
- Image upload and selection
- Draft/publish controls
- Locale switcher for bilingual editing
- Preview button

**Asset Library (`components/cms/AssetLibrary.tsx`)**
```typescript
interface AssetLibraryProps {
  onSelect: (asset: Asset) => void;
  multiple?: boolean;
}

interface Asset {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  size: number;
  uploadedAt: string;
}
```
- Grid view of uploaded images
- Upload button with drag-and-drop
- Search and filter
- Asset details modal


## Data Models

### Shopify Product Metafields

Products in Shopify will use custom metafields to support pre-order and ice cream scheduling features:

**Pre-order Metafields**
```typescript
interface PreorderMetafields {
  is_preorder: boolean;                    // namespace: custom, type: boolean
  preorder_ship_date: string;              // namespace: custom, type: date
  preorder_disclaimer_en: string;          // namespace: custom, type: single_line_text_field
  preorder_disclaimer_fr: string;          // namespace: custom, type: single_line_text_field
}
```

**Ice Cream Metafields**
```typescript
interface IceCreamMetafields {
  is_ice_cream: boolean;                   // namespace: custom, type: boolean
  requires_scheduling: boolean;            // namespace: custom, type: boolean
  lead_time_hours: number;                 // namespace: custom, type: number_integer
}
```

### CMS Database Schema (Prisma)

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashed with bcrypt
  name      String?
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model GlobalSettings {
  id                String   @id @default(cuid())
  locale            String   // 'en' or 'fr'
  headerNavigation  Json     // NavigationLink[]
  footerSections    Json     // FooterSection[]
  promotionalBanner Json?    // { text: string, link: string, enabled: boolean }
  seoDefaults       Json     // { title: string, description: string, ogImage: string }
  status            String   @default("published") // 'draft' or 'published'
  draftData         Json?    // Draft version of all fields
  updatedAt         DateTime @updatedAt
  
  @@unique([locale])
}

model HomePage {
  id            String   @id @default(cuid())
  locale        String   // 'en' or 'fr'
  heroSection   Json     // { title: string, subtitle: string, cta: { text: string, link: string }, image: string }
  featuredCollections Json // { handle: string, title: string, image: string }[]
  featureTiles  Json     // { title: string, description: string, image: string, link: string }[]
  seoMetadata   Json     // { title: string, description: string, ogImage: string }
  status        String   @default("published")
  draftData     Json?
  updatedAt     DateTime @updatedAt
  
  @@unique([locale])
}

model CollectionLanding {
  id              String   @id @default(cuid())
  collectionHandle String
  locale          String   // 'en' or 'fr'
  content         Json     // Rich text content
  bannerImage     String?
  seoMetadata     Json?
  status          String   @default("published")
  draftData       Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([collectionHandle, locale])
}

model StaticPage {
  id          String   @id @default(cuid())
  slug        String
  locale      String   // 'en' or 'fr'
  title       String
  content     Json     // Rich text content
  seoMetadata Json     // { title: string, description: string, ogImage: string }
  status      String   @default("published")
  draftData   Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([slug, locale])
}

model Asset {
  id           String   @id @default(cuid())
  filename     String
  url          String   // Cloudinary URL
  thumbnailUrl String   // Cloudinary thumbnail URL
  publicId     String   // Cloudinary public ID
  format       String   // jpg, png, etc.
  width        Int
  height       Int
  size         Int      // bytes
  uploadedBy   String?  // User ID
  createdAt    DateTime @default(now())
  
  @@index([createdAt])
}

model IceCreamSlot {
  id               String   @id @default(cuid())
  date             String   // YYYY-MM-DD format
  timeWindowStart  String   // HH:MM format
  timeWindowEnd    String   // HH:MM format
  location         String   @default("Main Location")
  maxCapacity      Int      @default(10)
  currentCapacity  Int      @default(0)
  isAvailable      Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@unique([date, timeWindowStart, timeWindowEnd, location])
  @@index([date, isAvailable])
}

model SlotReservation {
  id          String   @id @default(cuid())
  slotId      String
  cartId      String   // Shopify cart ID
  lineItemId  String   // Shopify line item ID
  expiresAt   DateTime // Reservation expires after 30 minutes
  createdAt   DateTime @default(now())
  
  slot        IceCreamSlot @relation(fields: [slotId], references: [id])
  
  @@index([cartId])
  @@index([expiresAt])
}

model SlotConfiguration {
  id                String   @id @default(cuid())
  leadTimeHours     Int      @default(24)
  defaultCapacity   Int      @default(10)
  timeWindows       Json     // { start: string, end: string, label: string }[]
  closedDays        Json     // string[] - days of week (0-6) or specific dates
  updatedAt         DateTime @updatedAt
  
  @@unique([id]) // Singleton pattern
}
```

### TypeScript Types

**Shopify Types**
```typescript
// types/shopify.ts

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  compareAtPriceRange?: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  tags: string[];
  productType: string;
  metafields: ShopifyMetafield[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  };
  image?: ShopifyImage;
  selectedOptions: {
    name: string;
    value: string;
  }[];
}

export interface ShopifyImage {
  url: string;
  altText?: string;
  width: number;
  height: number;
}

export interface ShopifyOption {
  name: string;
  values: string[];
}

export interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image?: ShopifyImage;
  products: ShopifyProduct[];
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: ShopifyCartLine[];
  cost: {
    subtotalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
  attributes: ShopifyCartAttribute[];
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: ShopifyVariant & {
    product: ShopifyProduct;
  };
  attributes: ShopifyCartAttribute[];
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
}

export interface ShopifyCartAttribute {
  key: string;
  value: string;
}
```

**Application Types**
```typescript
// types/app.ts

export type Locale = 'en' | 'fr';

export type ProductAvailability = 'in_stock' | 'preorder' | 'sold_out';

export interface EnrichedProduct extends ShopifyProduct {
  availability: ProductAvailability;
  isPreorder: boolean;
  preorderDate?: string;
  preorderDisclaimer?: string;
  isIceCream: boolean;
  requiresScheduling: boolean;
  leadTimeHours?: number;
}

export interface EnrichedCartLine extends ShopifyCartLine {
  isPreorder: boolean;
  preorderDate?: string;
  isIceCream: boolean;
  slot?: IceCreamSlot;
}

export interface IceCreamSlot {
  id: string;
  date: string;
  timeWindow: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  location: string;
  remainingCapacity: number;
  isAvailable: boolean;
}

export interface SlotSelectionData {
  selectedDate: string | null;
  selectedTimeWindow: string | null;
  availableDates: string[];
  availableTimeWindows: TimeWindow[];
}

export interface TimeWindow {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  remainingCapacity: number;
  isAvailable: boolean;
}

export interface CartValidationError {
  type: 'missing_slot' | 'invalid_slot' | 'mixed_cart' | 'out_of_stock';
  message: string;
  lineItemId?: string;
}

export interface SearchResult {
  handle: string;
  title: string;
  price: string;
  image: string;
  availability: ProductAvailability;
  productType: string;
  tags: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  page: number;
  totalPages: number;
  query: string;
}
```

**CMS Types**
```typescript
// types/cms.ts

export type ContentStatus = 'draft' | 'published';

export interface CMSContent<T = any> {
  id: string;
  status: ContentStatus;
  data: T;
  draftData?: T;
  updatedAt: string;
}

export interface NavigationLink {
  label: string;
  href: string;
  children?: NavigationLink[];
}

export interface FooterSection {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
}

export interface HeroSection {
  title: string;
  subtitle: string;
  cta: {
    text: string;
    link: string;
  };
  image: string;
}

export interface FeaturedCollection {
  handle: string;
  title: string;
  image: string;
}

export interface FeatureTile {
  title: string;
  description: string;
  image: string;
  link: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  ogImage?: string;
  noindex?: boolean;
}

export interface RichTextContent {
  type: 'doc';
  content: RichTextNode[];
}

export interface RichTextNode {
  type: string;
  attrs?: Record<string, any>;
  content?: RichTextNode[];
  text?: string;
  marks?: RichTextMark[];
}

export interface RichTextMark {
  type: string;
  attrs?: Record<string, any>;
}
```

### Cart State Management

The cart state will be managed using a combination of Shopify's Cart API and local state:

**Cart Storage Strategy**
- Shopify cart ID stored in localStorage: `shopify_cart_id`
- Locale stored in cookie: `locale`
- Slot reservations stored in cart attributes
- Cart persists across locale switches
- Cart expires after 10 days (Shopify default)

**Cart Attributes Schema**
```typescript
// Cart-level attributes
{
  "locale": "en",
  "has_ice_cream": "true",
  "has_preorder": "true"
}

// Line item attributes for ice cream products
{
  "slot_id": "clx123abc",
  "slot_date": "2024-06-15",
  "slot_time": "2:00 PM - 4:00 PM",
  "slot_location": "Main Location",
  "fulfillment_method": "pickup"
}

// Line item attributes for pre-order products
{
  "is_preorder": "true",
  "preorder_ship_date": "2024-07-01"
}
```

### Search Index Schema

**Meilisearch Index Configuration**
```typescript
// lib/search/config.ts

export const searchIndexSettings = {
  searchableAttributes: [
    'title',
    'handle',
    'product_type',
    'tags',
    'description'
  ],
  filterableAttributes: [
    'availability',
    'locale',
    'product_type',
    'tags',
    'sizes'
  ],
  sortableAttributes: [
    'price',
    'created_at'
  ],
  rankingRules: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness'
  ],
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 4,
      twoTypos: 8
    }
  }
};

export interface SearchDocument {
  id: string;                          // Product ID
  handle: string;                      // Product handle
  title: string;                       // Product title
  description: string;                 // Product description (truncated)
  product_type: string;                // Product type
  tags: string[];                      // Product tags
  availability: ProductAvailability;   // in_stock, preorder, sold_out
  locale: Locale;                      // en or fr
  price: number;                       // Numeric price for sorting
  price_formatted: string;             // Formatted price for display
  image: string;                       // Primary image URL
  sizes?: string[];                    // Available sizes if applicable
  created_at: number;                  // Unix timestamp
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before defining the correctness properties, I've analyzed all testable acceptance criteria and identified opportunities to consolidate redundant properties:

**Consolidation Decisions:**
- Cart persistence properties (8.2, 14.1) can be combined into a single comprehensive cart persistence property
- Locale switching properties (2.4, 2.5) are related but test different aspects - kept separate
- Search index CRUD operations (19.2, 19.3, 19.4) can be combined into a single index synchronization property
- Slot validation properties (12.4, 17.1, 17.3) test different validation points - kept separate for clarity
- Locale formatting properties (30.6, 30.7) test different data types - kept separate
- Error message locale properties (36.1, 37.1) can be combined into a single error localization property

### Property 1: Locale-based URL Structure

*For any* valid page path and locale (en or fr), the generated URL should include the correct locale prefix and the locale should be correctly parsed from the URL.

**Validates: Requirements 2.1**

### Property 2: Locale Switching Preserves Page Path

*For any* page path in one locale, switching to another locale should navigate to the equivalent page path in the new locale (preserving the path structure, only changing the locale prefix).

**Validates: Requirements 2.4**

### Property 3: Cart State Invariant Across Locale Switches

*For any* cart state, switching locale and then switching back should result in an identical cart state (round-trip property).

**Validates: Requirements 2.5**

### Property 4: Product Data Fetching Completeness

*For any* valid product handle, fetching product data from the Shopify API should return a product object with all required fields including metafields (is_preorder, preorder_ship_date, preorder_disclaimer_en, preorder_disclaimer_fr).

**Validates: Requirements 3.2, 3.4**

### Property 5: Add to Cart Creates Line Item

*For any* product variant and quantity, adding to cart should result in the cart containing a line item with that variant and quantity.

**Validates: Requirements 8.1**

### Property 6: Cart Persistence Round Trip

*For any* cart state (including line items and slot selections), persisting to storage and then retrieving should result in an equivalent cart state.

**Validates: Requirements 8.2, 14.1**

### Property 7: Cart Quantity Update Reflects Change

*For any* cart line item and new quantity value, updating the quantity should result in the cart reflecting the new quantity for that line item.

**Validates: Requirements 8.8**

### Property 8: Cart Item Removal Excludes Item

*For any* cart line item, removing it should result in the cart no longer containing that line item.

**Validates: Requirements 8.9**

### Property 9: Lead Time Enforcement for Available Dates

*For any* current timestamp and lead time configuration, all available dates for slot selection should be at least lead_time_hours in the future.

**Validates: Requirements 11.2**

### Property 10: Capacity Enforcement for Slot Availability

*For any* slot, when current capacity equals or exceeds max capacity, the slot should be marked as unavailable and not selectable.

**Validates: Requirements 11.6, 12.2**

### Property 11: Slot Selection Requires Available Capacity

*For any* slot selection attempt, if the slot has zero remaining capacity, the selection should be rejected with an error.

**Validates: Requirements 12.4**

### Property 12: Slot Availability Validation on Cart Load

*For any* cart with selected slots, loading the cart should validate that all slots are still available, and if any slot is unavailable, display a warning.

**Validates: Requirements 14.3**

### Property 13: Ice Cream Products Require Slot Selection

*For any* cart containing ice cream products, all ice cream line items must have a valid slot selected, otherwise checkout should be blocked.

**Validates: Requirements 17.1**

### Property 14: Pre-Checkout Slot Validation

*For any* cart with ice cream products and selected slots, initiating checkout should verify all slots are still available, and if any are unavailable, prevent checkout with an error.

**Validates: Requirements 17.3**

### Property 15: Search Index Synchronization

*For any* product operation (create, update, delete) in Shopify, the search index should reflect the change after indexing completes (create adds product, update modifies product, delete removes product).

**Validates: Requirements 19.2, 19.3, 19.4**

### Property 16: Search Results Match Locale

*For any* search query in a specific locale, all returned results should have documents matching that locale.

**Validates: Requirements 20.6**

### Property 17: Draft Save Preserves Published Content

*For any* CMS content, saving changes as draft should update the draftData field without modifying the published data field.

**Validates: Requirements 26.2**

### Property 18: Publish Copies Draft to Published

*For any* CMS content with draft changes, publishing should make the published data equal to the draft data.

**Validates: Requirements 26.3**

### Property 19: Public Users See Only Published Content

*For any* content request from a non-authenticated user, the returned content should be from the published data field, never from draftData.

**Validates: Requirements 26.4**

### Property 20: Date Formatting Matches Locale

*For any* date value and locale, the formatted date string should follow the conventions of that locale (e.g., MM/DD/YYYY for en, DD/MM/YYYY for fr).

**Validates: Requirements 30.6**

### Property 21: Currency Formatting Matches Locale

*For any* currency value and locale, the formatted currency string should follow the conventions of that locale (e.g., $10.00 for en, 10,00 $ for fr).

**Validates: Requirements 30.7**

### Property 22: Error Messages Localized

*For any* error condition (API failure, validation error), the error message displayed to the user should be in the current locale.

**Validates: Requirements 36.1, 37.1**

### Property 23: Sold Out Products Disable Add to Cart

*For any* product with availableForSale = false, the add-to-cart button should be disabled and display appropriate messaging.

**Validates: Requirements 6.7**

### Property 24: Invalid URLs Return 404

*For any* URL path that does not match a valid route, the application should return a 404 status and display the 404 error page.

**Validates: Requirements 35.1**

### Property 25: Stale-While-Revalidate Cache Behavior

*For any* cached product data, when the cache is stale, the system should serve the stale data immediately while fetching fresh data in the background, then update the cache with the fresh data.

**Validates: Requirements 39.2**


## Error Handling

### Error Handling Strategy

The application implements a comprehensive error handling strategy across all layers:

**Client-Side Error Boundaries**
- React Error Boundaries wrap major sections (pages, cart, CMS)
- Graceful degradation with fallback UI
- Error reporting to logging service
- User-friendly error messages in current locale

**API Error Handling**
- Consistent error response format across all API routes
- HTTP status codes following REST conventions
- Localized error messages
- Retry logic for transient failures

**Shopify API Error Handling**
- Rate limiting with exponential backoff
- GraphQL error parsing and user-friendly translation
- Fallback to cached data when available
- Circuit breaker pattern for repeated failures

**Search Engine Error Handling**
- Graceful degradation to browse-by-collection
- Error messages with alternative actions
- Health check monitoring
- Automatic retry with timeout

### Error Types and Handling

**Network Errors**
```typescript
// lib/errors/NetworkError.ts
export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Handling
try {
  const data = await fetchFromShopify(query);
} catch (error) {
  if (error instanceof NetworkError && error.retryable) {
    // Retry with exponential backoff
    return retryWithBackoff(() => fetchFromShopify(query));
  }
  // Show user-friendly error
  return {
    error: t('errors.network', { locale }),
    fallback: getCachedData()
  };
}
```

**Validation Errors**
```typescript
// lib/errors/ValidationError.ts
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Cart validation example
export function validateCart(cart: Cart): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check ice cream products have slots
  cart.lines.forEach(line => {
    if (line.isIceCream && !line.slot) {
      errors.push(new ValidationError(
        'Ice cream products require slot selection',
        `line.${line.id}.slot`,
        'MISSING_SLOT'
      ));
    }
  });
  
  // Check slot availability
  cart.lines.forEach(line => {
    if (line.slot && !line.slot.isAvailable) {
      errors.push(new ValidationError(
        'Selected slot is no longer available',
        `line.${line.id}.slot`,
        'INVALID_SLOT'
      ));
    }
  });
  
  return errors;
}
```

**Business Logic Errors**
```typescript
// lib/errors/BusinessError.ts
export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

// Slot capacity example
export async function reserveSlot(slotId: string, cartId: string) {
  const slot = await getSlot(slotId);
  
  if (slot.currentCapacity >= slot.maxCapacity) {
    throw new BusinessError(
      `Slot ${slotId} is at capacity`,
      'SLOT_AT_CAPACITY',
      'This time slot is fully booked. Please select another time.'
    );
  }
  
  // Reserve slot
  await incrementSlotCapacity(slotId);
  await createReservation(slotId, cartId);
}
```

**CMS Errors**
```typescript
// lib/errors/CMSError.ts
export class CMSError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'CMSError';
  }
}

// Content not found example
export async function getPageContent(slug: string, locale: Locale) {
  const page = await prisma.staticPage.findUnique({
    where: { slug_locale: { slug, locale } }
  });
  
  if (!page) {
    throw new CMSError(
      `Page not found: ${slug}`,
      'PAGE_NOT_FOUND',
      404
    );
  }
  
  return page;
}
```

### Error Response Format

All API routes return errors in a consistent format:

```typescript
// types/api.ts
export interface APIError {
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, any>;
  };
}

// Example API route error handling
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createContent(body);
    return Response.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json(
        {
          error: {
            code: error.code,
            message: error.message,
            field: error.field
          }
        },
        { status: 400 }
      );
    }
    
    if (error instanceof CMSError) {
      return Response.json(
        {
          error: {
            code: error.code,
            message: error.message
          }
        },
        { status: error.statusCode }
      );
    }
    
    // Unknown error
    console.error('Unexpected error:', error);
    return Response.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      },
      { status: 500 }
    );
  }
}
```

### User-Facing Error Messages

Error messages are localized and user-friendly:

```typescript
// public/locales/en/errors.json
{
  "network": "Unable to connect. Please check your internet connection.",
  "api_failed": "Something went wrong. Please try again.",
  "product_not_found": "This product could not be found.",
  "cart_validation": {
    "missing_slot": "Please select a pickup time for your ice cream order.",
    "invalid_slot": "Your selected time is no longer available. Please choose another time.",
    "mixed_cart": "Ice cream products must be ordered separately from other items."
  },
  "search_unavailable": "Search is temporarily unavailable. Try browsing our collections instead.",
  "checkout_failed": "Unable to proceed to checkout. Please try again or contact support."
}

// public/locales/fr/errors.json
{
  "network": "Impossible de se connecter. Veuillez vérifier votre connexion Internet.",
  "api_failed": "Une erreur s'est produite. Veuillez réessayer.",
  "product_not_found": "Ce produit est introuvable.",
  "cart_validation": {
    "missing_slot": "Veuillez sélectionner une heure de ramassage pour votre commande de crème glacée.",
    "invalid_slot": "L'heure sélectionnée n'est plus disponible. Veuillez choisir une autre heure.",
    "mixed_cart": "Les produits de crème glacée doivent être commandés séparément des autres articles."
  },
  "search_unavailable": "La recherche est temporairement indisponible. Essayez de parcourir nos collections.",
  "checkout_failed": "Impossible de procéder au paiement. Veuillez réessayer ou contacter le support."
}
```

### Logging and Monitoring

**Error Logging Strategy**
- Client-side errors logged to Vercel Analytics or Sentry
- Server-side errors logged with structured logging
- Error context includes: user ID, locale, cart ID, request ID
- PII is scrubbed from logs

**Monitoring Alerts**
- High error rate alerts (>5% of requests)
- Shopify API rate limit warnings
- Search engine downtime alerts
- Slot capacity threshold warnings (>80% full)
- Failed checkout attempts


## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples and edge cases
- Integration points between components
- Error conditions and boundary cases
- UI component rendering and interactions

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants and round-trip properties
- Business logic correctness across all scenarios

Together, these approaches provide complementary coverage: unit tests catch concrete bugs and verify specific behaviors, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**
- **JavaScript/TypeScript**: Use `fast-check` library for property-based testing
- Fast-check provides excellent TypeScript support and integrates well with Jest/Vitest
- Supports custom generators (arbitraries) for domain-specific types

**Test Configuration**
- Minimum 100 iterations per property test (due to randomization)
- Configurable seed for reproducible failures
- Shrinking enabled to find minimal failing examples
- Timeout of 10 seconds per property test

**Property Test Structure**
```typescript
// Example property test structure
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Cart Operations', () => {
  it('Property 5: Add to Cart Creates Line Item - Feature: shopify-headless-cms-transformation, Property 5: For any product variant and quantity, adding to cart should result in the cart containing a line item with that variant and quantity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          variantId: fc.string({ minLength: 10 }),
          quantity: fc.integer({ min: 1, max: 10 })
        }),
        async ({ variantId, quantity }) => {
          // Arrange
          const cart = await createEmptyCart();
          
          // Act
          await addToCart(cart.id, variantId, quantity);
          const updatedCart = await getCart(cart.id);
          
          // Assert
          const lineItem = updatedCart.lines.find(
            line => line.merchandise.id === variantId
          );
          expect(lineItem).toBeDefined();
          expect(lineItem?.quantity).toBe(quantity);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Custom Generators (Arbitraries)**
```typescript
// test/arbitraries/cart.ts
import fc from 'fast-check';

export const cartLineArbitrary = () =>
  fc.record({
    id: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 10 }),
    merchandise: fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 5, maxLength: 50 }),
      price: fc.record({
        amount: fc.float({ min: 1, max: 1000, noNaN: true }).map(n => n.toFixed(2)),
        currencyCode: fc.constantFrom('CAD', 'USD')
      })
    }),
    isPreorder: fc.boolean(),
    preorderDate: fc.option(fc.date({ min: new Date() }), { nil: undefined }),
    isIceCream: fc.boolean()
  });

export const cartArbitrary = () =>
  fc.record({
    id: fc.uuid(),
    lines: fc.array(cartLineArbitrary(), { minLength: 0, maxLength: 10 }),
    cost: fc.record({
      subtotal: fc.float({ min: 0, max: 10000, noNaN: true }).map(n => n.toFixed(2)),
      total: fc.float({ min: 0, max: 10000, noNaN: true }).map(n => n.toFixed(2))
    })
  });

// test/arbitraries/slot.ts
export const slotArbitrary = () =>
  fc.record({
    id: fc.uuid(),
    date: fc.date({ min: new Date() }).map(d => d.toISOString().split('T')[0]),
    timeWindowStart: fc.constantFrom('09:00', '11:00', '14:00', '16:00'),
    timeWindowEnd: fc.constantFrom('11:00', '13:00', '16:00', '18:00'),
    location: fc.constant('Main Location'),
    maxCapacity: fc.integer({ min: 5, max: 20 }),
    currentCapacity: fc.integer({ min: 0, max: 20 }),
    isAvailable: fc.boolean()
  }).filter(slot => slot.currentCapacity <= slot.maxCapacity);

// test/arbitraries/locale.ts
export const localeArbitrary = () => fc.constantFrom('en', 'fr');

// test/arbitraries/product.ts
export const productArbitrary = () =>
  fc.record({
    handle: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-'.split('')), { minLength: 5, maxLength: 30 }),
    title: fc.string({ minLength: 10, maxLength: 100 }),
    availableForSale: fc.boolean(),
    isPreorder: fc.boolean(),
    preorderDate: fc.option(fc.date({ min: new Date() }), { nil: undefined }),
    isIceCream: fc.boolean()
  });
```

### Unit Testing Strategy

**Testing Framework**
- Vitest for unit and integration tests
- React Testing Library for component tests
- MSW (Mock Service Worker) for API mocking

**Test Organization**
```
/
├── __tests__/
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── shopify/
│   │   │   ├── cms/
│   │   │   ├── search/
│   │   │   └── slots/
│   │   └── components/
│   ├── integration/
│   │   ├── api/
│   │   └── pages/
│   └── property/
│       ├── cart.test.ts
│       ├── slots.test.ts
│       ├── locale.test.ts
│       └── cms.test.ts
└── test/
    ├── arbitraries/
    ├── fixtures/
    ├── mocks/
    └── utils/
```

**Unit Test Coverage Goals**
- 80% code coverage minimum
- 100% coverage for critical paths (cart, checkout, slot validation)
- All error handling paths tested
- All edge cases documented in requirements

**Example Unit Tests**
```typescript
// __tests__/unit/lib/slots/validation.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { validateSlotAvailability, validateLeadTime } from '@/lib/slots/validation';

describe('Slot Validation', () => {
  describe('validateSlotAvailability', () => {
    it('should return true for slot with remaining capacity', () => {
      const slot = {
        id: '1',
        maxCapacity: 10,
        currentCapacity: 5,
        isAvailable: true
      };
      
      expect(validateSlotAvailability(slot)).toBe(true);
    });
    
    it('should return false for slot at capacity', () => {
      const slot = {
        id: '1',
        maxCapacity: 10,
        currentCapacity: 10,
        isAvailable: true
      };
      
      expect(validateSlotAvailability(slot)).toBe(false);
    });
    
    it('should return false for unavailable slot', () => {
      const slot = {
        id: '1',
        maxCapacity: 10,
        currentCapacity: 5,
        isAvailable: false
      };
      
      expect(validateSlotAvailability(slot)).toBe(false);
    });
  });
  
  describe('validateLeadTime', () => {
    it('should return true for date beyond lead time', () => {
      const now = new Date('2024-06-01T10:00:00Z');
      const slotDate = '2024-06-03'; // 2 days later
      const leadTimeHours = 24;
      
      expect(validateLeadTime(slotDate, leadTimeHours, now)).toBe(true);
    });
    
    it('should return false for date within lead time', () => {
      const now = new Date('2024-06-01T10:00:00Z');
      const slotDate = '2024-06-01'; // Same day
      const leadTimeHours = 24;
      
      expect(validateLeadTime(slotDate, leadTimeHours, now)).toBe(false);
    });
  });
});
```

**Component Test Example**
```typescript
// __tests__/unit/components/cart/CartLineItem.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartLineItem } from '@/components/cart/CartLineItem';

describe('CartLineItem', () => {
  const mockLine = {
    id: 'line-1',
    quantity: 2,
    merchandise: {
      id: 'variant-1',
      title: 'Medium',
      product: {
        title: 'Test Product',
        handle: 'test-product'
      },
      image: 'https://example.com/image.jpg',
      price: { amount: '29.99', currencyCode: 'CAD' }
    },
    isPreorder: false,
    isIceCream: false
  };
  
  it('should render product details', () => {
    render(
      <CartLineItem
        line={mockLine}
        locale="en"
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });
  
  it('should call onUpdate when quantity changes', () => {
    const onUpdate = vi.fn();
    render(
      <CartLineItem
        line={mockLine}
        locale="en"
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />
    );
    
    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '3' } });
    
    expect(onUpdate).toHaveBeenCalledWith(3);
  });
  
  it('should display pre-order badge when isPreorder is true', () => {
    const preorderLine = {
      ...mockLine,
      isPreorder: true,
      preorderDate: '2024-07-01'
    };
    
    render(
      <CartLineItem
        line={preorderLine}
        locale="en"
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    
    expect(screen.getByText('Pre-order')).toBeInTheDocument();
    expect(screen.getByText(/Ships July 1, 2024/i)).toBeInTheDocument();
  });
});
```

### Integration Testing

**API Route Testing**
```typescript
// __tests__/integration/api/cart.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/cart/add/route';

describe('POST /api/cart/add', () => {
  it('should add item to cart', async () => {
    const request = new Request('http://localhost:3000/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        cartId: 'test-cart-id',
        variantId: 'gid://shopify/ProductVariant/123',
        quantity: 1
      })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.cart.lines).toHaveLength(1);
    expect(data.cart.lines[0].merchandise.id).toBe('gid://shopify/ProductVariant/123');
  });
  
  it('should return error for invalid variant', async () => {
    const request = new Request('http://localhost:3000/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        cartId: 'test-cart-id',
        variantId: 'invalid-id',
        quantity: 1
      })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_VARIANT');
  });
});
```

### E2E Testing (Optional for P1)

**Playwright for Critical User Flows**
- Complete checkout flow (regular products)
- Complete checkout flow (pre-order products)
- Complete checkout flow (ice cream with slot selection)
- Locale switching preserves cart
- Search and add to cart
- CMS content editing and publishing

### Test Data Management

**Fixtures**
```typescript
// test/fixtures/products.ts
export const mockProducts = {
  regularProduct: {
    id: 'gid://shopify/Product/1',
    handle: 'regular-product',
    title: 'Regular Product',
    availableForSale: true,
    isPreorder: false,
    isIceCream: false
  },
  preorderProduct: {
    id: 'gid://shopify/Product/2',
    handle: 'preorder-product',
    title: 'Pre-order Product',
    availableForSale: true,
    isPreorder: true,
    preorderDate: '2024-07-01',
    isIceCream: false
  },
  iceCreamProduct: {
    id: 'gid://shopify/Product/3',
    handle: 'ice-cream',
    title: 'Vanilla Ice Cream',
    availableForSale: true,
    isPreorder: false,
    isIceCream: true
  }
};
```

### Continuous Integration

**CI Pipeline (GitHub Actions)**
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:property
      - run: npm run test:integration
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

**Test Commands**
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:property": "vitest run --testPathPattern=property",
    "test:integration": "vitest run --testPathPattern=integration",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui"
  }
}
```

### Testing Checklist

**Before Deployment**
- [ ] All unit tests passing
- [ ] All property tests passing (100 iterations each)
- [ ] Integration tests passing
- [ ] Code coverage >80%
- [ ] No console errors in browser
- [ ] Lighthouse score >90 for performance
- [ ] Accessibility audit passing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness verified
- [ ] Locale switching tested in both directions
- [ ] Cart persistence verified across sessions
- [ ] Slot capacity limits enforced
- [ ] Error handling tested for all critical paths


## Implementation Phases

### Phase 1: Project Setup & Foundation (Week 1-2)

**Objectives:**
- Disconnect from current repository and connect to new repository
- Set up Next.js boilerplate with Shopify integration
- Configure development environment
- Establish bilingual routing structure

**Tasks:**

1. **Repository Migration**
   - Disconnect from current git remote
   - Connect to git@github.com:sweetyams/JanineHeadless.git
   - Create initial commit with project structure

2. **Boilerplate Setup**
   - Clone Vercel Commerce boilerplate
   - Install dependencies and verify build
   - Configure environment variables for Shopify
   - Test Shopify Storefront API connection

3. **Bilingual Routing**
   - Implement locale middleware for /en/ and /fr/ routing
   - Set up locale detection and redirection
   - Create language switcher component
   - Configure locale persistence (cookies)

4. **Development Environment**
   - Set up Vercel project and connect repository
   - Configure preview deployments
   - Set up environment variables in Vercel
   - Create development, staging, and production environments

5. **Database Setup**
   - Provision Vercel Postgres database
   - Initialize Prisma schema
   - Run initial migrations
   - Seed database with test data

**Deliverables:**
- Working Next.js application with Shopify connection
- Bilingual routing functional
- Development environment configured
- Database schema deployed

**Testing:**
- Verify Shopify API connection
- Test locale switching
- Verify environment variables in all environments

---

### Phase 2: Core E-commerce (Week 3-5)

**Objectives:**
- Implement product catalog pages
- Build shopping cart functionality
- Integrate Shopify checkout
- Add search functionality

**Tasks:**

1. **Product Catalog**
   - Create collection (PLP) page with server components
   - Implement product (PDP) page with variant selection
   - Build product card component
   - Add filtering and sorting
   - Implement availability badges

2. **Shopping Cart**
   - Implement cart provider with Shopify Cart API
   - Build cart page with line items
   - Add quantity update and remove functionality
   - Implement cart persistence (localStorage)
   - Add cart count badge to navigation

3. **Checkout Integration**
   - Implement checkout redirect to Shopify
   - Pass cart data and locale to checkout
   - Handle post-checkout redirect
   - Clear cart after successful checkout

4. **Search Implementation**
   - Set up Meilisearch instance (Railway or Fly.io)
   - Create search index schema
   - Implement initial product indexing
   - Build search UI with autocomplete
   - Create search results page

5. **Shopify Webhooks**
   - Set up webhook endpoints for product updates
   - Implement webhook verification
   - Trigger search index updates on product changes

**Deliverables:**
- Functional product browsing and search
- Working shopping cart
- Checkout integration complete
- Search operational

**Testing:**
- Property tests for cart operations (Properties 5-8)
- Unit tests for product display
- Integration tests for checkout flow
- Search functionality tests

---

### Phase 3: Custom CMS (Week 6-8)

**Objectives:**
- Design and implement CMS database schema
- Build CMS admin interface
- Implement content APIs
- Add authentication

**Tasks:**

1. **CMS Schema Implementation**
   - Complete Prisma schema for all CMS models
   - Run migrations
   - Create seed data for testing

2. **CMS Authentication**
   - Implement NextAuth.js configuration
   - Create login page
   - Add session management
   - Protect CMS routes with middleware

3. **CMS Admin Interface**
   - Build CMS dashboard
   - Create content editors for each content type:
     - Global settings
     - Home page
     - Collection landing pages
     - Static pages
   - Implement rich text editor (TipTap)
   - Build asset library with Cloudinary integration

4. **Draft/Publish Workflow**
   - Implement draft save functionality
   - Add publish action
   - Create preview mode
   - Build content status indicators

5. **Content APIs**
   - Create API routes for CRUD operations
   - Implement content fetching for public pages
   - Add caching layer
   - Build content validation

**Deliverables:**
- Functional CMS admin interface
- Content management for all page types
- Draft/publish workflow operational
- Asset management working

**Testing:**
- Property tests for draft/publish workflow (Properties 17-19)
- Unit tests for content APIs
- Integration tests for CMS operations
- Authentication tests

---

### Phase 4: Advanced Features (Week 9-11)

**Objectives:**
- Implement pre-order product support
- Build ice cream scheduling system
- Add slot capacity management
- Implement cart validation rules

**Tasks:**

1. **Pre-order Products**
   - Fetch pre-order metafields from Shopify
   - Display pre-order badges and dates
   - Show pre-order disclaimers
   - Add "ships separately" messaging in cart

2. **Ice Cream Scheduling**
   - Create slot configuration interface
   - Build slot selection modal
   - Implement date picker with available dates
   - Create time window selector with capacity indicators
   - Add slot display in cart

3. **Slot Capacity Management**
   - Implement slot reservation system
   - Build capacity tracking
   - Add real-time availability updates
   - Create slot validation logic
   - Implement lead time enforcement

4. **Cart Validation**
   - Add ice cream slot requirement validation
   - Implement slot availability checking
   - Add mixed cart prevention (if required)
   - Create validation error messaging
   - Build pre-checkout validation

5. **Order Metadata**
   - Pass slot information to Shopify cart attributes
   - Include fulfillment method in order
   - Add slot details to order confirmation

**Deliverables:**
- Pre-order products fully functional
- Ice cream scheduling operational
- Slot capacity management working
- Cart validation enforced

**Testing:**
- Property tests for slot validation (Properties 9-14)
- Property tests for cart validation (Properties 13-14)
- Unit tests for slot capacity logic
- Integration tests for scheduling flow
- Edge case testing for capacity limits

---

### Phase 5: Polish & Launch (Week 12-14)

**Objectives:**
- Performance optimization
- SEO implementation
- Analytics integration
- Final testing and deployment

**Tasks:**

1. **Performance Optimization**
   - Implement caching strategies
   - Optimize images with Next.js Image
   - Add code splitting
   - Implement lazy loading
   - Configure CDN caching headers

2. **SEO Implementation**
   - Add meta tags to all pages
   - Generate sitemap
   - Implement structured data
   - Add hreflang tags
   - Configure robots.txt
   - Set up canonical URLs

3. **Analytics Integration**
   - Set up Google Analytics 4 or Vercel Analytics
   - Implement e-commerce event tracking
   - Add custom event tracking for pre-orders and slots
   - Configure conversion tracking

4. **Error Handling & Monitoring**
   - Set up error logging (Sentry or similar)
   - Configure monitoring alerts
   - Test error scenarios
   - Verify error messages in both locales

5. **Final Testing**
   - Run full test suite
   - Perform cross-browser testing
   - Test on mobile devices
   - Verify accessibility compliance
   - Load testing for slot capacity
   - Security audit

6. **Documentation**
   - Create deployment documentation
   - Write CMS user guide
   - Document API endpoints
   - Create troubleshooting guide

7. **Launch**
   - Deploy to production
   - Configure custom domain
   - Set up SSL certificate
   - Monitor for issues
   - Prepare rollback plan

**Deliverables:**
- Production-ready application
- All tests passing
- Documentation complete
- Monitoring configured
- Application deployed

**Testing:**
- Full regression testing
- Performance testing (Lighthouse)
- Accessibility audit (WAVE, axe)
- Security testing
- Load testing

---

## Migration Strategy

### File Cleanup

**Files to Remove:**
```
server.js                    # Express server no longer needed
src/contexts/AuthContext.jsx # Replace with NextAuth.js
public/data/*.json           # Replace with database
vite.config.js              # Replace with Next.js config
```

**Dependencies to Remove:**
```json
{
  "express": "^4.18.0",
  "multer": "^1.4.5-lts.1",
  "cors": "^2.8.5",
  "react-router-dom": "^6.22.0"
}
```

**Dependencies to Add:**
```json
{
  "next": "^14.0.0",
  "@shopify/hydrogen-react": "^2023.10.0",
  "@prisma/client": "^5.0.0",
  "prisma": "^5.0.0",
  "meilisearch": "^0.35.0",
  "next-auth": "^4.24.0",
  "zod": "^3.22.0",
  "zustand": "^4.4.0",
  "swr": "^2.2.0",
  "fast-check": "^3.15.0"
}
```

### Component Migration

**Reusable Components to Preserve:**
- Navigation structure (adapt to Next.js Link)
- Footer component (adapt to Next.js Link)
- Form components (adapt to Server Actions)
- UI components (Button, Input, etc.)

**Components to Rewrite:**
- All page components (convert to Next.js pages)
- Routing logic (replace React Router with App Router)
- Data fetching (replace useEffect with Server Components)
- Authentication (replace AuthContext with NextAuth.js)

### Data Migration

**Current Data Structure:**
```
public/data/
├── projects.json
├── news.json
├── pages.json
└── settings.json
```

**Migration Script:**
```typescript
// scripts/migrate-data.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function migrateData() {
  // Read existing JSON files
  const projects = JSON.parse(fs.readFileSync('public/data/projects.json', 'utf-8'));
  const news = JSON.parse(fs.readFileSync('public/data/news.json', 'utf-8'));
  const pages = JSON.parse(fs.readFileSync('public/data/pages.json', 'utf-8'));
  const settings = JSON.parse(fs.readFileSync('public/data/settings.json', 'utf-8'));
  
  // Note: Projects and news are not part of the new system
  // Only migrate pages and settings that are relevant
  
  // Migrate static pages
  for (const [slug, content] of Object.entries(pages)) {
    await prisma.staticPage.create({
      data: {
        slug,
        locale: 'en',
        title: content.title,
        content: content.content,
        seoMetadata: {
          title: content.title,
          description: content.description || ''
        },
        status: 'published'
      }
    });
  }
  
  // Migrate global settings
  await prisma.globalSettings.create({
    data: {
      locale: 'en',
      headerNavigation: settings.navigation || [],
      footerSections: settings.footer || [],
      seoDefaults: {
        title: settings.siteTitle || '',
        description: settings.siteDescription || ''
      },
      status: 'published'
    }
  });
  
  console.log('Data migration complete');
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Deployment Checklist

**Pre-Deployment:**
- [ ] All environment variables configured in Vercel
- [ ] Database migrations run on production database
- [ ] Shopify webhooks configured
- [ ] Meilisearch instance provisioned and configured
- [ ] Cloudinary account set up
- [ ] Custom domain DNS configured
- [ ] SSL certificate ready

**Deployment:**
- [ ] Deploy to production via Vercel
- [ ] Verify all environment variables
- [ ] Run database migrations
- [ ] Perform initial search index
- [ ] Test Shopify integration
- [ ] Verify checkout flow
- [ ] Test both locales
- [ ] Check mobile responsiveness

**Post-Deployment:**
- [ ] Monitor error logs
- [ ] Check analytics tracking
- [ ] Verify search functionality
- [ ] Test slot capacity management
- [ ] Monitor performance metrics
- [ ] Verify SEO tags
- [ ] Test CMS functionality

---

## Open Questions & Decisions

### Resolved Decisions

1. **Ice Cream Fulfillment**: Pickup only at single location (simplifies implementation)
2. **Slot Capacity**: Global capacity per slot (single location)
3. **Mixed Carts**: Not allowed - ice cream must be ordered separately

### Pending Decisions

1. **Slot Time Window Granularity**
   - Recommendation: Start with 2-hour windows (e.g., 9-11 AM, 11 AM-1 PM, 2-4 PM, 4-6 PM)
   - Rationale: Balances customer convenience with operational simplicity
   - Can be made configurable in CMS for future flexibility

2. **Lead Time Configuration**
   - Recommendation: 24-hour fixed lead time for MVP
   - Rationale: Simpler implementation, can be made configurable in Phase 5
   - Future: Add per-product lead time configuration

3. **Scheduled Publishing**
   - Recommendation: Defer to P1 (post-launch)
   - Rationale: Manual publishing is sufficient for MVP
   - Future: Add date picker and cron job for scheduled publishing

4. **Product Content Source**
   - Recommendation: Shopify native translations as primary source
   - Rationale: Single source of truth, simpler integration
   - Future: Add CMS overlay capability if marketing team needs more control

---

## Appendix

### Environment Variables

```bash
# .env.local

# Shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
SHOPIFY_ADMIN_ACCESS_TOKEN=your-admin-token
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Meilisearch
MEILISEARCH_HOST=https://your-meilisearch-instance.com
MEILISEARCH_API_KEY=your-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Vercel (auto-configured)
VERCEL_URL=auto
VERCEL_ENV=auto
```

### Useful Resources

**Next.js & Shopify:**
- [Vercel Commerce](https://github.com/vercel/commerce)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Next.js Documentation](https://nextjs.org/docs)

**Search:**
- [Meilisearch Documentation](https://docs.meilisearch.com/)
- [Meilisearch JS SDK](https://github.com/meilisearch/meilisearch-js)

**Testing:**
- [fast-check Documentation](https://fast-check.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

**Deployment:**
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

