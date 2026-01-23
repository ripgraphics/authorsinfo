// Unified FeedPost interface for the feed system
// This interface works with both old and new post structures from the activities table

import type { LinkPreviewMetadata } from './link-preview'

export interface FeedPost {
  // Core activity fields
  id: string
  user_id: string
  activity_type: string
  entity_type: string
  entity_id: string
  is_public: boolean
  metadata?: any
  created_at: string

  // User information
  user_name?: string
  user_avatar_url?: string

  // Engagement data
  like_count: number
  comment_count: number
  share_count?: number
  is_liked: boolean

  // Post content fields (new structure)
  text?: string
  image_url?: string
  link_url?: string
  visibility?: string
  content_type?: string
  updated_at?: string
  content_summary?: string

  // Legacy fields for backward compatibility
  content?: PostContent
  content_type_legacy?: string

  // Database fields from activities table
  data?: any // JSONB field from activities table

  // Content safety and restrictions
  content_safety_score?: number
  age_restriction?: string
  sensitive_content?: boolean

  // User interaction state
  user_has_reacted?: boolean
  user_has_commented?: boolean
  user_has_shared?: boolean
  user_reaction_type?: string // Type of reaction user has made (like, love, care, haha, wow, sad, angry)
  user_has_bookmarked?: boolean
  user_has_viewed?: boolean

  // Additional fields for backward compatibility
  view_count?: number
  bookmark_count?: number
  tags?: string[]

  // Post metadata fields
  scheduled_at?: string
  is_featured?: boolean
  is_pinned?: boolean
  is_verified?: boolean
  engagement_score?: number
}

export interface PostContent {
  text?: string
  media_files?: PostMediaFile[]
  links?: PostLink[]
  metadata?: PostMetadata
  // Legacy fields for backward compatibility
  book_details?: {
    book_id?: string
    title?: string
    author?: string
    rating?: number
    review?: string
    reading_status?: string
  }
  poll_question?: string
  poll_options?: string[]
  poll_results?: Record<string, number>
  content_safety_score?: number
  sentiment_analysis?: string
}

export interface PostMediaFile {
  id: string
  url: string
  thumbnail_url?: string
  filename?: string
  type: 'image' | 'video' | 'audio' | 'document'
  size?: number
  mime_type?: string
  alt_text?: string
  description?: string
}

export interface PostLink {
  id: string
  url: string
  title?: string
  description?: string
  thumbnail_url?: string
  domain?: string
  preview_metadata?: LinkPreviewMetadata  // Full metadata from extraction
}

export interface PostMetadata {
  tags?: string[]
  categories?: string[]
  location?: {
    latitude?: number
    longitude?: number
    address?: string
    city?: string
    country?: string
  }
  mentions?: string[]
  hashtags?: string[]
  custom_fields?: Record<string, any>
  liked_activity_image?: string // Added for like activities
  liked_activity_content?: string // Added for like activities
}

export interface PostVisibility {
  type: 'public' | 'private' | 'friends' | 'followers' | 'custom'
  custom_users?: string[]
  custom_groups?: string[]
}

export interface PostPublishStatus {
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  scheduled_at?: string
  published_at?: string
  archived_at?: string
}

// Type guards for checking post structure
export function isNewPostStructure(
  post: FeedPost
): post is FeedPost & { text: string; content_type: string } {
  return post.text !== undefined && post.content_type !== undefined
}

export function isOldPostStructure(post: FeedPost): post is FeedPost & { content: PostContent } {
  return post.content !== undefined && post.content.text !== undefined
}

export function hasImageContent(post: FeedPost): boolean {
  return !!(post.image_url || (post.content?.media_files && post.content.media_files.length > 0))
}

export function hasTextContent(post: FeedPost): boolean {
  return !!(post.text || post.content?.text)
}

export function getPostText(post: FeedPost): string {
  // Handle like activities specifically
  if (post.activity_type === 'like') {
    return post.text || 'liked a post'
  }

  if (post.text) return post.text
  if (post.content?.text) return post.content.text
  return 'Post content'
}

export function getPostImages(post: FeedPost): string[] {
  // Handle like activities - show the original post's image if available
  if (post.activity_type === 'like') {
    if (post.image_url) {
      return post.image_url
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)
    }
    // Fallback to data field for like activities
    if (post.metadata?.liked_activity_image) {
      return [post.metadata.liked_activity_image]
    }
    return []
  }

  if (post.image_url) {
    return post.image_url
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
  }
  if (post.content?.media_files) {
    return post.content.media_files.filter((file) => file.type === 'image').map((file) => file.url)
  }
  return []
}

export function getPostContentType(post: FeedPost): string {
  // Handle like activities
  if (post.activity_type === 'like') {
    return 'like'
  }

  if (post.content_type) return post.content_type
  if (post.content_type_legacy) return post.content_type_legacy

  // Infer from content
  if (hasImageContent(post)) return 'image'
  if (post.content?.media_files?.some((f) => f.type === 'video')) return 'video'
  if (post.content?.links && post.content.links.length > 0) return 'link'
  
  // Check for link_url field
  if (post.link_url) return 'link'
  
  // Check if text contains URLs (dynamic import to avoid circular dependency)
  if (post.text || post.content?.text) {
    const text = post.text || post.content?.text || ''
    // Simple URL pattern check - if text contains http:// or https://, treat as link
    if (text.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/i)) {
      return 'link'
    }
  }

  return 'text'
}

// New utility function for like activities
export function isLikeActivity(post: FeedPost): boolean {
  return post.activity_type === 'like'
}

export function getLikeActivitySummary(post: FeedPost): string {
  if (!isLikeActivity(post)) return ''

  const userName = post.user_name || 'User'
  const likedContent = post.text || post.metadata?.liked_activity_content || 'a post'

  return `${userName} liked ${likedContent}`
}
