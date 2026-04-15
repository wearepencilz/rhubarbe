/**
 * Database Schema for Rhubarbe
 * 
 * This file defines the PostgreSQL schema using Drizzle ORM.
 * Schema includes:
 * - Products (Shopify-linked sellable items)
 * - Launches (weekly preorder menus — the central operational object)
 * - Launch Products (products linked to a specific launch with overrides)
 * - Pickup Locations (collection points)
 * - Orders and Order Items
 */

import { pgTable, uuid, text, timestamp, integer, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { customJsonb } from './custom-types';

// Cake configuration types (used as JSONB generic parameters)
interface CakeFlavourEntry {
  handle: string;
  label: { en: string; fr: string };
  description: { en: string; fr: string } | null;
  pricingTierGroup: string | null;
  sortOrder: number;
  active: boolean;
  endDate: string | null;
}

interface CakeTierDetailEntry {
  sizeValue: string;
  layers: number;
  diameters: string;
  label: { en: string; fr: string } | null;
}

// Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Core fields
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  shopifyProductId: text('shopify_product_id'),
  shopifyProductHandle: text('shopify_product_handle'),
  
  // Migration fields
  legacyId: text('legacy_id'),
  title: text('title'),
  description: text('description'),
  category: text('category'),
  price: integer('price'),
  currency: text('currency').default('CAD'),
  image: text('image'),
  serves: text('serves'),
  shortCardCopy: text('short_card_copy'),
  tastingNotes: text('tasting_notes'),
  status: text('status'),

  // Jsonb arrays
  allergens: customJsonb<string[]>('allergens'),
  tags: customJsonb<string[]>('tags'),
  keyNotes: customJsonb<string[]>('key_notes'),
  variants: customJsonb<Record<string, unknown>[]>('variants'),
  translations: customJsonb<Record<string, Record<string, string>>>('translations'),

  // Availability & selection
  inventoryTracked: boolean('inventory_tracked').default(false),
  availabilityMode: text('availability_mode').notNull().default('always_available'),
  dateSelectionType: text('date_selection_type').notNull().default('none'),
  slotSelectionType: text('slot_selection_type').notNull().default('none'),
  variantType: text('variant_type'),

  // Sync fields
  syncStatus: text('sync_status'),
  lastSyncedAt: timestamp('last_synced_at'),
  syncError: text('sync_error'),

  // Order rules
  defaultMinQuantity: integer('default_min_quantity').notNull().default(1),
  defaultQuantityStep: integer('default_quantity_step').notNull().default(1),
  defaultMaxQuantity: integer('default_max_quantity'),
  
  // Pickup rules
  defaultPickupRequired: boolean('default_pickup_required').notNull().default(false),
  onlineOrderable: boolean('online_orderable').notNull().default(true),
  pickupOnly: boolean('pickup_only').notNull().default(false),

  // Volume sales fields
  volumeEnabled: boolean('volume_enabled').notNull().default(false),
  volumeDescription: customJsonb<{ en: string; fr: string }>('volume_description'),
  volumeInstructions: customJsonb<{ en: string; fr: string }>('volume_instructions'),
  volumeMinOrderQuantity: integer('volume_min_order_quantity'),
  volumeUnitLabel: text('volume_unit_label').notNull().default('quantity'), // 'quantity' | 'people'

  // Catering-specific fields
  cateringType: text('catering_type'), // 'brunch' (buffet) | 'lunch' | 'dinatoire'
  cateringDescription: customJsonb<{ en: string; fr: string }>('catering_description'),
  cateringFlavourName: customJsonb<{ en: string; fr: string }>('catering_flavour_name'),
  cateringEndDate: timestamp('catering_end_date'),
  dietaryTags: customJsonb<string[]>('dietary_tags'),
  temperatureTags: customJsonb<string[]>('temperature_tags'),

  // Catering ordering rules (per-product)
  orderMinimum: integer('order_minimum'),        // minimum total qty (scope=order) or ignored (scope=variant)
  orderScope: text('order_scope'),               // 'variant' | 'order'
  variantMinimum: integer('variant_minimum'),     // minimum per variant (scope=variant only)
  increment: integer('increment'),               // step size after minimum

  // Cake sales fields
  cakeEnabled: boolean('cake_enabled').notNull().default(false),
  cakeDescription: customJsonb<{ en: string; fr: string }>('cake_description'),
  cakeInstructions: customJsonb<{ en: string; fr: string }>('cake_instructions'),
  cakeMinPeople: integer('cake_min_people'),
  cakeMaxPeople: integer('cake_max_people'),

  // Ordering system extension fields
  nextAvailableDate: timestamp('next_available_date'),
  servesPerUnit: integer('serves_per_unit'),
  maxAdvanceDays: integer('max_advance_days'),
  cakeFlavourNotes: customJsonb<{ en: string; fr: string }>('cake_flavour_notes'),
  cakeDeliveryAvailable: boolean('cake_delivery_available').default(true),

  // Cake product type and configuration fields
  cakeProductType: text('cake_product_type'),  // 'cake-xxl' | 'croquembouche' | 'wedding-cake-tiered' | 'wedding-cake-tasting' | null
  cakeFlavourConfig: customJsonb<CakeFlavourEntry[]>('cake_flavour_config'),
  cakeTierDetailConfig: customJsonb<CakeTierDetailEntry[]>('cake_tier_detail_config'),
  cakeMaxFlavours: integer('cake_max_flavours'),

  // Tax fields
  taxBehavior: text('tax_behavior').notNull().default('always_taxable'),
  taxThreshold: integer('tax_threshold').notNull().default(6),
  taxUnitCount: integer('tax_unit_count').notNull().default(1),
  shopifyTaxExemptVariantId: text('shopify_tax_exempt_variant_id'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('products_slug_idx').on(table.slug),
  legacyIdIdx: index('products_legacy_id_idx').on(table.legacyId),
  categoryIdx: index('products_category_idx').on(table.category),
}));

