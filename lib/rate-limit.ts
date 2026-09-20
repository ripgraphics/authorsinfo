import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'

// Create the limiter only when the provider is configured. Local tests and
// development must fail open immediately instead of attempting a malformed
// network request to Upstash.
const ratelimit = process.env.NODE_ENV !== 'test'
  && process.env.UPSTASH_REDIS_REST_URL
  && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null

export async function checkRateLimit(identifier: string) {
  if (!ratelimit) {
    return { success: true, limit: 10, reset: 0, remaining: 10 }
  }

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
