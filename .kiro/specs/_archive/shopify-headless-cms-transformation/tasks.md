# Implementation Plan: Shopify Headless CMS Transformation

## Overview

This implementation plan transforms the existing Pencilz React/Vite/Express portfolio application into a bilingual (EN/FR) Next.js headless Shopify storefront with custom CMS, pre-order support, and ice cream scheduling. The plan is organized into 5 phases, with Phase 1 (Project Setup & Foundation) prioritized for immediate execution.

## Tasks

### PHASE 1: PROJECT SETUP & FOUNDATION (START HERE)

- [x] 1. Repository migration and git connection
  - [x] 1.1 Disconnect from current git repository
    - Run `git remote remove origin` to disconnect from current repo
    - Verify disconnection with `git remote -v`
    - _Requirements: Project Setup_
  
  - [x] 1.2 Connect to new repository
    - Run `git remote add origin git@github.com:sweetyams/JanineHeadless.git`
    - Create initial commit with current state
    - Push to new repository: `git push -u origin main`
    - _Requirements: Project Setup_

- [x] 2. Next.js Commerce boilerplate setup
  - [x] 2.1 Clone and configure Vercel Commerce boilerplate
    - Clone https://github.com/vercel/commerce to a temporary directory
    - Copy relevant files to project root (preserve git history)
    - Install dependencies: `npm install`
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 2.2 Configure Shopify Storefront API integration
    - Create `.env.local` with Shopify credentials
    - Set `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
    - Set `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
    - Set `SHOPIFY_ADMIN_ACCESS_TOKEN`
    - Test API connection with a simple product query
    - _Requirements: 3.1, 3.2_
  
  - [x] 2.3 Verify build and development server
    - Run `npm run dev` to start development server
    - Run `npm run build` to verify production build
    - Verify no build errors or warnings
    - _Requirements: 1.2_

- [ ] 3. Bilingual routing infrastructure
  - [ ] 3.1 Implement locale middleware
    - Create `middleware.ts` for locale detection and redirection
    - Implement root path `/` redirect to `/en/` or `/fr/` based on Accept-Language header
    - Set locale cookie for persistence
    - _Requirements: 2.1, 2.2_
  
  - [ ] 3.2 Create locale-based directory structure
    - Create `app/[locale]/` directory structure
    - Create `app/[locale]/layout.tsx` with locale provider
    - Create `app/[locale]/page.tsx` for home page
    - Set HTML lang attribute based on locale
    - _Requirements: 2.1, 2.6_
  
  - [ ] 3.3 Build language switcher component
    - Create `components/locale/LanguageSwitcher.tsx`
    - Implement toggle between EN/FR
    - Preserve current page path when switching locales
    - Update locale cookie on switch
    - _Requirements: 2.3, 2.4_
  
  - [ ]* 3.4 Write property test for locale switching
    - **Property 2: Locale Switching Preserves Page Path**
    - **Validates: Requirements 2.4**
    - Test that switching locale and back preserves path structure
    - _Requirements: 2.4_

- [ ] 4. Development environment configuration
  - [ ] 4.1 Set up Vercel project
    - Create new Vercel project
    - Connect to git@github.com:sweetyams/JanineHeadless.git
    - Configure automatic deployments on push
    - _Requirements: 42.5_
  
  - [ ] 4.2 Configure environment variables in Vercel
    - Add Shopify API credentials to Vercel environment
    - Configure for development, preview, and production environments
    - Verify environment variables are accessible
    - _Requirements: 42.2_
  
  - [ ] 4.3 Test preview deployment
    - Create a test branch and push changes
    - Verify preview deployment builds successfully
    - Test Shopify API connection in preview environment
    - _Requirements: 42.6_

- [ ] 5. Database setup and initialization
  - [ ] 5.1 Provision Vercel Postgres database
    - Create Vercel Postgres database in Vercel dashboard
    - Copy connection string to environment variables
    - Set `DATABASE_URL` in `.env.local` and Vercel
    - _Requirements: 42.4_
  
  - [ ] 5.2 Initialize Prisma ORM
    - Install Prisma: `npm install prisma @prisma/client`
    - Initialize Prisma: `npx prisma init`
    - Configure `prisma/schema.prisma` with database models from design
    - _Requirements: Database Setup_
  
  - [ ] 5.3 Create initial database schema
    - Define User, GlobalSettings, HomePage, CollectionLanding, StaticPage, Asset models
    - Define IceCreamSlot, SlotReservation, SlotConfiguration models
    - Run `npx prisma migrate dev --name init` to create tables
    - _Requirements: Database Setup_
  
  - [ ] 5.4 Seed database with test data
    - Create `prisma/seed.ts` with sample data
    - Add admin user with hashed password
    - Add sample global settings for EN and FR
    - Run `npx prisma db seed`
    - _Requirements: Database Setup_

- [ ] 6. Checkpoint - Verify Phase 1 completion
  - Ensure all tests pass, verify Shopify connection works, confirm bilingual routing functions, check database is accessible, ask the user if questions arise.



### PHASE 2: CORE E-COMMERCE

