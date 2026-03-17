# Requirements Document

## Introduction

This specification defines the transformation of the Janine CMS data model from an "offerings-first" to a "launch-first" approach. The current model is structured around individual offerings (Ingredient → Flavour → Format → Offering), which creates complexity when managing real-world product launches that involve multiple flavours and serving formats. The new model introduces Launch as a first-class editorial object and simplifies the relationship between ingredients, flavours, formats, modifiers, and product products.

## Glossary

- **CMS**: Content Management System - the admin interface at `/admin`
- **Ingredient**: A raw material or source component used to create flavours (e.g., White Peach, Corn, Spruce Tip)
- **Flavour**: A single flavour expression made from ingredients (e.g., Grilled Corn, Vanilla, Strawberry Thyme). Flavour type automatically determines format eligibility.
- **Format**: A serving or packaging pattern that defines rules for how flavours can be served (e.g., Cup, Cone, Pint, Twist, Sandwich)
- **Modifier**: An optional add-on or enhancement (e.g., toppings, sauces, crumbles, waffle cone dip)
- **Product**: A purchasable product combining format, flavours, and optional modifiers with pricing. Also called Product or Menu Item. This is the only object that syncs with Shopify.
- **Launch**: A top-level editorial object grouping related flavours and products into a public story (e.g., Corn + Tomato Launch, Peach Week). Ingredients are included through their flavour relationships.
- **Offering**: Legacy term for the current overloaded product concept (to be replaced by Product)
- **FlavourIngredient**: A join object linking Flavour to Ingredient with role and usage information
- **Admin_User**: A user with CMS access who manages content
- **Data_Migration_Tool**: The system component that transforms existing data to the new model
- **API_Layer**: The Next.js API routes that handle data operations

## Requirements

### Requirement 0: CMS-Managed Taxonomies

**User Story:** As an Admin_User, I want to manage category and type lists in Settings, so that I can customize taxonomies without code changes and add new options on-the-fly during content creation.

#### Acceptance Criteria

1. THE Settings SHALL include a Taxonomies section for managing all category and type lists
2. THE Taxonomies section SHALL allow managing: Ingredient Categories, Ingredient Roles, Flavour Types, Format Categories, Modifier Types, Allergens, Dietary Flags, Seasons, and Content Block Types
3. WHEN creating or editing content, THE CMS SHALL display taxonomy options from Settings
4. WHEN creating or editing content, THE CMS SHALL provide an "Add New" option in taxonomy dropdowns
5. WHEN "Add New" is selected, THE CMS SHALL display an inline form to add the new taxonomy value
6. WHEN a new taxonomy value is added inline, THE system SHALL save it to Settings and immediately make it available in the current form
7. THE Taxonomies section SHALL allow reordering taxonomy values for display order
8. THE Taxonomies section SHALL allow marking taxonomy values as archived (hidden from new content but preserved in existing content)
9. THE system SHALL validate that taxonomy values are unique within their category
10. THE system SHALL prevent deletion of taxonomy values that are in use by existing content
11. THE API_Layer SHALL provide GET /api/settings/taxonomies endpoint returning all taxonomies
12. THE API_Layer SHALL provide PUT /api/settings/taxonomies/[category] endpoint for updating taxonomy values
13. THE API_Layer SHALL provide POST /api/settings/taxonomies/[category] endpoint for adding new values
14. THE API_Layer SHALL provide DELETE /api/settings/taxonomies/[category]/[id] endpoint with usage validation
15. THE system SHALL store taxonomies in settings.json (dev) or Vercel KV settings:taxonomies (production)
16. THE system SHALL load format eligibility rules from settings instead of hardcoded constants
17. THE CMS SHALL use reusable TaxonomySelect component for all taxonomy dropdowns
18. THE TaxonomySelect component SHALL support inline creation with "Add New" option
19. THE TaxonomySelect component SHALL filter out archived values by default
20. THE TaxonomySelect component SHALL follow existing selector component patterns (BaseStyleSelector, FlavourIngredientSelector)

