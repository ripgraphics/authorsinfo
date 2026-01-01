import { Redis } from '@upstash/redis'

let redis: Redis | null = null

// Only initialize Redis if environment variables are set
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch (error) {
    console.warn('Failed to initialize Redis, caching disabled:', error)
    redis = null
  }
}

export { redis }