- [x] 7. Product catalog pages
  - [x] 7.1 Create collection (PLP) page structure
    - Create `app/[locale]/collections/[handle]/page.tsx`
    - Implement server component to fetch collection data from Shopify
    - Display collection title and description
    - _Requirements: 5.1, 5.8_
  
  - [x] 7.2 Build product grid with filtering
    - Create `components/product/ProductGrid.tsx` client component
    - Implement availability filter (In Stock, Pre-order, Sold Out)
    - Implement size filter (if applicable)
    - Display filtered product cards
    - _Requirements: 5.3, 5.5, 5.6_
  
  - [x] 7.3 Implement sorting functionality
    - Add sort dropdown with options: Featured, Price Low-High, Price High-Low, Newest
    - Implement sort logic in client component
    - Preserve sort selection in URL params
    - _Requirements: 5.4_
  
  - [x] 7.4 Create product card component
    - Create `components/product/ProductCard.tsx`
    - Display product image, title, price, availability badge
    - Show pre-order badge and date when applicable
    - Link to product detail page
    - _Requirements: 5.3, 6.4, 6.5_
  
  - [x] 7.5 Add empty state handling
    - Display message when no products match filters
    - Provide clear call-to-action to adjust filters
    - _Requirements: 5.7_

- [ ] 8. Product detail page (PDP)
  - [ ] 8.1 Create product detail page structure
    - Create `app/[locale]/products/[handle]/page.tsx`
    - Fetch product data including metafields from Shopify
    - Display product title, description, price, images
    - _Requirements: 6.1, 3.4_
  
  - [ ] 8.2 Build image gallery component
    - Create `components/product/ImageGallery.tsx`
    - Implement main image display with zoom
    - Add thumbnail navigation
    - Use Next.js Image component for optimization
    - _Requirements: 6.1_
  
  - [ ] 8.3 Implement variant selector
    - Create `components/product/VariantSelector.tsx`
    - Display variant options (size, color, etc.)
    - Require variant selection before add-to-cart
    - Update price and availability based on selected variant
    - _Requirements: 6.2_
  
  - [ ] 8.4 Display availability and pre-order information
    - Show availability state: In Stock, Pre-order, or Sold Out
    - Display "Pre-order" badge when `is_preorder` metafield is true
    - Show fulfillment date from `preorder_ship_date` metafield
    - Display disclaimer text from `preorder_disclaimer_en/fr` metafield
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 8.5 Build add-to-cart functionality
    - Create add-to-cart button component
    - Disable button when product is sold out
    - Trigger cart addition on click
    - Show loading state during cart update
    - _Requirements: 6.7, 8.1_
  
  - [ ]* 8.6 Write property test for product data fetching
    - **Property 4: Product Data Fetching Completeness**
    - **Validates: Requirements 3.2, 3.4**
    - Test that all required fields including metafields are returned
    - _Requirements: 3.2, 3.4_

- [ ] 9. Shopping cart implementation
  - [ ] 9.1 Create cart context provider
    - Create `components/cart/CartProvider.tsx`
    - Implement cart state management with Shopify Cart API
    - Provide addItem, updateItem, removeItem, clearCart functions
    - Persist cart ID in localStorage
    - _Requirements: 8.1, 8.2_
  
  - [ ] 9.2 Build cart page
    - Create `app/[locale]/cart/page.tsx`
    - Display cart line items with images, titles, variants, prices
    - Show pre-order labels and fulfillment dates
    - Display "Items may ship separately" message for mixed carts
    - _Requirements: 8.4, 8.5, 8.6, 8.7_
  
  - [ ] 9.3 Create cart line item component
    - Create `components/cart/CartLineItem.tsx`
    - Display product details and quantity selector
    - Implement quantity update functionality
    - Add remove button
    - _Requirements: 8.4, 8.8, 8.9_
  
  - [ ] 9.4 Build cart summary component
    - Create `components/cart/CartSummary.tsx`
    - Display subtotal and total
    - Add checkout button
    - Show validation errors
    - _Requirements: 8.11_
  
  - [ ] 9.5 Add cart count badge to navigation
    - Update navigation component with cart icon
    - Display item count badge
    - Link to cart page
    - _Requirements: 8.10_
  
  - [ ]* 9.6 Write property tests for cart operations
    - **Property 5: Add to Cart Creates Line Item**
    - **Validates: Requirements 8.1**
    - **Property 6: Cart Persistence Round Trip**
    - **Validates: Requirements 8.2, 14.1**
    - **Property 7: Cart Quantity Update Reflects Change**
    - **Validates: Requirements 8.8**
    - **Property 8: Cart Item Removal Excludes Item**
    - **Validates: Requirements 8.9**
    - _Requirements: 8.1, 8.2, 8.8, 8.9, 14.1_

- [ ] 10. Checkout integration
  - [ ] 10.1 Implement checkout redirect
    - Create checkout handler in cart page
    - Generate Shopify checkout URL with cart data
    - Include locale in checkout URL
    - Include cart attributes and metadata
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 10.2 Handle post-checkout flow
    - Create order confirmation page
    - Clear cart after successful checkout
    - Display order details
    - _Requirements: 16.6, 16.7_