### Requirement 1: Core Data Model Objects

**User Story:** As an Admin_User, I want six distinct core objects in the CMS, so that I can manage content with clear separation of concerns.

#### Acceptance Criteria

1. THE CMS SHALL provide an Ingredient object with fields: id, name, latinName, category, roles, descriptors, origin, allergens, dietaryFlags, seasonal, image, description, createdAt, updatedAt
2. THE CMS SHALL provide a Flavour object with fields: id, name, slug, type, baseStyle, description, shortDescription, story, tastingNotes, ingredients (FlavourIngredient array), keyNotes, allergens (auto-calculated), dietaryTags (auto-calculated), colour, image, season, status, sortOrder, featured, createdAt, updatedAt
3. THE CMS SHALL provide a Format object with fields: id, name, slug, category, description, requiresFlavours, minFlavours, maxFlavours, allowMixedTypes, canIncludeAddOns, defaultSizes, servingStyle, menuSection, image, icon, createdAt, updatedAt
4. THE CMS SHALL provide a Modifier object with fields: id, name, slug, type (topping, sauce, crunch, drizzle, premium-addon, pack-in), description, image, price (in cents), allergens, dietaryFlags, availableForFormatIds, status, sortOrder, createdAt, updatedAt
5. THE CMS SHALL provide a Product object with fields: id, internalName, publicName, slug, status, formatId, primaryFlavourIds, secondaryFlavourIds, componentIds, toppingIds, description, shortCardCopy, image, price, compareAtPrice, availabilityStart, availabilityEnd, location, tags, shopifyProductId, shopifyProductHandle, shopifySKU, posMapping, syncStatus, lastSyncedAt, syncError, inventoryTracked, inventoryQuantity, batchCode, restockDate, shelfLifeNotes, onlineOrderable, pickupOnly, createdAt, updatedAt
6. THE CMS SHALL provide a Launch object with fields: id, title, slug, status, heroImage, story, description, activeStart, activeEnd, featuredFlavourIds, featuredProductIds, contentBlocks, relatedEventIds, relatedMembershipDropIds, sortOrder, featured, createdAt, updatedAt

### Requirement 2: Automatic Format Eligibility Based on Flavour Type

**User Story:** As an Admin_User, I want flavours to be automatically eligible for formats based on their type, so that I cannot create invalid product combinations.

#### Acceptance Criteria

1. THE CMS SHALL support flavour types: gelato, sorbet, soft-serve-base, topping, cookie, sauce
2. WHEN a Flavour has type gelato, THE system SHALL automatically make it eligible for scoop formats, pint formats, twist formats (with gelato or sorbet), and sandwich filling formats
3. WHEN a Flavour has type sorbet, THE system SHALL automatically make it eligible for scoop formats, pint formats, and twist formats (with gelato or sorbet)
4. WHEN a Flavour has type soft-serve-base, THE system SHALL automatically make it eligible for soft serve formats only
5. WHEN a Flavour has type cookie, THE system SHALL automatically make it eligible as a component for sandwich formats
6. WHEN a Flavour has type topping or sauce, THE system SHALL automatically make it eligible as a modifier for formats that allow add-ons
7. WHEN creating a Product, THE CMS SHALL only display flavours that are eligible for the selected format based on their type

### Requirement 3: Format Rule Definition and Validation

**User Story:** As an Admin_User, I want to define format rules, so that the system can validate valid product combinations based on flavour type compatibility.

#### Acceptance Criteria

1. THE Format SHALL specify minimum flavour count and maximum flavour count
2. THE Format SHALL specify whether modifiers are allowed and which modifier types
3. THE Format SHALL specify whether the format is take-home, in-store only, or both
4. WHEN creating a Product, THE CMS SHALL validate that selected flavours are type-compatible with the format
5. WHEN creating a Product with a twist format, THE CMS SHALL validate that both flavours are either gelato or sorbet type
6. WHEN creating a Product with a sandwich format, THE CMS SHALL validate that the filling is gelato or sorbet type and components are cookie type

