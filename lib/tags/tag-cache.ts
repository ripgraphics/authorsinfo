/**
 * Tag Cache Service
 * Caches search results and top tags for performance
 */

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, { data: any; expires: number }>()

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached value
 */
export function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() > cached.expires) {
    cache.delete(key)
    return null
  }

  return cached.data as T
}

/**
 * Set cached value
 */
export function setCached<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  })
}

/**
 * Clear cache for a key pattern
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

/**
 * Generate cache key for tag search
 */
export function getSearchCacheKey(
  query: string,
  types?: string[],
  limit?: number
): string {
  return `tag_search:${query}:${types?.join(',') || 'all'}:${limit || 20}`
}

/**
 * Generate cache key for top tags
 */
export function getTopTagsCacheKey(type?: string, limit?: number): string {
  return `top_tags:${type || 'all'}:${limit || 20}`
}
