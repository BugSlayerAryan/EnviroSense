/**
 * Simple in-memory request cache with TTL (Time To Live)
 * Reduces duplicate API calls within the cache window
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // in milliseconds
}

class RequestCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private defaultTtl: number

  constructor(ttlMs = 300000) {
    // 5 minutes default TTL
    this.defaultTtl = ttlMs
  }

  set(key: string, data: T, ttl = this.defaultTtl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

// Global cache instance - shared across all API calls
const globalCache = new RequestCache(300000) // 5 minute TTL

export { RequestCache, globalCache }
