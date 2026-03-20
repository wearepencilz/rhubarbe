/**
 * Unit Tests for AvailabilityCache
 * 
 * Tests cache hit/miss, TTL expiration, and invalidation patterns.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AvailabilityCache } from './availability-cache';

describe('AvailabilityCache', () => {
  let cache: AvailabilityCache;

  beforeEach(() => {
    cache = new AvailabilityCache();
    vi.useFakeTimers();
  });

  describe('get and set', () => {
    it('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should store and retrieve values', () => {
      const data = { test: 'value' };
      cache.set('key1', data, 60);
      expect(cache.get('key1')).toEqual(data);
    });

    it('should handle multiple keys independently', () => {
      cache.set('key1', { value: 1 }, 60);
      cache.set('key2', { value: 2 }, 60);
      cache.set('key3', { value: 3 }, 60);

      expect(cache.get('key1')).toEqual({ value: 1 });
      expect(cache.get('key2')).toEqual({ value: 2 });
      expect(cache.get('key3')).toEqual({ value: 3 });
    });

    it('should overwrite existing keys', () => {
      cache.set('key1', { value: 'old' }, 60);
      cache.set('key1', { value: 'new' }, 60);
      expect(cache.get('key1')).toEqual({ value: 'new' });
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', () => {
      cache.set('key1', { value: 'test' }, 60); // 60 second TTL
      
      // Advance time by 61 seconds
      vi.advanceTimersByTime(61 * 1000);
      
      expect(cache.get('key1')).toBeNull();
    });

    it('should return value before expiration', () => {
      cache.set('key1', { value: 'test' }, 60); // 60 second TTL
      
      // Advance time by 59 seconds (still valid)
      vi.advanceTimersByTime(59 * 1000);
      
      expect(cache.get('key1')).toEqual({ value: 'test' });
    });

    it('should handle different TTLs for different keys', () => {
      cache.set('short', { value: 'short' }, 30); // 30 seconds
      cache.set('long', { value: 'long' }, 120); // 120 seconds
      
      // Advance time by 31 seconds
      vi.advanceTimersByTime(31 * 1000);
      
      expect(cache.get('short')).toBeNull();
      expect(cache.get('long')).toEqual({ value: 'long' });
    });

    it('should clean up expired entries on get', () => {
      cache.set('key1', { value: 'test' }, 60);
      
      // Advance time to expire
      vi.advanceTimersByTime(61 * 1000);
      
      // Get should return null and clean up
      expect(cache.get('key1')).toBeNull();
      
      // Verify it's actually removed
      const stats = cache.getStats();
      expect(stats.keys).not.toContain('key1');
    });
  });

  describe('invalidate', () => {
    it('should invalidate all keys matching a pattern', () => {
      cache.set('availability:product1:2024-01-01:loc1', { value: 1 }, 60);
      cache.set('availability:product1:2024-01-02:loc1', { value: 2 }, 60);
      cache.set('availability:product2:2024-01-01:loc1', { value: 3 }, 60);
      cache.set('slot:2024-01-01:loc1', { value: 4 }, 60);
      
      // Invalidate all availability caches
      cache.invalidate('availability:');
      
      expect(cache.get('availability:product1:2024-01-01:loc1')).toBeNull();
      expect(cache.get('availability:product1:2024-01-02:loc1')).toBeNull();
      expect(cache.get('availability:product2:2024-01-01:loc1')).toBeNull();
      expect(cache.get('slot:2024-01-01:loc1')).toEqual({ value: 4 });
    });

    it('should invalidate specific product availability', () => {
      cache.set('availability:product1:2024-01-01:loc1', { value: 1 }, 60);
      cache.set('availability:product1:2024-01-02:loc1', { value: 2 }, 60);
      cache.set('availability:product2:2024-01-01:loc1', { value: 3 }, 60);
      
      // Invalidate only product1
      cache.invalidate('availability:product1');
      
      expect(cache.get('availability:product1:2024-01-01:loc1')).toBeNull();
      expect(cache.get('availability:product1:2024-01-02:loc1')).toBeNull();
      expect(cache.get('availability:product2:2024-01-01:loc1')).toEqual({ value: 3 });
    });

    it('should handle patterns that match no keys', () => {
      cache.set('key1', { value: 1 }, 60);
      cache.set('key2', { value: 2 }, 60);
      
      // Invalidate non-existent pattern
      cache.invalidate('non-existent:');
      
      expect(cache.get('key1')).toEqual({ value: 1 });
      expect(cache.get('key2')).toEqual({ value: 2 });
    });

    it('should invalidate by date and location', () => {
      cache.set('slot:2024-01-01:loc1', { value: 1 }, 60);
      cache.set('slot:2024-01-01:loc2', { value: 2 }, 60);
      cache.set('slot:2024-01-02:loc1', { value: 3 }, 60);
      
      // Invalidate specific date and location
      cache.invalidate('slot:2024-01-01:loc1');
      
      expect(cache.get('slot:2024-01-01:loc1')).toBeNull();
      expect(cache.get('slot:2024-01-01:loc2')).toEqual({ value: 2 });
      expect(cache.get('slot:2024-01-02:loc1')).toEqual({ value: 3 });
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', { value: 1 }, 60);
      cache.set('key2', { value: 2 }, 60);
      cache.set('key3', { value: 3 }, 60);
      
      cache.clear();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
      
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });

    it('should allow new entries after clear', () => {
      cache.set('key1', { value: 1 }, 60);
      cache.clear();
      cache.set('key2', { value: 2 }, 60);
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toEqual({ value: 2 });
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      cache.set('key1', { value: 1 }, 30);
      cache.set('key2', { value: 2 }, 120);
      
      // Advance time to expire key1 but not key2
      vi.advanceTimersByTime(31 * 1000);
      
      cache.cleanup();
      
      const stats = cache.getStats();
      expect(stats.keys).not.toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should not affect valid entries', () => {
      cache.set('key1', { value: 1 }, 60);
      cache.set('key2', { value: 2 }, 60);
      
      // Advance time but not enough to expire
      vi.advanceTimersByTime(30 * 1000);
      
      cache.cleanup();
      
      expect(cache.get('key1')).toEqual({ value: 1 });
      expect(cache.get('key2')).toEqual({ value: 2 });
    });

    it('should handle empty cache', () => {
      cache.cleanup();
      
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct size and keys', () => {
      cache.set('key1', { value: 1 }, 60);
      cache.set('key2', { value: 2 }, 60);
      cache.set('key3', { value: 3 }, 60);
      
      const stats = cache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
      expect(stats.keys).toContain('key3');
    });

    it('should return empty stats for empty cache', () => {
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });
});
