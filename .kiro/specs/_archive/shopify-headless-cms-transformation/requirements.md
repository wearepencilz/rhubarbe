# Requirements Document

## Introduction

This document specifies the requirements for transforming the existing Pencilz React portfolio/CMS application into a bilingual (EN/FR) headless Shopify storefront built on Next.js. The system will support standard e-commerce, pre-order products, and advanced ice cream scheduling with delivery/pickup slot selection. The custom CMS serves as the source of truth for marketing and editorial content, while Shopify manages products and inventory. The system uses Shopify-hosted checkout, open-source search (Meilisearch or Typesense), and will be deployed to Vercel.

## Glossary

- **Storefront_API**: Shopify's GraphQL API for building custom storefronts
- **CMS_Module**: The custom content management system for marketing and editorial content
- **Next_Application**: The Next.js frontend application serving the headless storefront
- **Product_Catalog**: Collection of products managed through Shopify
- **Cart_System**: Shopping cart functionality for managing customer selections
- **Checkout_Flow**: Process for redirecting to Shopify-hosted checkout
- **Preorder_System**: System component handling pre-order product logic and display
- **Scheduling_System**: System component handling ice cream delivery/pickup slot selection
- **Search_Engine**: Open-source search service (Meilisearch or Typesense)
- **Search_Indexer**: Component that indexes product data for search
- **Locale_Manager**: Component managing bilingual EN/FR routing and content
- **Slot_Validator**: Component validating delivery/pickup slot availability and capacity
- **Capacity_Manager**: Component tracking and enforcing slot capacity limits
- **Authentication_Service**: System for verifying CMS administrator access
- **Content_Publisher**: Component managing draft/publish states and scheduled publishing

## Requirements

### Requirement 1: Next.js Boilerplate Selection and Setup

**User Story:** As a developer, I want to start with an existing open-source Next.js Shopify boilerplate, so that I can accelerate development with proven patterns.

#### Acceptance Criteria

1. THE Next_Application SHALL be based on an open-source Next.js Shopify boilerplate
2. THE Next_Application SHALL support React Server Components and App Router
3. THE Next_Application SHALL include Shopify Storefront API integration
4. THE Next_Application SHALL include Tailwind CSS configuration
5. THE Next_Application SHALL support environment-based configuration for Shopify credentials

### Requirement 2: Bilingual Routing Structure

**User Story:** As a customer, I want to browse the store in English or French, so that I can shop in my preferred language.

#### Acceptance Criteria

1. THE Locale_Manager SHALL implement URL structure with /en/ and /fr/ prefixes
2. WHEN a customer visits the root URL, THE Locale_Manager SHALL redirect to the default locale
3. THE Locale_Manager SHALL provide a language switcher component on all pages
4. WHEN a customer switches language, THE Locale_Manager SHALL navigate to the equivalent page in the new locale
5. WHEN a customer switches language, THE Cart_System SHALL preserve cart state across locales
6. THE Locale_Manager SHALL set the HTML lang attribute to match the current locale

### Requirement 3: Shopify Storefront API Integration

**User Story:** As a developer, I want to integrate Shopify Storefront API, so that the application can fetch products, collections, and manage cart operations.

#### Acceptance Criteria

1. THE Storefront_API SHALL authenticate using a storefront access token from environment variables
2. WHEN products are requested, THE Storefront_API SHALL fetch product data via GraphQL queries
3. WHEN collections are requested, THE Storefront_API SHALL fetch collection data via GraphQL queries
4. THE Storefront_API SHALL fetch product metafields including is_preorder, preorder_ship_date, and preorder_disclaimer fields
5. THE Storefront_API SHALL handle API errors and return descriptive error messages in the current locale
6. THE Storefront_API SHALL implement rate limiting to comply with Shopify API limits

### Requirement 4: Home Page Display

**User Story:** As a customer, I want to see an engaging home page with featured content, so that I can discover products and promotions.

#### Acceptance Criteria

1. WHEN the home page loads, THE Next_Application SHALL display a hero section with CMS-managed content
2. THE Next_Application SHALL display featured collections from CMS configuration
3. THE Next_Application SHALL display feature tiles with CMS-managed images and text
4. THE Next_Application SHALL display a promotional banner when configured in CMS
5. THE Next_Application SHALL render all home page content in the current locale

