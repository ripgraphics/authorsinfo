/**
 * Tag Analytics Service
 * Advanced analytics for tag impact and performance
 */

import { createClient } from '@/lib/supabase/server'

export interface TagImpactMetrics {
  tagId: string
  tagName: string
  engagementUplift: number
  avgLikes: number
  avgComments: number
  avgShares: number
  reachScore: number
  viralCoefficient: number
}

export interface TagHeatmapData {
  entityType: string
  tagType: string
  usageCount: number
  avgEngagement: number
  topTags: Array<{ tagId: string; tagName: string; count: number }>
}

export interface TagLifecycleData {
  tagId: string
  tagName: string
  createdAt: string
  growthRate: number
  declineRate: number
  peakUsage: number
  peakDate: string
  currentUsage: number
  retentionRate: number
}

/**
 * Calculate engagement impact metrics for a tag
 */
export async function getTagImpactMetrics(
  tagId: string,
  daysBack: number = 30
): Promise<TagImpactMetrics | null> {
  const supabase = await createClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)

  // Get tag info
  const { data: tag } = await supabase
    .from('tags')
    .select('id, name')
    .eq('id', tagId)
    .single()

  if (!tag) return null

  // Get taggings and their associated content engagement
  const { data: taggings } = await supabase
    .from('taggings')
    .select('entity_type, entity_id, created_at')
    .eq('tag_id', tagId)
    .gte('created_at', cutoffDate.toISOString())

  if (!taggings || taggings.length === 0) {
    return {
      tagId,
      tagName: tag.name,
      engagementUplift: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      reachScore: 0,
      viralCoefficient: 0,
    }
  }

  // Calculate engagement metrics from posts/activities
  let totalLikes = 0
  let totalComments = 0
  let totalShares = 0
  let contentCount = 0

  for (const tagging of taggings) {
    if (tagging.entity_type === 'post') {
      const { data: post } = await supabase
        .from('posts')
        .select('like_count, comment_count, share_count')
        .eq('id', tagging.entity_id)
        .single()

      if (post) {
        totalLikes += post.like_count || 0
        totalComments += post.comment_count || 0
        totalShares += post.share_count || 0
        contentCount++
      }
    } else if (tagging.entity_type === 'activity') {
      const { data: activity } = await supabase
        .from('activities')
        .select('like_count, comment_count, share_count')
        .eq('id', tagging.entity_id)
        .single()

      if (activity) {
        totalLikes += activity.like_count || 0
        totalComments += activity.comment_count || 0
        totalShares += activity.share_count || 0
        contentCount++
      }
    }
  }

  const avgLikes = contentCount > 0 ? totalLikes / contentCount : 0
  const avgComments = contentCount > 0 ? totalComments / contentCount : 0
  const avgShares = contentCount > 0 ? totalShares / contentCount : 0

  // Calculate engagement uplift (compared to baseline)
  // Baseline: average engagement for content without this tag
  const baselineEngagement = 10 // Placeholder - would calculate from all content
  const taggedEngagement = avgLikes + avgComments + avgShares
  const engagementUplift = ((taggedEngagement - baselineEngagement) / baselineEngagement) * 100

  // Calculate reach score (based on shares and views)
  const reachScore = avgShares * 10 + avgComments * 5 + avgLikes * 2

  // Calculate viral coefficient (shares per view, simplified)
  const viralCoefficient = avgShares / Math.max(avgLikes, 1)

  return {
    tagId,
    tagName: tag.name,
    engagementUplift,
    avgLikes,
    avgComments,
    avgShares,
    reachScore,
    viralCoefficient,
  }
}

/**
 * Get tag heatmap data by entity type
 */
export async function getTagHeatmapData(): Promise<TagHeatmapData[]> {
  const supabase = await createClient()

  // Get tag usage by entity type and tag type
  const { data: taggings } = await supabase
    .from('taggings')
    .select(
      `
      entity_type,
      context,
      tag_id,
      tags!inner (
        id,
        name,
        type
      )
    `
    )

  if (!taggings) return []

  // Group by entity type and tag type
  const heatmap = new Map<string, TagHeatmapData>()

  for (const tagging of taggings) {
    const tag = (tagging as any).tags
    const key = `${tagging.entity_type}:${tag.type}`

    if (!heatmap.has(key)) {
      heatmap.set(key, {
        entityType: tagging.entity_type,
        tagType: tag.type,
        usageCount: 0,
        avgEngagement: 0,
        topTags: [],
      })
    }

    const data = heatmap.get(key)!
    data.usageCount++

    // Track top tags
    const existingTag = data.topTags.find((t) => t.tagId === tag.id)
    if (existingTag) {
      existingTag.count++
    } else {
      data.topTags.push({ tagId: tag.id, tagName: tag.name, count: 1 })
    }
  }

  // Calculate average engagement for each group
  for (const [key, data] of heatmap.entries()) {
    // Simplified - would calculate from actual engagement data
    data.avgEngagement = data.usageCount * 0.5
    data.topTags.sort((a, b) => b.count - a.count)
    data.topTags = data.topTags.slice(0, 10) // Top 10
  }

  return Array.from(heatmap.values())
}

