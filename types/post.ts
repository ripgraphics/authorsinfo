// Unified Post Types for CRUD Operations
// Consolidates types between activities and posts tables

export interface BasePost {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  visibility: PostVisibility
  content_type: PostContentType
  content_summary?: string
  entity_type?: string
  entity_id?: string
  is_deleted: boolean
  is_hidden: boolean
  publish_status: PostPublishStatus
}

export interface Post extends BasePost {
  content: PostContent
  image_url?: string
  link_url?: string
  tags: string[]
  metadata: PostMetadata
  like_count: number
  comment_count: number
  share_count: number
  view_count: number
  engagement_score: number
  trending_score?: number
  is_featured: boolean
  is_pinned: boolean
  is_verified: boolean
  last_activity_at: string
  scheduled_at?: string
  published_at?: string
  enterprise_features: PostEnterpriseFeatures
}

export interface PostContent {
  text: string
  type: PostContentType
  summary?: string
  hashtags?: string[]
  migration_source?: string
  original_activity_id?: string
  // Rich content fields
  formatted_text?: string
  mentions?: string[]
  links?: PostLink[]
  // Media content
  media_files?: PostMediaFile[]
  // Poll content
  poll_question?: string
  poll_options?: string[]
  poll_results?: PollResult[]
  // Event content
  event_details?: EventDetails
  // Book content
  book_details?: BookDetails
}

export interface PostMediaFile {
  id: string
  url: string
  thumbnail_url?: string
  type: 'image' | 'video' | 'audio' | 'document'
  filename: string
  size: number
  mime_type: string
  dimensions?: {
    width: number
    height: number
  }
  duration?: number // for video/audio
  metadata?: Record<string, any>
}

export interface PostLink {
  url: string
  title?: string
  description?: string
  image_url?: string
  domain?: string
}

export interface PostMetadata {
  privacy_level: PostVisibility
  engagement_count: number
  image_count: number
  content_safety_score?: number
  sentiment_analysis?: string
  language?: string
  region?: string
  categories?: string[]
  content_warnings?: string[]
  sensitive_content?: boolean
  age_restriction?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  cross_posted_to?: string[]
  collaboration_type?: 'individual' | 'collaborative' | 'team'
  ai_enhanced?: boolean
  ai_enhanced_text?: string
  ai_enhanced_performance?: number
}

export interface PostEnterpriseFeatures {
  migration_source?: string
  migrated_at?: string
  original_activity_id?: string
  content_moderation?: {
    status: 'pending' | 'approved' | 'rejected' | 'flagged'
    moderator_id?: string
    moderated_at?: string
    moderation_notes?: string
    flags?: ModerationFlag[]
  }
  analytics?: {
    unique_views: number
    engagement_rate: number
    viral_coefficient: number
    reach_score: number
    influence_score: number
  }
  monetization?: {
    is_monetized: boolean
    revenue_share: number
    sponsored_content: boolean
    advertiser_id?: string
  }
  compliance?: {
    gdpr_compliant: boolean
    coppa_compliant: boolean
    accessibility_compliant: boolean
    legal_review_status: 'pending' | 'approved' | 'requires_changes'
  }
}

export interface ModerationFlag {
  id: string
  user_id: string
  reason: string
  category: 'spam' | 'inappropriate' | 'copyright' | 'harassment' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  reviewed: boolean
  reviewed_by?: string
  reviewed_at?: string
}

export interface PollResult {
  option: string
  votes: number
  percentage: number
  voters: string[] // user IDs
}

export interface EventDetails {
  title: string
  description?: string
  start_date: string
  end_date?: string
  location?: string
  venue?: string
  capacity?: number
  registration_required: boolean
  event_url?: string
}

export interface BookDetails {
  title: string
  author: string
  isbn?: string
  rating?: number
  review?: string
  book_url?: string
  cover_image_url?: string
}

// Enums
export type PostVisibility = 'public' | 'friends' | 'private' | 'group' | 'custom'