### Requirement 5: Collection Listing Page (PLP)

**User Story:** As a customer, I want to browse products in a collection with filtering and sorting, so that I can find products that match my needs.

#### Acceptance Criteria

1. WHEN a collection page loads, THE Product_Catalog SHALL fetch all products in the collection
2. THE Product_Catalog SHALL display collection landing content from CMS when configured
3. THE Product_Catalog SHALL display product cards with image, title, price, and availability badge
4. THE Product_Catalog SHALL provide sorting options: Featured, Price Low-High, Price High-Low, Newest
5. THE Product_Catalog SHALL provide an availability filter with options: In Stock, Pre-order, Sold Out
6. WHERE size variants exist, THE Product_Catalog SHALL provide an optional size filter
7. WHEN no products match the current filters, THE Product_Catalog SHALL display an empty state message
8. THE Product_Catalog SHALL display all product information in the current locale

### Requirement 6: Product Detail Page (PDP)

**User Story:** As a customer, I want to view detailed product information and select variants, so that I can make informed purchase decisions.

#### Acceptance Criteria

1. WHEN a product page loads, THE Product_Catalog SHALL display product title, description, price, and images
2. WHERE product variants exist, THE Product_Catalog SHALL require variant selection before adding to cart
3. THE Product_Catalog SHALL display availability state: In Stock, Pre-order, or Sold Out
4. WHEN a product is a pre-order, THE Product_Catalog SHALL display a "Pre-order" badge
5. WHEN a product is a pre-order, THE Product_Catalog SHALL display the fulfilment expectation date
6. WHEN a product is a pre-order, THE Product_Catalog SHALL display the disclaimer text in the current locale
7. WHEN a product is sold out, THE Product_Catalog SHALL disable the add-to-cart button
8. THE Product_Catalog SHALL display all product content in the current locale

### Requirement 7: Pre-order Product Configuration

**User Story:** As an administrator, I want to configure products as pre-orders with fulfilment dates, so that customers understand when they will receive items.

#### Acceptance Criteria

1. THE Preorder_System SHALL read the is_preorder boolean metafield from Shopify products
2. THE Preorder_System SHALL read the preorder_ship_date metafield from Shopify products
3. THE Preorder_System SHALL read the preorder_disclaimer_en metafield from Shopify products
4. THE Preorder_System SHALL read the preorder_disclaimer_fr metafield from Shopify products
5. WHEN is_preorder is true, THE Preorder_System SHALL classify the product as a pre-order product

### Requirement 8: Shopping Cart with Pre-order Support

**User Story:** As a customer, I want to add products to my cart and see clear pre-order information, so that I understand when items will ship.

#### Acceptance Criteria

1. WHEN a customer adds a product, THE Cart_System SHALL create or update a cart with the selected item and variant
2. THE Cart_System SHALL persist cart data across browser sessions
3. THE Cart_System SHALL persist cart data across locale switches
4. THE Cart_System SHALL display each line item with image, title, variant, price, and quantity
5. WHEN a line item is a pre-order, THE Cart_System SHALL display a "Pre-order" label
6. WHEN a line item is a pre-order, THE Cart_System SHALL display the fulfilment expectation date
7. WHEN the cart contains both regular and pre-order items, THE Cart_System SHALL display "Items may ship separately" message
8. THE Cart_System SHALL allow customers to update product quantities
9. THE Cart_System SHALL allow customers to remove items from the cart
10. THE Cart_System SHALL display the cart item count in the navigation header
11. THE Cart_System SHALL calculate and display the total price
12. THE Cart_System SHALL display all cart content in the current locale

### Requirement 9: Ice Cream Product Identification

**User Story:** As a developer, I want to identify ice cream products that require scheduling, so that the system can enforce slot selection rules.

#### Acceptance Criteria

1. THE Scheduling_System SHALL read a product metafield or tag to identify ice cream products
2. WHEN a product is identified as ice cream, THE Scheduling_System SHALL classify it as requiring slot selection
3. THE Scheduling_System SHALL distinguish ice cream products from regular and pre-order products