### Requirement 4: Modifier Management

**User Story:** As an Admin_User, I want to manage modifiers separately from flavours, so that I can handle toppings, sauces, and add-ons consistently.

#### Acceptance Criteria

1. THE CMS SHALL support modifier types: topping, sauce, crunch, drizzle, premium add-on, and pack-in
2. THE Modifier SHALL store pricing information independent of flavour pricing
3. THE CMS SHALL allow modifiers to be associated with multiple formats
4. WHEN a Format disallows modifiers, THE CMS SHALL prevent modifiers from being added to Products using that format

### Requirement 5: Product Product Creation with Modifiers

**User Story:** As an Admin_User, I want to create product products by combining formats, flavours, and modifiers similar to the current Offering structure, so that I can define purchasable items with proper composition.

#### Acceptance Criteria

1. WHEN creating a Product, THE Admin_User SHALL select one format
2. WHEN creating a Product, THE Admin_User SHALL select primary flavours within the format's minimum and maximum count
3. WHEN creating a Product with a twist format, THE Admin_User SHALL optionally select secondary flavours
4. WHEN creating a Product with a sandwich format, THE Admin_User SHALL select component flavours (cookies) separately from filling flavours
5. WHEN creating a Product, THE Admin_User SHALL optionally select toppings (modifiers) if the format allows them
6. THE Product SHALL store pricing information separate from component pricing
7. THE CMS SHALL generate a descriptive public name for the Product based on its components

### Requirement 6: Launch as Editorial Object

**User Story:** As an Admin_User, I want to create launches as first-class editorial objects that reference flavours and products, so that I can group related products into public stories without managing ingredients separately.

#### Acceptance Criteria

1. THE Launch SHALL reference multiple featured flavours via featuredFlavourIds
2. THE Launch SHALL reference multiple featured products via featuredProductIds
3. THE Launch SHALL NOT directly reference ingredients because ingredients are accessible through flavour relationships
4. THE Launch SHALL include active date range (activeStart, activeEnd) for display scheduling
5. THE Launch SHALL support content blocks for main site presentation
6. THE Launch SHALL optionally reference related events, tastings, or membership drops via relatedEventIds and relatedMembershipDropIds

### Requirement 7: Ice Cream Sandwich Handling

**User Story:** As an Admin_User, I want to define ice cream sandwiches as a format with specific rules, so that I can create sandwich products with proper validation.

#### Acceptance Criteria

1. THE CMS SHALL provide an Ice Cream Sandwich format
2. THE Ice Cream Sandwich format SHALL require exactly one filling flavour
3. THE Ice Cream Sandwich format SHALL require exactly two cookie components
4. THE Ice Cream Sandwich format SHALL specify packaging type as handheld
5. WHEN creating a sandwich Product, THE CMS SHALL validate that exactly one filling flavour and two cookie components are selected

### Requirement 8: Admin Navigation Restructure

**User Story:** As an Admin_User, I want the CMS navigation to reflect the launch-first model, so that I can access content in a logical order.

#### Acceptance Criteria

1. THE CMS navigation SHALL display sections in this order: Launches, Menu Items, Flavours, Ingredients, Formats, Modifiers, Batches
2. THE CMS SHALL rename the Offerings section to Menu Items
3. THE CMS SHALL add a new Launches section as the first navigation item
4. THE CMS SHALL add a new Modifiers section after Formats

### Requirement 9: Data Migration from Legacy Model

**User Story:** As an Admin_User, I want existing offerings to be migrated to the new model without data loss, so that all historical content is preserved and accessible.

#### Acceptance Criteria

