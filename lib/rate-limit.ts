import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'

// Create a new ratelimiter, that allows 10 requests per 10 seconds
// You can change the limit and window as needed
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
})

export async function checkRateLimit(identifier: string) {
  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

    return {
      success,
      limit,
      reset,
      remaining,
    }
  } catch (error) {
    logger.error({ err: error }, 'Rate limit check failed')
    // Fail open if Redis is down to not block users
    return {
      success: true,
      limit: 10,
      reset: 0,
      remaining: 10,
    }
  }
}
