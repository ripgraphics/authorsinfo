import { redis } from './redis'

class Cache {
  private static instance: Cache
  private defaultTTL: number = 5 * 60 // 5 minutes in seconds

  private constructor() {}

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache()
    }
    return Cache.instance
  }

  async set<T>(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    if (!redis) return // Skip caching if Redis is unavailable
    try {
      await redis.set(key, data, { ex: ttl })
    } catch (error) {
      console.warn('[cache] set failed; continuing without cache', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null // Return null if Redis is unavailable
    try {
      return await redis.get<T>(key)
    } catch (error) {
      console.warn('[cache] get failed; treating as cache miss', {
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }

  async delete(key: string): Promise<void> {
    if (!redis) return // Skip deletion if Redis is unavailable
    try {
      await redis.del(key)
    } catch (error) {
      console.warn('[cache] delete failed; continuing', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  async clear(): Promise<void> {
    if (!redis) return // Skip clearing if Redis is unavailable
    try {
      await redis.flushdb()
    } catch (error) {
      console.warn('[cache] clear failed; continuing', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

export const cache = Cache.getInstance()
