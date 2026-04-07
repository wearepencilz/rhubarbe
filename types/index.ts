// Core type definitions for Janine CMS

// ============================================================================
// i18n / Translation Types
// ============================================================================

export type Locale = 'en' | 'fr';

/**
 * Translatable content fields for a given record type.
 * The CMS stores English as the base; French translations live here.
 * When syncing to Shopify, both locales are pushed via the Translations API.
 */
export interface ContentTranslations {
  fr?: {
    name?: string;
    title?: string;
    description?: string;
    shortDescription?: string;
    shortCardCopy?: string;
    story?: string;
    tastingNotes?: string;
    // Ingredient-specific
    latinName?: string;
    // Story-specific
    intro?: string;
    // Generic catch-all for any other translatable field
    [key: string]: string | undefined;
  };
}

// ============================================================================
// Ingredient Types
// ============================================================================

export const ingredientCategoryOptions = [
  "Dairy",
  "Egg",
  "Fruit",
  "Vegetable",
  "Herb",
  "Spice",
  "Aromatic",
  "Floral",
  "Nut",
  "Seed",
  "Grain",
  "Sweetener",
  "Salt",
  "Fat",
  "Liquid",
  "Chocolate / Cocoa",
  "Coffee / Tea",
  "Fermented",
  "Savoury",
  "Condiment",
  "Baked Good",
  "Preserve",
  "Sauce",
  "Confection",
  "Alcohol",
  "Botanical",
  "Regional Specialty",
  "Other"
] as const;

export const ingredientRoleOptions = [
  "Base",
  "Primary Flavour",
  "Supporting Flavour",
  "Mix-in",
  "Inclusion",
  "Swirl",
  "Sauce",
  "Topping",
  "Garnish",
  "Coating",
  "Filling",
  "Pairing",
  "Optional Add-on",
  "Combo Component",
  "Retail Component",
  "Other"
] as const;

export const ingredientDescriptorTags = [
  "Local",
  "Imported",
  "Seasonal",
  "Foraged",
  "Fresh",
  "Dried",
  "Roasted",
  "Toasted",
  "Grilled",
  "Browned",
  "Caramelized",
  "Fermented",
  "Infused",
  "Candied",
  "Citrus",
  "Acidic",
  "Floral",
  "Herbal",
  "Earthy",
  "Smoky",
  "Savoury",
  "Sweet",
  "Bitter",
  "Spicy",
  "Crunchy",
  "Creamy"
] as const;

export const ingredientTastingNoteOptions = [
  "Sweet", "Floral", "Acidic", "Bitter", "Salty", "Umami",
  "Fruity", "Citrus", "Herbal", "Earthy", "Smoky", "Spicy",
  "Nutty", "Caramel", "Vanilla", "Chocolate", "Tropical", "Stone Fruit",
  "Berry", "Vegetal", "Fermented", "Creamy", "Fresh", "Bright",
] as const;

export const ingredientTextureOptions = [
  "Creamy", "Icy", "Crunchy", "Silky", "Chewy", "Smooth",
  "Grainy", "Airy", "Dense", "Liquid", "Gel", "Crisp",
] as const;

export const ingredientProcessOptions = [
  "Raw", "Roasted", "Toasted", "Grilled", "Infused", "Fermented",
  "Candied", "Caramelized", "Dried", "Freeze-dried", "Smoked",
  "Pickled", "Compressed", "Extracted", "Reduced", "Browned",
] as const;

export const ingredientAttributeOptions = [
  "Local", "Imported", "Seasonal", "Foraged", "Organic",
  "Biodynamic", "Fair Trade", "Wild", "Heritage Variety",
  "Animal-Derived", "Vegan", "Vegetarian",
] as const;

export const ingredientUsedAsOptions = [
  "Base", "Accent", "Infusion", "Garnish", "Swirl",
  "Mix-in", "Topping", "Coating", "Filling", "Pairing",
] as const;

export const ingredientSourceTypeOptions = [
  "Farm", "Distributor", "Producer", "Cooperative", "Market", "Forager", "Direct Import",
] as const;