### Requirement 10: Ice Cream Fulfilment Method Selection

**User Story:** As a customer, I want to choose between pickup and delivery for ice cream orders, so that I can receive my order in my preferred way.

#### Acceptance Criteria

1. WHEN a customer adds an ice cream product to cart, THE Scheduling_System SHALL prompt for fulfilment method selection
2. THE Scheduling_System SHALL provide fulfilment method options: Pickup or Delivery
3. WHERE multiple pickup locations exist, THE Scheduling_System SHALL prompt for location selection
4. WHERE delivery is selected, THE Scheduling_System SHALL prompt for delivery address
5. THE Scheduling_System SHALL store the selected fulfilment method with the cart line item

### Requirement 11: Ice Cream Slot Selection

**User Story:** As a customer, I want to select a delivery or pickup date and time window for ice cream, so that I can plan to receive my order.

#### Acceptance Criteria

1. WHEN fulfilment method is selected, THE Scheduling_System SHALL display available date options
2. THE Scheduling_System SHALL exclude dates that violate lead time rules
3. THE Scheduling_System SHALL exclude closed days from available dates
4. WHEN a date is selected, THE Scheduling_System SHALL display available time window options
5. THE Scheduling_System SHALL display time windows with remaining capacity indicators
6. WHEN a time window is at capacity, THE Scheduling_System SHALL disable that option
7. WHEN a slot is selected, THE Scheduling_System SHALL store the slot with the cart line item
8. THE Scheduling_System SHALL display the selected slot in the cart view
9. THE Scheduling_System SHALL display all slot information in the current locale

### Requirement 12: Slot Capacity Management

**User Story:** As a store owner, I want to limit the number of orders per time slot, so that I can manage fulfilment operations effectively.

#### Acceptance Criteria

1. THE Capacity_Manager SHALL track the number of orders assigned to each slot
2. WHEN a slot reaches capacity, THE Capacity_Manager SHALL mark it as unavailable
3. THE Capacity_Manager SHALL update slot availability in real-time as orders are placed
4. WHEN a customer selects a slot, THE Slot_Validator SHALL verify the slot has remaining capacity
5. IF a slot is at capacity, THEN THE Slot_Validator SHALL prevent slot selection and display an error message

### Requirement 13: Slot Lead Time Enforcement

**User Story:** As a store owner, I want to require advance notice for ice cream orders, so that I have time to prepare orders.

#### Acceptance Criteria

1. THE Slot_Validator SHALL read lead time configuration from system settings
2. THE Slot_Validator SHALL calculate the earliest available slot based on current time plus lead time
3. THE Scheduling_System SHALL exclude slots that violate the lead time requirement
4. WHEN a customer attempts to select a slot within the lead time window, THE Slot_Validator SHALL prevent selection and display an error message

### Requirement 14: Slot Persistence and Validation

**User Story:** As a customer, I want my selected slot to remain valid throughout my shopping session, so that I can complete my purchase with confidence.

#### Acceptance Criteria

1. THE Cart_System SHALL persist the selected slot across browser sessions
2. THE Cart_System SHALL persist the selected slot across locale switches
3. WHEN the cart page loads, THE Slot_Validator SHALL verify the selected slot is still available
4. IF the selected slot is no longer available, THEN THE Slot_Validator SHALL display a warning and prompt for new slot selection
5. WHEN checkout is initiated, THE Slot_Validator SHALL perform a final slot availability check
6. IF the slot is unavailable at checkout, THEN THE Slot_Validator SHALL prevent checkout and display an error message

### Requirement 15: Ice Cream Order Metadata

**User Story:** As a store owner, I want slot information included in order details, so that I can fulfill orders at the correct time.

#### Acceptance Criteria

1. WHEN checkout is initiated, THE Cart_System SHALL include slot information in Shopify cart attributes
2. THE Cart_System SHALL include fulfilment method in order metadata
3. THE Cart_System SHALL include selected date in order metadata
4. THE Cart_System SHALL include selected time window in order metadata
5. THE Cart_System SHALL include location information in order metadata
6. WHEN an order is placed, THE Scheduling_System SHALL display slot information in the order confirmation
7. WHEN an administrator views an order, THE Scheduling_System SHALL display slot information in order details