export type PostContentType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'link' 
  | 'poll' 
  | 'event' 
  | 'book' 
  | 'author' 
  | 'mixed'

export type PostPublishStatus = 'draft' | 'scheduled' | 'published' | 'archived' | 'deleted'

// Post Creation/Update Types
export interface CreatePostData {
  user_id: string
  content: Omit<PostContent, 'migration_source' | 'original_activity_id'>
  image_url?: string
  link_url?: string
  visibility?: PostVisibility
  content_type?: PostContentType
  content_summary?: string
  tags?: string[]
  metadata?: Partial<PostMetadata>
  entity_type?: string
  entity_id?: string
  scheduled_at?: string
  publish_status?: PostPublishStatus
}

export interface UpdatePostData {
  content?: Partial<PostContent>
  image_url?: string
  link_url?: string
  visibility?: PostVisibility
  content_type?: PostContentType
  content_summary?: string
  tags?: string[]
  metadata?: Partial<PostMetadata>
  is_featured?: boolean
  is_pinned?: boolean
  publish_status?: PostPublishStatus
  scheduled_at?: string
}

// Post Query Types
export interface PostQueryFilters {
  user_id?: string
  entity_type?: string
  entity_id?: string
  content_type?: PostContentType
  visibility?: PostVisibility
  publish_status?: PostPublishStatus
  tags?: string[]
  date_from?: string
  date_to?: string
  is_featured?: boolean
  is_pinned?: boolean
  has_images?: boolean
  has_videos?: boolean
}

export interface PostQueryOptions {
  limit?: number
  offset?: number
  sort_by?: 'created_at' | 'updated_at' | 'last_activity_at' | 'engagement_score' | 'trending_score'
  sort_order?: 'asc' | 'desc'
  include_deleted?: boolean
  include_hidden?: boolean
}

// Post Response Types
export interface PostListResponse {
  posts: Post[]
  total: number
  has_more: boolean
  next_offset?: number
}

export interface PostStats {
  total_posts: number
  published_posts: number
  draft_posts: number
  scheduled_posts: number
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
  average_engagement_rate: number
}

// Legacy Activity Post Type (for backward compatibility)
export interface ActivityPost {
  id: string
  user_id: string
  activity_type: 'post_created'
  text: string
  image_url?: string
  link_url?: string
  created_at: string
  updated_at?: string
  visibility?: string
  content_type?: string
  content_summary?: string
  hashtags?: string[]
  data?: any
  entity_type?: string
  entity_id?: string
  like_count?: number
  comment_count?: number
  share_count?: number
  view_count?: number
  engagement_score?: number
}

// Migration Types
export interface PostMigrationResult {
  success: boolean
  migrated_count: number
  total_count: number
  errors: string[]
  warnings: string[]
  migration_timestamp: string
}

// Utility Types
export type PostId = string
export type UserId = string
export type EntityId = string

// Type Guards
export function isPost(obj: any): obj is Post {
  return obj && 
         typeof obj.id === 'string' && 
         typeof obj.user_id === 'string' && 
         obj.content && 
         typeof obj.content.text === 'string'
}

export function isActivityPost(obj: any): obj is ActivityPost {
  return obj && 
         obj.activity_type === 'post_created' && 
         typeof obj.text === 'string'
}

export function canEditPost(post: Post, currentUserId: string): boolean {
  return post.user_id === currentUserId && 
         post.publish_status !== 'deleted' && 
         !post.is_hidden
}

export function canDeletePost(post: Post, currentUserId: string): boolean {
  return post.user_id === currentUserId && 
         post.publish_status !== 'deleted'
}

export function isPostVisible(post: Post, currentUserId: string, isFriend: boolean): boolean {
  if (post.is_hidden || post.is_deleted) return false
  
  switch (post.visibility) {
    case 'public':
      return true
    case 'friends':
      return post.user_id === currentUserId || isFriend
    case 'private':
      return post.user_id === currentUserId
    case 'group':
      // TODO: Implement group visibility logic
      return true
    default:
      return false
  }
}
