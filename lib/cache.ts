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
    await redis.set(key, data, { ex: ttl })
  }

  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null // Return null if Redis is unavailable
    return await redis.get<T>(key)
  }

  async delete(key: string): Promise<void> {
    if (!redis) return // Skip deletion if Redis is unavailable
    await redis.del(key)
  }

  async clear(): Promise<void> {
    if (!redis) return // Skip clearing if Redis is unavailable
    await redis.flushdb()
  }
}

export const cache = Cache.getInstance()