### Requirement 16: Shopify Checkout Integration

**User Story:** As a customer, I want to complete purchases securely through Shopify checkout, so that I can receive my ordered products.

#### Acceptance Criteria

1. WHEN a customer initiates checkout, THE Checkout_Flow SHALL generate a Shopify checkout URL
2. THE Checkout_Flow SHALL include the current locale in the checkout URL
3. THE Checkout_Flow SHALL include all cart items and quantities in the checkout URL
4. THE Checkout_Flow SHALL include cart attributes and metadata in the checkout URL
5. THE Checkout_Flow SHALL redirect customers to the Shopify-hosted checkout page
6. WHEN checkout is completed, THE Checkout_Flow SHALL clear the customer's cart
7. WHEN a customer returns from checkout, THE Checkout_Flow SHALL display an order confirmation page

### Requirement 17: Cart Validation Rules

**User Story:** As a customer, I want to understand cart requirements before checkout, so that I can complete my purchase successfully.

#### Acceptance Criteria

1. WHEN the cart contains an ice cream product, THE Slot_Validator SHALL verify a slot is selected
2. IF an ice cream product has no slot, THEN THE Cart_System SHALL prevent checkout and display an error message
3. WHEN checkout is initiated, THE Slot_Validator SHALL verify all slots are still valid
4. THE Cart_System SHALL display validation errors in the current locale

### Requirement 18: Search Engine Setup

**User Story:** As a developer, I want to set up an open-source search engine, so that customers can search for products efficiently.

#### Acceptance Criteria

1. THE Search_Engine SHALL be either Meilisearch or Typesense
2. THE Search_Engine SHALL be self-hosted and configured via environment variables
3. THE Search_Indexer SHALL create a product index with fields: title, handle, product_type, tags, availability, locale
4. WHERE products have size variants, THE Search_Indexer SHALL include size information in the index
5. THE Search_Indexer SHALL create separate index entries for EN and FR product content

### Requirement 19: Search Index Updates

**User Story:** As a store owner, I want product search results to stay current, so that customers find accurate information.

#### Acceptance Criteria

1. THE Search_Indexer SHALL perform a full reindex nightly
2. WHEN a product is created in Shopify, THE Search_Indexer SHALL add it to the search index
3. WHEN a product is updated in Shopify, THE Search_Indexer SHALL update the search index
4. WHEN a product is deleted in Shopify, THE Search_Indexer SHALL remove it from the search index
5. THE Search_Indexer SHALL use Shopify webhooks to trigger partial index updates

### Requirement 20: Search User Interface

**User Story:** As a customer, I want to search for products by name or attributes, so that I can quickly find what I'm looking for.

#### Acceptance Criteria

1. THE Next_Application SHALL display a search input in the site header on all pages
2. WHEN a customer types in the search input, THE Search_Engine SHALL provide autocomplete suggestions
3. THE Search_Engine SHALL return suggestions in the current locale
4. WHEN a customer submits a search query, THE Next_Application SHALL navigate to a search results page
5. THE Search_Engine SHALL search across product titles, handles, product types, and tags
6. THE Search_Engine SHALL return results matching the current locale
7. THE Next_Application SHALL display search results with product cards showing image, title, price, and availability
8. THE Next_Application SHALL provide sort options: Relevance and Availability
9. THE Next_Application SHALL provide an availability filter on search results
10. WHEN no results match the query, THE Next_Application SHALL display a "no results" message with suggested actions
11. THE Next_Application SHALL display all search UI in the current locale

### Requirement 21: Search Performance

**User Story:** As a customer, I want search results to appear quickly, so that I can find products without delays.

#### Acceptance Criteria

1. WHEN a search query is submitted, THE Search_Engine SHALL return results within 200ms
2. WHEN autocomplete is triggered, THE Search_Engine SHALL return suggestions within 100ms
3. THE Search_Engine SHALL implement query caching to improve response times
4. THE Next_Application SHALL display a loading indicator during search operations