- [ ] 11. Search implementation
  - [ ] 11.1 Set up Meilisearch instance
    - Provision Meilisearch on Railway or Fly.io
    - Configure environment variables: `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`
    - Test connection from Next.js application
    - _Requirements: 18.1, 18.2_
  
  - [ ] 11.2 Create search index schema
    - Define index with fields: title, handle, product_type, tags, availability, locale, price, image
    - Configure searchable attributes
    - Configure filterable attributes (availability, locale, product_type)
    - Configure sortable attributes (price, created_at)
    - _Requirements: 18.3, 18.4_
  
  - [ ] 11.3 Build initial product indexer
    - Create `lib/search/indexer.ts`
    - Fetch all products from Shopify
    - Transform product data to search documents
    - Create separate entries for EN and FR
    - Index products in Meilisearch
    - _Requirements: 18.5_
  
  - [ ] 11.4 Create search UI components
    - Create `components/search/SearchInput.tsx` for header
    - Implement debounced input with autocomplete
    - Create `app/[locale]/search/page.tsx` for results
    - Display search results with product cards
    - _Requirements: 20.1, 20.2, 20.4, 20.7_
  
  - [ ] 11.5 Implement search functionality
    - Create `lib/search/client.ts` for Meilisearch queries
    - Implement autocomplete suggestions
    - Implement full-text search across titles, handles, types, tags
    - Filter results by locale
    - Add sort options (Relevance, Availability)
    - _Requirements: 20.3, 20.5, 20.6, 20.8_
  
  - [ ] 11.6 Add search filters and empty states
    - Implement availability filter on search results
    - Display "no results" message with suggestions
    - Add loading indicators
    - _Requirements: 20.9, 20.10, 21.4_
  
  - [ ]* 11.7 Write property test for search locale matching
    - **Property 16: Search Results Match Locale**
    - **Validates: Requirements 20.6**
    - Test that search results only return documents matching current locale
    - _Requirements: 20.6_

- [ ] 12. Shopify webhooks for search updates
  - [ ] 12.1 Create webhook endpoints
    - Create `app/api/webhooks/products/create/route.ts`
    - Create `app/api/webhooks/products/update/route.ts`
    - Create `app/api/webhooks/products/delete/route.ts`
    - Implement webhook signature verification
    - _Requirements: 19.5_
  
  - [ ] 12.2 Implement partial index updates
    - Add product to index on create webhook
    - Update product in index on update webhook
    - Remove product from index on delete webhook
    - Handle both EN and FR entries
    - _Requirements: 19.2, 19.3, 19.4_
  
  - [ ] 12.3 Configure webhooks in Shopify
    - Register webhook URLs in Shopify admin
    - Set webhook secret in environment variables
    - Test webhook delivery
    - _Requirements: 19.5_
  
  - [ ]* 12.4 Write property test for search index synchronization
    - **Property 15: Search Index Synchronization**
    - **Validates: Requirements 19.2, 19.3, 19.4**
    - Test that CRUD operations sync correctly to search index
    - _Requirements: 19.2, 19.3, 19.4_

- [ ] 13. Checkpoint - Verify Phase 2 completion
  - Ensure all tests pass, verify product browsing works, confirm cart operations function, check checkout flow completes, test search functionality, ask the user if questions arise.



### PHASE 3: CUSTOM CMS

- [ ] 14. CMS authentication
  - [ ] 14.1 Install and configure NextAuth.js
    - Install NextAuth.js: `npm install next-auth`
    - Create `app/api/auth/[...nextauth]/route.ts`
    - Configure credentials provider
    - Set `NEXTAUTH_URL` and `NEXTAUTH_SECRET` environment variables
    - _Requirements: 29.1, 29.2_
  
  - [ ] 14.2 Create CMS login page
    - Create `app/cms/login/page.tsx`
    - Build login form with email and password fields
    - Implement authentication with NextAuth
    - Redirect to dashboard on success
    - Display error messages on failure
    - _Requirements: 29.3_
  
  - [ ] 14.3 Implement CMS route protection
    - Create middleware to protect `/cms/*` routes
    - Redirect unauthenticated users to login page
    - Verify session on protected routes
    - _Requirements: 29.4_
  
  - [ ] 14.4 Add logout functionality
    - Create logout button in CMS layout
    - Clear session on logout
    - Redirect to login page
    - _Requirements: 29.5_

- [ ] 15. CMS admin interface foundation
  - [ ] 15.1 Create CMS layout
    - Create `app/cms/layout.tsx` with admin navigation
    - Add sidebar with links to content sections
    - Include logout button
    - Apply admin-specific styling
    - _Requirements: CMS Admin Interface_
  
  - [ ] 15.2 Build CMS dashboard
    - Create `app/cms/dashboard/page.tsx`
    - Display content status overview
    - Show quick links to content sections
    - Add recent changes log
    - _Requirements: CMS Dashboard_
  
  - [ ] 15.3 Create content status indicators
    - Build component to show draft vs published status
    - Display last updated timestamp
    - Add visual indicators for content state
    - _Requirements: 26.1_

- [ ] 16. Global settings management
  - [ ] 16.1 Create global settings editor
    - Create `app/cms/settings/page.tsx`
    - Build form for header navigation links
    - Build form for footer sections
    - Build form for promotional banner
    - Build form for SEO defaults
    - _Requirements: 22.1, 22.2, 22.3, 22.4_
  
  - [ ] 16.2 Implement locale switcher for settings
    - Add EN/FR toggle in settings editor
    - Load settings for selected locale
    - Save settings per locale
    - _Requirements: 22.5_
  
  - [ ] 16.3 Create settings API routes
    - Create `app/api/cms/settings/route.ts` for GET and PUT
    - Fetch settings from database
    - Update settings in database
    - Return settings in JSON format
    - _Requirements: 22.6_

