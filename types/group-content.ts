export interface GroupContent {
  id: string
  group_id: string
  user_id: string
  content_type: 'post' | 'announcement' | 'discussion' | 'poll'
  title: string | null
  content: string
  content_html: string | null
  is_pinned: boolean
  is_featured: boolean
  is_locked: boolean
  visibility: 'group' | 'members_only' | 'public'
  metadata: Record<string, any>
  like_count: number
  comment_count: number
  share_count: number
  view_count: number
  moderation_status: 'pending' | 'approved' | 'rejected' | 'flagged'
  moderated_by: string | null
  moderated_at: string | null
  created_at: string
  updated_at: string
  published_at: string
  // Expanded fields
  user?: {
    id: string
    name: string
    email: string
  }
  group?: {
    id: string
    name: string
  }
}

export interface GroupContentInput {
  contentType: 'post' | 'announcement' | 'discussion' | 'poll'
  title?: string | null
  content: string
  contentHtml?: string | null
  isPinned?: boolean
  visibility?: 'group' | 'members_only' | 'public'
  metadata?: Record<string, any>
}

export interface GroupContentUpdate {
  title?: string | null
  content?: string
  contentHtml?: string | null
  isPinned?: boolean
  isLocked?: boolean
  visibility?: 'group' | 'members_only' | 'public'
  metadata?: Record<string, any>
}