// Volume Lead Time Tiers — per-product lead time rules based on quantity
export const volumeLeadTimeTiers = pgTable('volume_lead_time_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  minQuantity: integer('min_quantity').notNull(),
  leadTimeDays: integer('lead_time_days').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('volume_lead_time_tiers_product_id_idx').on(table.productId),
}));

// Cake Lead Time Tiers — per-product lead time rules based on number of people
export const cakeLeadTimeTiers = pgTable('cake_lead_time_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  minPeople: integer('min_people').notNull(),
  leadTimeDays: integer('lead_time_days').notNull(),
  deliveryOnly: boolean('delivery_only').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('cake_lead_time_tiers_product_id_idx').on(table.productId),
}));

// Cake Pricing Tiers — per-product tiered pricing based on number of people
export const cakePricingTiers = pgTable('cake_pricing_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  minPeople: integer('min_people').notNull(),
  priceInCents: integer('price_in_cents').notNull(),
  shopifyVariantId: text('shopify_variant_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('cake_pricing_tiers_product_id_idx').on(table.productId),
}));

// Cake Pricing Grid — two-axis pricing: (size × flavour) → price + Shopify variant
export const cakePricingGrid = pgTable('cake_pricing_grid', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sizeValue: text('size_value').notNull(),
  flavourHandle: text('flavour_handle').notNull(),
  priceInCents: integer('price_in_cents').notNull(),
  shopifyVariantId: text('shopify_variant_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('cake_pricing_grid_product_id_idx').on(table.productId),
  uniqueCell: uniqueIndex('cake_pricing_grid_unique_cell').on(table.productId, table.sizeValue, table.flavourHandle),
}));

// Cake Add-On Links — links parent cake products to optional add-on products
export const cakeAddonLinks = pgTable('cake_addon_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentProductId: uuid('parent_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  addonProductId: uuid('addon_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  parentIdx: index('cake_addon_links_parent_idx').on(table.parentProductId),
  uniqueLink: uniqueIndex('cake_addon_links_unique').on(table.parentProductId, table.addonProductId),
}));

// Cake Variants — cake-specific variants with bilingual labels and Shopify mapping
export const cakeVariants = pgTable('cake_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  label: customJsonb<{ en: string; fr: string }>('label').notNull(),
  shopifyVariantId: text('shopify_variant_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  description: customJsonb<{ en: string; fr: string }>('description'),
  allergens: customJsonb<string[]>('allergens'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('cake_variants_product_id_idx').on(table.productId),
  sortOrderIdx: index('cake_variants_sort_order_idx').on(table.sortOrder),
}));

// Volume Variants — volume-specific variants with bilingual labels and Shopify mapping
export const volumeVariants = pgTable('volume_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  label: customJsonb<{ en: string; fr: string }>('label').notNull(),
  shopifyVariantId: text('shopify_variant_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  description: customJsonb<{ en: string; fr: string }>('description'),
  allergens: customJsonb<string[]>('allergens'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  productIdIdx: index('volume_variants_product_id_idx').on(table.productId),
  sortOrderIdx: index('volume_variants_sort_order_idx').on(table.sortOrder),
}));

// Pickup Locations
export const pickupLocations = pgTable('pickup_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  internalName: text('internal_name').notNull(),
  publicLabel: customJsonb<{ en: string; fr: string }>('public_label').notNull(),
  address: text('address').notNull(),
  pickupInstructions: customJsonb<{ en: string; fr: string }>('pickup_instructions').notNull(),
  contactDetails: text('contact_details').notNull(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  mapOrDirectionsLink: text('map_or_directions_link'),
  operationalNotesForStaff: text('operational_notes_for_staff'),
  disabledPickupDays: customJsonb<number[]>('disabled_pickup_days').default([]),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  activeIdx: index('pickup_locations_active_idx').on(table.active),
  sortOrderIdx: index('pickup_locations_sort_order_idx').on(table.sortOrder),
}));