export type IngredientCategory = typeof ingredientCategoryOptions[number];
export type IngredientRole = typeof ingredientRoleOptions[number];
export type IngredientDescriptor = typeof ingredientDescriptorTags[number];
export type IngredientTastingNote = typeof ingredientTastingNoteOptions[number];
export type IngredientTexture = typeof ingredientTextureOptions[number];
export type IngredientProcess = typeof ingredientProcessOptions[number];
export type IngredientAttribute = typeof ingredientAttributeOptions[number];
export type IngredientUsedAs = typeof ingredientUsedAsOptions[number];
export type IngredientSourceType = typeof ingredientSourceTypeOptions[number];

export type Allergen = 
  | 'dairy' 
  | 'egg' 
  | 'gluten' 
  | 'tree-nuts' 
  | 'peanuts' 
  | 'sesame' 
  | 'soy';

// Dietary claims are computed from ingredient facts, not stored
export type DietaryClaim = 
  | 'contains-dairy'
  | 'contains-egg'
  | 'contains-gluten'
  | 'contains-nuts'
  | 'dairy-free'
  | 'gluten-free'
  | 'nut-free'
  | 'vegan'
  | 'vegetarian';

// Legacy alias - some components use DietaryFlag instead of DietaryClaim
export type DietaryFlag = DietaryClaim;

export interface Ingredient {
  id: string;                       // UUID
  name: string;                     // Display name (unique) — English base
  latinName?: string;               // Scientific name (optional)
  category: IngredientCategory;     // Primary category (single select)
  roles: IngredientRole[];          // Usage roles (multi-select)
  descriptors: IngredientDescriptor[]; // Descriptor tags (optional multi-select)
  origin: string;                   // Source/origin location
  allergens: Allergen[];            // Allergen flags (source of truth)
  animalDerived?: boolean;          // Contains animal products
  vegetarian?: boolean;             // Suitable for vegetarians
  seasonal: boolean;                // Seasonal availability
  availableMonths?: number[];       // Month indices (0-11) when available
  image?: string;                   // Image URL (Vercel Blob or local)
  imageAlt?: string;                // Image alt text
  description?: string;             // Additional information
  story?: string;                   // Provenance story
  tastingNotes?: string[];          // Tasting notes array
  supplier?: string;                // Supplier name
  farm?: string;                    // Farm name
  isOrganic?: boolean;              // Organic certification
  status?: 'active' | 'archived';   // Status
  translations?: ContentTranslations; // French translations
  createdAt: string;                // ISO 8601 timestamp
  updatedAt: string;                // ISO 8601 timestamp
}

// ============================================================================
// Flavour Types
// ============================================================================

export type SyncStatus = 
  | 'synced'      // Successfully synced
  | 'pending'     // Queued for sync
  | 'failed'      // Sync failed
  | 'not_linked'; // No Shopify product linked

export type FlavourType = 
  | 'gelato'              // Dairy-based ice cream
  | 'sorbet'              // Fruit-based, dairy-free
  | 'special'             // Unique preparations
  | 'tasting-component';  // For tasting experiences

export type BaseStyle = 
  | 'dairy'      // Milk/cream base
  | 'non-dairy'  // Alternative milk
  | 'fruit'      // Fruit base
  | 'cheese'     // Cheese-based
  | 'other';     // Unique bases

export type Status = 
  | 'active'     // Currently available
  | 'upcoming'   // Coming soon
  | 'archived';  // No longer available

// Legacy type alias for backward compatibility
export type AvailabilityStatus = Status;

export interface FlavourIngredient {
  ingredientId: string;          // Reference to Ingredient.id
  quantity?: string;             // e.g., "30%", "2 cups", "to taste"
  displayOrder: number;          // Sort order (0-indexed)
  notes?: string;                // Special preparation notes
}

export interface Flavour {
  id: string;                    // UUID
  name: string;                  // Flavour name
  slug: string;                  // URL-friendly identifier
  type: FlavourType;             // Classification
  baseStyle: BaseStyle;          // Base category
  description: string;           // Full description
  shortDescription: string;      // Card copy
  story?: string;                // Flavour story/narrative
  tastingNotes?: string;         // Tasting notes
  ingredients: FlavourIngredient[]; // Ordered ingredient list
  keyNotes: string[];            // Flavor notes (e.g., "nutty", "floral")
  
