/**
 * AvailabilityCache - Centralized caching layer for preorder operations
 * 
 * Provides in-memory caching with TTL support and pattern-based invalidation.
 * Used to cache availability calculations, slot capacity, product lists, and menu weeks.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class AvailabilityCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get a value from the cache
   * Returns null if the key doesn't exist or has expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in the cache with a TTL in seconds
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate all cache entries matching a pattern
   * Pattern can be a substring that appears in the key
   */
  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   * Should be called periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    keys.forEach((key) => {
      const entry = this.cache.get(key);
      if (entry && now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    });
  }
}

// Singleton instance
export const availabilityCache = new AvailabilityCache();