// Launches — the central weekly preorder object
export const launches = pgTable('launches', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Menu Details
  title: customJsonb<{ en: string; fr: string }>('title').notNull(),
  slug: text('slug').unique(),
  introCopy: customJsonb<{ en: string; fr: string }>('intro_copy').notNull(),
  status: text('status', { enum: ['draft', 'active', 'archived'] }).notNull().default('draft'),
  
  // Ordering Window
  orderOpens: timestamp('order_opens').notNull(),
  orderCloses: timestamp('order_closes').notNull(),
  allowEarlyOrdering: boolean('allow_early_ordering').notNull().default(false),
  
  // Pickup
  pickupDate: timestamp('pickup_date').notNull(),
  pickupLocationId: uuid('pickup_location_id').references(() => pickupLocations.id),
  pickupWindowStart: timestamp('pickup_window_start'),
  pickupWindowEnd: timestamp('pickup_window_end'),
  pickupInstructions: customJsonb<{ en: string; fr: string }>('pickup_instructions'),
  
  // Pickup Slots — config used to generate, plus the generated slots
  pickupSlotConfig: customJsonb<{
    startTime: string;
    endTime: string;
    intervalMinutes: number;
  }>('pickup_slot_config'),
  pickupSlots: customJsonb<Array<{
    id: string;
    startTime: string;
    endTime: string;
    capacity?: number;
  }>>('pickup_slots').notNull().default([]),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('launches_status_idx').on(table.status),
  pickupDateIdx: index('launches_pickup_date_idx').on(table.pickupDate),
  slugIdx: index('launches_slug_idx').on(table.slug),
}));

// Launch Products — products linked to a specific launch
// productId is text (not uuid) because products currently live in a JSON file with slug-based IDs
export const launchProducts = pgTable('launch_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  launchId: uuid('launch_id').notNull().references(() => launches.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  
  // Per-menu overrides
  minQuantityOverride: integer('min_quantity_override'),
  maxQuantityOverride: integer('max_quantity_override'),
  quantityStepOverride: integer('quantity_step_override'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  launchIdIdx: index('launch_products_launch_id_idx').on(table.launchId),
  productIdIdx: index('launch_products_product_id_idx').on(table.productId),
  uniqueLaunchProduct: index('launch_products_unique').on(table.launchId, table.productId),
}));

// Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull().unique(),
  shopifyOrderId: text('shopify_order_id').unique(),
  launchId: text('launch_id'),
  launchTitle: text('launch_title'),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  specialInstructions: text('special_instructions'),
  
  // Pricing (in cents)
  subtotal: integer('subtotal').notNull(),
  tax: integer('tax').notNull(),
  total: integer('total').notNull(),
  
  // Status
  status: text('status', { 
    enum: ['pending', 'confirmed', 'fulfilled', 'cancelled'] 
  }).notNull().default('pending'),
  paymentStatus: text('payment_status', { 
    enum: ['pending', 'paid', 'refunded'] 
  }).notNull().default('pending'),
  
  // Order type fields
  orderType: text('order_type').notNull().default('launch'),  // "launch" | "volume" | "cake"
  fulfillmentDate: timestamp('fulfillment_date'),
  allergenNotes: text('allergen_notes'),
  leadTimeDays: integer('lead_time_days'),
  cateringType: text('catering_type'),  // 'brunch' | 'lunch' | 'dinatoire' (primary type for volume orders)

  orderDate: timestamp('order_date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orderNumberIdx: index('orders_order_number_idx').on(table.orderNumber),
  shopifyOrderIdIdx: index('orders_shopify_order_id_idx').on(table.shopifyOrderId),
  statusIdx: index('orders_status_idx').on(table.status),
  orderDateIdx: index('orders_order_date_idx').on(table.orderDate),
  orderTypeIdx: index('orders_order_type_idx').on(table.orderType),
}));

// Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  productId: uuid('product_id').notNull(),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull(),
  
  // Pickup details
  pickupDate: timestamp('pickup_date').notNull(),
  pickupLocationId: uuid('pickup_location_id').notNull(),
  pickupLocationName: text('pickup_location_name').notNull(),
  pickupSlot: customJsonb<{
    startTime: string;
    endTime: string;
  }>('pickup_slot'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
  productIdIdx: index('order_items_product_id_idx').on(table.productId),
  pickupDateIdx: index('order_items_pickup_date_idx').on(table.pickupDate),
  pickupLocationIdx: index('order_items_pickup_location_id_idx').on(table.pickupLocationId),
}));