  // Allergens & Dietary (calculated from ingredients)
  allergens: Allergen[];         // Auto-calculated
  dietaryClaims?: DietaryClaim[]; // Auto-calculated (computed, not stored)
  
  // Display
  colour: string;                // Hex color code
  image?: string;                // Flavour image URL
  
  // Availability
  status: Status;                // Current availability status
  season?: string;               // Seasonal availability
  
  // Format eligibility flags
  canBeUsedInTwist?: boolean;    // Eligible for twist format
  canBeSoldAsPint?: boolean;     // Eligible for pint format
  canBeUsedInSandwich?: boolean; // Eligible for sandwich format
  
  // Shopify Integration
  shopifyProductId?: string;     // Shopify product ID
  shopifyProductHandle?: string; // Shopify product handle
  syncStatus?: SyncStatus;       // Sync status with Shopify
  lastSyncedAt?: string;         // Last sync timestamp
  syncError?: string;            // Last sync error message
  
  // Admin
  sortOrder: number;             // Display order
  featured: boolean;             // Highlight in admin
  translations?: ContentTranslations; // French translations
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Offering Types (Three-Layer Architecture)
// ============================================================================

export type OfferingStatus = 
  | 'draft'       // Not published
  | 'scheduled'   // Scheduled for future
  | 'active'      // Currently available
  | 'sold-out'    // Temporarily unavailable
  | 'archived';   // No longer offered

// ============================================================================
// Product Variant Types
// ============================================================================

export interface ProductVariant {
  id: string;                    // UUID or slug-based ID
  label: string;                 // Display label (e.g. "Vanille", "500ml")
  labelFr?: string;              // French label
  price?: number;                // Override price in cents (null = use base price)
  sku?: string;                  // SKU for this variant
  shopifyVariantId?: string;     // Shopify variant GID after sync
  available: boolean;            // Is this variant currently available?
  sortOrder: number;             // Display order
  taxUnitCount?: number;         // Units per item for tax threshold calc (e.g. box of 4 = 4). Falls back to product-level taxUnitCount if unset.
}

export interface Offering {
  id: string;                    // UUID
  title: string;                 // Product title (maps to Shopify title)
  slug: string;                  // URL-friendly identifier (maps to Shopify handle)
  status: OfferingStatus;        // Publication status
  
  // Relationships
  formatId: string;              // Reference to Format.id
  primaryFlavourIds: string[];   // Main flavour(s) - array for flexibility
  secondaryFlavourIds?: string[]; // Optional additional flavours
  componentIds?: string[];       // Optional components (for sandwiches, tastings)
  
  // Content
  description: string;           // Full description
  shortCardCopy: string;         // Brief card text
  image?: string;                // Offering-specific image (overrides flavour image)
  keyNotes?: string[];           // Tasting tags (e.g. "smoky", "floral")
  tastingNotes?: string;         // Optional prose tasting notes
  ingredients?: FlavourIngredient[]; // Ordered ingredient list
  
  // Pricing
  price: number;                 // Base price in cents
  compareAtPrice?: number;       // Original price (for sales)
  
  // Availability
  availabilityStart?: string;    // ISO 8601 date
  availabilityEnd?: string;      // ISO 8601 date
  location?: string;             // Specific location if relevant
  
  // Tags & Classification
  tags: string[];                // e.g., ["seasonal", "weekly", "featured", "limited", "collab"]
  
  // Variants
  variantType?: 'none' | 'flavour' | 'size'; // Type of variant for this product
  variants?: ProductVariant[];   // Variant definitions (managed in CMS)
  
  // Shopify Integration
  shopifyProductId?: string;     // Linked Shopify product GID
  shopifyProductHandle?: string; // Product handle for URLs
  shopifySKU?: string;           // SKU for inventory
  posMapping?: string;           // POS system identifier
  
  // Sync status
  syncStatus?: SyncStatus;       // Current sync state
  lastSyncedAt?: string;         // Last successful sync timestamp
  syncError?: string;            // Error message if failed
  