- [ ] 17. Home page content management
  - [ ] 17.1 Create home page editor
    - Create `app/cms/home/page.tsx`
    - Build form for hero section (title, subtitle, CTA, image)
    - Build interface for selecting featured collections
    - Build interface for managing feature tiles
    - _Requirements: 23.1, 23.2, 23.3_
  
  - [ ] 17.2 Implement drag-and-drop reordering
    - Add drag-and-drop for featured collections
    - Add drag-and-drop for feature tiles
    - Save order to database
    - _Requirements: 23.5_
  
  - [ ] 17.3 Add locale support for home page
    - Store home page content for EN and FR
    - Switch between locales in editor
    - _Requirements: 23.4_
  
  - [ ] 17.4 Create home page API routes
    - Create `app/api/cms/home/route.ts` for GET and PUT
    - Fetch home page content from database
    - Update home page content in database
    - _Requirements: Home Page API_

- [ ] 18. Collection landing content management
  - [ ] 18.1 Create collection landing editor
    - Create `app/cms/collections/page.tsx`
    - List all Shopify collections
    - Allow selection of collection to edit
    - Build rich text editor for landing content
    - Add banner image upload
    - _Requirements: 24.1, 24.2, 24.3_
  
  - [ ] 18.2 Integrate rich text editor
    - Install TipTap: `npm install @tiptap/react @tiptap/starter-kit`
    - Create `components/cms/RichTextEditor.tsx`
    - Configure toolbar with formatting options
    - Support image insertion
    - _Requirements: 24.3_
  
  - [ ] 18.3 Add locale support for collection landing
    - Store collection landing content for EN and FR
    - Switch between locales in editor
    - _Requirements: 24.4_
  
  - [ ] 18.4 Create collection landing API routes
    - Create `app/api/cms/collections/[handle]/route.ts`
    - Fetch collection landing content from database
    - Update collection landing content in database
    - _Requirements: 24.5_

- [ ] 19. Static pages management
  - [ ] 19.1 Create static pages list view
    - Create `app/cms/pages/page.tsx`
    - List all static pages
    - Show page title, slug, status, last updated
    - Add "Create New Page" button
    - _Requirements: 25.1_
  
  - [ ] 19.2 Build static page editor
    - Create `app/cms/pages/[slug]/page.tsx`
    - Build form for page title, slug, content
    - Integrate rich text editor for content
    - Add SEO metadata fields (title, description, og:image)
    - _Requirements: 25.2, 25.3_
  
  - [ ] 19.3 Add locale support for static pages
    - Store static page content for EN and FR
    - Switch between locales in editor
    - _Requirements: 25.4_
  
  - [ ] 19.4 Create static pages API routes
    - Create `app/api/cms/pages/route.ts` for list and create
    - Create `app/api/cms/pages/[slug]/route.ts` for get, update, delete
    - Handle CRUD operations with database
    - _Requirements: 25.5_

- [ ] 20. Draft and publish workflow
  - [ ] 20.1 Implement draft save functionality
    - Add "Save Draft" button to all content editors
    - Update `draftData` field in database without changing published data
    - Show success message on save
    - _Requirements: 26.2_
  
  - [ ] 20.2 Implement publish functionality
    - Add "Publish" button to all content editors
    - Copy `draftData` to published data field
    - Update status to "published"
    - Show success message on publish
    - _Requirements: 26.3_
  
  - [ ] 20.3 Ensure public users see only published content
    - Fetch only published data in public-facing pages
    - Never expose draftData to non-authenticated users
    - _Requirements: 26.4_
  
  - [ ] 20.4 Create preview mode
    - Add "Preview" button to content editors
    - Create preview route that shows draft content
    - Require authentication for preview access
    - Display preview indicator banner
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_
  
  - [ ]* 20.5 Write property tests for draft/publish workflow
    - **Property 17: Draft Save Preserves Published Content**
    - **Validates: Requirements 26.2**
    - **Property 18: Publish Copies Draft to Published**
    - **Validates: Requirements 26.3**
    - **Property 19: Public Users See Only Published Content**
    - **Validates: Requirements 26.4**
    - _Requirements: 26.2, 26.3, 26.4_

- [ ] 21. Asset management
  - [ ] 21.1 Set up Cloudinary integration
    - Create Cloudinary account
    - Install Cloudinary SDK: `npm install cloudinary`
    - Configure environment variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
    - _Requirements: 28.2_
  
  - [ ] 21.2 Create asset upload API
    - Create `app/api/cms/assets/upload/route.ts`
    - Handle multipart file upload
    - Upload to Cloudinary
    - Store asset metadata in database
    - Return asset URL and metadata
    - _Requirements: 28.1, 28.2_
  
  - [ ] 21.3 Build asset library interface
    - Create `app/cms/assets/page.tsx`
    - Display grid of uploaded images
    - Show thumbnails with asset details
    - Add search and filter functionality
    - _Requirements: 28.3_
  
  - [ ] 21.4 Create asset selector component
    - Create `components/cms/AssetSelector.tsx`
    - Allow selection from asset library
    - Support single and multiple selection
    - Integrate with content editors
    - _Requirements: 28.4_
  
  - [ ] 21.5 Implement image optimization
    - Generate multiple sizes on upload
    - Create responsive image URLs
    - Use Next.js Image component for display
    - _Requirements: 28.5_

- [ ] 22. Checkpoint - Verify Phase 3 completion
  - Ensure all tests pass, verify CMS authentication works, confirm content editing functions, check draft/publish workflow, test asset management, ask the user if questions arise.



### PHASE 4: ADVANCED FEATURES (PRE-ORDER & ICE CREAM SCHEDULING)

