/**
 * Property-Based Tests for Database Retry Logic
 * Feature: pixel-art-game
 * Property 32: Database Retry Logic
 * Validates: Requirements 13.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { Pool } from 'pg';

// Mock the pg module
vi.mock('pg', () => {
  const mockPool = {
    query: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
    end: vi.fn(),
  };
  
  return {
    Pool: vi.fn(() => mockPool),
  };
});

// Import after mocking
import { queryWithRetry, transaction, closePool } from '../../db-game';

describe('Feature: pixel-art-game, Property 32: Database Retry Logic', () => {
  let mockPool: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Get the mocked pool instance
    const PoolConstructor = Pool as any;
    mockPool = new PoolConstructor();
  });

  afterEach(async () => {
    await closePool();
  });

  it('should retry transient database failures up to 3 times', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.array(fc.anything(), { minLength: 0, maxLength: 5 }),
        async (query, params) => {
          // Simulate transient failure (connection error)
          const transientError = new Error('Connection timeout');
          (transientError as any).code = 'ETIMEDOUT';

          let attemptCount = 0;
          mockPool.query.mockImplementation(() => {
            attemptCount++;
            if (attemptCount < 3) {
              throw transientError;
            }
            return Promise.resolve({ rows: [{ result: 'success' }], rowCount: 1 });
          });

          // Should succeed after retries
          const result = await queryWithRetry(query, params, { maxAttempts: 3, delayMs: 1 });

          // Verify it retried exactly 3 times
          expect(attemptCount).toBe(3);
          expect(result.rows[0].result).toBe('success');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not retry non-transient errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (query) => {
          // Simulate non-transient error (syntax error)
          const syntaxError = new Error('Syntax error in SQL');
          (syntaxError as any).code = '42601';

          let attemptCount = 0;
          mockPool.query.mockImplementation(() => {
            attemptCount++;
            throw syntaxError;
          });

          // Should fail immediately without retries
          await expect(queryWithRetry(query, [], { maxAttempts: 3, delayMs: 1 }))
            .rejects.toThrow('Syntax error in SQL');

          // Verify it only attempted once
          expect(attemptCount).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail after max retry attempts for persistent transient errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 5 }),
        async (query, maxAttempts) => {
          // Simulate persistent transient failure
          const transientError = new Error('Connection refused');
          (transientError as any).code = 'ECONNREFUSED';

          let attemptCount = 0;
          mockPool.query.mockImplementation(() => {
            attemptCount++;
            throw transientError;
          });

          // Should fail after max attempts
          await expect(queryWithRetry(query, [], { maxAttempts, delayMs: 1 }))
            .rejects.toThrow('Connection refused');

          // Verify it attempted exactly maxAttempts times
          expect(attemptCount).toBe(maxAttempts);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use exponential backoff between retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 10, max: 100 }),
        async (query, baseDelayMs) => {
          const transientError = new Error('Network error');
          (transientError as any).code = 'ETIMEDOUT';

          const attemptTimestamps: number[] = [];
          let attemptCount = 0;

          mockPool.query.mockImplementation(() => {
            attemptTimestamps.push(Date.now());
            attemptCount++;
            if (attemptCount < 3) {
              throw transientError;
            }
            return Promise.resolve({ rows: [], rowCount: 0 });
          });

          await queryWithRetry(query, [], { maxAttempts: 3, delayMs: baseDelayMs });

          // Verify exponential backoff (each delay should be roughly 2x the previous)
          if (attemptTimestamps.length >= 2) {
            const delay1 = attemptTimestamps[1] - attemptTimestamps[0];
            // First retry should wait at least baseDelayMs
            expect(delay1).toBeGreaterThanOrEqual(baseDelayMs * 0.9); // Allow 10% tolerance
          }

          if (attemptTimestamps.length >= 3) {
            const delay2 = attemptTimestamps[2] - attemptTimestamps[1];
            // Second retry should wait at least 2x baseDelayMs
            expect(delay2).toBeGreaterThanOrEqual(baseDelayMs * 2 * 0.9);
          }
        }
      ),
      { numRuns: 50 } // Fewer runs since this test involves timing
    );
  });

  it('should rollback transaction on failure and retry', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          value1: fc.integer(),
          value2: fc.string(),
        }),
        async (data) => {
          const mockClient = {
            query: vi.fn(),
            release: vi.fn(),
          };

          let attemptCount = 0;
          mockPool.connect.mockResolvedValue(mockClient);

          mockClient.query.mockImplementation((sql: string) => {
            if (sql === 'BEGIN') {
              return Promise.resolve();
            }
            if (sql === 'ROLLBACK') {
              return Promise.resolve();
            }
            if (sql === 'COMMIT') {
              return Promise.resolve();
            }

            attemptCount++;
            if (attemptCount < 2) {
              const error = new Error('Deadlock detected');
              (error as any).code = '40P01';
              throw error;
            }
            return Promise.resolve({ rows: [data], rowCount: 1 });
          });

          // Transaction should succeed after retry
          const result = await transaction(
            async (client) => {
              const res = await client.query('INSERT INTO test VALUES ($1, $2)', [data.value1, data.value2]);
              return res.rows[0];
            },
            { maxAttempts: 3, delayMs: 1 }
          );

          // Verify transaction was retried
          expect(attemptCount).toBe(2);
          
          // Verify ROLLBACK was called on first failure
          const rollbackCalls = mockClient.query.mock.calls.filter(
            (call: any[]) => call[0] === 'ROLLBACK'
          );
          expect(rollbackCalls.length).toBeGreaterThanOrEqual(1);

          // Verify COMMIT was called on success
          const commitCalls = mockClient.query.mock.calls.filter(
            (call: any[]) => call[0] === 'COMMIT'
          );
          expect(commitCalls.length).toBe(1);

          // Verify client was released
          expect(mockClient.release).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle concurrent retry attempts independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
        async (queries) => {
          // Each query fails once then succeeds
          const attemptCounts = new Map<string, number>();

          mockPool.query.mockImplementation((query: string) => {
            const count = attemptCounts.get(query) || 0;
            attemptCounts.set(query, count + 1);

            if (count === 0) {
              const error = new Error('Connection reset');
              (error as any).code = 'ECONNRESET';
              throw error;
            }

            return Promise.resolve({ rows: [{ query }], rowCount: 1 });
          });

          // Execute all queries concurrently
          const results = await Promise.all(
            queries.map((q) => queryWithRetry(q, [], { maxAttempts: 3, delayMs: 1 }))
          );

          // All queries should succeed
          expect(results).toHaveLength(queries.length);

          // Each unique query should have been attempted exactly twice
          const uniqueQueries = new Set(queries);
          uniqueQueries.forEach((query) => {
            expect(attemptCounts.get(query)).toBe(2);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