  // Inventory (for packaged products like pints)
  inventoryTracked: boolean;     // Track inventory?
  inventoryQuantity?: number;    // Current stock
  restockDate?: string;          // Expected restock date
  shelfLifeNotes?: string;       // Storage/shelf life info
  
  // Ordering
  onlineOrderable: boolean;      // Available for online orders?
  pickupOnly: boolean;           // Pickup only (no delivery)?
  translations?: ContentTranslations; // French translations
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Bundle Types (Three-Layer Architecture)
// ============================================================================

export interface BundleItem {
  type: 'offering' | 'component'; // What kind of item
  id: string;                     // Reference to offering or component
  quantity: number;               // How many included
  required: boolean;              // Must be included?
}

export interface ChoiceRule {
  componentType: string;          // e.g., "soft-serve", "focaccia"
  minChoices: number;             // Minimum selections
  maxChoices: number;             // Maximum selections
  allowedTypes: string[];         // Allowed flavour types (e.g., ["gelato", "sorbet"])
  allowTwist: boolean;            // Allow twist combinations?
  premiumSurcharge?: number;      // Extra charge for premium options
}

export interface Bundle {
  id: string;                    // UUID
  name: string;                  // Bundle name
  slug: string;                  // URL-friendly identifier
  description: string;           // Bundle description
  
  // Structure
  includedItems: BundleItem[];   // Items in the bundle
  choiceRules: ChoiceRule[];     // Customer choice constraints
  
  // Pricing
  bundlePrice: number;           // Bundle price in cents
  individualPriceSum?: number;   // Sum of individual prices (for comparison)
  
  // Availability
  availabilityStart?: string;    // ISO 8601 date
  availabilityEnd?: string;      // ISO 8601 date
  
  // Content
  upsellCopy?: string;           // Marketing copy
  image?: string;                // Bundle image
  
  // Integration
  shopifyProductId?: string;     // Linked Shopify product
  posMapping?: string;           // POS system identifier
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Component Types (Three-Layer Architecture)
// ============================================================================

export type ComponentType = 
  | 'bread'      // Focaccia, brioche
  | 'cheese'     // Goat cheese, ricotta
  | 'topping'    // Crumbs, sprinkles
  | 'sauce'      // Jam, honey, olive oil
  | 'pairing';   // Wine, coffee, etc.

export interface Component {
  id: string;                    // UUID
  name: string;                  // Component name
  slug: string;                  // URL-friendly identifier
  type: ComponentType;           // Classification
  description: string;           // Description
  
  // Allergens & Dietary
  allergens: Allergen[];         // Allergen tags
  dietaryClaims?: DietaryClaim[]; // Computed dietary claims
  
  // Pricing
  price?: number;                // Price if sold separately
  
  // Display
  image?: string;                // Component image
  
  // Availability
  status: Status;                // Current availability status
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Seasonal Collection Types (Three-Layer Architecture)
// ============================================================================

export interface SeasonalCollection {
  id: string;                    // UUID
  name: string;                  // Collection name
  slug: string;                  // URL-friendly identifier
  description: string;           // Collection description
  
  // Content
  heroImage?: string;            // Hero image for collection page
  
  // Relationships
  offeringIds: string[];         // Offerings in this collection
  
  // Availability
  availabilityStart?: string;    // ISO 8601 date
  availabilityEnd?: string;      // ISO 8601 date
  