1. THE Data_Migration_Tool SHALL preserve all existing data in the original tables during migration
2. WHEN the Data_Migration_Tool runs, THE system SHALL create new Product records from existing Offering records without deleting the originals
3. WHEN the Data_Migration_Tool runs, THE system SHALL preserve all ingredient data including: name, latinName, category, roles, descriptors, origin, allergens, dietaryFlags, seasonal status, images, and descriptions
4. WHEN the Data_Migration_Tool runs, THE system SHALL preserve all flavour data including: name, slug, type, baseStyle, descriptions, story, tasting notes, ingredient relationships, key notes, allergens, dietary tags, colour, images, season, status, sort order, and featured status
5. WHEN the Data_Migration_Tool runs, THE system SHALL preserve all format data including: name, slug, category, description, flavour requirements, configuration settings, serving style, menu section, images, and icons
6. WHEN the Data_Migration_Tool runs, THE system SHALL extract modifiers from existing offering topping references and create new Modifier records
7. WHEN the Data_Migration_Tool runs, THE system SHALL map existing Offering shopifyProductId, shopifyProductHandle, and shopifySKU to the new Product records
8. WHEN the Data_Migration_Tool runs, THE system SHALL preserve all Offering metadata including: pricing, availability dates, tags, inventory tracking, batch codes, and ordering preferences
9. THE Data_Migration_Tool SHALL generate a detailed migration report listing: total records processed, successful conversions, records requiring manual review, and any data that could not be automatically migrated
10. THE Data_Migration_Tool SHALL create a rollback script that can restore the original state if needed
11. THE CMS SHALL maintain backward compatibility by keeping legacy API endpoints functional during a transition period

### Requirement 10: Relationship Integrity

**User Story:** As an Admin_User, I want the system to maintain referential integrity between objects, so that I don't create orphaned or invalid references.

#### Acceptance Criteria

1. WHEN deleting an Ingredient, THE CMS SHALL prevent deletion if the ingredient is referenced by any flavour
2. WHEN deleting a Flavour, THE CMS SHALL prevent deletion if the flavour is referenced by any product or launch
3. WHEN deleting a Format, THE CMS SHALL prevent deletion if the format is referenced by any product
4. WHEN deleting a Modifier, THE CMS SHALL prevent deletion if the modifier is referenced by any product
5. WHEN an Admin_User attempts to delete a referenced object, THE CMS SHALL display a list of dependent objects

### Requirement 11: API Endpoint Updates

**User Story:** As a developer, I want API endpoints for all new objects, so that the frontend can interact with the new data model.

#### Acceptance Criteria

1. THE API_Layer SHALL provide CRUD endpoints for launches at `/api/launches`
2. THE API_Layer SHALL provide CRUD endpoints for formats at `/api/formats`
3. THE API_Layer SHALL provide CRUD endpoints for modifiers at `/api/modifiers`
4. THE API_Layer SHALL provide CRUD endpoints for products at `/api/products`
5. THE API_Layer SHALL update existing ingredient and flavour endpoints to support new relationships
6. WHEN an API request violates format rules, THE API_Layer SHALL return a 400 error with validation details

### Requirement 12: Launch Display on Public Site

**User Story:** As a public visitor, I want to see launches on the main site, so that I can discover new flavour combinations and products.

#### Acceptance Criteria

1. THE public site SHALL display active launches based on the launch date range
2. WHEN viewing a launch, THE public site SHALL display the launch story, hero image, and featured content
3. WHEN viewing a launch, THE public site SHALL display all featured flavours with links to flavour detail pages
4. WHEN viewing a launch, THE public site SHALL display all featured products with links to purchase
5. THE public site SHALL display launches in reverse chronological order on the launches index page

### Requirement 13: Shopify Integration on Products Only

**User Story:** As an Admin_User, I want to map products to Shopify products, so that purchases flow through the existing e-commerce system without managing Shopify links on individual flavours.

#### Acceptance Criteria