### Requirement 22: CMS Content Model - Global Settings

**User Story:** As an administrator, I want to manage global site settings, so that I can control header navigation, footer content, promotional banners, and SEO defaults.

#### Acceptance Criteria

1. THE CMS_Module SHALL provide an interface for managing header navigation links
2. THE CMS_Module SHALL provide an interface for managing footer content sections
3. THE CMS_Module SHALL provide an interface for managing promotional banner content
4. THE CMS_Module SHALL provide an interface for managing default SEO metadata
5. THE CMS_Module SHALL store global settings in both EN and FR
6. WHEN global settings are updated, THE CMS_Module SHALL publish changes immediately

### Requirement 23: CMS Content Model - Home Page

**User Story:** As an administrator, I want to manage home page content, so that I can control the hero section, featured collections, and feature tiles.

#### Acceptance Criteria

1. THE CMS_Module SHALL provide an interface for managing hero section content
2. THE CMS_Module SHALL provide an interface for selecting featured collections
3. THE CMS_Module SHALL provide an interface for managing feature tiles with images and text
4. THE CMS_Module SHALL store home page content in both EN and FR
5. THE CMS_Module SHALL allow administrators to reorder featured collections and feature tiles

### Requirement 24: CMS Content Model - Collection Landing Content

**User Story:** As an administrator, I want to add editorial content to collection pages, so that I can provide context and storytelling for product collections.

#### Acceptance Criteria

1. THE CMS_Module SHALL provide an interface for managing collection landing content
2. THE CMS_Module SHALL associate landing content with specific Shopify collections
3. THE CMS_Module SHALL support rich text content with images
4. THE CMS_Module SHALL store collection landing content in both EN and FR
5. WHEN a collection page loads, THE Product_Catalog SHALL display CMS landing content above product listings

### Requirement 25: CMS Content Model - Static Pages

**User Story:** As an administrator, I want to create and manage static pages, so that I can provide informational content like About, FAQ, and Contact pages.

#### Acceptance Criteria

1. THE CMS_Module SHALL provide an interface for creating new static pages
2. THE CMS_Module SHALL provide a rich text editor for page content
3. THE CMS_Module SHALL provide fields for page title, slug, and SEO metadata
4. THE CMS_Module SHALL store static page content in both EN and FR
5. WHEN a static page URL is accessed, THE Next_Application SHALL render the CMS page content

### Requirement 26: CMS Draft and Publish Workflow

**User Story:** As an administrator, I want to save drafts and publish content separately, so that I can prepare content without making it live immediately.

#### Acceptance Criteria

1. THE Content_Publisher SHALL maintain separate draft and published versions of content
2. THE CMS_Module SHALL provide a "Save Draft" action that updates draft content
3. THE CMS_Module SHALL provide a "Publish" action that copies draft content to published
4. THE Next_Application SHALL display only published content to customers
5. THE CMS_Module SHALL display draft content in preview mode for administrators

### Requirement 27: CMS Preview Functionality

**User Story:** As an administrator, I want to preview content before publishing, so that I can verify it appears correctly.

#### Acceptance Criteria

1. THE CMS_Module SHALL provide a "Preview" action for draft content
2. WHEN preview is activated, THE Next_Application SHALL render draft content in a preview mode
3. THE Next_Application SHALL display a preview indicator when in preview mode
4. THE Next_Application SHALL require authentication to access preview mode
5. THE Next_Application SHALL render preview content in both EN and FR locales

### Requirement 28: CMS Asset Management

**User Story:** As an administrator, I want to upload and manage images, so that I can use them in content throughout the site.

#### Acceptance Criteria

1. THE CMS_Module SHALL provide an interface for uploading images
2. THE CMS_Module SHALL store uploaded images in a cloud storage service
3. THE CMS_Module SHALL provide an asset library for browsing uploaded images
4. THE CMS_Module SHALL allow administrators to select images from the asset library when editing content
5. THE CMS_Module SHALL generate optimized image URLs for different screen sizes

### Requirement 29: CMS Authentication

**User Story:** As an administrator, I want to securely log into the CMS, so that I can manage store content.

