/**
 * Query Result Cache
 *
 * Simple in-memory cache for API route query results.
 * Helps reduce database load for frequently accessed, rarely changed data.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
}

interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum number of entries
}

const DEFAULT_TTL = 60 * 1000 // 1 minute
const DEFAULT_MAX_SIZE = 100

class QueryCache<T = any> {
  private cache: Map<string, CacheEntry<T>>
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map()
    this.config = {
      ttl: config.ttl || DEFAULT_TTL,
      maxSize: config.maxSize || DEFAULT_MAX_SIZE
    }
  }

  /**
   * Generate a cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&')
    return `${prefix}:${sortedParams}`
  }

  /**
   * Get cached data
   */
  get(prefix: string, params: Record<string, any> = {}): T | null {
    const key = this.generateKey(prefix, params)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    const now = Date.now()
    if (now - entry.timestamp > this.config.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update hit count
    entry.hits++
    return entry.data
  }

  /**
   * Set cached data
   */
  set(prefix: string, params: Record<string, any>, data: T): void {
    const key = this.generateKey(prefix, params)

    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.config.maxSize) {
      let oldestKey = ''
      let oldestTime = Infinity

      for (const [k, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp
          oldestKey = k
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    })
  }

  /**
   * Invalidate cache entries matching a prefix
   */
  invalidate(prefix: string): void {
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix + ':')) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ key: string; hits: number; age: number }> } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: now - entry.timestamp
    }))

    return {
      size: this.cache.size,
      entries
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

// Singleton instances for different data types
export const testCasesCache = new QueryCache<any>({ ttl: 30 * 1000, maxSize: 50 })
export const modulesCache = new QueryCache<any>({ ttl: 60 * 1000, maxSize: 20 })
export const executionsCache = new QueryCache<any>({ ttl: 10 * 1000, maxSize: 100 })
export const previewCache = new QueryCache<any>({ ttl: 30 * 1000, maxSize: 50 })

// Periodic cleanup
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    testCasesCache.cleanup()
    modulesCache.cleanup()
    executionsCache.cleanup()
    previewCache.cleanup()
  }, 60 * 1000) // Every minute
}