- [ ] 23. Pre-order product support
  - [ ] 23.1 Fetch and parse pre-order metafields
    - Update Shopify GraphQL queries to include pre-order metafields
    - Parse `is_preorder`, `preorder_ship_date`, `preorder_disclaimer_en`, `preorder_disclaimer_fr`
    - Create helper function to classify products as pre-order
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 23.2 Display pre-order badges and information
    - Update ProductCard to show "Pre-order" badge
    - Display fulfillment date on product cards
    - Show pre-order badge on PDP
    - Display fulfillment date on PDP
    - Show disclaimer text on PDP in current locale
    - _Requirements: 6.4, 6.5, 6.6_
  
  - [ ] 23.3 Add pre-order labels in cart
    - Update CartLineItem to show "Pre-order" label
    - Display fulfillment date for pre-order items
    - Show "Items may ship separately" message when cart has mixed items
    - _Requirements: 8.5, 8.6, 8.7_
  
  - [ ]* 23.4 Write property test for sold out products
    - **Property 23: Sold Out Products Disable Add to Cart**
    - **Validates: Requirements 6.7**
    - Test that add-to-cart is disabled when availableForSale is false
    - _Requirements: 6.7_

- [ ] 24. Ice cream product identification
  - [ ] 24.1 Configure ice cream product metafields
    - Define `is_ice_cream`, `requires_scheduling`, `lead_time_hours` metafields in Shopify
    - Document metafield configuration for store administrators
    - _Requirements: 9.1_
  
  - [ ] 24.2 Create ice cream product classifier
    - Create `lib/products/classifier.ts`
    - Implement function to identify ice cream products from metafields
    - Distinguish ice cream from regular and pre-order products
    - _Requirements: 9.2, 9.3_

- [ ] 25. Slot configuration and management
  - [ ] 25.1 Create slot configuration interface
    - Create `app/cms/slots/config/page.tsx`
    - Build form for lead time hours
    - Build form for default capacity
    - Build interface for defining time windows
    - Build interface for setting closed days
    - _Requirements: 13.1_
  
  - [ ] 25.2 Create slot configuration API
    - Create `app/api/cms/slots/config/route.ts`
    - Fetch slot configuration from database
    - Update slot configuration in database
    - _Requirements: Slot Configuration_
  
  - [ ] 25.3 Build slot capacity tracking
    - Create `lib/slots/capacity.ts`
    - Implement function to track current capacity per slot
    - Implement function to check if slot is at capacity
    - Update availability when capacity is reached
    - _Requirements: 12.1, 12.2_
  
  - [ ] 25.4 Implement slot availability calculator
    - Create `lib/slots/availability.ts`
    - Calculate available dates based on lead time
    - Exclude closed days from available dates
    - Filter out slots at capacity
    - _Requirements: 11.2, 11.3, 13.2_
  
  - [ ]* 25.5 Write property tests for slot management
    - **Property 9: Lead Time Enforcement for Available Dates**
    - **Validates: Requirements 11.2**
    - **Property 10: Capacity Enforcement for Slot Availability**
    - **Validates: Requirements 11.6, 12.2**
    - Test that slots respect lead time and capacity limits
    - _Requirements: 11.2, 11.6, 12.2_

- [ ] 26. Ice cream scheduling UI
  - [ ] 26.1 Create scheduling modal component
    - Create `components/scheduling/SchedulingModal.tsx`
    - Trigger modal when ice cream product is added to cart
    - Display date picker with available dates
    - Display time window selector
    - Show capacity indicators for each time window
    - _Requirements: 11.1, 11.4, 11.5_
  
  - [ ] 26.2 Build date picker component
    - Create `components/scheduling/DatePicker.tsx`
    - Display calendar view
    - Highlight available dates
    - Disable dates that violate lead time or are closed
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ] 26.3 Build time window selector
    - Create `components/scheduling/TimeWindowSelector.tsx`
    - Display time windows as selectable cards
    - Show remaining capacity for each window
    - Disable windows at capacity
    - Update in real-time as capacity changes
    - _Requirements: 11.4, 11.5, 11.6_
  
  - [ ] 26.4 Create slot display component
    - Create `components/scheduling/SlotDisplay.tsx`
    - Show selected slot information in cart
    - Display date, time window, location
    - Add edit button to change slot
    - _Requirements: 11.8_
  
  - [ ] 26.5 Implement fulfillment method selection
    - Add fulfillment method selector to scheduling modal
    - Provide "Pickup" option (delivery deferred to P1)
    - Store fulfillment method with cart line item
    - _Requirements: 10.1, 10.2, 10.5_

- [ ] 27. Slot reservation and validation
  - [ ] 27.1 Implement slot reservation system
    - Create `lib/slots/reservation.ts`
    - Reserve slot when customer selects it
    - Create reservation record with expiration (30 minutes)
    - Increment slot capacity counter
    - _Requirements: 12.3_
  
  - [ ] 27.2 Build slot validation logic
    - Create `lib/slots/validation.ts`
    - Verify slot has remaining capacity before selection
    - Prevent selection of slots at capacity
    - Display error message when slot is unavailable
    - _Requirements: 12.4, 12.5_
  
  - [ ] 27.3 Implement slot persistence
    - Store selected slot in cart attributes
    - Persist slot across browser sessions
    - Persist slot across locale switches
    - _Requirements: 14.1, 14.2_
  
  - [ ] 27.4 Add slot validation on cart load
    - Validate slot availability when cart page loads
    - Display warning if slot is no longer available
    - Prompt for new slot selection if invalid
    - _Requirements: 14.3, 14.4_
  
  - [ ] 27.5 Implement pre-checkout slot validation
    - Validate all slots before checkout
    - Prevent checkout if any slot is unavailable
    - Display clear error message
    - _Requirements: 14.5, 14.6_
  
  - [ ]* 27.6 Write property tests for slot validation
    - **Property 11: Slot Selection Requires Available Capacity**
    - **Validates: Requirements 12.4**
    - **Property 12: Slot Availability Validation on Cart Load**
    - **Validates: Requirements 14.3**
    - **Property 14: Pre-Checkout Slot Validation**
    - **Validates: Requirements 17.3**
    - Test slot validation at different stages
    - _Requirements: 12.4, 14.3, 17.3_

