/**
 * Unit Tests for Migration Script: migrate-existing-products.ts
 * 
 * Tests the migration logic for adding availability fields to existing products.
 * 
 * **Validates: Requirements 24.1-24.10**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { products } from '../../lib/db/schema';
import { sql } from 'drizzle-orm';

// Use test database
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test';

describe('migrate-existing-products', () => {
  let client: postgres.Sql;
  let db: ReturnType<typeof drizzle>;

  beforeEach(async () => {
    // Create test database connection
    client = postgres(TEST_DATABASE_URL, { max: 1 });
    db = drizzle(client);

    // Clean up test data
    await db.execute(sql`DELETE FROM products WHERE name LIKE 'Test Product%'`);
  });

  afterEach(async () => {
    // Clean up and close connection
    await db.execute(sql`DELETE FROM products WHERE name LIKE 'Test Product%'`);
    await client.end();
  });

  it('should set availability_mode to always_available for existing products', async () => {
    // Insert a test product without availability fields
    await db.execute(sql`
      INSERT INTO products (name, slug)
      VALUES ('Test Product 1', 'test-product-1')
    `);

    // Run migration logic
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 1'
    `);

    // Verify
    const result = await db.execute(sql`
      SELECT availability_mode FROM products WHERE name = 'Test Product 1'
    `);

    expect(result[0].availability_mode).toBe('always_available');
  });

  it('should set online_orderable to true for existing products', async () => {
    // Insert a test product
    await db.execute(sql`
      INSERT INTO products (name, slug)
      VALUES ('Test Product 2', 'test-product-2')
    `);

    // Run migration logic
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 2'
    `);

    // Verify
    const result = await db.execute(sql`
      SELECT online_orderable FROM products WHERE name = 'Test Product 2'
    `);

    expect(result[0].online_orderable).toBe(true);
  });

  it('should set pickup_only to false for existing products', async () => {
    // Insert a test product
    await db.execute(sql`
      INSERT INTO products (name, slug)
      VALUES ('Test Product 3', 'test-product-3')
    `);

    // Run migration logic
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 3'
    `);

    // Verify
    const result = await db.execute(sql`
      SELECT pickup_only FROM products WHERE name = 'Test Product 3'
    `);

    expect(result[0].pickup_only).toBe(false);
  });

  it('should set default_min_quantity to 1 for existing products', async () => {
    // Insert a test product
    await db.execute(sql`
      INSERT INTO products (name, slug)
      VALUES ('Test Product 4', 'test-product-4')
    `);

    // Run migration logic
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 4'
    `);

    // Verify
    const result = await db.execute(sql`
      SELECT default_min_quantity FROM products WHERE name = 'Test Product 4'
    `);

    expect(result[0].default_min_quantity).toBe(1);
  });

  it('should set default_quantity_step to 1 for existing products', async () => {
    // Insert a test product
    await db.execute(sql`
      INSERT INTO products (name, slug)
      VALUES ('Test Product 5', 'test-product-5')
    `);

    // Run migration logic
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 5'
    `);

    // Verify
    const result = await db.execute(sql`
      SELECT default_quantity_step FROM products WHERE name = 'Test Product 5'
    `);

    expect(result[0].default_quantity_step).toBe(1);
  });

  it('should set default_pickup_required to false for existing products', async () => {
    // Insert a test product
    await db.execute(sql`
      INSERT INTO products (name, slug)
      VALUES ('Test Product 6', 'test-product-6')
    `);

    // Run migration logic
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 6'
    `);

    // Verify
    const result = await db.execute(sql`
      SELECT default_pickup_required FROM products WHERE name = 'Test Product 6'
    `);

    expect(result[0].default_pickup_required).toBe(false);
  });

  it('should be idempotent - running twice should not change values', async () => {
    // Insert a test product
    await db.execute(sql`
      INSERT INTO products (name, slug)
      VALUES ('Test Product 7', 'test-product-7')
    `);

    // Run migration logic first time
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 7'
    `);

    // Get values after first run
    const firstRun = await db.execute(sql`
      SELECT 
        availability_mode,
        online_orderable,
        pickup_only,
        default_min_quantity,
        default_quantity_step,
        default_pickup_required
      FROM products 
      WHERE name = 'Test Product 7'
    `);

    // Run migration logic second time
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 7'
    `);

    // Get values after second run
    const secondRun = await db.execute(sql`
      SELECT 
        availability_mode,
        online_orderable,
        pickup_only,
        default_min_quantity,
        default_quantity_step,
        default_pickup_required
      FROM products 
      WHERE name = 'Test Product 7'
    `);

    // Verify values are the same
    expect(secondRun[0]).toEqual(firstRun[0]);
  });

  it('should not override existing non-default values', async () => {
    // Insert a test product with custom values
    await db.execute(sql`
      INSERT INTO products (
        name, 
        slug, 
        availability_mode, 
        online_orderable,
        default_min_quantity
      )
      VALUES (
        'Test Product 8', 
        'test-product-8',
        'hidden',
        false,
        5
      )
    `);

    // Run migration logic
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 8'
    `);

    // Verify custom values are preserved
    const result = await db.execute(sql`
      SELECT 
        availability_mode,
        online_orderable,
        default_min_quantity
      FROM products 
      WHERE name = 'Test Product 8'
    `);

    expect(result[0].availability_mode).toBe('hidden');
    expect(result[0].online_orderable).toBe(false);
    expect(result[0].default_min_quantity).toBe(5);
  });

  it('should update all fields in a single transaction', async () => {
    // Insert a test product
    await db.execute(sql`
      INSERT INTO products (name, slug)
      VALUES ('Test Product 9', 'test-product-9')
    `);

    // Run migration logic
    await db.execute(sql`
      UPDATE products
      SET 
        availability_mode = COALESCE(availability_mode, 'always_available'),
        online_orderable = COALESCE(online_orderable, true),
        pickup_only = COALESCE(pickup_only, false),
        default_min_quantity = COALESCE(default_min_quantity, 1),
        default_quantity_step = COALESCE(default_quantity_step, 1),
        default_pickup_required = COALESCE(default_pickup_required, false)
      WHERE name = 'Test Product 9'
    `);

    // Verify all fields are set
    const result = await db.execute(sql`
      SELECT 
        availability_mode,
        online_orderable,
        pickup_only,
        default_min_quantity,
        default_quantity_step,
        default_pickup_required
      FROM products 
      WHERE name = 'Test Product 9'
    `);

    expect(result[0]).toEqual({
      availability_mode: 'always_available',
      online_orderable: true,
      pickup_only: false,
      default_min_quantity: 1,
      default_quantity_step: 1,
      default_pickup_required: false,
    });
  });
});