#### Acceptance Criteria

1. THE Authentication_Service SHALL verify administrator credentials before granting CMS access
2. THE Authentication_Service SHALL maintain session state for authenticated administrators
3. WHEN authentication fails, THE Authentication_Service SHALL display an error message in the current locale
4. THE Authentication_Service SHALL protect all CMS routes from unauthorized access
5. THE Authentication_Service SHALL allow administrators to log out and clear session data

### Requirement 30: Localization - Content Translation

**User Story:** As a customer, I want all content displayed in my selected language, so that I can understand product information and site content.

#### Acceptance Criteria

1. THE Locale_Manager SHALL display all customer-facing strings in the current locale
2. THE Locale_Manager SHALL translate error messages to the current locale
3. THE Locale_Manager SHALL translate empty state messages to the current locale
4. THE Locale_Manager SHALL translate form labels and validation messages to the current locale
5. THE Locale_Manager SHALL translate button text and calls-to-action to the current locale
6. THE Locale_Manager SHALL format dates according to locale conventions
7. THE Locale_Manager SHALL format currency according to locale conventions

### Requirement 31: Localization - Product Content

**User Story:** As an administrator, I want to provide product information in both English and French, so that customers can read product details in their preferred language.

#### Acceptance Criteria

1. THE Product_Catalog SHALL fetch product titles in the current locale from Shopify
2. THE Product_Catalog SHALL fetch product descriptions in the current locale from Shopify
3. WHERE Shopify does not provide localized content, THE Product_Catalog SHALL fetch translations from CMS
4. THE Product_Catalog SHALL display variant option names in the current locale
5. THE Product_Catalog SHALL display product metafields in the current locale

### Requirement 32: Analytics - E-commerce Event Tracking

**User Story:** As a store owner, I want to track customer behavior and conversions, so that I can optimize the shopping experience.

#### Acceptance Criteria

1. THE Next_Application SHALL track view_item events when a product page loads
2. THE Next_Application SHALL track view_item_list events when a collection page loads
3. THE Next_Application SHALL track search events when a customer performs a search
4. THE Next_Application SHALL track add_to_cart events when a customer adds a product
5. THE Next_Application SHALL track view_cart events when the cart page loads
6. THE Next_Application SHALL track begin_checkout events when checkout is initiated
7. THE Next_Application SHALL track purchase events when an order is completed
8. THE Next_Application SHALL include locale as a dimension in all analytics events

### Requirement 33: Analytics - Custom Event Tracking

**User Story:** As a store owner, I want to track pre-order and ice cream scheduling behavior, so that I can understand customer preferences and optimize these features.

#### Acceptance Criteria

1. THE Next_Application SHALL track preorder_viewed events when a pre-order product page loads
2. THE Next_Application SHALL track preorder_added events when a pre-order product is added to cart
3. THE Next_Application SHALL track slot_selected events when a customer selects an ice cream slot
4. THE Next_Application SHALL track slot_invalidated events when a selected slot becomes unavailable
5. THE Next_Application SHALL include product information and slot details in custom events

### Requirement 34: Static Page Rendering

**User Story:** As a customer, I want to access informational pages like About and FAQ, so that I can learn more about the store.

#### Acceptance Criteria

1. WHEN a static page URL is accessed, THE Next_Application SHALL fetch page content from CMS
2. THE Next_Application SHALL render page content with proper HTML structure
3. THE Next_Application SHALL display page title and SEO metadata
4. THE Next_Application SHALL render page content in the current locale
5. WHEN a page does not exist, THE Next_Application SHALL display a 404 error page

### Requirement 35: 404 Error Page

**User Story:** As a customer, I want to see a helpful error page when I access an invalid URL, so that I can navigate back to the store.

#### Acceptance Criteria

1. WHEN an invalid URL is accessed, THE Next_Application SHALL display a 404 error page
2. THE Next_Application SHALL display the error message in the current locale
3. THE Next_Application SHALL provide navigation links to return to the home page or search
4. THE Next_Application SHALL maintain the site header and footer on the 404 page

### Requirement 36: Error Handling - API Failures

