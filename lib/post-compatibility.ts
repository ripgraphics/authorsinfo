// Post Compatibility Layer
// Now using the posts table as the single source of truth

import { Post, isPost } from '@/types/post'
import { createBrowserClient } from '@supabase/ssr'

// Performance optimization: Define only the columns we actually need
const POSTS_SELECT_COLUMNS =
  'id, user_id, content, image_url, link_url, created_at, updated_at, visibility, content_type, hashtags, entity_type, entity_id, like_count, comment_count, share_count, view_count, engagement_score, publish_status, is_featured, is_pinned'

export interface UnifiedPost {
  id: string
  user_id: string
  text: string // Mapped from content
  content: string // Added for consistency
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
  is_deleted?: boolean
  is_hidden?: boolean
  publish_status?: string
  last_activity_at?: string
  source: 'posts'
}

export class PostCompatibilityLayer {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /**
   * Convert a Post object to UnifiedPost format
   */
  static postToUnified(post: Post): UnifiedPost {
    return {
      id: post.id,
      user_id: post.user_id,
      text: post.content.text || post.content as any || '',
      content: post.content.text || post.content as any || '',
      image_url: post.image_url,
      link_url: post.link_url,
      created_at: post.created_at,
      updated_at: post.updated_at,
      visibility: post.visibility,
      content_type: post.content_type,
      content_summary: post.content_summary,
      hashtags: post.tags || post.content.hashtags || [],
      metadata: post.metadata,
      entity_type: post.entity_type,
      entity_id: post.entity_id,
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      share_count: post.share_count || 0,
      view_count: post.view_count || 0,
      engagement_score: post.engagement_score || 0,
      is_deleted: post.is_deleted,
      is_hidden: post.is_hidden,
      publish_status: post.publish_status,
      last_activity_at: post.last_activity_at,
      source: 'posts',
    }
  }

  /**
   * Get posts from the posts table
   */
  async getUnifiedPosts(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UnifiedPost[]> {
    try {
      const { data: postsData, error: postsError } = await this.supabase
        .from('posts')
        .select(POSTS_SELECT_COLUMNS)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (postsError) {
        console.warn('Error fetching from posts table:', postsError)
        return []
      }

      return (postsData || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        text: post.content || '',
        content: post.content || '',
        image_url: post.image_url,
        link_url: post.link_url,
        created_at: post.created_at,
        updated_at: post.updated_at,
        visibility: post.visibility,
        content_type: post.content_type,
        hashtags: post.hashtags || [],
        entity_type: post.entity_type,
        entity_id: post.entity_id,
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        share_count: post.share_count || 0,
        view_count: post.view_count || 0,
        engagement_score: post.engagement_score || 0,
        publish_status: post.publish_status,
        source: 'posts',
      }))
    } catch (error) {
      console.error('Error in getUnifiedPosts:', error)
      return []
    }
  }

  /**
   * Get posts by entity from the posts table
   */
  async getUnifiedEntityPosts(
    entityType: string,
    entityId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UnifiedPost[]> {
    try {
      const { data: postsData, error: postsError } = await this.supabase
        .from('posts')
        .select(POSTS_SELECT_COLUMNS)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (postsError) {
        console.warn('Error fetching entity posts from posts table:', postsError)
        return []
      }

      return (postsData || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        text: post.content || '',
        content: post.content || '',
        image_url: post.image_url,
        link_url: post.link_url,
        created_at: post.created_at,
        updated_at: post.updated_at,
        visibility: post.visibility,
        content_type: post.content_type,
        hashtags: post.hashtags || [],
        entity_type: post.entity_type,
        entity_id: post.entity_id,
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        share_count: post.share_count || 0,
        view_count: post.view_count || 0,
        engagement_score: post.engagement_score || 0,
        publish_status: post.publish_status,
        source: 'posts',
      }))
    } catch (error) {
      console.error('Error in getUnifiedEntityPosts:', error)
      return []
    }
  }

  /**
   * Check if a post exists
   */
  async checkPostExists(postId: string): Promise<{
    exists: boolean
    source: 'posts' | 'none'
    post?: UnifiedPost
  }> {
    try {
      const { data: postData, error } = await this.supabase
        .from('posts')
        .select(POSTS_SELECT_COLUMNS)
        .eq('id', postId)
        .single()

      if (postData) {
        const unified = {
          id: postData.id,
          user_id: postData.user_id,
          text: postData.content || '',
          content: postData.content || '',
          created_at: postData.created_at,
          visibility: postData.visibility,
          content_type: postData.content_type,
          like_count: postData.like_count || 0,
          comment_count: postData.comment_count || 0,
          share_count: postData.share_count || 0,
          view_count: postData.view_count || 0,
          engagement_score: postData.engagement_score || 0,
          source: 'posts' as const,
        }
        return {
          exists: true,
          source: 'posts',
          post: unified as any,
        }
      }
      return { exists: false, source: 'none' }
    } catch (error) {
      return { exists: false, source: 'none' }
    }
  }
}

export const postCompatibility = new PostCompatibilityLayer()

export function convertToUnifiedPost(post: any): UnifiedPost {
  if (isPost(post)) {
    return PostCompatibilityLayer.postToUnified(post)
  }
  
  return {
    id: post.id || post.post_id,
    user_id: post.user_id || post.userId,
    text: post.content || post.text || post.body || '',
    content: post.content || post.text || post.body || '',
    image_url: post.image_url || post.imageUrl,
    link_url: post.link_url || post.linkUrl,
    created_at: post.created_at || post.createdAt || new Date().toISOString(),
    visibility: post.visibility || 'public',
    content_type: post.content_type || 'text',
    hashtags: post.hashtags || post.tags || [],
    like_count: post.like_count || 0,
    comment_count: post.comment_count || 0,
    share_count: post.share_count || 0,
    view_count: post.view_count || 0,
    engagement_score: post.engagement_score || 0,
    source: 'posts',
  }
}

export function isUnifiedPost(obj: any): obj is UnifiedPost {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    (typeof obj.text === 'string' || typeof obj.content === 'string') &&
    typeof obj.created_at === 'string'
  )
}
