/**
 * Enterprise Link Preview Cache
 * Multi-layer caching system using Redis and Supabase
 * Phase 1: Enterprise Link Post Component
 */

import { redis } from '@/lib/redis'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'
import type { LinkPreviewMetadata, LinkPreviewCacheEntry } from '@/types/link-preview'

const CACHE_PREFIX = 'link_preview:'
const REDIS_TTL = 60 * 60 // 1 hour in seconds
const DB_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Get cache key for Redis
 */
function getCacheKey(url: string): string {
  return `${CACHE_PREFIX}${url}`
}

/**
 * Get link preview from Redis cache
 */
async function getFromRedis(url: string): Promise<LinkPreviewMetadata | null> {
  if (!redis) {
    return null
  }

  try {
    const key = getCacheKey(url)
    const cached = await redis.get<LinkPreviewCacheEntry>(key)
    
    if (cached && Date.now() < cached.expires_at) {
      return cached.metadata
    }
    
    return null
  } catch (error) {
    console.warn('[link-cache] Redis get failed:', error)
    return null
  }
}

/**
 * Store link preview in Redis cache
 */
async function setInRedis(
  url: string,
  metadata: LinkPreviewMetadata,
  ttl: number = REDIS_TTL
): Promise<void> {
  if (!redis) {
    return
  }

  try {
    const key = getCacheKey(url)
    const expiresAt = Date.now() + ttl * 1000
    
    const cacheEntry: LinkPreviewCacheEntry = {
      url,
      metadata,
      cached_at: Date.now(),
      expires_at: expiresAt,
      hit_count: 0,
    }
    
    await redis.set(key, cacheEntry, { ex: ttl })
  } catch (error) {
    console.warn('[link-cache] Redis set failed:', error)
  }
}

/**
 * Get link preview from database cache
 */
async function getFromDatabase(
  normalizedUrl: string
): Promise<LinkPreviewMetadata | null> {
  try {
    const { data, error } = await (supabaseAdmin
      .from('link_previews')
      .select('*')
      .eq('normalized_url', normalizedUrl)
      .eq('is_valid', true)
      .single() as any)

    if (error || !data) {
      return null
    }

    // Check if expired
    const linkPreview = data as { expires_at?: string | null; [key: string]: any }
    if (linkPreview.expires_at && new Date(linkPreview.expires_at) < new Date()) {
      return null
    }

    // Convert database row to LinkPreviewMetadata
    return {
      id: linkPreview.id,
      url: linkPreview.url,
      normalized_url: linkPreview.normalized_url,
      title: linkPreview.title || undefined,
      description: linkPreview.description || undefined,
      image_url: linkPreview.image_url || undefined,
      thumbnail_url: linkPreview.thumbnail_url || undefined,
      favicon_url: linkPreview.favicon_url || undefined,
      site_name: linkPreview.site_name || undefined,
      domain: linkPreview.domain,
      link_type: linkPreview.link_type || undefined,
      author: linkPreview.author || undefined,
      published_at: linkPreview.published_at || undefined,
      metadata: (linkPreview.metadata as Record<string, any>) || {},
      security_score: linkPreview.security_score || undefined,
      extracted_at: linkPreview.extracted_at || undefined,
      expires_at: linkPreview.expires_at || undefined,
      is_valid: linkPreview.is_valid,
      created_at: linkPreview.created_at || undefined,
      updated_at: linkPreview.updated_at || undefined,
    }
  } catch (error) {
    console.warn('[link-cache] Database get failed:', error)
    return null
  }
}

/**
 * Store link preview in database cache
 */
async function setInDatabase(metadata: LinkPreviewMetadata): Promise<void> {
  try {
    // Ensure metadata has an id (required for upsert)
    const metadataWithId = {
      ...metadata,
      id: metadata.id || randomUUID(),
    }

    const { error } = await (supabaseAdmin.from('link_previews') as any).upsert(
      {
        id: metadataWithId.id,
        url: metadataWithId.url,
        normalized_url: metadataWithId.normalized_url,
        title: metadataWithId.title || null,
        description: metadataWithId.description || null,
        image_url: metadataWithId.image_url || null,
        thumbnail_url: metadataWithId.thumbnail_url || null,
        favicon_url: metadataWithId.favicon_url || null,
        site_name: metadataWithId.site_name || null,
        domain: metadataWithId.domain,
        link_type: metadataWithId.link_type || null,
        author: metadataWithId.author || null,
        published_at: metadataWithId.published_at || null,
        metadata: metadataWithId.metadata || {},
        security_score: metadataWithId.security_score || null,
        extracted_at: metadataWithId.extracted_at || null,
        expires_at: metadataWithId.expires_at || null,
        is_valid: metadataWithId.is_valid ?? true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'normalized_url',
        ignoreDuplicates: false,
      }
    )

    if (error) {
      console.error('[link-cache] Database upsert failed:', error)
      throw error
    }
  } catch (error) {
    console.error('[link-cache] Database set failed:', error)
    throw error
  }
}

/**
 * Get link preview from cache (Redis first, then database)
 */
export async function getCachedPreview(
  url: string,
  normalizedUrl: string
): Promise<LinkPreviewMetadata | null> {
  // Try Redis first (fastest)
  const redisCache = await getFromRedis(url)
  if (redisCache) {
    return redisCache
  }

  // Try database (slower but persistent)
  const dbCache = await getFromDatabase(normalizedUrl)
  if (dbCache) {
    // Refresh Redis cache with database result
    await setInRedis(url, dbCache)
    return dbCache
  }

  return null
}

/**
 * Store link preview in cache (both Redis and database)
 */
export async function setCachedPreview(
  metadata: LinkPreviewMetadata
): Promise<void> {
  // Ensure metadata has an id
  const metadataWithId = {
    ...metadata,
    id: metadata.id || randomUUID(),
  }

  // Store in database (persistent)
  await setInDatabase(metadataWithId)

  // Store in Redis (fast access)
  await setInRedis(metadataWithId.url, metadataWithId)
}

/**
 * Invalidate cache for a URL
 */
export async function invalidateCache(url: string, normalizedUrl: string): Promise<void> {
  // Remove from Redis
  if (redis) {
    try {
      const key = getCacheKey(url)
      await redis.del(key)
    } catch (error) {
      console.warn('[link-cache] Redis delete failed:', error)
    }
  }

  // Mark as invalid in database
  try {
    await (supabaseAdmin
      .from('link_previews') as any)
      .update({ is_valid: false, updated_at: new Date().toISOString() })
      .eq('normalized_url', normalizedUrl)
  } catch (error) {
    console.warn('[link-cache] Database invalidate failed:', error)
  }
}

/**
 * Clear expired cache entries from database
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('link_previews')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.warn('[link-cache] Clear expired failed:', error)
    }
  } catch (error) {
    console.warn('[link-cache] Clear expired failed:', error)
  }
}
