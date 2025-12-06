// Post Compatibility Layer
// Provides backward compatibility during the transition from activities to posts table

import { Post, ActivityPost, isPost, isActivityPost } from '@/types/post'
import { createBrowserClient } from '@supabase/ssr'

// Performance optimization: Define only the columns we actually need
const ACTIVITIES_SELECT_COLUMNS = 'id, user_id, text, image_url, link_url, created_at, updated_at, visibility, content_type, hashtags, entity_type, entity_id, like_count, comment_count, share_count, view_count, engagement_score, publish_status, activity_type'

export interface UnifiedPost {
  id: string
  user_id: string
  text: string
  image_url?: string
  link_url?: string
  created_at: string
  updated_at?: string
  visibility: string
  content_type: string
  content_summary?: string
  hashtags?: string[]
  metadata?: any
  entity_type?: string
  entity_id?: string
  like_count: number
  comment_count: number
  share_count: number
  view_count: number
  engagement_score: number
  // New posts table fields
  is_deleted?: boolean
  is_hidden?: boolean
  publish_status?: string
  last_activity_at?: string
  // Source tracking
  source: 'activities' | 'posts' | 'mixed'
  original_activity_id?: string
}

export class PostCompatibilityLayer {
  private supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  /**
   * Convert a Post object to UnifiedPost format
   */
  static postToUnified(post: Post): UnifiedPost {
    return {
      id: post.id,
      user_id: post.user_id,
      text: post.content.text,
      image_url: post.image_url,
      link_url: post.link_url,
      created_at: post.created_at,
      updated_at: post.updated_at,
      visibility: post.visibility,
      content_type: post.content_type,
      content_summary: post.content_summary,
      hashtags: post.content.hashtags,
      metadata: post.metadata,
      entity_type: post.entity_type,
      entity_id: post.entity_id,
      like_count: post.like_count,
      comment_count: post.comment_count,
      share_count: post.share_count,
      view_count: post.view_count,
      engagement_score: post.engagement_score,
      is_deleted: post.is_deleted,
      is_hidden: post.is_hidden,
      publish_status: post.publish_status,
      last_activity_at: post.last_activity_at,
      source: 'posts',
      original_activity_id: post.content.original_activity_id
    }
  }

  /**
   * Convert an ActivityPost object to UnifiedPost format
   */
  static activityToUnified(activity: ActivityPost): UnifiedPost {
    return {
      id: activity.id,
      user_id: activity.user_id,
      text: activity.text,
      image_url: activity.image_url,
      link_url: activity.link_url,
      created_at: activity.created_at,
      updated_at: activity.updated_at,
      visibility: activity.visibility || 'public',
      content_type: activity.content_type || 'text',
      content_summary: activity.content_summary,
      hashtags: activity.hashtags,
      metadata: activity.data,
      entity_type: activity.entity_type,
      entity_id: activity.entity_id,
      like_count: activity.like_count || 0,
      comment_count: activity.comment_count || 0,
      share_count: activity.share_count || 0,
      view_count: activity.view_count || 0,
      engagement_score: activity.engagement_score || 0,
      source: 'activities'
    }
  }

  /**
   * Get posts from both sources (activities and posts tables)
   * This provides a unified view during the transition period
   */
  async getUnifiedPosts(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UnifiedPost[]> {
    try {
      // Performance optimization: Use specific columns instead of select('*')
      const { data: activitiesData, error: activitiesError } = await this.supabase
        .from('activities')
        .select(ACTIVITIES_SELECT_COLUMNS)
        .eq('user_id', userId)
        .eq('activity_type', 'post_created')
        .not('text', 'is', null)
        .not('text', 'eq', '')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (activitiesError) {
        console.warn('Error fetching from activities table:', activitiesError)
      }

      // Convert to unified format
      const unifiedPosts: UnifiedPost[] = []

      // Add activities data
      if (activitiesData) {
        activitiesData.forEach(activity => {
          unifiedPosts.push(PostCompatibilityLayer.activityToUnified(activity))
        })
      }

      // Sort by creation date and remove duplicates
      const uniquePosts = this.removeDuplicates(unifiedPosts)
      return uniquePosts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, limit)

    } catch (error) {
      console.error('Error in getUnifiedPosts:', error)
      return []
    }
  }