1. THE Product SHALL include fields for shopifyProductId, shopifyProductHandle, shopifySKU, and posMapping
2. THE Flavour SHALL NOT include any Shopify-related fields because Shopify integration happens at the Product level
3. WHEN migrating existing data, THE system SHALL move shopifyProductId, shopifyProductHandle, and syncStatus from Flavour records to corresponding Product records
4. WHEN a Flavour has existing Shopify links but no corresponding Product, THE migration tool SHALL create a default Product to preserve the Shopify relationship
5. WHEN a Product has a shopifyProductId, THE CMS SHALL display a link to the Shopify admin
6. THE API_Layer SHALL provide an endpoint to sync product metadata to Shopify products
7. WHEN syncing to Shopify, THE system SHALL update product title, description, and metadata fields
8. THE system SHALL preserve Shopify inventory, pricing, and fulfillment settings during sync
9. THE Product SHALL track syncStatus, lastSyncedAt, and syncError for monitoring integration health
10. THE migration process SHALL maintain a mapping table between old Flavour Shopify IDs and new Product Shopify IDs for reference

### Requirement 14: Format Validation Based on Flavour Type

**User Story:** As an Admin_User, I want the system to enforce format rules based on flavour type automatically, so that I cannot create invalid product combinations.

#### Acceptance Criteria

1. WHEN a Format is for scoops or pints, THE CMS SHALL only allow gelato or sorbet type flavours to be added to products
2. WHEN a Format is for twists, THE CMS SHALL only allow gelato or sorbet type flavours and require exactly two flavours
3. WHEN a Format is for sandwiches, THE CMS SHALL only allow gelato or sorbet type for filling and cookie type for components
4. WHEN a Format is for soft serve, THE CMS SHALL only allow soft-serve-base type flavours
5. WHEN a Format specifies minimum flavours, THE CMS SHALL prevent saving a product with fewer flavours
6. WHEN a Format specifies maximum flavours, THE CMS SHALL prevent adding more flavours than allowed
7. WHEN a Format disallows modifiers, THE CMS SHALL hide the modifier selection interface for that format
8. THE CMS SHALL display format rules and type requirements prominently when creating or editing products

### Requirement 15: Batch Tracking Integration

**User Story:** As a test kitchen user, I want batches to reference flavours in the new model, so that I can track recipe iterations.

#### Acceptance Criteria

1. THE Batch object SHALL reference one or more flavours
2. THE Batch object SHALL maintain existing fields for iteration notes, recipe details, and process photography
3. WHEN viewing a Flavour, THE CMS SHALL display all associated batches in chronological order
4. THE Batch object SHALL remain independent of products and launches

### Requirement 16: Content Layer Organization

**User Story:** As an Admin_User, I want the CMS to organize content into logical layers, so that I can understand the system architecture.

#### Acceptance Criteria

1. THE CMS SHALL group Ingredients, Flavours, Launches, and Stories as content layer objects
2. THE CMS SHALL group Formats, Modifiers, and Availability Rules as configuration layer objects
3. THE CMS SHALL group Products, Shopify Mappings, Store Availability, and Pricing as commerce layer objects
4. THE CMS documentation SHALL explain the purpose and relationships of each layer

### Requirement 17: Twist Format Handling

**User Story:** As an Admin_User, I want to create twist products that combine two flavours, so that I can offer classic soft-serve style combinations.

#### Acceptance Criteria

1. THE CMS SHALL provide a Twist format
2. THE Twist format SHALL require exactly two flavours
3. THE Twist format SHALL allow both gelato and sorbet flavour types
4. WHEN creating a twist Product, THE CMS SHALL validate that exactly two flavours are selected
5. THE Product name generation SHALL format twist products as "Flavour A + Flavour B Twist"

### Requirement 18: Seasonal and Status Management

**User Story:** As an Admin_User, I want to mark flavours and launches with seasonal and status information, so that I can manage availability and archive old products.

#### Acceptance Criteria

1. THE Flavour SHALL include a status field with values: active, archived, in development, seasonal
2. THE Flavour SHALL include a season field with values: spring, summer, fall, winter, year-round
3. THE Launch SHALL include a status field with values: upcoming, active, ended, archived
4. WHEN a Launch end date passes, THE system SHALL automatically update the status to ended
5. THE public site SHALL only display flavours with status active or seasonal when in season