- [ ] 28. Cart validation for ice cream products
  - [ ] 28.1 Implement ice cream slot requirement validation
    - Check that all ice cream products have slots selected
    - Block checkout if any ice cream product lacks a slot
    - Display validation error message
    - _Requirements: 17.1, 17.2_
  
  - [ ] 28.2 Add cart validation UI
    - Display validation errors prominently in cart
    - Highlight line items with missing slots
    - Provide clear guidance to resolve issues
    - _Requirements: 17.4_
  
  - [ ]* 28.3 Write property test for ice cream slot requirement
    - **Property 13: Ice Cream Products Require Slot Selection**
    - **Validates: Requirements 17.1**
    - Test that checkout is blocked without slot selection
    - _Requirements: 17.1_

- [ ] 29. Order metadata for ice cream
  - [ ] 29.1 Include slot information in cart attributes
    - Add slot_id, slot_date, slot_time, slot_location to cart attributes
    - Add fulfillment_method to cart attributes
    - Pass attributes to Shopify checkout
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ] 29.2 Display slot information in order confirmation
    - Show slot details on order confirmation page
    - Display fulfillment method and location
    - _Requirements: 15.6_
  
  - [ ] 29.3 Ensure slot information visible in Shopify admin
    - Verify cart attributes appear in Shopify order details
    - Document how to view slot information for fulfillment
    - _Requirements: 15.7_

- [ ] 30. Checkpoint - Verify Phase 4 completion
  - Ensure all tests pass, verify pre-order display works, confirm ice cream scheduling functions, check slot validation enforced, test cart validation rules, ask the user if questions arise.



### PHASE 5: POLISH & LAUNCH

- [ ] 31. Localization implementation
  - [ ] 31.1 Set up translation files
    - Create `public/locales/en/` and `public/locales/fr/` directories
    - Create translation files for common strings, errors, validation messages
    - Organize translations by feature (cart, product, search, etc.)
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5_
  
  - [ ] 31.2 Implement translation helper
    - Create `lib/i18n/translate.ts`
    - Implement function to fetch translations by key and locale
    - Support interpolation for dynamic values
    - _Requirements: 30.1_
  
  - [ ] 31.3 Add date and currency formatting
    - Create `lib/i18n/format.ts`
    - Implement date formatting per locale (MM/DD/YYYY for EN, DD/MM/YYYY for FR)
    - Implement currency formatting per locale ($10.00 for EN, 10,00 $ for FR)
    - _Requirements: 30.6, 30.7_
  
  - [ ] 31.4 Localize all customer-facing strings
    - Replace hardcoded strings with translation keys
    - Translate button text and CTAs
    - Translate form labels and placeholders
    - Translate empty state messages
    - _Requirements: 30.1, 30.3, 30.4, 30.5_
  
  - [ ] 31.5 Localize error messages
    - Translate all error messages
    - Translate validation messages
    - Ensure errors display in current locale
    - _Requirements: 30.2, 36.1, 37.1_
  
  - [ ]* 31.6 Write property tests for localization
    - **Property 20: Date Formatting Matches Locale**
    - **Validates: Requirements 30.6**
    - **Property 21: Currency Formatting Matches Locale**
    - **Validates: Requirements 30.7**
    - **Property 22: Error Messages Localized**
    - **Validates: Requirements 36.1, 37.1**
    - Test formatting and error localization
    - _Requirements: 30.6, 30.7, 36.1, 37.1_

- [ ] 32. Product content localization
  - [ ] 32.1 Fetch localized product data from Shopify
    - Update GraphQL queries to request locale-specific fields
    - Fetch product titles in current locale
    - Fetch product descriptions in current locale
    - Fetch variant option names in current locale
    - _Requirements: 31.1, 31.2, 31.4_
  
  - [ ] 32.2 Implement CMS translation overlay (if needed)
    - Create CMS interface for product translation overrides
    - Fetch CMS translations when Shopify data is unavailable
    - Prioritize Shopify native translations
    - _Requirements: 31.3_
  
  - [ ] 32.3 Localize product metafields
    - Display pre-order disclaimers in current locale
    - Use `preorder_disclaimer_en` or `preorder_disclaimer_fr` based on locale
    - _Requirements: 31.5_

- [ ] 33. Static page rendering
  - [ ] 33.1 Create static page route
    - Create `app/[locale]/[slug]/page.tsx` for CMS pages
    - Fetch page content from database based on slug and locale
    - Render rich text content with proper HTML structure
    - Display page title and SEO metadata
    - _Requirements: 34.1, 34.2, 34.3, 34.4_
  
  - [ ] 33.2 Implement 404 error page
    - Create `app/[locale]/not-found.tsx`
    - Display error message in current locale
    - Provide navigation links to home and search
    - Maintain header and footer
    - _Requirements: 35.1, 35.2, 35.3, 35.4_
  
  - [ ]* 33.3 Write property test for 404 handling
    - **Property 24: Invalid URLs Return 404**
    - **Validates: Requirements 35.1**
    - Test that invalid paths return 404 status
    - _Requirements: 35.1_