  /**
   * Get posts by entity from both sources
   */
  async getUnifiedEntityPosts(
    entityType: string,
    entityId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UnifiedPost[]> {
    try {
      // Performance optimization: Use specific columns instead of select('*')
      const { data: activitiesData, error: activitiesError } = await this.supabase
        .from('activities')
        .select(ACTIVITIES_SELECT_COLUMNS)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('activity_type', 'post_created')
        .not('text', 'eq', '')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (activitiesError) {
        console.warn('Error fetching entity posts from activities table:', activitiesError)
      }

      // Convert to unified format
      const unifiedPosts: UnifiedPost[] = []

      if (activitiesData) {
        activitiesData.forEach(activity => {
          unifiedPosts.push(PostCompatibilityLayer.activityToUnified(activity))
        })
      }

      // Remove duplicates and sort
      const uniquePosts = this.removeDuplicates(unifiedPosts)
      return uniquePosts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, limit)

    } catch (error) {
      console.error('Error in getUnifiedEntityPosts:', error)
      return []
    }
  }

  /**
   * Remove duplicate posts based on content and user
   */
  private removeDuplicates(posts: UnifiedPost[]): UnifiedPost[] {
    const seen = new Set<string>()
    return posts.filter(post => {
      const key = `${post.user_id}-${post.text.substring(0, 100)}-${post.created_at}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * Check if a post exists in both sources
   */
  async checkPostExists(postId: string): Promise<{
    exists: boolean
    source: 'posts' | 'activities' | 'both' | 'none'
    post?: UnifiedPost
  }> {
    try {
      // Performance optimization: Use specific columns instead of select('*')
      const { data: activityData, error: activityError } = await this.supabase
        .from('activities')
        .select(ACTIVITIES_SELECT_COLUMNS)
        .eq('id', postId)
        .eq('activity_type', 'post_created')
        .single()

      if (activityData) {
        return {
          exists: true,
          source: 'activities',
          post: PostCompatibilityLayer.activityToUnified(activityData)
        }
      } else {
        return {
          exists: false,
          source: 'none'
        }
      }
    } catch (error) {
      console.error('Error checking post existence:', error)
      return {
        exists: false,
        source: 'none'
      }
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    total_activities: number
    migrated_posts: number
    new_posts: number
    migration_status: string
  }> {
    try {
      const { data, error } = await this.supabase.rpc('get_migration_status')
      
      if (error) {
        console.error('Error getting migration status:', error)
        return {
          total_activities: 0,
          migrated_posts: 0,
          new_posts: 0,
          migration_status: 'ERROR'
        }
      }

      return data[0] || {
        total_activities: 0,
        migrated_posts: 0,
        new_posts: 0,
        migration_status: 'UNKNOWN'
      }
    } catch (error) {
      console.error('Error in getMigrationStatus:', error)
      return {
        total_activities: 0,
        migrated_posts: 0,
        new_posts: 0,
        migration_status: 'ERROR'
      }
    }
  }

  /**
   * Validate migration integrity
   */
  async validateMigration(): Promise<Array<{
    check_name: string
    status: string
    details: string
    count_value: number
  }>> {
    try {
      const { data, error } = await this.supabase.rpc('validate_posts_migration')
      
      if (error) {
        console.error('Error validating migration:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in validateMigration:', error)
      return []
    }
  }
}

// Export singleton instance
export const postCompatibility = new PostCompatibilityLayer()

// Utility functions for backward compatibility
export function convertToUnifiedPost(post: any): UnifiedPost {
  if (isPost(post)) {
    return PostCompatibilityLayer.postToUnified(post)
  } else if (isActivityPost(post)) {
    return PostCompatibilityLayer.activityToUnified(post)
  } else {
    // Handle legacy format
    return {
      id: post.id || post.post_id,
      user_id: post.user_id || post.userId,
      text: post.text || post.content || post.body || '',
      image_url: post.image_url || post.imageUrl,
      link_url: post.link_url || post.linkUrl,
      created_at: post.created_at || post.createdAt || post.date || new Date().toISOString(),
      updated_at: post.updated_at || post.updatedAt,
      visibility: post.visibility || 'public',
      content_type: post.content_type || post.type || 'text',
      content_summary: post.content_summary || post.summary,
      hashtags: post.hashtags || post.tags || [],
      metadata: post.metadata || post.meta || {},
      entity_type: post.entity_type || post.entityType,
      entity_id: post.entity_id || post.entityId,
      like_count: post.like_count || post.likes || 0,
      comment_count: post.comment_count || post.comments || 0,
      share_count: post.share_count || post.shares || 0,
      view_count: post.view_count || post.views || 0,
      engagement_score: post.engagement_score || 0,
      source: 'activities'
    }
  }
}

// Type guard for UnifiedPost
export function isUnifiedPost(obj: any): obj is UnifiedPost {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.user_id === 'string' && 
         typeof obj.text === 'string' &&
         typeof obj.created_at === 'string'
}