### Requirement 19: Modifier Pricing and Display

**User Story:** As a public visitor, I want to see modifier options and pricing when viewing products, so that I can understand the full cost of customization.

#### Acceptance Criteria

1. WHEN a Product allows modifiers, THE public site SHALL display available modifiers with pricing
2. THE public site SHALL calculate and display total price including selected modifiers
3. WHEN adding a Product to cart, THE system SHALL include selected modifiers in the cart item
4. THE checkout process SHALL display modifier selections and pricing in the order summary

### Requirement 20: Launch Content Blocks

**User Story:** As an Admin_User, I want to add flexible content blocks to launches, so that I can create rich editorial presentations.

#### Acceptance Criteria

1. THE Launch SHALL support multiple content block types: text, image, image gallery, flavour showcase, ingredient spotlight, video embed
2. THE Admin_User SHALL be able to add, remove, and reorder content blocks
3. THE Launch SHALL store content blocks as structured data
4. THE public site SHALL render content blocks in the specified order
5. WHEN a content block references a flavour or ingredient, THE system SHALL maintain referential integrity

### Requirement 21: Backward Compatibility During Transition

**User Story:** As an Admin_User, I want the system to maintain backward compatibility during the transition, so that existing integrations and workflows continue to function.

#### Acceptance Criteria

1. THE API_Layer SHALL maintain existing `/api/offerings` endpoints alongside new `/api/products` endpoints during the transition period
2. WHEN a request is made to legacy endpoints, THE system SHALL map the request to the new data model and return responses in the legacy format
3. THE CMS SHALL display a migration status indicator showing which content has been migrated to the new model
4. THE CMS SHALL allow Admin_Users to edit content using either the legacy or new interface during the transition period
5. THE system SHALL maintain existing URL structures for public-facing pages to prevent broken links
6. WHEN a legacy URL is accessed, THE system SHALL redirect to the new URL structure with a 301 permanent redirect
7. THE system SHALL maintain existing Shopify product mappings without requiring re-linking
8. THE migration process SHALL preserve all existing images, ensuring no broken image links
9. THE system SHALL maintain existing batch tracking relationships when flavours are migrated
10. THE CMS SHALL provide a transition guide documenting changes and migration timeline for Admin_Users

### Requirement 22: Quick-Create Products from Launch

**User Story:** As an Admin_User, I want to quickly create products from a launch's featured flavours, so that I can efficiently build a menu for a new launch without manually creating each product.

#### Acceptance Criteria

1. WHEN viewing a Launch in edit mode, THE CMS SHALL display a "Quick Create Products" button
2. WHEN "Quick Create Products" is clicked, THE CMS SHALL display a modal showing all featured flavours from the launch
3. THE modal SHALL allow selecting one or more featured flavours to create products from
4. THE modal SHALL allow selecting a format for each flavour (or apply same format to all)
5. WHEN a format is selected, THE CMS SHALL validate that the flavour type is compatible with the format
6. THE modal SHALL display a preview of products that will be created (format + flavour combinations)
7. WHEN "Create Products" is confirmed, THE system SHALL create all products using the 3-step offering workflow logic
8. THE system SHALL auto-generate internal names based on format and flavour names
9. THE system SHALL auto-generate public names based on format and flavour names
10. THE system SHALL set all quick-created products to "draft" status by default
11. THE system SHALL automatically add the quick-created products to the launch's featuredProductIds
12. WHEN quick-creation completes, THE CMS SHALL display a success message with links to edit each created product
13. THE CMS SHALL allow bulk-editing common fields (price, status, tags) for all quick-created products
14. THE quick-create workflow SHALL follow the same validation rules as the standard 3-step product creation
15. THE quick-create workflow SHALL preserve the user experience of the current offerings creation (format selection → flavour selection → details)