**User Story:** As a customer, I want to see helpful error messages when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN a Shopify API request fails, THE Storefront_API SHALL display a user-friendly error message in the current locale
2. WHEN network connectivity is lost, THE Next_Application SHALL display a connectivity error message in the current locale
3. WHEN a product fails to load, THE Product_Catalog SHALL display an error state with retry option
4. WHEN search is unavailable, THE Search_Engine SHALL display an error message and suggest browsing collections
5. THE Next_Application SHALL log all errors for debugging purposes

### Requirement 37: Error Handling - Validation Errors

**User Story:** As a customer, I want to understand why my actions failed, so that I can correct issues and complete my purchase.

#### Acceptance Criteria

1. WHEN variant selection is required, THE Product_Catalog SHALL display a validation error in the current locale
2. WHEN a slot is required for ice cream, THE Cart_System SHALL display a validation error in the current locale
3. WHEN a slot becomes invalid, THE Slot_Validator SHALL display a clear error message in the current locale
4. WHEN checkout fails, THE Checkout_Flow SHALL display an error message and suggest retrying
5. THE Next_Application SHALL display validation errors near the relevant form fields

### Requirement 38: Performance - Page Load Optimization

**User Story:** As a customer, I want pages to load quickly, so that I can browse products without delays.

#### Acceptance Criteria

1. THE Next_Application SHALL implement server-side rendering for initial page loads
2. THE Next_Application SHALL implement lazy loading for product images
3. THE Next_Application SHALL implement code splitting for route-based chunks
4. THE Next_Application SHALL prefetch critical resources for faster navigation
5. THE Next_Application SHALL optimize images with Next.js Image component
6. THE Product_Catalog SHALL display loading indicators during data fetching

### Requirement 39: Performance - API Response Caching

**User Story:** As a customer, I want consistent performance when browsing products, so that I can shop efficiently.

#### Acceptance Criteria

1. THE Storefront_API SHALL implement response caching with appropriate cache expiration
2. THE Storefront_API SHALL use stale-while-revalidate caching strategy for product data
3. THE Search_Engine SHALL implement query result caching
4. THE Next_Application SHALL implement client-side caching for frequently accessed data
5. THE Next_Application SHALL invalidate cache when products are updated

### Requirement 40: Responsive Design

**User Story:** As a customer, I want to use the store on any device, so that I can shop from my phone, tablet, or computer.

#### Acceptance Criteria

1. THE Next_Application SHALL render responsive layouts that adapt to screen size
2. THE Product_Catalog SHALL display product grids optimized for mobile, tablet, and desktop
3. THE Cart_System SHALL display a mobile-optimized cart interface on small screens
4. THE Scheduling_System SHALL display a mobile-optimized slot selection interface
5. THE Next_Application SHALL use touch-friendly controls on mobile devices
6. THE CMS_Module SHALL provide a responsive admin interface for mobile devices

### Requirement 41: SEO Optimization

**User Story:** As a store owner, I want the store to be discoverable in search engines, so that customers can find my products through Google.

#### Acceptance Criteria

1. THE Next_Application SHALL generate semantic HTML with proper heading hierarchy
2. THE Next_Application SHALL include meta descriptions for all pages in both locales
3. THE Next_Application SHALL generate Open Graph tags for social media sharing
4. THE Next_Application SHALL implement structured data markup for products
5. THE Next_Application SHALL generate hreflang tags for bilingual content
6. THE Next_Application SHALL generate a sitemap including all localized URLs
7. THE Next_Application SHALL implement canonical URLs to prevent duplicate content issues

### Requirement 42: Vercel Deployment Configuration

**User Story:** As a developer, I want to deploy the application to Vercel, so that it is accessible to customers on the internet.

#### Acceptance Criteria

1. THE Next_Application SHALL build successfully for production deployment
2. THE Next_Application SHALL configure environment variables for Shopify API credentials
3. THE Next_Application SHALL configure environment variables for Search Engine credentials
4. THE Next_Application SHALL configure environment variables for CMS database connection
5. THE Next_Application SHALL enable automatic deployments on Git push
6. THE Next_Application SHALL configure custom domain settings when provided
7. THE Next_Application SHALL enable preview deployments for pull requests