/**
 * Get tag lifecycle analytics
 */
export async function getTagLifecycleData(tagId: string): Promise<TagLifecycleData | null> {
  const supabase = await createClient()

  // Get tag info
  const { data: tag } = await supabase
    .from('tags')
    .select('id, name, created_at')
    .eq('id', tagId)
    .single()

  if (!tag) return null

  // Get all taggings with dates
  const { data: taggings } = await supabase
    .from('taggings')
    .select('created_at')
    .eq('tag_id', tagId)
    .order('created_at', { ascending: true })

  if (!taggings || taggings.length === 0) {
    return {
      tagId,
      tagName: tag.name,
      createdAt: tag.created_at,
      growthRate: 0,
      declineRate: 0,
      peakUsage: 0,
      peakDate: tag.created_at,
      currentUsage: 0,
      retentionRate: 0,
    }
  }

  // Calculate usage over time (group by week)
  const weeklyUsage = new Map<string, number>()
  let peakUsage = 0
  let peakDate = tag.created_at

  for (const tagging of taggings) {
    const week = new Date(tagging.created_at).toISOString().split('T')[0].substring(0, 7) // YYYY-MM
    weeklyUsage.set(week, (weeklyUsage.get(week) || 0) + 1)

    if (weeklyUsage.get(week)! > peakUsage) {
      peakUsage = weeklyUsage.get(week)!
      peakDate = tagging.created_at
    }
  }

  // Calculate growth rate (first half vs second half)
  const weeks = Array.from(weeklyUsage.keys()).sort()
  const midPoint = Math.floor(weeks.length / 2)
  const firstHalf = weeks.slice(0, midPoint)
  const secondHalf = weeks.slice(midPoint)

  const firstHalfAvg =
    firstHalf.reduce((sum, week) => sum + (weeklyUsage.get(week) || 0), 0) / Math.max(firstHalf.length, 1)
  const secondHalfAvg =
    secondHalf.reduce((sum, week) => sum + (weeklyUsage.get(week) || 0), 0) / Math.max(secondHalf.length, 1)

  const growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0

  // Calculate decline rate (recent trend)
  const recentWeeks = weeks.slice(-4) // Last 4 weeks
  const olderWeeks = weeks.slice(-8, -4) // Previous 4 weeks

  const recentAvg =
    recentWeeks.reduce((sum, week) => sum + (weeklyUsage.get(week) || 0), 0) / Math.max(recentWeeks.length, 1)
  const olderAvg =
    olderWeeks.reduce((sum, week) => sum + (weeklyUsage.get(week) || 0), 0) / Math.max(olderWeeks.length, 1)

  const declineRate = olderAvg > 0 ? ((olderAvg - recentAvg) / olderAvg) * 100 : 0

  // Current usage (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const currentUsage = taggings.filter((t) => new Date(t.created_at) >= sevenDaysAgo).length

  // Retention rate (users who used tag multiple times)
  const { data: uniqueTaggers } = await supabase
    .from('taggings')
    .select('tagged_by')
    .eq('tag_id', tagId)
    .not('tagged_by', 'is', null)

  const taggerCounts = new Map<string, number>()
  for (const tagging of uniqueTaggers || []) {
    taggerCounts.set(tagging.tagged_by, (taggerCounts.get(tagging.tagged_by) || 0) + 1)
  }

  const repeatTaggers = Array.from(taggerCounts.values()).filter((count) => count > 1).length
  const retentionRate =
    taggerCounts.size > 0 ? (repeatTaggers / taggerCounts.size) * 100 : 0

  return {
    tagId,
    tagName: tag.name,
    createdAt: tag.created_at,
    growthRate,
    declineRate,
    peakUsage,
    peakDate,
    currentUsage,
    retentionRate,
  }
}
