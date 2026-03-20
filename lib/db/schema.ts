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

import { pgTable, uuid, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';
import { customJsonb } from './custom-types';

// Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Core fields
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  shopifyProductId: text('shopify_product_id'),
  shopifyProductHandle: text('shopify_product_handle'),
  
  // Order rules
  defaultMinQuantity: integer('default_min_quantity').notNull().default(1),
  defaultQuantityStep: integer('default_quantity_step').notNull().default(1),
  defaultMaxQuantity: integer('default_max_quantity'),
  
  // Pickup rules
  defaultPickupRequired: boolean('default_pickup_required').notNull().default(false),
  onlineOrderable: boolean('online_orderable').notNull().default(true),
  pickupOnly: boolean('pickup_only').notNull().default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('products_slug_idx').on(table.slug),
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
  introCopy: customJsonb<{ en: string; fr: string }>('intro_copy').notNull(),
  status: text('status', { enum: ['draft', 'active', 'archived'] }).notNull().default('draft'),
  
  // Ordering Window
  orderOpens: timestamp('order_opens').notNull(),
  orderCloses: timestamp('order_closes').notNull(),
  
  // Pickup
  pickupDate: timestamp('pickup_date').notNull(),
  pickupLocationId: uuid('pickup_location_id').references(() => pickupLocations.id),
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
  
  orderDate: timestamp('order_date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orderNumberIdx: index('orders_order_number_idx').on(table.orderNumber),
  statusIdx: index('orders_status_idx').on(table.status),
  orderDateIdx: index('orders_order_date_idx').on(table.orderDate),
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
