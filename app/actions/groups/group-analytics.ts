'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'
import { supabaseAdmin } from '@/lib/supabase/server'

export interface GroupAnalyticsParams {
  groupId: string
  startDate?: string
  endDate?: string
}

export interface GroupAnalyticsResult {
  success: boolean
  analytics?: {
    memberStats: {
      total: number
      active: number
      new: number
    }
    contentStats: {
      total: number
      byType: Record<string, number>
      recent: number
    }
    engagementStats: {
      totalLikes: number
      totalComments: number
      totalViews: number
      avgEngagement: number
    }
    eventStats: {
      total: number
      upcoming: number
      past: number
    }
    activityLog?: any[]
  }
  error?: string
}

/**
 * Get comprehensive analytics for a group
 */
export async function getGroupAnalytics(
  params: GroupAnalyticsParams
): Promise<GroupAnalyticsResult> {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Check permission
    const hasPermission = await checkGroupPermission(params.groupId, user.id, 'manage_group')
    if (!hasPermission) {
      return {
        success: false,
        error: 'You do not have permission to view analytics',
      }
    }

    // Build date filter
    const dateFilter: { gte?: string; lte?: string } = {}
    if (params.startDate) {
      dateFilter.gte = params.startDate
    }
    if (params.endDate) {
      dateFilter.lte = params.endDate
    }

    // Get member statistics
    const { data: allMembers } = await supabaseAdmin
      .from('group_members')
      .select('status, joined_at')
      .eq('group_id', params.groupId)

    const memberStats = {
      total: allMembers?.length || 0,
      active: allMembers?.filter((m) => m.status === 'active').length || 0,
      new: params.startDate
        ? allMembers?.filter((m) => new Date(m.joined_at) >= new Date(params.startDate!)).length ||
          0
        : 0,
    }

    // Get content statistics
    let contentQuery = supabaseAdmin
      .from('group_content')
      .select('content_type, created_at')
      .eq('group_id', params.groupId)

    if (params.startDate) {
      contentQuery = contentQuery.gte('created_at', params.startDate)
    }
    if (params.endDate) {
      contentQuery = contentQuery.lte('created_at', params.endDate)
    }

    const { data: allContent } = await contentQuery

    const contentByType: Record<string, number> = {}
    allContent?.forEach((content) => {
      contentByType[content.content_type] = (contentByType[content.content_type] || 0) + 1
    })

    const contentStats = {
      total: allContent?.length || 0,
      byType: contentByType,
      recent: params.startDate
        ? allContent?.filter((c) => new Date(c.created_at) >= new Date(params.startDate!)).length ||
          0
        : allContent?.length || 0,
    }

    // Get engagement statistics
    const { data: allContentWithEngagement } = await supabaseAdmin
      .from('group_content')
      .select('like_count, comment_count, view_count')
      .eq('group_id', params.groupId)

    const totalLikes =
      allContentWithEngagement?.reduce((sum, c) => sum + (c.like_count || 0), 0) || 0
    const totalComments =
      allContentWithEngagement?.reduce((sum, c) => sum + (c.comment_count || 0), 0) || 0
    const totalViews =
      allContentWithEngagement?.reduce((sum, c) => sum + (c.view_count || 0), 0) || 0
    const totalContent = allContentWithEngagement?.length || 1
    const avgEngagement =
      totalContent > 0 ? (totalLikes + totalComments + totalViews) / totalContent : 0

    const engagementStats = {
      totalLikes,
      totalComments,
      totalViews,
      avgEngagement: Math.round(avgEngagement * 100) / 100,
    }

    // Get event statistics
    const eventsQuery = supabaseAdmin
      .from('group_events')
      .select('start_date')
      .eq('group_id', params.groupId)

    const { data: allEvents } = await eventsQuery
    const now = new Date()

    const eventStats = {
      total: allEvents?.length || 0,
      upcoming: allEvents?.filter((e) => new Date(e.start_date) > now).length || 0,
      past: allEvents?.filter((e) => new Date(e.start_date) <= now).length || 0,
    }

    // Get recent activity log (optional, if needed)
    let activityQuery = supabaseAdmin
      .from('group_analytics')
      .select('id, group_id, event_type, event_count, metadata, created_at, updated_at')
      .eq('group_id', params.groupId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (params.startDate) {
      activityQuery = activityQuery.gte('created_at', params.startDate)
    }
    if (params.endDate) {
      activityQuery = activityQuery.lte('created_at', params.endDate)
    }

    const { data: activityLog } = await activityQuery

    return {
      success: true,
      analytics: {
        memberStats,
        contentStats,
        engagementStats,
        eventStats,
        activityLog: activityLog || [],
      },
    }
  } catch (error) {
    console.error('Unexpected error getting analytics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Log an analytics event
 */
export async function logGroupAnalyticsEvent(
  groupId: string,
  eventType: string,
  eventData?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerActionClientAsync()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const { error } = await supabaseAdmin.from('group_analytics').insert({
      group_id: groupId,
      event_type: eventType,
      event_data: eventData || {},
      user_id: user.id,
    })

    if (error) {
      console.error('Error logging analytics event:', error)
      return {
        success: false,
        error: 'Failed to log event',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Unexpected error logging analytics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }
  }
}

/**
 * Check if user has permission in a group
 */
async function checkGroupPermission(
  groupId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  try {
    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single()

    if (group?.created_by === userId) {
      return true
    }

    const { data: member } = await supabaseAdmin
      .from('group_members')
      .select(
        `
        role_id,
        group_roles!inner(permissions)
      `
      )
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!member || !member.group_roles) {
      return false
    }

    const role = Array.isArray(member.group_roles) ? member.group_roles[0] : member.group_roles
    const permissions = role.permissions as string[]

    return permissions.includes('*') || permissions.includes(permission)
  } catch (error) {
    console.error('Error checking group permission:', error)
    return false
  }
}
