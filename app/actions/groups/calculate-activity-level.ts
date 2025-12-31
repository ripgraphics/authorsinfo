'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import type { ActivityLevelDefinition } from './get-group-constants'
import { getActivityLevelDefinitions } from './get-group-constants'

/**
 * Calculate activity level for a group based on recent activity
 * Uses database-defined thresholds (single source of truth)
 */
export async function calculateGroupActivityLevel(groupId: string): Promise<{
  success: boolean
  levelKey?: string
  activityCount?: number
  error?: string
}> {
  try {
    // Get activity level definitions from database (single source of truth)
    const definitionsResult = await getActivityLevelDefinitions()
    if (!definitionsResult.success || !definitionsResult.definitions) {
      return {
        success: false,
        error: 'Failed to fetch activity level definitions',
      }
    }

    const definitions = definitionsResult.definitions.sort(
      (a, b) => b.min_activities - a.min_activities
    )

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

    let totalActivityCount = 0

    // Count posts/comments from group_content in last 30 days
    const { count: contentCount, error: contentError } = await supabaseAdmin
      .from('group_content')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .gte('created_at', thirtyDaysAgoISO)

    if (contentError) {
      console.error('Error counting group content:', contentError)
    } else {
      totalActivityCount += contentCount || 0
    }

    // Count new member joins in last 30 days
    const { count: memberCount, error: memberError } = await supabaseAdmin
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .gte('joined_at', thirtyDaysAgoISO)

    if (memberError) {
      console.error('Error counting new members:', memberError)
    } else {
      totalActivityCount += memberCount || 0
    }

    // Count events in last 30 days (created or started)
    const { count: eventCount, error: eventError } = await supabaseAdmin
      .from('group_events')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .gte('created_at', thirtyDaysAgoISO)

    if (eventError) {
      console.error('Error counting events:', eventError)
    } else {
      totalActivityCount += eventCount || 0
    }

    // Determine activity level based on thresholds from database
    let levelKey = 'inactive' // Default to lowest level
    for (const definition of definitions) {
      if (totalActivityCount >= definition.min_activities) {
        if (definition.max_activities === null || totalActivityCount <= definition.max_activities) {
          levelKey = definition.level_key
          break
        }
      }
    }

    return {
      success: true,
      levelKey,
      activityCount: totalActivityCount,
    }
  } catch (error) {
    console.error('Unexpected error calculating activity level:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Calculate activity levels for multiple groups (optimized batch version)
 */
export async function calculateMultipleGroupActivityLevels(groupIds: string[]): Promise<{
  success: boolean
  levels?: Record<string, { levelKey: string; activityCount: number }>
  error?: string
}> {
  try {
    // Get activity level definitions
    const definitionsResult = await getActivityLevelDefinitions()
    if (!definitionsResult.success || !definitionsResult.definitions) {
      return {
        success: false,
        error: 'Failed to fetch activity level definitions',
      }
    }

    const definitions = definitionsResult.definitions.sort(
      (a, b) => b.min_activities - a.min_activities
    )

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

    const results: Record<string, { levelKey: string; activityCount: number }> = {}

    // Initialize all groups with 0 activity
    groupIds.forEach((id) => {
      results[id] = { levelKey: 'inactive', activityCount: 0 }
    })

    // Count content for all groups
    const { data: contentCounts, error: contentError } = await supabaseAdmin
      .from('group_content')
      .select('group_id')
      .in('group_id', groupIds)
      .gte('created_at', thirtyDaysAgoISO)

    if (!contentError && contentCounts) {
      contentCounts.forEach((item) => {
        if (results[item.group_id]) {
          results[item.group_id].activityCount += 1
        }
      })
    }

    // Count members for all groups
    const { data: memberCounts, error: memberError } = await supabaseAdmin
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds)
      .gte('joined_at', thirtyDaysAgoISO)

    if (!memberError && memberCounts) {
      memberCounts.forEach((item) => {
        if (results[item.group_id]) {
          results[item.group_id].activityCount += 1
        }
      })
    }

    // Count events for all groups
    const { data: eventCounts, error: eventError } = await supabaseAdmin
      .from('group_events')
      .select('group_id')
      .in('group_id', groupIds)
      .gte('created_at', thirtyDaysAgoISO)

    if (!eventError && eventCounts) {
      eventCounts.forEach((item) => {
        if (results[item.group_id]) {
          results[item.group_id].activityCount += 1
        }
      })
    }

    // Determine activity levels based on thresholds
    Object.keys(results).forEach((groupId) => {
      const activityCount = results[groupId].activityCount
      let levelKey = 'inactive'

      for (const definition of definitions) {
        if (activityCount >= definition.min_activities) {
          if (definition.max_activities === null || activityCount <= definition.max_activities) {
            levelKey = definition.level_key
            break
          }
        }
      }

      results[groupId].levelKey = levelKey
    })

    return {
      success: true,
      levels: results,
    }
  } catch (error) {
    console.error('Unexpected error calculating multiple activity levels:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}