// Taxonomy Values — normalized taxonomy entries with category discriminator
export const taxonomyValues = pgTable('taxonomy_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category').notNull(),
  label: text('label').notNull(),
  value: text('value').notNull(),
  description: text('description'),
  translations: customJsonb<{ fr?: string }>('translations'),
  sortOrder: integer('sort_order').notNull().default(0),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('taxonomy_values_category_idx').on(table.category),
  categoryValueUniq: uniqueIndex('taxonomy_values_category_value_uniq').on(table.category, table.value),
}));

// Ingredients — gelato ingredients with taxonomy references and metadata
export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  legacyId: text('legacy_id'),

  // Core fields
  name: text('name').notNull(),
  latinName: text('latin_name'),
  category: text('category'),
  taxonomyCategory: text('taxonomy_category'),
  origin: text('origin'),
  description: text('description'),
  story: text('story'),
  image: text('image'),
  imageAlt: text('image_alt'),

  // Jsonb arrays
  allergens: customJsonb<string[]>('allergens'),
  roles: customJsonb<string[]>('roles'),
  descriptors: customJsonb<string[]>('descriptors'),
  tastingNotes: customJsonb<string[]>('tasting_notes'),
  texture: customJsonb<string[]>('texture'),
  process: customJsonb<string[]>('process'),
  attributes: customJsonb<string[]>('attributes'),
  usedAs: customJsonb<string[]>('used_as'),
  availableMonths: customJsonb<number[]>('available_months'),

  // Booleans
  seasonal: boolean('seasonal').notNull().default(false),
  animalDerived: boolean('animal_derived').default(false),
  vegetarian: boolean('vegetarian').default(true),
  isOrganic: boolean('is_organic').default(false),

  // Supplier fields
  sourceName: text('source_name'),
  sourceType: text('source_type'),
  supplier: text('supplier'),
  farm: text('farm'),

  // Status
  status: text('status').default('active'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  legacyIdIdx: index('ingredients_legacy_id_idx').on(table.legacyId),
  nameIdx: index('ingredients_name_idx').on(table.name),
  categoryIdx: index('ingredients_category_idx').on(table.category),
}));

// Users — admin/editor accounts migrated from users.json
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  legacyId: text('legacy_id'),

  // Core fields
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  role: text('role').notNull(),
  active: boolean('active').notNull().default(true),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Pages — CMS page content stored as flexible jsonb
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageName: text('page_name').notNull().unique(),
  content: customJsonb<Record<string, unknown>>('content').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Settings — key-value settings with jsonb values
export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: customJsonb<unknown>('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Product Ingredients — join table linking products to ingredients
export const productIngredients = pgTable('product_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  ingredientId: uuid('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'cascade' }),
  displayOrder: integer('display_order').notNull().default(0),
  quantity: text('quantity'),
  notes: text('notes'),
}, (table) => ({
  productIdIdx: index('product_ingredients_product_id_idx').on(table.productId),
  ingredientIdIdx: index('product_ingredients_ingredient_id_idx').on(table.ingredientId),
}));

// Stories — bilingual content with story blocks
export const stories = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  legacyId: text('legacy_id'),
  slug: text('slug').unique(),
  title: customJsonb<{ en: string; fr: string }>('title'),
  subtitle: customJsonb<{ en: string; fr: string }>('subtitle'),
  content: customJsonb<unknown>('content'),
  category: text('category'),
  tags: customJsonb<string[]>('tags'),
  coverImage: text('cover_image'),
  status: text('status'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('stories_slug_idx').on(table.slug),
  statusIdx: index('stories_status_idx').on(table.status),
  categoryIdx: index('stories_category_idx').on(table.category),
}));

// News — simple content entries
export const news = pgTable('news', {
  id: uuid('id').primaryKey().defaultRandom(),
  legacyId: text('legacy_id'),
  title: text('title'),
  content: customJsonb<unknown>('content'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  legacyIdIdx: index('news_legacy_id_idx').on(table.legacyId),
}));

// Requests — traiteur and gateaux order requests
export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  legacyId: text('legacy_id'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  date: text('date'),
  time: text('time'),
  guests: text('guests'),
  eventType: text('event_type'),
  delivery: text('delivery'),
  address: text('address'),
  notes: text('notes'),
  type: text('type').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  typeIdx: index('requests_type_idx').on(table.type),
  statusIdx: index('requests_status_idx').on(table.status),
}));

// Email Templates — admin-configurable bilingual email templates
export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateKey: text('template_key').notNull().unique(),
  subject: customJsonb<{ en: string; fr: string }>('subject').notNull(),
  body: customJsonb<{ en: string; fr: string }>('body').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Email Logs — audit trail for all transactional emails
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipientEmail: text('recipient_email').notNull(),
  templateKey: text('template_key').notNull(),
  orderId: text('order_id'),
  status: text('status').notNull(),  // "sent" | "failed"
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
});