- [ ] 34. Error handling implementation
  - [ ] 34.1 Create error boundary components
    - Create React Error Boundaries for major sections
    - Implement fallback UI for errors
    - Log errors to monitoring service
    - _Requirements: Error Handling_
  
  - [ ] 34.2 Implement API error handling
    - Handle Shopify API failures gracefully
    - Display user-friendly error messages
    - Implement retry logic for transient failures
    - Show connectivity errors when network is lost
    - _Requirements: 36.1, 36.2_
  
  - [ ] 34.3 Add product loading error states
    - Display error state when product fails to load
    - Provide retry option
    - _Requirements: 36.3_
  
  - [ ] 34.4 Implement search error handling
    - Display error message when search is unavailable
    - Suggest browsing collections as alternative
    - _Requirements: 36.4_
  
  - [ ] 34.5 Add validation error display
    - Show validation errors near relevant form fields
    - Display variant selection requirement error
    - Display slot requirement error for ice cream
    - Display slot invalidity error
    - Display checkout failure error
    - _Requirements: 37.1, 37.2, 37.3, 37.4_

- [ ] 35. Performance optimization
  - [ ] 35.1 Implement server-side rendering
    - Use React Server Components for initial page loads
    - Fetch data on server for faster initial render
    - _Requirements: 38.1_
  
  - [ ] 35.2 Add image optimization
    - Use Next.js Image component throughout
    - Implement lazy loading for product images
    - Generate responsive image sizes
    - _Requirements: 38.2, 38.5_
  
  - [ ] 35.3 Implement code splitting
    - Configure route-based code splitting
    - Lazy load non-critical components
    - _Requirements: 38.3_
  
  - [ ] 35.4 Add resource prefetching
    - Prefetch critical resources for faster navigation
    - Preload fonts and key assets
    - _Requirements: 38.4_
  
  - [ ] 35.5 Add loading indicators
    - Display loading states during data fetching
    - Show skeleton screens for product grids
    - Add spinners for async operations
    - _Requirements: 38.6_
  
  - [ ] 35.6 Implement API response caching
    - Configure stale-while-revalidate caching for product data
    - Implement query result caching for search
    - Add client-side caching for frequently accessed data
    - Invalidate cache on product updates
    - _Requirements: 39.1, 39.2, 39.3, 39.4, 39.5_
  
  - [ ]* 35.7 Write property test for cache behavior
    - **Property 25: Stale-While-Revalidate Cache Behavior**
    - **Validates: Requirements 39.2**
    - Test that stale data is served while revalidating
    - _Requirements: 39.2_

- [ ] 36. Responsive design
  - [ ] 36.1 Implement responsive layouts
    - Ensure all pages adapt to screen size
    - Test on mobile, tablet, and desktop breakpoints
    - _Requirements: 40.1_
  
  - [ ] 36.2 Optimize product grids for mobile
    - Adjust grid columns for different screen sizes
    - Ensure product cards are touch-friendly
    - _Requirements: 40.2_
  
  - [ ] 36.3 Create mobile-optimized cart
    - Adapt cart layout for small screens
    - Ensure quantity controls are touch-friendly
    - _Requirements: 40.3_
  
  - [ ] 36.4 Optimize scheduling UI for mobile
    - Adapt date picker for mobile screens
    - Ensure time window selector is touch-friendly
    - _Requirements: 40.4_
  
  - [ ] 36.5 Add touch-friendly controls
    - Ensure all interactive elements are appropriately sized
    - Add touch feedback for buttons and links
    - _Requirements: 40.5_
  
  - [ ] 36.6 Make CMS responsive
    - Ensure CMS admin interface works on mobile devices
    - Adapt forms and editors for smaller screens
    - _Requirements: 40.6_

- [ ] 37. SEO optimization
  - [ ] 37.1 Implement semantic HTML
    - Use proper heading hierarchy (h1, h2, h3)
    - Use semantic elements (nav, main, article, section)
    - _Requirements: 41.1_
  
  - [ ] 37.2 Add meta descriptions
    - Include meta descriptions on all pages
    - Fetch descriptions from CMS for static pages
    - Generate descriptions for product and collection pages
    - Provide descriptions in both EN and FR
    - _Requirements: 41.2_
  
  - [ ] 37.3 Implement Open Graph tags
    - Add og:title, og:description, og:image to all pages
    - Support social media sharing with rich previews
    - _Requirements: 41.3_
  
  - [ ] 37.4 Add structured data markup
    - Implement Product schema for product pages
    - Add BreadcrumbList schema for navigation
    - Include Organization schema for home page
    - _Requirements: 41.4_
  
  - [ ] 37.5 Implement hreflang tags
    - Add hreflang tags for EN and FR versions of pages
    - Link alternate language versions
    - _Requirements: 41.5_
  
  - [ ] 37.6 Generate sitemap
    - Create dynamic sitemap including all localized URLs
    - Include product, collection, and static page URLs
    - Update sitemap when content changes
    - _Requirements: 41.6_
  
  - [ ] 37.7 Add canonical URLs
    - Implement canonical tags to prevent duplicate content
    - Set canonical URLs for all pages
    - _Requirements: 41.7_