## Priority Levels

### P0 (Must Ship - MVP)

These requirements must be completed before initial launch:

- Requirement 1: Next.js Boilerplate Selection and Setup
- Requirement 2: Bilingual Routing Structure
- Requirement 3: Shopify Storefront API Integration
- Requirement 4: Home Page Display
- Requirement 5: Collection Listing Page (PLP)
- Requirement 6: Product Detail Page (PDP)
- Requirement 8: Shopping Cart with Pre-order Support
- Requirement 9: Ice Cream Product Identification
- Requirement 10: Ice Cream Fulfilment Method Selection
- Requirement 11: Ice Cream Slot Selection
- Requirement 12: Slot Capacity Management
- Requirement 13: Slot Lead Time Enforcement
- Requirement 14: Slot Persistence and Validation
- Requirement 15: Ice Cream Order Metadata
- Requirement 16: Shopify Checkout Integration
- Requirement 17: Cart Validation Rules
- Requirement 18: Search Engine Setup
- Requirement 19: Search Index Updates
- Requirement 20: Search User Interface
- Requirement 22-29: CMS Content Model and Authentication
- Requirement 30-31: Localization
- Requirement 34: Static Page Rendering
- Requirement 35: 404 Error Page
- Requirement 36-37: Error Handling
- Requirement 40: Responsive Design
- Requirement 42: Vercel Deployment Configuration

### P1 (Soon After Launch)

These requirements should be completed shortly after MVP launch:

- Requirement 7: Pre-order Product Configuration (if not in P0)
- Requirement 21: Search Performance
- Requirement 32-33: Analytics Event Tracking
- Requirement 38-39: Performance Optimization
- Requirement 41: SEO Optimization

## Open Questions

The following questions require product decisions before implementation can be finalized. These are flagged for stakeholder review:

### Ice Cream Fulfilment Configuration

**Decision:** Pickup only at a single location.

**Impact:** Simplifies Requirement 10 (Fulfilment Method Selection) - no delivery logic or location selection needed.

### Slot Time Window Granularity

**Question:** What time window granularity should be supported for ice cream slots? Options include 30 minutes, 1 hour, or AM/PM blocks.

**Impact:** Affects Requirement 11 (Slot Selection) and capacity management.

**Considerations:**
- Finer granularity (30 min): More customer choice, more complex capacity management
- Coarser granularity (AM/PM): Simpler implementation, less precise scheduling
- Configurable: Most flexible but requires admin interface for slot configuration

### Capacity Limit Scope

**Decision:** Single location with global capacity per slot.

**Impact:** Simplifies Requirement 12 (Capacity Management) - single capacity counter per slot.

### Mixed Cart Policies

**Decision:** No mixed carts allowed. Ice cream products cannot be mixed with regular or pre-order products.

**Impact:** Affects Requirement 17 (Cart Validation Rules) - must block mixed carts and display clear guidance to customers.

### Lead Time Configuration

**Question:** What is the minimum lead time required for ice cream orders? Should this be configurable per product or global?

**Impact:** Affects Requirement 13 (Lead Time Enforcement).

**Considerations:**
- Fixed lead time (e.g., 24 hours): Simpler implementation
- Configurable per product: More flexible for different ice cream types
- Configurable by admin: Requires admin interface but allows operational flexibility

### Scheduled Publishing

**Question:** Is scheduled publishing (setting future publish dates) required for MVP or can it be deferred to P1?

**Impact:** Affects Requirement 26 (CMS Draft and Publish Workflow).

**Considerations:**
- MVP: Requires date picker and background job scheduling
- P1: Simpler MVP, manual publishing workflow
- Nice to have: Marked as optional in original requirements

### Product Content Source

**Question:** Should product titles and descriptions come from Shopify's native translation fields, or should CMS overlay translations on top of Shopify data?

**Impact:** Affects Requirement 31 (Localization - Product Content).

**Considerations:**
- Shopify native: Simpler integration, single source of truth
- CMS overlay: More control, allows marketing team to customize without Shopify access
- Hybrid: Use Shopify as default, CMS as override
