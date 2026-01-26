/**
 * Tag Rate Limiting Service
 * Prevents abuse by limiting tagging frequency
 */

import { createClient } from '@/lib/supabase/server'

export interface RateLimitCheck {
  allowed: boolean
  remaining: number
  resetAt: Date
  reason?: string
}

const RATE_LIMITS = {
  mentions_per_hour: 50,
  mentions_per_day: 200,
  hashtags_per_hour: 100,
  hashtags_per_day: 500,
}

/**
 * Check rate limit for tagging
 */
export async function checkTagRateLimit(
  userId: string,
  tagType: 'user' | 'entity' | 'topic',
  count: number = 1
): Promise<RateLimitCheck> {
  const supabase = await createClient()

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Get recent taggings
  const { data: recentTaggings, error } = await supabase
    .from('taggings')
    .select('id, created_at, tags!inner(type)')
    .eq('tagged_by', userId)
    .gte('created_at', oneDayAgo.toISOString())

  if (error) {
    console.error('Error checking rate limit:', error)
    // Fail open - allow tagging if we can't check
    return {
      allowed: true,
      remaining: 1000,
      resetAt: new Date(now.getTime() + 60 * 60 * 1000),
    }
  }

  // Count by type and time window
  const hourlyMentions = (recentTaggings || []).filter(
    (t: any) =>
      (t.tags.type === 'user' || t.tags.type === 'entity') &&
      new Date(t.created_at) >= oneHourAgo
  ).length

  const dailyMentions = (recentTaggings || []).filter(
    (t: any) => t.tags.type === 'user' || t.tags.type === 'entity'
  ).length

  const hourlyHashtags = (recentTaggings || []).filter(
    (t: any) => t.tags.type === 'topic' && new Date(t.created_at) >= oneHourAgo
  ).length

  const dailyHashtags = (recentTaggings || []).filter(
    (t: any) => t.tags.type === 'topic'
  ).length

  // Check limits based on tag type
  if (tagType === 'user' || tagType === 'entity') {
    if (hourlyMentions + count > RATE_LIMITS.mentions_per_hour) {
      return {
        allowed: false,
        remaining: Math.max(0, RATE_LIMITS.mentions_per_hour - hourlyMentions),
        resetAt: new Date(now.getTime() + 60 * 60 * 1000),
        reason: `Rate limit exceeded: ${RATE_LIMITS.mentions_per_hour} mentions per hour`,
      }
    }

    if (dailyMentions + count > RATE_LIMITS.mentions_per_day) {
      return {
        allowed: false,
        remaining: Math.max(0, RATE_LIMITS.mentions_per_day - dailyMentions),
        resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        reason: `Rate limit exceeded: ${RATE_LIMITS.mentions_per_day} mentions per day`,
      }
    }

    return {
      allowed: true,
      remaining: Math.min(
        RATE_LIMITS.mentions_per_hour - hourlyMentions,
        RATE_LIMITS.mentions_per_day - dailyMentions
      ),
      resetAt: new Date(now.getTime() + 60 * 60 * 1000),
    }
  } else if (tagType === 'topic') {
    if (hourlyHashtags + count > RATE_LIMITS.hashtags_per_hour) {
      return {
        allowed: false,
        remaining: Math.max(0, RATE_LIMITS.hashtags_per_hour - hourlyHashtags),
        resetAt: new Date(now.getTime() + 60 * 60 * 1000),
        reason: `Rate limit exceeded: ${RATE_LIMITS.hashtags_per_hour} hashtags per hour`,
      }
    }

    if (dailyHashtags + count > RATE_LIMITS.hashtags_per_day) {
      return {
        allowed: false,
        remaining: Math.max(0, RATE_LIMITS.hashtags_per_day - dailyHashtags),
        resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        reason: `Rate limit exceeded: ${RATE_LIMITS.hashtags_per_day} hashtags per day`,
      }
    }

    return {
      allowed: true,
      remaining: Math.min(
        RATE_LIMITS.hashtags_per_hour - hourlyHashtags,
        RATE_LIMITS.hashtags_per_day - dailyHashtags
      ),
      resetAt: new Date(now.getTime() + 60 * 60 * 1000),
    }
  }

  // Default: allow
  return {
    allowed: true,
    remaining: 1000,
    resetAt: new Date(now.getTime() + 60 * 60 * 1000),
  }
}
