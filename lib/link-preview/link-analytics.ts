/**
 * Enterprise Link Analytics Service
 * Tracks link engagement (views, clicks, shares, bookmarks)
 * Phase 4: Enterprise Link Post Component
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { LinkAnalyticsEvent } from '@/types/link-preview'

/**
 * Track link analytics event
 */
export async function trackLinkEvent(
  event: Omit<LinkAnalyticsEvent, 'id' | 'created_at'>
): Promise<void> {
  try {
    const { error } = await (supabaseAdmin.from('link_analytics') as any).insert({
      link_preview_id: event.link_preview_id,
      post_id: event.post_id || null,
      user_id: event.user_id || null,
      event_type: event.event_type,
      clicked_at: event.clicked_at || new Date().toISOString(),
      user_agent: event.user_agent || null,
      referrer: event.referrer || null,
      ip_address: event.ip_address || null,
    })

    if (error) {
      console.error('[link-analytics] Track event failed:', error)
      // Don't throw - analytics failures shouldn't break the app
    }
  } catch (error) {
    console.error('[link-analytics] Track event error:', error)
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Track link view
 */
export async function trackLinkView(
  linkPreviewId: string,
  postId?: string,
  userId?: string,
  userAgent?: string,
  referrer?: string
): Promise<void> {
  await trackLinkEvent({
    link_preview_id: linkPreviewId,
    post_id: postId,
    user_id: userId,
    event_type: 'view',
    user_agent: userAgent,
    referrer,
  })
}

/**
 * Track link click
 */
export async function trackLinkClick(
  linkPreviewId: string,
  postId?: string,
  userId?: string,
  userAgent?: string,
  referrer?: string,
  ipAddress?: string
): Promise<void> {
  await trackLinkEvent({
    link_preview_id: linkPreviewId,
    post_id: postId,
    user_id: userId,
    event_type: 'click',
    user_agent: userAgent,
    referrer,
    ip_address: ipAddress,
  })
}

/**
 * Track link share
 */
export async function trackLinkShare(
  linkPreviewId: string,
  postId?: string,
  userId?: string
): Promise<void> {
  await trackLinkEvent({
    link_preview_id: linkPreviewId,
    post_id: postId,
    user_id: userId,
    event_type: 'share',
  })
}

/**
 * Track link bookmark
 */
export async function trackLinkBookmark(
  linkPreviewId: string,
  postId?: string,
  userId?: string
): Promise<void> {
  await trackLinkEvent({
    link_preview_id: linkPreviewId,
    post_id: postId,
    user_id: userId,
    event_type: 'bookmark',
  })
}

/**
 * Get link analytics summary
 */
export async function getLinkAnalytics(
  linkPreviewId: string
): Promise<{
  views: number
  clicks: number
  shares: number
  bookmarks: number
  clickThroughRate: number
}> {
  try {
    const { data, error } = await (supabaseAdmin
      .from('link_analytics')
      .select('event_type')
      .eq('link_preview_id', linkPreviewId) as any)

    if (error) {
      console.error('[link-analytics] Get analytics failed:', error)
      return {
        views: 0,
        clicks: 0,
        shares: 0,
        bookmarks: 0,
        clickThroughRate: 0,
      }
    }

    const events = data || []
    const views = events.filter((e: any) => e.event_type === 'view').length
    const clicks = events.filter((e: any) => e.event_type === 'click').length
    const shares = events.filter((e: any) => e.event_type === 'share').length
    const bookmarks = events.filter((e: any) => e.event_type === 'bookmark').length
    const clickThroughRate = views > 0 ? (clicks / views) * 100 : 0

    return {
      views,
      clicks,
      shares,
      bookmarks,
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
    }
  } catch (error) {
    console.error('[link-analytics] Get analytics error:', error)
    return {
      views: 0,
      clicks: 0,
      shares: 0,
      bookmarks: 0,
      clickThroughRate: 0,
    }
  }
}

/**
 * Get popular links
 */
export async function getPopularLinks(
  limit: number = 10,
  days: number = 7
): Promise<
  Array<{
    link_preview_id: string
    url: string
    title?: string
    clicks: number
    views: number
    clickThroughRate: number
  }>
> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await (supabaseAdmin
      .from('link_analytics')
      .select('link_preview_id, event_type')
      .gte('clicked_at', since.toISOString()) as any)

    if (error) {
      console.error('[link-analytics] Get popular links failed:', error)
      return []
    }

    // Aggregate by link_preview_id
    const aggregated = new Map<
      string,
      { clicks: number; views: number }
    >()

    for (const event of data || []) {
      const linkId = event.link_preview_id
      if (!aggregated.has(linkId)) {
        aggregated.set(linkId, { clicks: 0, views: 0 })
      }

      const stats = aggregated.get(linkId)!
      if (event.event_type === 'click') {
        stats.clicks++
      } else if (event.event_type === 'view') {
        stats.views++
      }
    }

    // Get link preview details
    const linkIds = Array.from(aggregated.keys())
    const { data: linkPreviews } = await (supabaseAdmin
      .from('link_previews')
      .select('id, url, title')
      .in('id', linkIds) as any)

    interface LinkPreviewRow {
      id: string
      url: string
      title?: string | null
    }

    const linkMap = new Map<string, LinkPreviewRow>(
      (linkPreviews || []).map((lp: LinkPreviewRow) => [lp.id, lp])
    )

    // Build result
    const result = Array.from(aggregated.entries())
      .map(([linkId, stats]) => {
        const linkPreview = linkMap.get(linkId)
        const clickThroughRate =
          stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0

        return {
          link_preview_id: linkId,
          url: linkPreview?.url || '',
          title: linkPreview?.title || undefined,
          clicks: stats.clicks,
          views: stats.views,
          clickThroughRate: Math.round(clickThroughRate * 100) / 100,
        }
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit)

    return result
  } catch (error) {
    console.error('[link-analytics] Get popular links error:', error)
    return []
  }
}