  // Display
  featured: boolean;             // Show on homepage?
  sortOrder: number;             // Display order
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Shopify Types
// ============================================================================

export interface ShopifyProduct {
  id: string;              // GID (e.g., "gid://shopify/Product/123")
  handle: string;          // URL handle
  title: string;           // Product title
  featuredImage?: {
    url: string;
    altText?: string;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
}

export interface ProductMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export interface ProductMetafields {
  'custom.flavour_id': string;              // CMS flavour ID
  'custom.ingredient_ids': string[];        // Array of ingredient IDs
  'custom.allergens': Allergen[];           // Calculated allergen list
  'custom.dietary_tags': DietaryClaim[];     // Computed dietary claims
  'custom.seasonal_ingredients': boolean;   // Has seasonal items
}

// ============================================================================
// Sync Types
// ============================================================================

export type SyncJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SyncJob {
  id: string;                    // Job ID
  flavourId: string;             // Flavour to sync
  productId: string;             // Shopify product GID
  status: SyncJobStatus;
  attempts: number;              // Retry count
  maxAttempts: number;           // Max retry limit (default: 3)
  error?: string;                // Error message
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
}

export type SyncAction = 'create' | 'update' | 'delete';
export type SyncLogStatus = 'success' | 'failure';

export interface SyncLog {
  id: string;
  flavourId: string;
  productId: string;
  action: SyncAction;
  status: SyncLogStatus;
  error?: string;
  timestamp: string;
  duration: number;              // Milliseconds
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorResponse {
  error: string;           // Human-readable error message
  code?: string;           // Machine-readable error code
  details?: any;           // Additional error details
  timestamp: string;       // ISO 8601 timestamp
  requestId?: string;      // For tracking and debugging
}

// ============================================================================
// Helper Types
// ============================================================================

export interface IngredientWithDetails extends Ingredient {
  quantity?: string;
  displayOrder: number;
  notes?: string;
}

export interface FlavourWithSyncStatus extends Flavour {
  syncStatusLabel: string;
  canResync: boolean;
}

// Three-Layer Architecture Helper Types
export interface OfferingFull extends Offering {
  primaryFlavours: Flavour[];
  secondaryFlavours?: Flavour[];
  components?: Component[];
}

export interface FlavourWithUsage extends Flavour {
  usageCount: number;
  usedInOfferings: {
    id: string;
    name: string;
    status: OfferingStatus;
  }[];
}

export interface CollectionFull extends SeasonalCollection {
  offerings: OfferingFull[];
}

// ============================================================================
// Product Generation Types
// ============================================================================

/**
 * Detailed report of product generation results.
 * Provides breakdown by format and flavour type, plus human-readable summary.
 * 
 * @example
 * ```typescript
 * const report: GenerationReport = {
 *   success: true,
 *   created: 8,
 *   skipped: 2,
 *   total: 15,
 *   breakdown: {
 *     byFormat: {
 *       "Scoop": {
 *         created: 4,
 *         skipped: 0,
 *         flavourTypes: ["gelato", "sorbet"]
 *       },
 *       "Sandwich": {
 *         created: 2,
 *         skipped: 1,
 *         flavourTypes: ["gelato"]
 *       },
 *       "Twist": {
 *         created: 2,
 *         skipped: 1,
 *         flavourTypes: ["gelato", "sorbet"]
 *       }
 *     },
 *     byFlavourType: {
 *       "gelato": 6,
 *       "sorbet": 2
 *     }
 *   },
 *   message: "Generated 8 new products across 3 formats. Skipped 2 combinations due to eligibility rules.",
 *   details: {
 *     skippedCombinations: [
 *       {
 *         formatName: "Sandwich",
 *         flavourName: "Lemon Sorbet",
 *         reason: "Flavour type 'sorbet' not eligible for format 'Sandwich'"
 *       },
 *       {
 *         formatName: "Twist",
 *         flavourName: "Chocolate Cookie",
 *         reason: "Flavour type 'cookie' not eligible for format 'Twist'"
 *       }
 *     ]
 *   }
 * };
 * ```
 */
export interface GenerationReport {
  success: boolean;           // Overall success status
  created: number;            // Number of new products created
  skipped: number;            // Number of combinations skipped due to eligibility
  total: number;              // Total products now associated with launch
  breakdown: {
    byFormat: {
      [formatName: string]: {
        created: number;        // Products created for this format
        skipped: number;        // Combinations skipped for this format
        flavourTypes: string[]; // Flavour types used in this format
      };
    };
    byFlavourType: {
      [flavourType: string]: number; // Count of products per flavour type
    };
  };
  message: string;            // Human-readable summary message
  details?: {
    skippedCombinations: Array<{
      formatName: string;
      flavourName: string;
      reason: string;
    }>;
  };
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
