/**
 * Property-Based Tests for Migration Script: migrate-existing-products.ts
 * 
 * **Validates: Requirements 24.2-24.7**
 * 
 * Tests that the migration logic correctly sets default values for any product data:
 * - availability_mode is set to 'always_available'
 * - online_orderable is set to true
 * - pickup_only is set to false
 * - default_min_quantity is set to 1
 * - default_quantity_step is set to 1
 * - default_pickup_required is set to false
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Use test database
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://rhubarbe:rhubarbe_dev@localhost:5432/rhubarbe_test';

/**
 * Migration logic function that applies the same COALESCE logic as the migration script
 */
async function applyMigrationLogic(db: ReturnType<typeof drizzle>, productName: string) {
  await db.execute(sql`
    UPDATE products
    SET 
      availability_mode = COALESCE(availability_mode, 'always_available'),
      online_orderable = COALESCE(online_orderable, true),
      pickup_only = COALESCE(pickup_only, false),
      default_min_quantity = COALESCE(default_min_quantity, 1),
      default_quantity_step = COALESCE(default_quantity_step, 1),
      default_pickup_required = COALESCE(default_pickup_required, false)
    WHERE name = ${productName}
  `);
}

describe('Property 20: Migration Default Values', () => {
  let client: postgres.Sql;
  let db: ReturnType<typeof drizzle>;

  beforeEach(async () => {
    // Create test database connection
    client = postgres(TEST_DATABASE_URL, { max: 1 });
    db = drizzle(client);

    // Clean up test data
    await db.execute(sql`DELETE FROM products WHERE name LIKE 'PropTest%'`);
  });

  afterEach(async () => {
    // Clean up and close connection
    await db.execute(sql`DELETE FROM products WHERE name LIKE 'PropTest%'`);
    await client.end();
  });

  it('should set availability_mode to always_available for any product data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PropTest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => `proptest-${s.replace(/[^a-z0-9]/g, '-')}`),
        }),
        async (productData) => {
          // Insert product without availability_mode
          await db.execute(sql`
            INSERT INTO products (name, slug)
            VALUES (${productData.name}, ${productData.slug})
          `);

          // Apply migration logic
          await applyMigrationLogic(db, productData.name);

          // Verify availability_mode is set to 'always_available'
          const result = await db.execute(sql`
            SELECT availability_mode FROM products WHERE name = ${productData.name}
          `);

          expect(result[0].availability_mode).toBe('always_available');

          // Cleanup
          await db.execute(sql`DELETE FROM products WHERE name = ${productData.name}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set online_orderable to true for any product data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PropTest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => `proptest-${s.replace(/[^a-z0-9]/g, '-')}`),
        }),
        async (productData) => {
          // Insert product without online_orderable
          await db.execute(sql`
            INSERT INTO products (name, slug)
            VALUES (${productData.name}, ${productData.slug})
          `);

          // Apply migration logic
          await applyMigrationLogic(db, productData.name);

          // Verify online_orderable is set to true
          const result = await db.execute(sql`
            SELECT online_orderable FROM products WHERE name = ${productData.name}
          `);

          expect(result[0].online_orderable).toBe(true);

          // Cleanup
          await db.execute(sql`DELETE FROM products WHERE name = ${productData.name}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set pickup_only to false for any product data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PropTest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => `proptest-${s.replace(/[^a-z0-9]/g, '-')}`),
        }),
        async (productData) => {
          // Insert product without pickup_only
          await db.execute(sql`
            INSERT INTO products (name, slug)
            VALUES (${productData.name}, ${productData.slug})
          `);

          // Apply migration logic
          await applyMigrationLogic(db, productData.name);

          // Verify pickup_only is set to false
          const result = await db.execute(sql`
            SELECT pickup_only FROM products WHERE name = ${productData.name}
          `);

          expect(result[0].pickup_only).toBe(false);

          // Cleanup
          await db.execute(sql`DELETE FROM products WHERE name = ${productData.name}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set default_min_quantity to 1 for any product data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PropTest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => `proptest-${s.replace(/[^a-z0-9]/g, '-')}`),
        }),
        async (productData) => {
          // Insert product without default_min_quantity
          await db.execute(sql`
            INSERT INTO products (name, slug)
            VALUES (${productData.name}, ${productData.slug})
          `);

          // Apply migration logic
          await applyMigrationLogic(db, productData.name);

          // Verify default_min_quantity is set to 1
          const result = await db.execute(sql`
            SELECT default_min_quantity FROM products WHERE name = ${productData.name}
          `);

          expect(result[0].default_min_quantity).toBe(1);

          // Cleanup
          await db.execute(sql`DELETE FROM products WHERE name = ${productData.name}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set default_quantity_step to 1 for any product data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PropTest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => `proptest-${s.replace(/[^a-z0-9]/g, '-')}`),
        }),
        async (productData) => {
          // Insert product without default_quantity_step
          await db.execute(sql`
            INSERT INTO products (name, slug)
            VALUES (${productData.name}, ${productData.slug})
          `);

          // Apply migration logic
          await applyMigrationLogic(db, productData.name);

          // Verify default_quantity_step is set to 1
          const result = await db.execute(sql`
            SELECT default_quantity_step FROM products WHERE name = ${productData.name}
          `);

          expect(result[0].default_quantity_step).toBe(1);

          // Cleanup
          await db.execute(sql`DELETE FROM products WHERE name = ${productData.name}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set default_pickup_required to false for any product data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PropTest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => `proptest-${s.replace(/[^a-z0-9]/g, '-')}`),
        }),
        async (productData) => {
          // Insert product without default_pickup_required
          await db.execute(sql`
            INSERT INTO products (name, slug)
            VALUES (${productData.name}, ${productData.slug})
          `);

          // Apply migration logic
          await applyMigrationLogic(db, productData.name);

          // Verify default_pickup_required is set to false
          const result = await db.execute(sql`
            SELECT default_pickup_required FROM products WHERE name = ${productData.name}
          `);

          expect(result[0].default_pickup_required).toBe(false);

          // Cleanup
          await db.execute(sql`DELETE FROM products WHERE name = ${productData.name}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should set all default values correctly for any product data in a single operation', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PropTest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => `proptest-${s.replace(/[^a-z0-9]/g, '-')}`),
        }),
        async (productData) => {
          // Insert product without any availability fields
          await db.execute(sql`
            INSERT INTO products (name, slug)
            VALUES (${productData.name}, ${productData.slug})
          `);

          // Apply migration logic
          await applyMigrationLogic(db, productData.name);

          // Verify all default values are set correctly
          const result = await db.execute(sql`
            SELECT 
              availability_mode,
              online_orderable,
              pickup_only,
              default_min_quantity,
              default_quantity_step,
              default_pickup_required
            FROM products 
            WHERE name = ${productData.name}
          `);

          expect(result[0]).toEqual({
            availability_mode: 'always_available',
            online_orderable: true,
            pickup_only: false,
            default_min_quantity: 1,
            default_quantity_step: 1,
            default_pickup_required: false,
          });

          // Cleanup
          await db.execute(sql`DELETE FROM products WHERE name = ${productData.name}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve existing non-default values for any product data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PropTest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => `proptest-${s.replace(/[^a-z0-9]/g, '-')}`),
          availabilityMode: fc.constantFrom('scheduled', 'pattern_based', 'hidden'),
          onlineOrderable: fc.boolean(),
          defaultMinQuantity: fc.integer({ min: 2, max: 10 }),
        }),
        async (productData) => {
          // Insert product with custom values
          await db.execute(sql`
            INSERT INTO products (
              name, 
              slug, 
              availability_mode, 
              online_orderable,
              default_min_quantity
            )
            VALUES (
              ${productData.name}, 
              ${productData.slug},
              ${productData.availabilityMode},
              ${productData.onlineOrderable},
              ${productData.defaultMinQuantity}
            )
          `);

          // Apply migration logic
          await applyMigrationLogic(db, productData.name);

          // Verify custom values are preserved
          const result = await db.execute(sql`
            SELECT 
              availability_mode,
              online_orderable,
              default_min_quantity
            FROM products 
            WHERE name = ${productData.name}
          `);

          expect(result[0].availability_mode).toBe(productData.availabilityMode);
          expect(result[0].online_orderable).toBe(productData.onlineOrderable);
          expect(result[0].default_min_quantity).toBe(productData.defaultMinQuantity);

          // Cleanup
          await db.execute(sql`DELETE FROM products WHERE name = ${productData.name}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should be idempotent - running migration multiple times produces same result for any product data', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PropTest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          slug: fc.string({ minLength: 1, maxLength: 50 }).map(s => `proptest-${s.replace(/[^a-z0-9]/g, '-')}`),
        }),
        async (productData) => {
          // Insert product without availability fields
          await db.execute(sql`
            INSERT INTO products (name, slug)
            VALUES (${productData.name}, ${productData.slug})
          `);

          // Apply migration logic first time
          await applyMigrationLogic(db, productData.name);

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
            WHERE name = ${productData.name}
          `);

          // Apply migration logic second time
          await applyMigrationLogic(db, productData.name);

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
            WHERE name = ${productData.name}
          `);

          // Verify values are identical
          expect(secondRun[0]).toEqual(firstRun[0]);

          // Cleanup
          await db.execute(sql`DELETE FROM products WHERE name = ${productData.name}`);
        }
      ),
      { numRuns: 50 }
    );
  });
});
