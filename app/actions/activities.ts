'use server'

import { createServerActionClientAsync } from '@/lib/supabase/client-helper'

import { revalidatePath } from 'next/cache'

export interface CreateActivityParams {
  activity_type: string
  entity_type?: string
  entity_id?: string
  is_public?: boolean
  metadata?: Record<string, any>
  group_id?: string
  book_id?: string
  author_id?: string
  event_id?: string
}

export interface Activity {
  id: string
  user_id: string
  activity_type: string
  entity_type: string
  entity_id: string
  is_public: boolean
  metadata: any
  created_at: string
  user_name: string
  user_avatar_url?: string
  like_count: number
  comment_count: number
  is_liked: boolean
}

export interface ActivityEngagement {
  likes: Array<{
    id: string
    user_id: string
    user_name: string
    user_avatar_url?: string
    created_at: string
  }>
  comments: Array<{
    id: string
    user_id: string
    user_name: string
    user_avatar_url?: string
    comment_text: string
    created_at: string
    updated_at: string
  }>
}

/**
 * Create a new activity
 */
export async function createActivity(params: CreateActivityParams): Promise<{
  success: boolean
  activity?: Activity
  error?: string
}> {
  try {
    const supabase = await createServerActionClientAsync()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate required fields
    if (!params.activity_type) {
      return { success: false, error: 'Activity type is required' }
    }

    // Create the activity
    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        activity_type: params.activity_type,
        entity_type: params.entity_type || 'unknown',
        entity_id: params.entity_id || null,
        is_public: params.is_public ?? true,
        metadata: params.metadata || {},
        group_id: params.group_id || null,
        book_id: params.book_id || null,
        author_id: params.author_id || null,
        event_id: params.event_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return { success: false, error: 'Failed to create activity' }
    }

    // Revalidate relevant paths
    revalidatePath('/feed')
    revalidatePath(`/profile/${user.id}`)
    if (params.group_id) {
      revalidatePath(`/groups/${params.group_id}`)
    }

    return { success: true, activity: activity as Activity }
  } catch (error) {
    console.error('Unexpected error creating activity:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get user-specific feed activities
 */
export async function getUserFeedActivities(
  limit = 20,
  offset = 0
): Promise<{
  success: boolean
  activities?: Activity[]
  error?: string
  hasMore?: boolean
}> {
  try {
    const supabase = await createServerActionClientAsync()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Use the fixed database function
    const { data, error } = await supabase
      .rpc('get_user_feed_activities', {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset
      })

    if (error) {
      console.error('Error fetching user activities:', error)
      return { success: false, error: 'Failed to fetch activities' }
    }

    const activities = data || []
    const hasMore = activities.length === limit

    return { 
      success: true, 
      activities: activities as Activity[],
      hasMore
    }
  } catch (error) {
    console.error('Unexpected error fetching user activities:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get public feed activities
 */
export async function getPublicFeedActivities(
  limit = 20,
  offset = 0
): Promise<{
  success: boolean
  activities?: Activity[]
  error?: string
  hasMore?: boolean
}> {
  try {
    const supabase = await createServerActionClientAsync()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Use the public feed function
    const { data, error } = await supabase
      .rpc('get_public_feed_activities', {
        p_current_user_id: user.id,
        p_limit: limit,
        p_offset: offset
      })

    if (error) {
      console.error('Error fetching public activities:', error)
      return { success: false, error: 'Failed to fetch activities' }
    }

    const activities = data || []
    const hasMore = activities.length === limit

    return { 
      success: true, 
      activities: activities as Activity[],
      hasMore
    }
  } catch (error) {
    console.error('Unexpected error fetching public activities:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Toggle like on an activity
 */
export async function toggleActivityLike(
  activityId: string
): Promise<{
  success: boolean
  result?: {
    action: string
    like_count: number
    is_liked: boolean
  }
  error?: string
}> {
  try {
    const supabase = await createServerActionClientAsync()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Use the database function to toggle like
    const { data, error } = await supabase
      .rpc('toggle_activity_like', {
        p_activity_id: activityId,
        p_user_id: user.id
      })

    if (error) {
      console.error('Error toggling like:', error)
      return { success: false, error: 'Failed to toggle like' }
    }

    // Revalidate relevant paths
    revalidatePath('/feed')
    revalidatePath(`/profile/${user.id}`)

    return { success: true, result: data }
  } catch (error) {
    console.error('Unexpected error toggling like:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Add a comment to an activity
 */
export async function addActivityComment(
  activityId: string,
  commentText: string
): Promise<{
  success: boolean
  result?: {
    comment_id: string
    comment_count: number
  }
  error?: string
}> {
  try {
    const supabase = await createServerActionClientAsync()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate comment text
    if (!commentText || commentText.trim().length === 0) {
      return { success: false, error: 'Comment text is required' }
    }

    // Use the database function to add comment
    const { data, error } = await supabase
      .rpc('add_activity_comment', {
        p_activity_id: activityId,
        p_user_id: user.id,
        p_comment_text: commentText.trim()
      })

    if (error) {
      console.error('Error adding comment:', error)
      return { success: false, error: 'Failed to add comment' }
    }

    // Revalidate relevant paths
    revalidatePath('/feed')
    revalidatePath(`/profile/${user.id}`)

    return { success: true, result: data }
  } catch (error) {
    console.error('Unexpected error adding comment:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Get engagement data for an activity (likes and comments)
 */
export async function getActivityEngagement(
  activityId: string
): Promise<{
  success: boolean
  engagement?: ActivityEngagement
  error?: string
}> {
  try {
    const supabase = await createServerActionClientAsync()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get likes
    const { data: likes, error: likesError } = await supabase
      .from('activity_likes')
      .select(`
        id,
        user_id,
        created_at,
        user:user_id(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })

    if (likesError) {
      console.error('Error fetching likes:', likesError)
      return { success: false, error: 'Failed to fetch likes' }
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('activity_comments')
      .select(`
        id,
        user_id,
        comment_text,
        created_at,
        updated_at,
        user:user_id(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('activity_id', activityId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return { success: false, error: 'Failed to fetch comments' }
    }

    // Process user data
    const processedLikes = (likes || []).map((like: any) => ({
      id: like.id,
      user_id: like.user_id,
      user_name: like.user?.raw_user_meta_data?.name || 
                 like.user?.raw_user_meta_data?.full_name || 
                 like.user?.email || 
                 'Unknown User',
      user_avatar_url: like.user?.raw_user_meta_data?.avatar_url || '',
      created_at: like.created_at
    }))

    const processedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      user_id: comment.user_id,
      user_name: comment.user?.raw_user_meta_data?.name || 
                 comment.user?.raw_user_meta_data?.full_name || 
                 comment.user?.email || 
                 'Unknown User',
      user_avatar_url: comment.user?.raw_user_meta_data?.avatar_url || '',
      comment_text: comment.comment_text,
      created_at: comment.created_at,
      updated_at: comment.updated_at
    }))

    const engagement: ActivityEngagement = {
      likes: processedLikes,
      comments: processedComments
    }

    return { success: true, engagement }
  } catch (error) {
    console.error('Unexpected error fetching engagement:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Create common activity types
 */
export const ActivityTypes = {
  // User activities
  PROFILE_UPDATED: 'profile_updated',
  USER_JOINED: 'user_joined',
  
  // Book activities
  BOOK_ADDED: 'book_added',
  BOOK_UPDATED: 'book_updated',
  BOOK_REVIEWED: 'book_reviewed',
  BOOK_RATED: 'book_rated',
  READING_PROGRESS: 'reading_progress',
  
  // Author activities
  AUTHOR_CREATED: 'author_created',
  AUTHOR_UPDATED: 'author_updated',
  
  // Publisher activities
  PUBLISHER_CREATED: 'publisher_created',
  PUBLISHER_UPDATED: 'publisher_updated',
  
  // Group activities
  GROUP_CREATED: 'group_created',
  GROUP_JOINED: 'group_joined',
  GROUP_LEFT: 'group_left',
  
  // Photo album activities
  ALBUM_CREATED: 'album_created',
  ALBUM_UPDATED: 'album_updated',
  PHOTO_ADDED: 'photo_added',
  
  // Event activities
  EVENT_CREATED: 'event_created',
  EVENT_JOINED: 'event_joined',
  EVENT_LEFT: 'event_left'
} as const

/**
 * Helper function to create a book-related activity
 */
export async function createBookActivity(
  bookId: string,
  activityType: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  return createActivity({
    activity_type: activityType,
    entity_type: 'book',
    entity_id: bookId,
    book_id: bookId,
    metadata: metadata || {}
  })
}

/**
 * Helper function to create a group-related activity
 */
export async function createGroupActivity(
  groupId: string,
  activityType: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  return createActivity({
    activity_type: activityType,
    entity_type: 'group',
    entity_id: groupId,
    group_id: groupId,
    metadata: metadata || {}
  })
}