- [ ] 38. Analytics integration
  - [ ] 38.1 Set up analytics service
    - Choose Google Analytics 4 or Vercel Analytics
    - Install analytics SDK
    - Configure tracking ID in environment variables
    - _Requirements: Analytics Setup_
  
  - [ ] 38.2 Implement e-commerce event tracking
    - Track view_item events on product pages
    - Track view_item_list events on collection pages
    - Track search events on search
    - Track add_to_cart events
    - Track view_cart events
    - Track begin_checkout events
    - Track purchase events
    - Include locale as dimension in all events
    - _Requirements: 32.1, 32.2, 32.3, 32.4, 32.5, 32.6, 32.7, 32.8_
  
  - [ ] 38.3 Implement custom event tracking
    - Track preorder_viewed events
    - Track preorder_added events
    - Track slot_selected events
    - Track slot_invalidated events
    - Include product and slot details in events
    - _Requirements: 33.1, 33.2, 33.3, 33.4, 33.5_

- [ ] 39. Testing and quality assurance
  - [ ] 39.1 Run full test suite
    - Execute all unit tests
    - Execute all property tests (100 iterations each)
    - Execute all integration tests
    - Verify code coverage >80%
    - _Requirements: Testing Strategy_
  
  - [ ] 39.2 Perform cross-browser testing
    - Test on Chrome, Firefox, Safari
    - Verify functionality across browsers
    - Fix browser-specific issues
    - _Requirements: Testing Checklist_
  
  - [ ] 39.3 Test mobile responsiveness
    - Test on iOS and Android devices
    - Verify touch interactions work correctly
    - Test different screen sizes
    - _Requirements: Testing Checklist_
  
  - [ ] 39.4 Run accessibility audit
    - Use WAVE or axe DevTools
    - Fix accessibility issues
    - Verify keyboard navigation
    - Test with screen reader
    - _Requirements: Testing Checklist_
  
  - [ ] 39.5 Perform load testing
    - Test slot capacity limits under load
    - Verify concurrent slot reservations work correctly
    - Test search performance under load
    - _Requirements: Testing Checklist_
  
  - [ ] 39.6 Run security audit
    - Verify authentication is secure
    - Check for XSS vulnerabilities
    - Verify API endpoints are protected
    - Test webhook signature verification
    - _Requirements: Testing Checklist_

- [ ] 40. Documentation
  - [ ] 40.1 Create deployment documentation
    - Document environment variables required
    - Document deployment process to Vercel
    - Document database migration process
    - _Requirements: Documentation_
  
  - [ ] 40.2 Write CMS user guide
    - Document how to manage global settings
    - Document how to edit home page content
    - Document how to create static pages
    - Document how to manage collection landing content
    - Document how to upload and manage assets
    - Document draft/publish workflow
    - _Requirements: Documentation_
  
  - [ ] 40.3 Document slot configuration
    - Document how to configure time windows
    - Document how to set lead time
    - Document how to set capacity limits
    - Document how to set closed days
    - _Requirements: Documentation_
  
  - [ ] 40.4 Create troubleshooting guide
    - Document common issues and solutions
    - Document how to view logs
    - Document how to handle webhook failures
    - Document how to reindex search
    - _Requirements: Documentation_

- [ ] 41. Production deployment
  - [ ] 41.1 Configure production environment
    - Set all environment variables in Vercel production
    - Verify Shopify API credentials
    - Verify database connection
    - Verify Meilisearch connection
    - Verify Cloudinary configuration
    - _Requirements: 42.2, 42.3, 42.4_
  
  - [ ] 41.2 Run database migrations on production
    - Execute Prisma migrations on production database
    - Verify all tables created successfully
    - Seed initial data if needed
    - _Requirements: Database Deployment_
  
  - [ ] 41.3 Perform initial search index
    - Run full product indexing script
    - Verify all products indexed correctly
    - Test search functionality in production
    - _Requirements: Search Deployment_
  
  - [ ] 41.4 Configure Shopify webhooks
    - Register webhook URLs in Shopify admin
    - Test webhook delivery to production
    - Verify webhook signature verification works
    - _Requirements: Webhook Configuration_
  
  - [ ] 41.5 Deploy to production
    - Merge to main branch to trigger deployment
    - Monitor deployment logs
    - Verify build completes successfully
    - _Requirements: 42.1, 42.5_
  
  - [ ] 41.6 Configure custom domain
    - Add custom domain in Vercel
    - Configure DNS settings
    - Verify SSL certificate
    - _Requirements: 42.6_
  
  - [ ] 41.7 Post-deployment verification
    - Test Shopify integration in production
    - Verify checkout flow works
    - Test both EN and FR locales
    - Verify mobile responsiveness
    - Check CMS functionality
    - Test slot capacity management
    - Monitor error logs
    - Check analytics tracking
    - Verify search functionality
    - Test SEO tags
    - _Requirements: Deployment Checklist_

- [ ] 42. Final checkpoint - Launch complete
  - Ensure all tests pass, verify production deployment successful, confirm all features functional, monitor for issues, prepare rollback plan if needed, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Phase 1 is prioritized for immediate execution as requested by the user
- The implementation uses TypeScript with Next.js 14+ and App Router
- All code should follow Next.js best practices and use Server Components where appropriate
- Tailwind CSS is used for all styling, maintaining consistency with the existing Pencilz design system

